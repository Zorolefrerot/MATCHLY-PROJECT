import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import { openStore } from "../server/store.js";
import { VillageRoom } from "../server/village-room.js";
import {
  ACADEMY_RECEPTION,
  TeamRecruitmentService,
} from "../server/team-recruitment.js";

async function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "idrem-academy-"));
  const db = await openStore(join(dir, "test.sqlite"));
  for (let id = 1; id <= 4; id++) {
    await db
      .prepare(
        "INSERT INTO users(id,name,email,password,role) VALUES (?,?,?,?,?)",
      )
      .run(id, `Genin ${id}`, `genin${id}@test.invalid`, "x", "player");
    await db
      .prepare(
        "INSERT INTO applications(user_id,character,discovery,goals,motivation,story,answers,quiz_snapshot,score,status,created,updated) VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",
      )
      .run(id, `Genin ${id}`, "x", "x", "x", "x", "{}", "{}", 10, "accepted");
    await db
      .prepare(
        "INSERT INTO allocations(user_id,clan,affinity,mokuton) VALUES (?,?,?,?)",
      )
      .run(id, id === 3 ? "Senju" : "Uchiwa", id === 3 ? "Suiton" : "Katon", 0);
    await db
      .prepare(
        "INSERT INTO character_appearances VALUES (?,?,?,CURRENT_TIMESTAMP)",
      )
      .run(
        id,
        JSON.stringify({
          model: id % 2,
          hair: id % 4,
          hair_color: id % 8,
          eyes: id % 6,
          skin: id % 6,
          top: id % 3,
          top_color: id % 8,
          bottom: id % 3,
          bottom_color: (id + 1) % 8,
        }),
        1,
      );
    await db
      .prepare(
        "INSERT INTO clan_missions(user_id,status,score,revision,reward_claimed,updated) VALUES (?, 'COMPLETED', 20, 5, 1, CURRENT_TIMESTAMP)",
      )
      .run(id);
  }
  return { db, dir };
}

const peer = (id, position = ACADEMY_RECEPTION) => ({
  id,
  state: { p: [...position] },
});

async function action(service, userId, action, extra = {}) {
  return service.action(peer(userId), {
    type: "academy_action",
    action,
    ...extra,
  });
}

