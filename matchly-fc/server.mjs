import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.argv.includes('--dev');
const PORT = Number(process.env.PORT || 5173);
const HOST = '0.0.0.0';

// In-memory room state relay (complements Supabase Realtime for zero-latency sync)
const rooms = new Map(); // code -> room object
const roomSockets = new Map(); // code -> Set<ws>

function broadcastToRoom(code, payload, excludeWs = null) {
  const peers = roomSockets.get(code);
  if (!peers) return;
  const serialized = JSON.stringify(payload);
  for (const client of peers) {
    if (client !== excludeWs && client.readyState === 1) {
      client.send(serialized);
    }
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 512_000) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ico': 'image/x-icon',
};

async function start() {
  const server = http.createServer();
  let vite = null;
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      root: __dirname,
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: {
          server,
          path: '/__vite_hmr',
        },
      },
      appType: 'spa',
    });
  }

  server.on('request', async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    // Health check
    if (url.pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, rooms: rooms.size, mode: isDev ? 'dev' : 'prod' }));
      return;
    }

    // Room REST mirror endpoints
    if (url.pathname === '/api/rooms' && req.method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const code = String(body.code || '').toUpperCase().trim();
        if (!code) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Code requis' }));
          return;
        }
        const room = {
          ...body,
          code,
          updated_at: new Date().toISOString(),
        };
        rooms.set(code, room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ room }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: String(err) }));
      }
      return;
    }

    if (url.pathname.startsWith('/api/rooms/')) {
      const code = decodeURIComponent(url.pathname.slice('/api/rooms/'.length)).toUpperCase().trim();
      if (req.method === 'GET') {
        const room = rooms.get(code) || null;
        res.writeHead(room ? 200 : 404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ room }));
        return;
      }
      if (req.method === 'PATCH') {
        try {
          const patch = await readJsonBody(req);
          const existing = rooms.get(code) || { code };
          const updated = {
            ...existing,
            ...patch,
            code,
            updated_at: new Date().toISOString(),
          };
          rooms.set(code, updated);
          broadcastToRoom(code, { type: 'room_patch', room: updated });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ room: updated }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: String(err) }));
        }
        return;
      }
    }

    if (vite) {
      vite.middlewares(req, res);
      return;
    }

    // Production static serving from dist/
    const distDir = path.join(__dirname, 'dist');
    let filePath = path.join(distDir, url.pathname === '/' ? 'index.html' : url.pathname);
    if (!filePath.startsWith(distDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Build dist/ introuvable');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname === '/ws') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
    // Otherwise let Vite HMR handle its own upgrade listener
  });

  wss.on('connection', (ws) => {
    let joinedCode = null;
    let playerSide = null;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(String(raw));
        if (msg.type === 'join_room' && msg.code) {
          const code = String(msg.code).toUpperCase().trim();
          if (joinedCode && roomSockets.has(joinedCode)) {
            roomSockets.get(joinedCode).delete(ws);
          }
          joinedCode = code;
          playerSide = msg.side || null;
          if (!roomSockets.has(code)) roomSockets.set(code, new Set());
          roomSockets.get(code).add(ws);

          const currentRoom = rooms.get(code);
          if (currentRoom) {
            ws.send(JSON.stringify({ type: 'room_patch', room: currentRoom }));
          }
          broadcastToRoom(code, { type: 'peer_presence', side: playerSide, online: true }, ws);
          return;
        }

        if (joinedCode && msg.type) {
          if (msg.type === 'room_patch' && msg.room) {
            const merged = { ...(rooms.get(joinedCode) || {}), ...msg.room, code: joinedCode };
            rooms.set(joinedCode, merged);
          }
          broadcastToRoom(joinedCode, msg, ws);
        }
      } catch {
        // ignore malformed packets
      }
    });

    ws.on('close', () => {
      if (joinedCode && roomSockets.has(joinedCode)) {
        const set = roomSockets.get(joinedCode);
        set.delete(ws);
        if (set.size === 0) roomSockets.delete(joinedCode);
        else broadcastToRoom(joinedCode, { type: 'peer_presence', side: playerSide, online: false }, ws);
      }
    });
  });

  // Periodic cleanup of stale rooms older than 6 hours
  setInterval(() => {
    const cutoff = Date.now() - 6 * 3600 * 1000;
    for (const [code, r] of rooms.entries()) {
      const ts = r.updated_at ? Date.parse(r.updated_at) : Date.now();
      if (ts < cutoff && (!roomSockets.has(code) || roomSockets.get(code).size === 0)) {
        rooms.delete(code);
      }
    }
  }, 600_000).unref();

  server.listen(PORT, HOST, () => {
    console.log(`[Matchly FC] Serveur actif sur http://${HOST}:${PORT} (${isDev ? 'dev' : 'prod'})`);
  });
}

start();
