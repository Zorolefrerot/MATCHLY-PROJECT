import assert from "node:assert/strict";
import { test } from "node:test";
import { openStore } from "../server/store.js";
import { TEAM_RECEPTION, TeamService } from "../server/team-system.js";
import { VillageRoom } from "../server/village-room.js";

const waitTurn = () => new Promise((resolve) => setImmediate(resolve));

function identity(id = 1) {
  return {
    id,
    name: `Genin${id}`,
    clan: "Uchiwa",
    appearance: {},
    secondaryUnlocked: true,
    expires: Date.now() + 60000,
  };
}

function action(action, targetKey = "") {
  return { type: "team_action", action, targetKey, revision: 0 };
}

test("the first room snapshot is team_state and a reconnect keeps the durable candidacy", async () => {
  const db = await openStore(":memory:");
  const teams = new TeamService(db);
  await db
    .prepare("INSERT INTO users(id,name,email,password,role) VALUES (?,?,?,?,?)")
    .run(1, "Genin1", "genin1@test.invalid", "x", "player");
  await db
    .prepare("INSERT INTO player_progress(user_id,idrem_gold,level,updated) VALUES (?,?,?,?)")
    .run(1, 0, 5, "test");
  const room = new VillageRoom({ teams });
  const events = [];
  const transport = { send: (event) => events.push(structuredClone(event)), close: () => {} };
  try {
    const first = room.join(identity(), transport);
    await waitTurn();
    assert.equal(events.find((event) => event.type === "team_state")?.type, "team_state");
    assert.equal(events.some((event) => event.type === "academy_state"), false);

    first.state.p = [TEAM_RECEPTION.x, 0.55, TEAM_RECEPTION.z];
    room.receive(first, action("refresh"));
    await waitTurn();
    const visible = events.filter((event) => event.type === "team_action_ack").at(-1);
    assert.deepEqual(visible.state.candidates.map((candidate) => candidate.name), ["Kaito", "Renji"]);

    room.receive(first, action("apply"));
    await waitTurn();
    assert.equal(events.filter((event) => event.type === "team_action_ack").at(-1).state.self.status, "recherche");

    room.leave(first);
    events.length = 0;
    const reconnected = room.join(identity(), transport);
    await waitTurn();
    const restored = events.find((event) => event.type === "team_state");
    assert.equal(restored.self.status, "recherche");
    assert.equal(restored.candidates.length, 0, "the reconnect starts away from the physical counter");
    reconnected.state.p = [TEAM_RECEPTION.x, 0.55, TEAM_RECEPTION.z];
    room.receive(reconnected, action("refresh"));
    await waitTurn();
    const restoredAtCounter = events.filter((event) => event.type === "team_action_ack").at(-1);
    assert.equal(restoredAtCounter.state.self.name, "Genin1");
  } finally {
    room.close();
    await db.close();
  }
});