test("academy reception exposes test NPCs, enforces physical access, and creates team 001", async () => {
  const { db, dir } = await fixture();
  try {
    const service = new TeamRecruitmentService(db);
    const initial = await action(service, 1, "refresh");
    assert.deepEqual(
      initial.candidates.map((candidate) => candidate.key),
      ["npc:kaito", "npc:renji"],
    );
    assert.equal(initial.candidates[0].portraitId, "academy-npc-kaito-v1");
    assert.equal(initial.candidates[1].portraitId, "academy-npc-renji-v1");
    await assert.rejects(
      () =>
        service.action(peer(1, [0, 0.55, 78]), {
          type: "academy_action",
          action: "apply",
        }),
      { gameCode: "ACADEMY_TOO_FAR" },
    );

    await action(service, 1, "apply");
    await action(service, 1, "invite", { targetKey: "npc:kaito" });
    await action(service, 1, "invite", { targetKey: "npc:renji" });
    const completed = await action(service, 1, "confirm_team");
    assert.equal(completed.team.teamNumber, 1);
    assert.equal(completed.team.sensei.id, "daichi_kurogane");
    assert.equal(completed.team.sensei.portraitId, "sensei-daichi-kurogane-v1");
    assert.match(completed.team.sensei.dialogue, /Daichi Kurogane/);
    assert.equal(completed.team.members.length, 3);
    assert.deepEqual(
      completed.team.members.map((member) => member.id),
      [1, "kaito", "renji"],
    );

    const persisted = await new TeamRecruitmentService(db).stateForPeer(
      peer(1),
    );
    assert.equal(persisted.team.teamNumber, 1);
    assert.equal(persisted.group, null);
    await assert.rejects(() => action(service, 1, "apply"), {
      gameCode: "ACADEMY_ALREADY_GROUPED",
    });
  } finally {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("player invitations use saved portraits, groups stop at three, and Sensei selection changes", async () => {
  const { db, dir } = await fixture();
  try {
    const service = new TeamRecruitmentService(db);
    await action(service, 1, "apply");
    await action(service, 1, "invite", { targetKey: "npc:kaito" });
    await action(service, 1, "invite", { targetKey: "npc:renji" });
    await action(service, 1, "confirm_team");
    for (const id of [2, 3, 4]) await action(service, id, "apply");
    await action(service, 2, "invite", { targetKey: "player:3" });
    const invitation = (await service.stateForPeer(peer(3))).invitations[0];
    assert.equal(invitation.from.key, "player:2");
    assert.equal(invitation.from.portraitId, "player-2-v1");
    assert.deepEqual(invitation.from.appearance, {
      model: 0,
      hair: 2,
      hair_color: 2,
      eyes: 2,
      skin: 2,
      top: 2,
      top_color: 2,
      bottom: 2,
      bottom_color: 3,
    });
    await action(service, 3, "accept_invite", { inviteId: invitation.id });
    await action(service, 2, "invite", { targetKey: "player:4" });
    const invitationTwo = (await service.stateForPeer(peer(4))).invitations[0];
    await action(service, 4, "accept_invite", { inviteId: invitationTwo.id });
    const forming = await service.stateForPeer(peer(2));
    assert.equal(forming.group.members.length, 3);
    await assert.rejects(
      () => action(service, 2, "invite", { targetKey: "npc:kaito" }),
      { gameCode: "ACADEMY_GROUP_FULL" },
    );
    const official = await action(service, 2, "confirm_team");
    assert.equal(official.team.teamNumber, 2);
    assert.equal(official.team.sensei.id, "ayame_shirogane");
    assert.match(official.team.sensei.dialogue, /Ayame Shirogane/);
    assert.equal((await service.stateForPeer(peer(3))).candidates.length, 0);
    assert.equal((await service.stateForPeer(peer(4))).team.teamNumber, 2);
  } finally {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("village WebSocket room routes validated academy actions and broadcasts state", async () => {
  const { db, dir } = await fixture();
  try {
    const service = new TeamRecruitmentService(db);
    const events = [];
    const room = new VillageRoom({ teams: service });
    const joined = room.join(
      {
        ...peer(1),
        name: "Genin 1",
        appearance: null,
        tokenHash: "session-hash",
        expires: Date.now() + 60000,
      },
      { send: (event) => events.push(structuredClone(event)), close: () => {} },
    );
    joined.state.p = [...ACADEMY_RECEPTION];
    await new Promise((resolve) => setImmediate(resolve));
    room.receive(joined, { type: "academy_action", action: "apply" });
    await new Promise((resolve) => setImmediate(resolve));
    const state = events
      .filter((event) => event.type === "academy_state")
      .at(-1);
    assert.equal(state.unlocked, true);
    assert.equal(state.candidate.status, "AVAILABLE");
    room.close();
  } finally {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("academy actions and state validation reject forged payloads", async () => {
  const { db, dir } = await fixture();
  try {
    const service = new TeamRecruitmentService(db);
    await action(service, 1, "apply");
    await action(service, 1, "invite", { targetKey: "npc:kaito" });
    await action(service, 1, "withdraw");
    const withdrawn = await service.stateForPeer(peer(1));
    assert.equal(withdrawn.candidate, null);
    assert.equal(withdrawn.group, null);
    const far = peer(1, [0, 0.55, 78]);
    await assert.rejects(
      () =>
        service.action(far, {
          type: "academy_action",
          action: "invite",
          targetKey: "player:2",
        }),
      { gameCode: "ACADEMY_TOO_FAR" },
    );
    await assert.rejects(
      () =>
        service.action(peer(1), {
          type: "academy_action",
          action: "invite",
          targetKey: "player:999999",
        }),
      { gameCode: "ACADEMY_NOT_AVAILABLE" },
    );
    await assert.rejects(
      () =>
        service.action(peer(1), {
          type: "academy_action",
          action: "apply",
          profile: { portraitId: "forged" },
        }),
      { gameCode: "INVALID_ACADEMY_ACTION" },
    );
  } finally {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
