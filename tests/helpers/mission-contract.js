import assert from "node:assert/strict";
import { createApp } from "../../server/app.js";
import { hashPassword, digest } from "../../server/store.js";
import { appearance } from "./game-contract.js";

// Same contract runs against SQLite and independent real PostgreSQL pools.
export async function missionContract(db, secondDb = db) {
  const password = "Mission-private-test-2026";
  const users = [];
  for (let i = 0; i < 2; i++) {
    const result = await db
      .prepare("INSERT INTO users(name,email,password,role) VALUES (?,?,?,?)")
      .run(
        `Mission ${i}`,
        `mission${i}@test.local`,
        hashPassword(password),
        "player",
      );
    const id = Number(result.lastInsertRowid);
    users.push(id);
    await db
      .prepare(
        "INSERT INTO applications(user_id,character,discovery,goals,motivation,story,answers,quiz_snapshot,score,status) VALUES (?,?,?,?,?,?,?,?,?,?)",
      )
      .run(
        id,
        `Genin mission ${i}`,
        "test",
        "test",
        "test",
        "test",
        "{}",
        "[]",
        0,
        "accepted",
      );
    await db
      .prepare(
        "INSERT INTO allocations(user_id,clan,affinity,mokuton) VALUES (?,?,?,?)",
      )
      .run(id, "Hyūga", "Raiton", 0);
  }
  const allocations = await db
    .prepare("SELECT * FROM allocations ORDER BY user_id")
    .all();
  const applications = await db
    .prepare("SELECT * FROM applications ORDER BY user_id")
    .all();
  const apps = [createApp(db), createApp(secondDb)];
  const servers = apps.map((app) => app.listen(0, "127.0.0.1"));
  await Promise.all(
    servers.map(
      (server) => new Promise((resolve) => server.once("listening", resolve)),
    ),
  );
  async function request(path, token, body, which = 0, extraHeaders = {}) {
    const response = await fetch(
      `http://127.0.0.1:${servers[which].address().port}/api/game${path}`,
      {
        method: body ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...extraHeaders,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
    );
    return { status: response.status, data: await response.json() };
  }
  const login = (i = 0) =>
    request("/login", null, { email: `mission${i}@test.local`, password });
  let token;
  const event = (event, expectedRevision, which = 0) =>
    request(
      "/missions/welcome/events",
      token,
      { event, expectedRevision },
      which,
    );
  try {
    const initial = await login();
    token = initial.data.token;
    const blank = {
      schemaVersion: 1,
      missionId: "konoha_welcome",
      status: "available",
      visited: [],
      revision: 0,
    };
    assert.deepEqual(initial.data.profile.welcomeMission, blank);
    assert.equal(
      (await db.prepare("SELECT COUNT(*) AS n FROM welcome_missions").get()).n,
      0,
      "reading does not create progress",
    );
    assert.equal(
      (
        await request("/missions/welcome/events", null, {
          event: "accept",
          expectedRevision: 0,
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await request(
          "/missions/welcome/events",
          null,
          { event: "accept", expectedRevision: 0 },
          0,
          { Cookie: "session=not-a-native-token" },
        )
      ).status,
      401,
    );
    for (const body of [
      { event: "accept", expectedRevision: 0, userId: users[1] },
      { event: "complete", expectedRevision: 0 },
      { event: "read_unknown", expectedRevision: 0 },
      { event: "accept", expectedRevision: "0" },
      { event: "accept", expectedRevision: -1 },
      { event: "accept", expectedRevision: 1.5 },
      { event: "accept", expectedRevision: 6 },
      { event: "accept", expectedRevision: 0, rewards: 100 },
    ])
      assert.equal(
        (await request("/missions/welcome/events", token, body)).status,
        400,
      );
    assert.equal(
      (await event("read_market", 0)).data.code,
      "MISSION_NOT_STARTED",
    );
    assert.equal((await event("report", 0)).status, 409);
    const accepts = await Promise.all([
      event("accept", 0),
      event("accept", 0, 1),
    ]);
    assert.deepEqual(
      accepts.map((r) => r.status),
      [200, 200],
    );
    assert.ok(accepts.every((r) => r.data.welcomeMission.revision === 1));
    assert.equal((await event("report", 1)).data.code, "MISSION_INCOMPLETE");
    // Two distinct checkpoints racing: one wins, the other must refresh.
    const race = await Promise.all([
      event("read_market", 1),
      event("read_academy", 1, 1),
    ]);
    assert.deepEqual(race.map((r) => r.status).sort(), [200, 409]);
    const won = race.find((r) => r.status === 200).data.welcomeMission
      .visited[0];
    const missing = won === "market" ? "academy" : "market";
    assert.equal(
      (await event(`read_${won}`, 1)).data.welcomeMission.revision,
      2,
      "retry after lost ack never increments twice",
    );
    assert.equal(
      (await event(`read_${missing}`, 2)).data.welcomeMission.revision,
      3,
    );
    assert.equal(
      (await event("read_hokage", 3)).data.welcomeMission.revision,
      4,
    );
    const completed = await event("report", 4);
    assert.equal(completed.status, 200);
    assert.deepEqual(completed.data.welcomeMission, {
      ...blank,
      status: "completed",
      visited: ["academy", "market", "hokage"],
      revision: 5,
    });
    const stored = await db
      .prepare("SELECT * FROM welcome_missions WHERE user_id=?")
      .get(users[0]);
    assert.equal((await event("report", 4, 1)).data.welcomeMission.revision, 5);
    assert.equal(
      (await event("accept", 0, 1)).data.welcomeMission.status,
      "completed",
      "no reroll/reset on another start",
    );
    assert.deepEqual(
      await db
        .prepare("SELECT * FROM welcome_missions WHERE user_id=?")
        .get(users[0]),
      stored,
      "duplicates do not even change updated timestamp",
    );
    assert.deepEqual(
      (await login(1)).data.profile.welcomeMission,
      blank,
      "progress is scoped to one account",
    );
    assert.equal(completed.data.revision, 0);
    assert.equal(completed.data.appearance, null);
    // Cosmetic changes have an independent revision and cannot reset the mission.
    const saved = await fetch(
      `http://127.0.0.1:${servers[1].address().port}/api/game/appearance`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schemaVersion: 1,
          expectedRevision: 0,
          appearance,
        }),
      },
    );
    assert.equal(saved.status, 200);
    assert.deepEqual(
      (await saved.json()).welcomeMission,
      completed.data.welcomeMission,
    );
    const reconnect = await login();
    const old = token;
    token = reconnect.data.token;
    assert.deepEqual(
      reconnect.data.profile.welcomeMission,
      completed.data.welcomeMission,
      "a new installation/login restores progress",
    );
    assert.equal(
      (
        await request(
          "/missions/welcome/events",
          old,
          { event: "report", expectedRevision: 4 },
          1,
        )
      ).status,
      401,
    );
    await db
      .prepare("UPDATE applications SET status='waitlisted' WHERE user_id=?")
      .run(users[0]);
    assert.equal(
      (await event("report", 4, 1)).status,
      403,
      "even idempotent replays must recheck admission",
    );
    await db
      .prepare("UPDATE applications SET status='accepted' WHERE user_id=?")
      .run(users[0]);
    await db
      .prepare("UPDATE game_sessions SET expires=0 WHERE user_id=?")
      .run(users[0]);
    assert.equal((await event("report", 4, 1)).status, 401);
    // A valid bearer owned by an administrator is still rejected.
    const owner = await db
      .prepare("INSERT INTO users(name,email,password,role) VALUES (?,?,?,?)")
      .run(
        "Mission owner",
        "mission-owner@test.local",
        hashPassword(password),
        "admin",
      );
    const ownerToken = "a".repeat(64);
    await db
      .prepare(
        "INSERT INTO game_sessions(token,user_id,expires) VALUES (?,?,?)",
      )
      .run(
        digest(ownerToken),
        Number(owner.lastInsertRowid),
        Date.now() + 60000,
      );
    assert.equal(
      (
        await request(
          "/missions/welcome/events",
          ownerToken,
          { event: "accept", expectedRevision: 0 },
          1,
        )
      ).status,
      403,
    );
    assert.deepEqual(
      await db.prepare("SELECT * FROM allocations ORDER BY user_id").all(),
      allocations,
    );
    assert.deepEqual(
      await db.prepare("SELECT * FROM applications ORDER BY user_id").all(),
      applications,
    );
    assert.equal(
      (await db.prepare("SELECT COUNT(*) AS n FROM welcome_missions").get()).n,
      1,
    );
    return users[0];
  } finally {
    apps.forEach((app) => app.locals.cleanup());
    await Promise.all(
      servers.map((server) => new Promise((resolve) => server.close(resolve))),
    );
  }
}
