import { test } from "node:test";
import assert from "node:assert/strict";
import { postgresOptions, postgresSql } from "../server/database.js";
import { openStore, verifyPassword } from "../server/store.js";
import { bootstrapAdmin } from "../server/bootstrap-admin.js";
import { recoveryAvailable, sendRecovery } from "../server/mailer.js";
import { createApp } from "../server/app.js";

test("Neon connection uses verified TLS; disabling SSL is only possible on loopback", () => {
  const remote = postgresOptions(
    "postgresql://user:private@db.example.test/test?sslmode=require&channel_binding=require",
  );
  assert.equal(remote.ssl.rejectUnauthorized, true);
  assert.equal(
    new URL(remote.connectionString).searchParams.has("sslmode"),
    false,
  );
  assert.equal(
    postgresOptions(
      "postgresql://user:private@db.example.test/test?sslmode=disable",
    ).ssl.rejectUnauthorized,
    true,
  );
  assert.equal(
    postgresOptions(
      "postgresql://user:private@127.0.0.1:5432/test?sslmode=disable",
    ).ssl,
    false,
  );
  assert.equal(remote.max, 4);
  assert.equal(
    postgresSql(
      "SELECT '?' AS text, value FROM settings WHERE key=? AND value=?",
    ),
    "SELECT '?' AS text, value FROM settings WHERE key=$1 AND value=$2",
  );
});

test("Render never falls back to ephemeral SQLite when DATABASE_URL is missing", async () => {
  const oldRender = process.env.RENDER,
    oldUrl = process.env.DATABASE_URL;
  try {
    process.env.RENDER = "true";
    delete process.env.DATABASE_URL;
    await assert.rejects(() => openStore(), /DATABASE_URL est obligatoire/);
  } finally {
    if (oldRender === undefined) delete process.env.RENDER;
    else process.env.RENDER = oldRender;
    if (oldUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = oldUrl;
  }
});

test("private owner bootstrap is atomic, idempotent and never overwrites credentials", async () => {
  const db = await openStore(":memory:");
  const env = {
    ADMIN_EMAIL: "owner@example.test",
    ADMIN_PASSWORD: "Private-Test-Password!2026",
    ADMIN_NAME: "Hokage",
  };
  try {
    await assert.rejects(
      () => bootstrapAdmin(db, {}, { required: true }),
      /ADMIN_EMAIL/,
    );
    const results = await Promise.all([
      bootstrapAdmin(db, env),
      bootstrapAdmin(db, env),
    ]);
    assert.equal(results.filter((r) => r.created).length, 1);
    const user = await db
      .prepare("SELECT * FROM users WHERE role='admin'")
      .get();
    assert.equal(verifyPassword(env.ADMIN_PASSWORD, user.password), true);
    await bootstrapAdmin(db, {
      ...env,
      ADMIN_PASSWORD: "New-Not-Applied-Password!2026",
    });
    assert.equal(
      (await db.prepare("SELECT * FROM users WHERE role='admin'").get())
        .password,
      user.password,
    );
    assert.deepEqual(await bootstrapAdmin(db, {}, { required: true }), {
      created: false,
      configured: true,
    });
  } finally {
    await db.close();
  }
});

test("bootstrap refuses to promote a previously registered player", async () => {
  const db = await openStore(":memory:");
  try {
    await db
      .prepare("INSERT INTO users(name,email,password) VALUES (?,?,?)")
      .run("Player", "owner@example.test", "not-a-real-hash");
    await assert.rejects(
      () =>
        bootstrapAdmin(db, {
          ADMIN_EMAIL: "owner@example.test",
          ADMIN_PASSWORD: "Private-Test-Password!2026",
          ADMIN_NAME: "Owner",
        }),
      /compte joueur/,
    );
    assert.equal(
      (await db.prepare("SELECT role FROM users").get()).role,
      "player",
    );
  } finally {
    await db.close();
  }
});

test("Render health checks never query the database or block on Neon wake-up", async () => {
  const db = {
    prepare() {
      throw new Error("Health must not access DB");
    },
  };
  const app = createApp(db);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  try {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/healthz`,
      { headers: { Cookie: "iz_session=old-cookie" } },
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
  } finally {
    app.locals.cleanup();
    await new Promise((r) => server.close(r));
  }
});

test("recovery remains disabled on Render without an HTTPS mail provider", async () => {
  const smtp = {
    RENDER: "true",
    PUBLIC_ORIGIN: "https://example.test",
    SMTP_HOST: "smtp.example.test",
    SMTP_FROM: "noreply@example.test",
  };
  assert.equal(recoveryAvailable(smtp), false);
  assert.equal(recoveryAvailable({ ...smtp, RENDER: "false" }), true);
  assert.equal(
    recoveryAvailable({
      ...smtp,
      RESEND_API_KEY: "test-only-key",
      MAIL_FROM: "noreply@example.test",
    }),
    true,
  );
  await assert.rejects(
    () => sendRecovery("user@example.test", "test-token", smtp),
    /MAIL_NOT_CONFIGURED/,
  );
});

test("HTTPS password recovery sends a bounded request without leaking tokens in errors", async (t) => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    requests.push({ url, options });
    return { ok: true };
  });
  const env = {
    PUBLIC_ORIGIN: "https://idrem.example.test",
    RESEND_API_KEY: "test-only-key",
    MAIL_FROM: "IDREM <noreply@example.test>",
  };
  await sendRecovery("user@example.test", "test-only-token", env);
  assert.equal(requests[0].url, "https://api.resend.com/emails");
  const payload = JSON.parse(requests[0].options.body);
  assert.deepEqual(payload.to, ["user@example.test"]);
  assert.match(
    payload.text,
    /https:\/\/idrem.example.test\/reinitialiser\?token=test-only-token/,
  );
  assert.ok(requests[0].options.signal instanceof AbortSignal);
  t.mock.method(globalThis, "fetch", async () => ({ ok: false }));
  await assert.rejects(
    () => sendRecovery("user@example.test", "test-only-token", env),
    /^Error: MAIL_DELIVERY_FAILED$/,
  );
});
