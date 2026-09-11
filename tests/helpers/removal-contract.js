import assert from "node:assert/strict";
import { createApp } from "../../server/app.js";
import {
  hashPassword,
  digest,
  allocate,
  decide,
  mapAllocationSeats,
  transaction,
} from "../../server/store.js";
import { downloadInfo } from "../../server/android-build.js";
export async function removalContract(db, secondDb = db) {
  const password = "Private-owner-removal-test";
  const owner = Number(
    (
      await db
        .prepare(
          "INSERT INTO users(name,email,password,role) VALUES (?,?,?,'admin')",
        )
        .run("Test Owner", "owner-removal@test.local", hashPassword(password))
    ).lastInsertRowid,
  );
  const ids = [];
  const hash = hashPassword("Private-player-password");
  for (let i = 0; i < 22; i++) {
    const id = Number(
      (
        await db
          .prepare("INSERT INTO users(name,email,password) VALUES (?,?,?)")
          .run(`Player ${i}`, `removal${i}@test.local`, hash)
      ).lastInsertRowid,
    );
    const application = Number(
      (
        await db
          .prepare(
            "INSERT INTO applications(user_id,character,discovery,goals,motivation,story,answers,quiz_snapshot,score) VALUES (?,?,?,?,?,?,?,?,?)",
          )
          .run(id, `Ninja ${i}`, "test", "test", "test", "test", "{}", "[]", 0)
      ).lastInsertRowid,
    );
    ids.push({ id, application });
    if (i < 20) {
      await decide(db, owner, application, "accepted");
      await allocate(db, id);
    }
  }
  const before = await db
    .prepare("SELECT * FROM allocations ORDER BY user_id")
    .all();
  // Simulate a pre-feature database: backfill existing draws without changing them.
  await db.prepare("DELETE FROM allocation_seats").run();
  await transaction(db, () => mapAllocationSeats(db));
  assert.deepEqual(
    await db.prepare("SELECT * FROM allocations ORDER BY user_id").all(),
    before,
  );
  assert.equal(
    (await db.prepare("SELECT COUNT(*) AS n FROM allocation_seats").get()).n,
    20,
  );
  const victim = before.find((row) => row.mokuton === 1);
  const victimIndex = ids.findIndex((row) => row.id === victim.user_id);
  const ownerToken = "owner-test-session",
    playerToken = "player-test-session",
    nativeToken = "b".repeat(64);
  for (const [token, id] of [
    [ownerToken, owner],
    [playerToken, victim.user_id],
  ])
    await db
      .prepare("INSERT INTO sessions(token,user_id,expires) VALUES (?,?,?)")
      .run(digest(token), id, Date.now() + 600000);
  await db
    .prepare("INSERT INTO game_sessions(token,user_id,expires) VALUES (?,?,?)")
    .run(digest(nativeToken), victim.user_id, Date.now() + 600000);
  await db
    .prepare("INSERT INTO resets(token,user_id,expires) VALUES (?,?,?)")
    .run("test-reset", victim.user_id, Date.now() + 600000);
  await db
    .prepare(
      "INSERT INTO welcome_missions(user_id,phase,visited,revision,updated) VALUES (?,'completed',7,5,'test')",
    )
    .run(victim.user_id);
  await db
    .prepare(
      "INSERT INTO character_appearances(user_id,appearance,revision,updated) VALUES (?,'{}',1,'test')",
    )
    .run(victim.user_id);
  const apps = [createApp(db), createApp(secondDb)],
    servers = apps.map((app) => app.listen(0, "127.0.0.1"));
  await Promise.all(
    servers.map(
      (server) => new Promise((resolve) => server.once("listening", resolve)),
    ),
  );
  const request = (path, { cookie, body, headers = {}, which = 0 } = {}) =>
    fetch(`http://127.0.0.1:${servers[which].address().port}/api${path}`, {
      method: body ? "POST" : "GET",
      redirect: "manual",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: `iz_session=${cookie}` } : {}),
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  const payload = {
    password,
    confirmation: `Ninja ${victimIndex}`,
    releasePlace: true,
  };
  const remove = (
    body = payload,
    cookie = ownerToken,
    id = victim.user_id,
    which = 0,
  ) => request(`/admin/accounts/${id}/delete`, { cookie, body, which });
  try {
    assert.equal((await request("/game-download")).status, 401);
    const me = await (await request("/me", { cookie: playerToken })).json();
    assert.ok(me.download);
    assert.equal(
      me.download.url,
      undefined,
      "API metadata does not leak the redirect URL",
    );
    const download = await request("/game-download", { cookie: playerToken });
    assert.equal(download.status, downloadInfo().available ? 302 : 410);
    if (downloadInfo().available)
      assert.match(download.headers.get("location"), /^https:\/\/github.com\//);
    assert.equal(download.headers.get("cache-control"), "no-store");
    assert.equal(
      (await request("/game-download", { cookie: ownerToken })).status,
      403,
    );
    assert.equal((await remove(payload, "")).status, 401);
    assert.equal((await remove(payload, playerToken)).status, 403);
    assert.equal((await remove({ ...payload, password: "wrong" })).status, 409);
    assert.equal(
      (await remove({ ...payload, confirmation: "Wrong target" })).status,
      409,
    );
    assert.equal(
      (await remove({ ...payload, releasePlace: false })).status,
      409,
    );
    assert.equal((await remove(payload, ownerToken, owner)).status, 409);
    assert.equal((await remove(payload, ownerToken, ids[20].id)).status, 409);
    assert.equal(
      (
        await request(`/admin/accounts/${victim.user_id}/delete`, {
          cookie: ownerToken,
          body: payload,
          headers: { Origin: "https://evil.test" },
        })
      ).status,
      403,
    );
    assert.deepEqual(
      await db.prepare("SELECT * FROM allocations ORDER BY user_id").all(),
      before,
      "failed confirmations cannot mutate any player",
    );
    const race = await Promise.all([
      remove(),
      remove(payload, ownerToken, victim.user_id, 1),
    ]);
    assert.deepEqual(
      race.map((r) => r.status),
      [200, 200],
    );
    assert.equal(
      (
        await db
          .prepare(
            "SELECT COUNT(*) AS n FROM audit WHERE action='account_deleted'",
          )
          .get()
      ).n,
      1,
    );
    for (const table of [
      "applications",
      "allocations",
      "allocation_seats",
      "character_appearances",
      "welcome_missions",
      "sessions",
      "game_sessions",
      "resets",
    ])
      assert.equal(
        (
          await db
            .prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE user_id=?`)
            .get(victim.user_id)
        ).n,
        0,
        table + " is purged",
      );
    const retired = await db
      .prepare("SELECT * FROM users WHERE id=?")
      .get(victim.user_id);
    assert.equal(retired.name, "Compte supprimé");
    assert.notEqual(retired.password, hash);
    assert.match(retired.email, /@deleted\.invalid$/);
    assert.equal(
      (await request("/game-download", { cookie: playerToken })).status,
      401,
    );
    assert.equal(
      (
        await request("/game/profile", {
          headers: { Authorization: `Bearer ${nativeToken}` },
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await request("/auth/login", {
          body: {
            email: `removal${victimIndex}@test.local`,
            password: "Private-player-password",
          },
        })
      ).status,
      401,
    );
    await assert.rejects(() => allocate(db, victim.user_id), /acceptée/);
    assert.deepEqual(
      await db.prepare("SELECT * FROM allocations ORDER BY user_id").all(),
      before.filter((row) => row.user_id !== victim.user_id),
    );
    const admissions = await Promise.allSettled([
      decide(db, owner, ids[20].application, "accepted"),
      decide(secondDb, owner, ids[21].application, "accepted"),
    ]);
    assert.equal(
      admissions.filter((r) => r.status === "fulfilled").length,
      1,
      "only the one released place can be reused",
    );
    const replacement =
      ids[20 + admissions.findIndex((r) => r.status === "fulfilled")].id;
    const draw = await allocate(secondDb, replacement);
    assert.equal(
      draw.mokuton,
      1,
      "the vacated potential seat is reused, not another random deck entry",
    );
    const after = await db
      .prepare("SELECT * FROM allocations ORDER BY user_id")
      .all();
    assert.equal(after.length, 20);
    assert.equal(after.filter((row) => row.mokuton === 1).length, 3);
    for (const clan of ["Uchiwa", "Senju", "Uzumaki"])
      assert.ok(after.filter((row) => row.clan === clan).length <= 3);
    assert.deepEqual(
      after.filter((row) => row.user_id !== replacement),
      before.filter((row) => row.user_id !== victim.user_id),
    );
    assert.deepEqual(
      await allocate(db, replacement),
      draw,
      "new account gets exactly one stable draw",
    );
    const pendingId =
      ids[20 + admissions.findIndex((r) => r.status === "rejected")].id;
    await db
      .prepare("INSERT INTO sessions(token,user_id,expires) VALUES (?,?,?)")
      .run(digest("pending-test"), pendingId, Date.now() + 60000);
    assert.equal(
      (await request("/game-download", { cookie: "pending-test" })).status,
      403,
    );
    assert.equal(
      (await (await request("/me", { cookie: "pending-test" })).json())
        .download,
      null,
    );
    return victim.user_id;
  } finally {
    apps.forEach((app) => app.locals.cleanup());
    await Promise.all(
      servers.map((server) => new Promise((resolve) => server.close(resolve))),
    );
  }
}
