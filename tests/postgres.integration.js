import { test, before, after } from "node:test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { randomBytes } from "node:crypto";
import EmbeddedPostgres from "embedded-postgres";
import {
  openStore,
  decide,
  allocate,
  digest,
  transaction,
} from "../server/store.js";
import { bootstrapAdmin } from "../server/bootstrap-admin.js";
import { createApp } from "../server/app.js";
import { quiz } from "../server/quiz.js";

// A real, disposable PostgreSQL cluster. Never connects to the user's Neon DB.
const previousUrl = process.env.DATABASE_URL;
const dir = mkdtempSync(join(tmpdir(), "idrem-pg-"));
const ownerEnv = {
  ADMIN_EMAIL: "owner@example.test",
  ADMIN_PASSWORD: "Owner-Only-Test-Password!2026",
  ADMIN_NAME: "Test Owner",
};
let cluster, db, second, server, app, base, ownerId, cookie, candidateId;
const candidates = [];
let assignments = [];
const payload = {
  character: "Haru Test",
  discovery: "Découvert dans notre groupe.",
  goals: "Aider les autres joueurs pendant les missions.",
  motivation: "Participer à des aventures en équipe avec respect.",
  story:
    "Un genin de Konoha qui souhaite protéger sa famille et découvrir le monde.",
  consent: true,
  answers: Object.fromEntries(quiz.map((q) => [q.id, q.answer])),
};
async function request(path, { body, cookie, method, headers = {} } = {}) {
  const response = await fetch(base + "/api" + path, {
    method: method || (body ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: response.status,
    body: await response.json(),
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
}
before(async () => {
  const probe = createServer();
  await new Promise((r) => probe.listen(0, "127.0.0.1", r));
  const port = probe.address().port;
  await new Promise((r) => probe.close(r));
  const password = randomBytes(24).toString("hex");
  cluster = new EmbeddedPostgres({
    databaseDir: dir,
    user: "test_owner",
    password,
    port,
    persistent: false,
    authMethod: "scram-sha-256",
    postgresFlags: ["-h", "127.0.0.1"],
    onLog: () => {},
    onError: () => {},
  });
  await cluster.initialise();
  await cluster.start();
  await cluster.createDatabase("idrem_test");
  process.env.DATABASE_URL = `postgresql://test_owner:${password}@127.0.0.1:${port}/idrem_test?sslmode=disable`;
  [db, second] = await Promise.all([openStore(), openStore()]);
  app = createApp(db);
  server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  app?.locals.cleanup();
  if (server) await new Promise((r) => server.close(r));
  await db?.close();
  await second?.close();
  await cluster?.stop();
  if (previousUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = previousUrl;
  rmSync(dir, { recursive: true, force: true });
});

test("PostgreSQL schema and sole owner initialize safely across two connections", async () => {
  assert.equal(db.dialect, "postgres");
  const owners = await Promise.all([
    bootstrapAdmin(db, ownerEnv),
    bootstrapAdmin(second, ownerEnv),
  ]);
  assert.equal(owners.filter((o) => o.created).length, 1);
  assert.equal(
    (
      await db
        .prepare("SELECT COUNT(*) AS n FROM users WHERE role='admin'")
        .get()
    ).n,
    1,
  );
  ownerId = (await db.prepare("SELECT id FROM users WHERE role='admin'").get())
    .id;
  assert.equal(
    (await db.prepare("SELECT COUNT(*) AS n FROM mokuton_slots").get()).n,
    20,
  );
  assert.equal(
    (await db.prepare("SELECT SUM(potential) AS n FROM mokuton_slots").get()).n,
    3,
  );
});

test("real Postgres registration, duplicate handling, private sessions and quiz snapshots", async () => {
  const reg = await request("/auth/register", {
    body: {
      name: "Haru",
      email: "haru@example.test",
      password: "Test-Candidate-Password!2026",
      role: "admin",
    },
  });
  assert.equal(reg.status, 201);
  assert.equal(reg.body.user.role, "player");
  cookie = reg.cookie;
  candidateId = reg.body.user.id;
  assert.equal(
    (
      await request("/auth/register", {
        body: {
          name: "Haru",
          email: "haru@example.test",
          password: "Another-Password!2026",
        },
      })
    ).status,
    409,
  );
  const submitted = await Promise.all([
    request("/application", { cookie, body: payload }),
    request("/application", { cookie, body: payload }),
  ]);
  assert.deepEqual(submitted.map((r) => r.status).sort(), [201, 409]);
  assert.equal((await request("/admin/applications", { cookie })).status, 403);
  assert.equal(
    (await request("/allocation", { cookie, body: {} })).status,
    409,
  );
  const me = (await request("/me", { cookie })).body;
  assert.equal(me.application.status, "pending");
  assert.equal(me.application.character, payload.character);
  assert.ok(!("password" in me.user));
  assert.ok(!("answers" in me.application));
  const outsider = await request("/auth/register", {
    body: {
      name: "Other",
      email: "other@example.test",
      password: "Other-Test-Password!2026",
    },
  });
  assert.equal(
    (await request("/me", { cookie: outsider.cookie })).body.application,
    null,
  );
  const owner = await request("/auth/login", {
    body: { email: ownerEnv.ADMIN_EMAIL, password: ownerEnv.ADMIN_PASSWORD },
  });
  const edited = quiz.map((q) => ({ ...q }));
  edited[0] = {
    ...edited[0],
    question: "Quel personnage dirige Konoha au début de Shippuden ?",
  };
  assert.equal(
    (
      await request("/admin/quiz", {
        cookie: owner.cookie,
        method: "PUT",
        body: { questions: edited },
      })
    ).status,
    200,
  );
  const stored = await db
    .prepare("SELECT quiz_snapshot,score FROM applications WHERE user_id=?")
    .get(candidateId);
  assert.equal(stored.score, 10);
  assert.equal(JSON.parse(stored.quiz_snapshot)[0].question, quiz[0].question);
  assert.equal((await request("/quiz")).body[0].question, edited[0].question);
  assert.ok((await request("/quiz")).body.every((q) => !("answer" in q)));
  candidates.push({ user: candidateId, id: me.application.id });
});

test("concurrent PostgreSQL admissions stop at 20 across separate app pools", async () => {
  for (let i = 0; i < 20; i++) {
    const user = Number(
      (
        await db
          .prepare("INSERT INTO users(name,email,password) VALUES (?,?,?)")
          .run("Ninja " + i, `ninja${i}@example.test`, "unused-test-hash")
      ).lastInsertRowid,
    );
    const id = Number(
      (
        await db
          .prepare(
            "INSERT INTO applications(user_id,character,discovery,goals,motivation,story,answers,quiz_snapshot,score) VALUES (?,?,?,?,?,?,?,?,?)",
          )
          .run(
            user,
            "Ninja",
            "Friend",
            "Goal",
            "Motivation",
            "Story",
            "{}",
            JSON.stringify(quiz),
            0,
          )
      ).lastInsertRowid,
    );
    candidates.push({ user, id });
  }
  const results = await Promise.allSettled(
    candidates.map((c, i) =>
      decide(i % 2 ? db : second, ownerId, c.id, "accepted", "Bienvenue"),
    ),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 20);
  assert.equal(results.filter((r) => r.status === "rejected").length, 1);
  assert.match(
    results.find((r) => r.status === "rejected").reason.message,
    /20 places/,
  );
  assert.equal(
    (
      await db
        .prepare(
          "SELECT COUNT(*) AS n FROM applications WHERE status='accepted'",
        )
        .get()
    ).n,
    20,
  );
  assert.equal((await request("/info")).body.accepted, 20);
});

test("concurrent PostgreSQL draws remain unique, capped, persistent and exactly three Mokuton", async () => {
  const admitted = await db
    .prepare(
      "SELECT user_id FROM applications WHERE status='accepted' ORDER BY id",
    )
    .all();
  const draws = await Promise.all(
    admitted.flatMap((c) => [
      allocate(db, c.user_id),
      allocate(second, c.user_id),
    ]),
  );
  for (let i = 0; i < draws.length; i += 2)
    assert.deepEqual(draws[i], draws[i + 1]);
  assignments = await db
    .prepare("SELECT * FROM allocations ORDER BY user_id")
    .all();
  assert.equal(assignments.length, 20);
  assert.equal(assignments.filter((a) => a.mokuton).length, 3);
  for (const clan of ["Uchiwa", "Uzumaki", "Senju"])
    assert.ok(assignments.filter((a) => a.clan === clan).length <= 3);
  await second.close();
  second = await openStore();
  assert.deepEqual(
    await second.prepare("SELECT * FROM allocations ORDER BY user_id").all(),
    assignments,
  );
  assert.deepEqual(
    await allocate(second, assignments[0].user_id),
    assignments[0],
  );
});

test("PostgreSQL rollback and single-use password reset invalidate old sessions", async () => {
  await assert.rejects(
    () =>
      transaction(db, async () => {
        await db
          .prepare(
            "INSERT INTO settings(key,value) VALUES ('rollback_test','secret')",
          )
          .run();
        throw new Error("rollback");
      }),
    /rollback/,
  );
  assert.equal(
    await second
      .prepare("SELECT * FROM settings WHERE key='rollback_test'")
      .get(),
    undefined,
  );
  const token = randomBytes(32).toString("hex");
  await db
    .prepare("INSERT INTO resets VALUES (?,?,?)")
    .run(digest(token), candidateId, Date.now() + 60000);
  const resets = await Promise.all([
    request("/auth/reset", {
      body: { token, password: "New-Candidate-Password!2026" },
    }),
    request("/auth/reset", {
      body: { token, password: "New-Candidate-Password!2026" },
    }),
  ]);
  assert.deepEqual(resets.map((r) => r.status).sort(), [200, 400]);
  assert.equal((await request("/me", { cookie })).body.user, null);
  assert.equal(
    (
      await request("/auth/login", {
        body: {
          email: "haru@example.test",
          password: "New-Candidate-Password!2026",
        },
      })
    ).status,
    200,
  );
});

test("production entrypoint restarts against PostgreSQL with no bootstrap secrets left", async () => {
  const probe = createServer();
  await new Promise((r) => probe.listen(0, "127.0.0.1", r));
  const port = probe.address().port;
  await new Promise((r) => probe.close(r));
  const child = spawn(process.execPath, ["server/index.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
      RENDER: "true",
      PORT: String(port),
      RENDER_EXTERNAL_URL: "https://idrem.example.test",
      PUBLIC_ORIGIN: "",
      ADMIN_EMAIL: "",
      ADMIN_PASSWORD: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const exited = once(child, "exit");
  let output = "";
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Production startup timeout")),
        15000,
      );
      const observe = (chunk) => {
        output += chunk.toString();
        if (output.includes("disponible sur le port")) {
          clearTimeout(timeout);
          resolve();
        }
      };
      child.stdout.on("data", observe);
      child.stderr.on("data", observe);
      child.once("exit", (code) => {
        clearTimeout(timeout);
        reject(new Error(`Production startup exited (${code})`));
      });
    });
    const response = await fetch(`http://127.0.0.1:${port}/healthz`);
    assert.equal(response.status, 200);
    assert.match(output, /stockage postgres/);
    assert.ok(!output.includes(process.env.DATABASE_URL));
    const me = await fetch(`http://127.0.0.1:${port}/api/info`);
    assert.equal((await me.json()).accepted, 20);
  } finally {
    child.kill("SIGTERM");
    const timer = setTimeout(() => child.kill("SIGKILL"), 12000);
    timer.unref();
    const [code] = await exited;
    clearTimeout(timer);
    assert.equal(code, 0);
  }
});

test("native game API contract also holds on PostgreSQL", async () => {
  const { gameContract } = await import("./helpers/game-contract.js");
  await cluster.createDatabase("idrem_game_test");
  const old = process.env.DATABASE_URL;
  const url = new URL(old);
  url.pathname = "/idrem_game_test";
  process.env.DATABASE_URL = url.toString();
  let gameDb;
  try {
    gameDb = await openStore();
    await gameContract(gameDb);
  } finally {
    process.env.DATABASE_URL = old;
    await gameDb?.close();
  }
});

test("welcome mission contract holds across two PostgreSQL pools", async () => {
  const { missionContract } = await import("./helpers/mission-contract.js");
  await cluster.createDatabase("idrem_mission_test");
  const old = process.env.DATABASE_URL;
  const url = new URL(old);
  url.pathname = "/idrem_mission_test";
  process.env.DATABASE_URL = url.toString();
  let first, second;
  try {
    first = await openStore();
    second = await openStore();
    await missionContract(first, second);
  } finally {
    process.env.DATABASE_URL = old;
    await first?.close();
    await second?.close();
  }
});

test("account removal and replacement keep the 20-seat deck across PostgreSQL pools", async () => {
  const { removalContract } = await import("./helpers/removal-contract.js");
  await cluster.createDatabase("idrem_removal_test");
  const old = process.env.DATABASE_URL;
  const url = new URL(old);
  url.pathname = "/idrem_removal_test";
  process.env.DATABASE_URL = url.toString();
  let first, second;
  try {
    first = await openStore();
    second = await openStore();
    await removalContract(first, second);
  } finally {
    process.env.DATABASE_URL = old;
    await first?.close();
    await second?.close();
  }
});

test("village WebSocket revocation and account removal work across PostgreSQL pools", async () => {
  const { villageContract } = await import("./helpers/village-contract.js");
  await cluster.createDatabase("idrem_village_test");
  const old = process.env.DATABASE_URL;
  const url = new URL(old);
  url.pathname = "/idrem_village_test";
  process.env.DATABASE_URL = url.toString();
  let first, second;
  try {
    first = await openStore();
    second = await openStore();
    await villageContract(first, second);
  } finally {
    process.env.DATABASE_URL = old;
    await first?.close();
    await second?.close();
  }
});
