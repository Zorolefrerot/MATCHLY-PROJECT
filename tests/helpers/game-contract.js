import assert from "node:assert/strict";
import { hashPassword, digest } from "../../server/store.js";
import { createApp } from "../../server/app.js";

export const appearance = {
  model: 1,
  hair: 3,
  hair_color: 2,
  eyes: 4,
  skin: 5,
  top: 1,
  top_color: 6,
  bottom: 2,
  bottom_color: 1,
};
export async function gameContract(db) {
  const password = "Private-test-password-2026";
  const users = {};
  for (const [name, role, status, allocation] of [
    ["accepted", "player", "accepted", true],
    ["other", "player", "accepted", true],
    ["pending", "player", "pending", false],
    ["waiting", "player", "waitlisted", false],
    ["rejected", "player", "rejected", false],
    ["noDraw", "player", "accepted", false],
    ["owner", "admin", null, false],
  ]) {
    const row = await db
      .prepare("INSERT INTO users(name,email,password,role) VALUES (?,?,?,?)")
      .run(
        name,
        `${name.toLowerCase()}@game.test`,
        hashPassword(password),
        role,
      );
    const id = Number(row.lastInsertRowid);
    users[name] = id;
    if (status)
      await db
        .prepare(
          "INSERT INTO applications(user_id,character,discovery,goals,motivation,story,answers,quiz_snapshot,score,status) VALUES (?,?,?,?,?,?,?,?,?,?)",
        )
        .run(
          id,
          `Genin ${name}`,
          "test",
          "test",
          "test",
          "test",
          "{}",
          "[]",
          0,
          status,
        );
    if (allocation)
      await db
        .prepare(
          "INSERT INTO allocations(user_id,clan,affinity,mokuton) VALUES (?,?,?,?)",
        )
        .run(id, "Hyūga", "Raiton", name === "accepted" ? 1 : 0);
  }
  const before = await db
    .prepare("SELECT * FROM allocations ORDER BY user_id")
    .all();
  const app = createApp(db),
    server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const request = async (path, { token, body, method, headers = {} } = {}) => {
    const response = await fetch(base + path, {
      method: method || (body ? "POST" : "GET"),
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return {
      status: response.status,
      body: await response.json(),
      headers: response.headers,
    };
  };
  const login = (name) =>
    request("/game/login", {
      body: { email: `${name.toLowerCase()}@game.test`, password },
    });
  try {
    assert.equal((await request("/game/profile")).status, 401);
    for (const name of ["pending", "waiting", "rejected", "owner"])
      assert.equal((await login(name)).status, 403);
    assert.equal((await login("noDraw")).body.code, "ALLOCATION_REQUIRED");
    assert.equal(
      (
        await request("/game/login", {
          body: { email: "accepted@game.test", password: "wrong" },
        })
      ).status,
      401,
    );
    assert.equal(
      (await db.prepare("SELECT COUNT(*) AS n FROM game_sessions").get()).n,
      0,
    );
    const session = await login("accepted"),
      token = session.body.token;
    assert.equal(session.status, 200);
    assert.match(token, /^[a-f0-9]{64}$/);
    assert.equal(session.headers.get("set-cookie"), null);
    assert.equal(session.headers.get("cache-control"), "no-store");
    assert.equal(session.body.profile.character.name, "Genin accepted");
    assert.equal(session.body.profile.character.mokuton, true);
    assert.equal(session.body.profile.appearance, null);
    assert.equal(session.body.profile.revision, 0);
    const stored = await db
      .prepare("SELECT * FROM game_sessions WHERE user_id=?")
      .get(users.accepted);
    assert.equal(stored.token, digest(token));
    assert.notEqual(stored.token, token);
    assert.ok(
      Number(stored.expires) > Date.now() &&
        Number(stored.expires) < Date.now() + 7210000,
    );
    assert.equal(
      (await request("/me", { token })).body.user,
      null,
      "game tokens do not become website sessions",
    );
    assert.equal((await request("/admin/applications", { token })).status, 401);
    const web = await request("/auth/login", {
      body: { email: "accepted@game.test", password },
    });
    assert.equal(
      (
        await request("/game/profile", {
          headers: { Cookie: web.headers.get("set-cookie").split(";")[0] },
        })
      ).status,
      401,
      "website cookies cannot authenticate native game API",
    );
    const put = (body) =>
      request("/game/appearance", { token, method: "PUT", body });
    const payload = { schemaVersion: 1, expectedRevision: 0, appearance };
    assert.equal((await put({ ...payload, userId: users.other })).status, 400);
    assert.equal(
      (await put({ ...payload, appearance: { ...appearance, clan: "Uchiwa" } }))
        .status,
      400,
    );
    for (const bad of [-1, 999, 1.5, "1", true])
      assert.equal(
        (await put({ ...payload, appearance: { ...appearance, hair: bad } }))
          .status,
        400,
      );
    assert.equal((await put({ ...payload, schemaVersion: 2 })).status, 400);
    assert.equal(
      (
        await request("/game/appearance", {
          token,
          method: "PUT",
          body: payload,
          headers: { Origin: "https://evil.test" },
        })
      ).status,
      403,
    );
    const race = await Promise.all([put(payload), put(payload)]);
    assert.deepEqual(race.map((r) => r.status).sort(), [200, 409]);
    assert.equal(
      race.find((r) => r.status === 409).body.code,
      "APPEARANCE_CONFLICT",
    );
    const saved = await request("/game/profile", { token });
    assert.deepEqual(saved.body.appearance, appearance);
    assert.equal(saved.body.revision, 1);
    const other = await login("other");
    assert.equal(
      other.body.profile.appearance,
      null,
      "another account sees no appearance from the first",
    );
    assert.equal(
      (
        await db
          .prepare("SELECT COUNT(*) AS n FROM character_appearances")
          .get()
      ).n,
      1,
    );
    assert.deepEqual(
      await db.prepare("SELECT * FROM allocations ORDER BY user_id").all(),
      before,
      "no game request modifies or repeats an allocation",
    );
    const second = await login("accepted");
    assert.equal(
      (await request("/game/profile", { token })).status,
      401,
      "new login revokes previous device session",
    );
    assert.deepEqual(
      second.body.profile.appearance,
      appearance,
      "relogin restores appearance from the database",
    );
    await db
      .prepare("UPDATE applications SET status='waitlisted' WHERE user_id=?")
      .run(users.accepted);
    assert.equal(
      (await request("/game/profile", { token: second.body.token })).status,
      403,
    );
    assert.equal(
      (
        await request("/game/appearance", {
          token: second.body.token,
          method: "PUT",
          body: { ...payload, expectedRevision: 1 },
        })
      ).status,
      403,
      "admission rechecked even for a valid token",
    );
    await db
      .prepare("UPDATE applications SET status='accepted' WHERE user_id=?")
      .run(users.accepted);
    await db
      .prepare("UPDATE game_sessions SET expires=0 WHERE user_id=?")
      .run(users.accepted);
    assert.equal(
      (await request("/game/profile", { token: second.body.token })).status,
      401,
    );
    assert.equal(
      (await request("/game/logout", { token: other.body.token, body: {} }))
        .status,
      200,
    );
    assert.equal(
      (await request("/game/profile", { token: other.body.token })).status,
      401,
    );
    const third = await login("accepted");
    const reset = "only-a-local-test-reset-token";
    await db
      .prepare("INSERT INTO resets(token,user_id,expires) VALUES (?,?,?)")
      .run(digest(reset), users.accepted, Date.now() + 60000);
    assert.equal(
      (
        await request("/auth/reset", {
          body: { token: reset, password: "New-private-test-password" },
        })
      ).status,
      200,
    );
    assert.equal(
      (await request("/game/profile", { token: third.body.token })).status,
      401,
      "password reset revokes game sessions too",
    );
    return users.accepted;
  } finally {
    app.locals.cleanup();
    await new Promise((r) => server.close(r));
  }
}
