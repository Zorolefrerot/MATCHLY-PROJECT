import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { WebSocket } from "ws";
import { installVillage } from "../server/village.js";
import { test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openStore } from "../server/store.js";
import { villageContract } from "./helpers/village-contract.js";
test("real WebSocket admission, two avatars, movement, RP, reconnect and deletion contract", async () => {
  const dir = mkdtempSync(join(tmpdir(), "idrem-village-"));
  const db = await openStore(join(dir, "test.sqlite"));
  try {
    await villageContract(db);
  } finally {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("unknown upgrades close and missing native credentials never acquire the database lock", async () => {
  let databaseCalls = 0;
  const denyDatabase = () => {
    databaseCalls++;
    throw new Error("No database access expected");
  };
  const server = createServer((req, res) => res.end("available"));
  const village = installVillage(
    server,
    { transaction: denyDatabase, prepare: denyDatabase },
    { production: true },
  );
  const clients = [];
  try {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = `127.0.0.1:${server.address().port}`;
    for (const [path, token, status] of [
      ["/unknown", "", 404],
      ["/api/game/village", "", 401],
      ["/api/game/village", "Bearer invalid", 401],
    ]) {
      const ws = new WebSocket(`ws://${base}${path}`, {
        handshakeTimeout: 4000,
        headers: {
          "X-Forwarded-Proto": "https",
          Cookie: "iz_session=not-a-native-token",
          ...(token ? { Authorization: token } : {}),
        },
      });
      clients.push(ws);
      ws.on("error", () => {});
      const [, response] = await once(ws, "unexpected-response");
      assert.equal(response.statusCode, status);
      assert.equal(response.headers.connection, "close");
      response.resume();
      ws.terminate();
    }
    assert.equal(databaseCalls, 0);
    assert.equal(village.room.peers.size, 0);
    assert.equal(
      await (await fetch(`http://${base}/healthz`)).text(),
      "available",
    );
  } finally {
    for (const client of clients) client.terminate();
    village.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
