// Real Node HTTPS/WSS + two Godot clients. Disposable data/certificate only.
import { spawn, execFileSync } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:https";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";
import {
  openStore,
  digest,
  decide,
  allocate,
  hashPassword,
} from "../../server/store.js";
import { createApp } from "../../server/app.js";
import { installVillage } from "../../server/village.js";
const dir = mkdtempSync(join(tmpdir(), "idrem-native-network-"));
let db, app, server, village, child;
try {
  execFileSync(
    "openssl",
    [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-days",
      "1",
      "-keyout",
      join(dir, "key.pem"),
      "-out",
      join(dir, "cert.pem"),
      "-subj",
      "/CN=127.0.0.1",
      "-addext",
      "subjectAltName=IP:127.0.0.1",
    ],
    { stdio: "ignore" },
  );
  // Do not inherit DATABASE_URL: this runner can never touch production Neon.
  const previous = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    db = await openStore(join(dir, "fixture.sqlite"));
  } finally {
    if (previous !== undefined) process.env.DATABASE_URL = previous;
  }
  const owner = Number(
    (
      await db
        .prepare(
          "INSERT INTO users(name,email,password,role) VALUES ('Owner','owner@fixture.test',?,'admin')",
        )
        .run(hashPassword("Not-a-production-password"))
    ).lastInsertRowid,
  );
  const players = [];
  for (let i = 0; i < 2; i++) {
    const id = Number(
      (
        await db
          .prepare("INSERT INTO users(name,email,password) VALUES (?,?,?)")
          .run(
            `Test ${i}`,
            `test${i}@fixture.test`,
            "test-only-unusable-password",
          )
      ).lastInsertRowid,
    );
    const aid = Number(
      (
        await db
          .prepare(
            "INSERT INTO applications(user_id,character,discovery,goals,motivation,story,answers,quiz_snapshot,score) VALUES (?,?,?,?,?,?,?,?,?)",
          )
          .run(
            id,
            `Genin Réseau ${i}`,
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
    await decide(db, owner, aid, "accepted");
    await allocate(db, id);
    const appearance = {
      model: i,
      hair: 3,
      hair_color: 2,
      eyes: 4,
      skin: 3,
      top: 1,
      top_color: i,
      bottom: 2,
      bottom_color: 7,
    };
    await db
      .prepare(
        "INSERT INTO character_appearances(user_id,appearance,revision,updated) VALUES (?,?,1,'test')",
      )
      .run(id, JSON.stringify(appearance));
    const token = randomBytes(32).toString("hex");
    await db
      .prepare(
        "INSERT INTO game_sessions(token,user_id,expires) VALUES (?,?,?)",
      )
      .run(digest(token), id, Date.now() + 120000);
    const allocation = await db
      .prepare("SELECT * FROM allocations WHERE user_id=?")
      .get(id);
    players.push({
      token,
      profile: {
        protocol: 1,
        schemaVersion: 1,
        revision: 1,
        appearance,
        character: {
          id,
          name: `Genin Réseau ${i}`,
          clan: allocation.clan,
          affinity: allocation.affinity,
          mokuton: Boolean(allocation.mokuton),
          rank: "Genin",
          village: "Konoha",
        },
        welcomeMission: {
          schemaVersion: 1,
          missionId: "konoha_welcome",
          status: "available",
          visited: [],
          revision: 0,
        },
      },
    });
  }
  app = createApp(db);
  server = createServer(
    {
      key: readFileSync(join(dir, "key.pem")),
      cert: readFileSync(join(dir, "cert.pem")),
    },
    app,
  );
  village = installVillage(server, db, { production: true });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const config = join(dir, "fixture.json");
  writeFileSync(
    config,
    JSON.stringify({
      players,
      url: `wss://127.0.0.1:${server.address().port}/api/game/village`,
      ca: join(dir, "cert.pem"),
    }),
    { mode: 0o600 },
  );
  const childEnv = { ...process.env, IDREM_VILLAGE_FIXTURE: config };
  delete childEnv.DATABASE_URL;
  delete childEnv.ADMIN_PASSWORD;
  delete childEnv.ADMIN_EMAIL;
  child = spawn(
    process.env.GODOT_BIN || "godot",
    [
      "--headless",
      "--verbose",
      "--audio-driver",
      "Dummy",
      "--path",
      resolve("game"),
      "--script",
      "res://tests/village_network.gd",
    ],
    {
      env: childEnv,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let logs = "";
  for (const stream of [child.stdout, child.stderr])
    stream.on("data", (chunk) => {
      process.stdout.write(chunk);
      logs = (logs + chunk).slice(-2000000);
    });
  const timeout = setTimeout(() => child.kill("SIGKILL"), 90000);
  timeout.unref();
  let code;
  try {
    [code] = await once(child, "exit");
  } finally {
    clearTimeout(timeout);
  }
  if (
    code !== 0 ||
    /SCRIPT ERROR:|ERROR:|TEST FAILED:/.test(logs) ||
    !logs.includes("IDREM_VILLAGE_NETWORK_FAILURES=0")
  )
    throw new Error("Native network validation failed");
  console.log("IDREM_NATIVE_WSS_SUCCESS");
} catch (error) {
  console.error(error.code || "IDREM_NATIVE_WSS_FAILED");
  process.exitCode = 1;
} finally {
  child?.kill("SIGTERM");
  village?.close();
  app?.locals.cleanup();
  if (server) await new Promise((r) => server.close(r));
  await db?.close();
  rmSync(dir, { recursive: true, force: true });
}
