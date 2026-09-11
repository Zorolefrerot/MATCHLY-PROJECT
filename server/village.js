import { WebSocketServer, WebSocket } from "ws";
import { digest, transaction } from "./store.js";
import { validAppearance } from "./game.js";
import { VillageRoom, VILLAGE } from "./village-room.js";

const accessSQL = `FROM game_sessions s
  JOIN users u ON u.id=s.user_id AND u.role='player'
  JOIN applications a ON a.user_id=u.id AND a.status='accepted'
  JOIN allocations l ON l.user_id=u.id
  WHERE s.expires>? AND NOT EXISTS(SELECT 1 FROM deleted_accounts d WHERE d.user_id=u.id)`;
export async function villageIdentity(db, authorization, now = Date.now()) {
  const token = /^Bearer ([a-f0-9]{64})$/.exec(authorization || "")?.[1];
  if (!token) return null;
  const tokenHash = digest(token);
  const row = await db
    .prepare(
      `SELECT u.id,a.character AS name,s.expires,
    (SELECT appearance FROM character_appearances WHERE user_id=u.id) AS appearance
    ${accessSQL} AND s.token=?`,
    )
    .get(now, tokenHash);
  if (!row) return null;
  const appearance = row.appearance ? JSON.parse(row.appearance) : null;
  if (appearance !== null && !validAppearance(appearance)) return null;
  return {
    id: row.id,
    name:
      row.name
        .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, "")
        .slice(0, 50)
        .toWellFormed() || "Genin",
    appearance,
    tokenHash,
    expires: Number(row.expires),
  };
}

