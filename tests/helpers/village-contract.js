import assert from "node:assert/strict";
import { once } from "node:events";
import { WebSocket } from "ws";
import { createApp } from "../../server/app.js";
import { installVillage, villageIdentity } from "../../server/village.js";
import { digest, hashPassword, allocate, decide } from "../../server/store.js";
import { removeAcceptedAccount } from "../../server/account-removal.js";

export async function villageContract(db, secondDb = db) {
  const password = "Private-network-test-password";
  const hash = hashPassword(password);
  const owner = Number(
    (
      await db
        .prepare(
          "INSERT INTO users(name,email,password,role) VALUES (?,?,?,'admin')",
        )
        .run("Owner", "ws-owner@test.local", hash)
    ).lastInsertRowid,
  );
  const ids = [],
    tokens = ["a", "b", "c", "d"].map((c) => c.repeat(64));
  for (let i = 0; i < 4; i++) {
    const id = Number(
      (
        await db
          .prepare("INSERT INTO users(name,email,password) VALUES (?,?,?)")
          .run(`WS ${i}`, `ws${i}@test.local`, hash)
      ).lastInsertRowid,
    );
    ids.push(id);
    const aid = Number(
      (
        await db
          .prepare(
            "INSERT INTO applications(user_id,character,discovery,goals,motivation,story,answers,quiz_snapshot,score) VALUES (?,?,?,?,?,?,?,?,?)",
          )
          .run(
            id,
            `Genin WS ${i}`,
            "test",
            "test",
            "test",
            "test",
            "{}",
            "[]",
            0,
          )
      ).lastInsertRowid,
    );
    if (i !== 2) await decide(db, owner, aid, "accepted");
    if (i < 2) await allocate(db, id);
    await db
      .prepare(
        "INSERT INTO game_sessions(token,user_id,expires) VALUES (?,?,?)",
      )
      .run(digest(tokens[i]), id, Date.now() + 600000);
  }
  const ownerToken = "e".repeat(64);
  await db
    .prepare("INSERT INTO game_sessions(token,user_id,expires) VALUES (?,?,?)")
    .run(digest(ownerToken), owner, Date.now() + 600000);
  await db
    .prepare("INSERT INTO sessions(token,user_id,expires) VALUES (?,?,?)")
    .run(digest("ws-owner-cookie"), owner, Date.now() + 600000);
  const appearance = {
    model: 1,
    hair: 3,
    hair_color: 7,
    eyes: 2,
    skin: 4,
    top: 2,
    top_color: 6,
    bottom: 1,
    bottom_color: 0,
  };
  await db
    .prepare(
      "INSERT INTO character_appearances(user_id,appearance,revision,updated) VALUES (?,?,1,'test')",
    )
    .run(ids[0], JSON.stringify(appearance));
  const before = await db
    .prepare("SELECT * FROM allocations ORDER BY user_id")
    .all();
  const app = createApp(db);
  const server = app.listen(0, "127.0.0.1");
  const village = installVillage(server, db, {
    production: true,
    publicOrigin: "https://village.test",
  });
  await once(server, "listening");
  const url = `ws://127.0.0.1:${server.address().port}/api/game/village`;
  const clients = [];
  const connect = (token, headers = {}, suffix = "") => {
    const ws = new WebSocket(url + suffix, {
      headers: {
        "X-Forwarded-Proto": "https",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
    const events = [];
    const waits = new Set();
    ws.on("error", () => {});
    ws.on("message", (bytes) => {
      const event = JSON.parse(bytes.toString());
      events.push(event);
      for (const fn of waits) fn(event);
    });
    const client = {
      ws,
      events,
      wait(type, predicate = () => true) {
        const existing = events.find((e) => e.type === type && predicate(e));
        if (existing) return Promise.resolve(existing);
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            waits.delete(done);
            reject(new Error(`Missing ${type}`));
          }, 4000);
          function done(event) {
            if (event.type !== type || !predicate(event)) return;
            clearTimeout(timeout);
            waits.delete(done);
            resolve(event);
          }
          waits.add(done);
        });
      },
    };
    clients.push(client);
    return client;
  };
  const denied = async (token, status, headers, suffix) => {
    const { ws } = connect(token, headers, suffix);
    const [, response] = await once(ws, "unexpected-response");
    assert.equal(response.statusCode, status);
    response.resume();
    ws.terminate();
  };
  try {
    await denied(null, 401, { Cookie: "iz_session=ws-owner-cookie" });
    await denied(tokens[2], 401); // pending
    await denied(tokens[3], 401); // accepted but attribution not performed
    await denied(ownerToken, 401);
    await denied(tokens[0], 403, { Origin: "https://foreign.test" });
    await denied(tokens[0], 403, { "X-Forwarded-Proto": "http" });
    await denied(tokens[0], 400, {}, `?token=${tokens[0]}`);
    const a = connect(tokens[0]),
      b = connect(tokens[1]);
    assert.equal((await a.wait("welcome")).self, ids[0]);
    await b.wait("welcome");
    const roster = await a.wait("roster", (e) => e.players.length === 2);
    assert.deepEqual(
      roster.players.find((p) => p.id === ids[0]).appearance,
      appearance,
    );
    assert.deepEqual(Object.keys(roster.players[0]).sort(), [
      "appearance",
      "id",
      "name",
    ]);
    a.ws.send(
      JSON.stringify({
        type: "move",
        seq: 0,
        p: [0, 1, 21],
        yaw: 1,
        motion: "jump",
      }),
    );
    const snapshot = await b.wait("snapshot", (e) =>
      e.players.some((p) => p.id === ids[0] && p.motion === "jump"),
    );
    assert.equal(snapshot.players.find((p) => p.id === ids[0]).p[1], 1);
    a.ws.send(
      JSON.stringify({
        type: "chat",
        seq: 0,
        channel: "RP",
        text: "Bonjour, voisin !",
      }),
    );
    const message = await b.wait("chat");
    assert.equal(message.sender, ids[0]);
    assert.equal(message.name, "Genin WS 0");
    const replaced = once(a.ws, "close");
    const again = connect(tokens[0]);
    await again.wait("welcome");
    assert.equal((await replaced)[0], 4001);
    assert.equal(village.room.peers.size, 2);
    assert.ok(!again.events.some((e) => e.type === "chat"));
    const departure = once(again.ws, "close");
    again.ws.close(1000, "Départ");
    await departure;
    await b.wait("roster", (e) => e.players.length === 1);
    assert.equal(village.room.peers.size, 1);
    const rejoined = connect(tokens[0]);
    await rejoined.wait("welcome");
    const revoked = once(rejoined.ws, "close");
    await secondDb
      .prepare("DELETE FROM game_sessions WHERE user_id=?")
      .run(ids[0]);
    await village.revalidate();
    assert.equal((await revoked)[0], 4003);
    await denied(tokens[0], 401);
    // A real deletion contract through another PG pool removes existing presence.
    const removed = once(b.ws, "close");
    await removeAcceptedAccount(secondDb, owner, "ws-owner-cookie", ids[1], {
      confirmation: "Genin WS 1",
      password,
      releasePlace: true,
    });
    await village.revalidate();
    assert.equal((await removed)[0], 4003);
    await denied(tokens[1], 401);
    const after = await db
      .prepare("SELECT * FROM allocations ORDER BY user_id")
      .all();
    assert.deepEqual(
      after,
      before.filter((row) => row.user_id !== ids[1]),
    );
    assert.equal(
      (await db.prepare("SELECT COUNT(*) AS n FROM welcome_missions").get()).n,
      0,
    );
    assert.deepEqual(
      JSON.parse(
        (
          await db
            .prepare(
              "SELECT appearance FROM character_appearances WHERE user_id=?",
            )
            .get(ids[0])
        ).appearance,
      ),
      appearance,
    );
    assert.equal(await villageIdentity(db, "Bearer " + tokens[1]), null);
  } finally {
    for (const client of clients) client.ws.terminate();
    village.close();
    app.locals.cleanup();
    await new Promise((resolve) => server.close(resolve));
  }
}