// Same HTTPS service/port as the website. No cookies, query-string credentials,
// arbitrary player IDs, external broker, second paid service, or persistent chat.
export function installVillage(
  server,
  db,
  {
    production = process.env.NODE_ENV === "production",
    publicOrigin = process.env.PUBLIC_ORIGIN,
  } = {},
) {
  const room = new VillageRoom();
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 1024,
    perMessageDeflate: false,
    maxFragments: 8,
    maxBufferedChunks: 16,
  });
  const pending = new Set();
  const attempts = new Map();
  let stopped = false,
    checking = false,
    lastCheck = 0;
  const reject = (socket, status) => {
    if (!socket.destroyed)
      socket.end(
        `HTTP/1.1 ${status}\r\nConnection: close\r\nCache-Control: no-store\r\nContent-Length: 0\r\n\r\n`,
      );
  };
  const upgrade = async (req, socket, head) => {
    socket.on("error", () => {}); // Never log raw headers, tokens or payloads.
    if (req.url?.split("?")[0] !== "/api/game/village") {
      // A registered upgrade listener disables Node's default socket disposal.
      // Do not leave unknown upgrade paths open indefinitely in production.
      // Only let another development listener handle its own HMR connection.
      if (!production && server.listenerCount("upgrade") > 1) return;
      return reject(socket, "404 Not Found");
    }
    if (stopped) return reject(socket, "503 Service Unavailable");
    // Match the existing single trusted Render reverse proxy configuration.
    if (
      production &&
      !req.socket.encrypted &&
      req.headers["x-forwarded-proto"] !== "https"
    )
      return reject(socket, "403 Forbidden");
    if (req.url !== "/api/game/village" || req.method !== "GET")
      return reject(socket, "400 Bad Request");
    if (req.headers.origin) {
      const expected =
        publicOrigin ||
        `${production ? "https" : "http"}://${req.headers.host}`;
      if (req.headers.origin !== expected)
        return reject(socket, "403 Forbidden");
    }
    // Missing/malformed native credentials need no database connection or lock.
    if (!/^Bearer [a-f0-9]{64}$/.test(req.headers.authorization || ""))
      return reject(socket, "401 Unauthorized");
    const address = socket.remoteAddress || "unknown";
    const now = Date.now();
    for (const [key, entry] of attempts)
      if (entry.until <= now) attempts.delete(key);
    if (!attempts.has(address)) {
      if (attempts.size >= 512) return reject(socket, "429 Too Many Requests");
      attempts.set(address, { count: 0, until: now + 60000 });
    }
    // IP is the proxy's actual socket, not an untrusted forwarding header.
    // Global bounded handshake concurrency also protects pooled DB connections.
    if (++attempts.get(address).count > 60 || pending.size >= 4)
      return reject(socket, "429 Too Many Requests");
    pending.add(socket);
    const timeout = setTimeout(() => socket.destroy(), 30000);
    timeout.unref();
    let upgraded = false;
    try {
      // Serialize authentication + installation against login/deletion/reset.
      // An older handshake cannot replace a newer login after its token was revoked.
      await transaction(db, async () => {
        const identity = await villageIdentity(db, req.headers.authorization);
        if (stopped || socket.destroyed) return;
        if (!identity) return reject(socket, "401 Unauthorized");
        if (Date.now() - now >= VILLAGE.leaseMs)
          return reject(socket, "503 Service Unavailable");
        wss.handleUpgrade(req, socket, head, (ws) => {
          upgraded = true;
          let peer;
          ws.on("error", () => {
            if (peer) room.leave(peer, 1008, "Connexion invalide");
          });
          const transport = {
            send(event) {
              if (ws.readyState !== WebSocket.OPEN) return;
              if (ws.bufferedAmount > 65536) {
                if (peer)
                  queueMicrotask(() =>
                    room.leave(peer, 4000, "Connexion trop lente"),
                  );
                return;
              }
              ws.send(JSON.stringify(event), (error) => {
                if (error) ws.terminate();
              });
            },
            close(code, reason) {
              ws.close(code, reason);
              const timer = setTimeout(() => ws.terminate(), 1000);
              timer.unref();
              ws.once("close", () => clearTimeout(timer));
            },
          };
          peer = room.join(identity, transport);
          ws.on("close", () => room.leave(peer));
          ws.on("message", (bytes, binary) => {
            if (!peer) return;
            if (binary) return room.leave(peer, 1008, "JSON texte requis");
            try {
              room.receive(peer, JSON.parse(bytes.toString()));
            } catch {
              room.leave(peer, 1008, "Message invalide");
            }
          });
        });
      });
    } catch {
      if (upgraded) socket.destroy();
      else reject(socket, "503 Service Unavailable");
    } finally {
      clearTimeout(timeout);
      pending.delete(socket);
    }
  };
  server.on("upgrade", upgrade);

  async function revalidate() {
    if (stopped || checking || !room.peers.size) return;
    checking = true;
    const started = Date.now();
    const peers = [...room.peers.values()];
    try {
      const rows = await db
        .prepare(
          `SELECT s.token,s.expires ${accessSQL}
        AND s.token IN (${peers.map(() => "?").join(",")})`,
        )
        .all(started, ...peers.map((p) => p.tokenHash));
      if (stopped) return;
      const current = new Map(rows.map((r) => [r.token, Number(r.expires)]));
      for (const peer of peers) {
        if (room.peers.get(peer.id) !== peer) continue;
        if (!current.has(peer.tokenHash))
          room.leave(peer, 4003, "Session ou admission retirée");
        else {
          peer.expires = current.get(peer.tokenHash);
          // Slow/failed DB queries never extend the original access lease.
          peer.leaseUntil = started + VILLAGE.leaseMs;
        }
      }
    } catch {
      for (const peer of peers)
        room.leave(peer, 1013, "Vérification indisponible");
    } finally {
      checking = false;
    }
  }
  const timer = setInterval(() => {
    room.tick();
    if (Date.now() - lastCheck >= 2000 && room.peers.size) {
      lastCheck = Date.now();
      void revalidate();
    }
  }, 100);
  timer.unref();
  return {
    room,
    revalidate,
    close() {
      stopped = true;
      clearInterval(timer);
      server.off("upgrade", upgrade);
      for (const socket of pending) socket.destroy();
      room.close();
      wss.close();
    },
  };
}
