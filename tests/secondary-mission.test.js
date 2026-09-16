import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import { openStore } from "../server/store.js";
import {
  SECONDARY_RENEWAL_MS,
  SECONDARY_REWARD,
  SECONDARY_TYPES,
  SecondaryMissionService,
} from "../server/secondary-mission.js";

async function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "idrem-secondary-"));
  const db = await openStore(join(dir, "test.sqlite"));
  await db
    .prepare(
      "INSERT INTO users(id,name,email,password,role) VALUES (1,'One','one@test.invalid','x','player'),(2,'Two','two@test.invalid','x','player')",
    )
    .run();
  await db
    .prepare(
      "INSERT INTO applications(user_id,character,discovery,goals,motivation,story,answers,quiz_snapshot,score,status,created,updated) VALUES (1,'One','x','x','x','x','{}','{}',10,'accepted',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),(2,'Two','x','x','x','x','{}','{}',10,'accepted',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",
    )
    .run();
  await db
    .prepare(
      "INSERT INTO clan_missions(user_id,status,score,revision,reward_claimed,updated) VALUES (1,'COMPLETED',20,5,1,CURRENT_TIMESTAMP),(2,'COMPLETED',20,5,1,CURRENT_TIMESTAMP)",
    )
    .run();
  return { db, dir };
}

test("secondary missions are global, locked until clan reward, and always have three zones", async () => {
  const { db, dir } = await fixture();
  try {
    assert.equal(SECONDARY_TYPES.length, 12);
    assert.equal(
      new Set(SECONDARY_TYPES.map((type) => type.id)).size,
      SECONDARY_TYPES.length,
    );
    const service = new SecondaryMissionService(db);
    await service.refresh();
    const one = { id: 1, secondaryUnlocked: true, state: { p: [0, 0.55, 78] } };
    const two = { id: 2, secondaryUnlocked: true, state: { p: [0, 0.55, 78] } };
    const state = service.stateForPeer(one);
    assert.equal(state.unlocked, true);
    assert.equal(state.missions.length, 3);
    assert.equal(
      new Set(state.missions.map((mission) => mission.zone)).size,
      3,
    );
    assert.equal(
      new Set(state.missions.map((mission) => mission.npcId)).size,
      3,
    );

    const target = state.missions[0];
    assert.equal("targets" in target, false);
    assert.equal("returnPosition" in target, false);
    assert.equal("npcPosition" in target, false);
    const accepted = await service.action(one, {
      action: "accept",
      slot: target.slot,
      missionId: target.missionId,
      revision: target.revision,
      index: -1,
    });
    assert.equal(
      accepted.missions.find((mission) => mission.slot === target.slot).status,
      "accepted",
    );
    await assert.rejects(
      () =>
        service.action(two, {
          action: "accept",
          slot: target.slot,
          missionId: target.missionId,
          revision: target.revision,
          index: -1,
        }),
      /mission/i,
    );

    const row = await db
      .prepare("SELECT * FROM secondary_missions WHERE slot=?")
      .get(target.slot);
    const objective = JSON.parse(row.objective);
    for (let i = 0; i < objective.targets.length; i++) {
      one.state.p = objective.targets[i];
      const current = service
        .stateForPeer(one)
        .missions.find((mission) => mission.slot === target.slot);
      await service.action(one, {
        action: "collect",
        slot: target.slot,
        missionId: target.missionId,
        revision: current.revision,
        index: i,
      });
    }
    one.state.p = objective.returnPosition;
    const current = service
      .stateForPeer(one)
      .missions.find((mission) => mission.slot === target.slot);
    const completed = await service.action(one, {
      action: "complete",
      slot: target.slot,
      missionId: target.missionId,
      revision: current.revision,
      index: -1,
    });
    assert.equal(
      completed.missions.find((mission) => mission.slot === target.slot).status,
      "cooldown",
    );
    assert.equal(
      (
        await db
          .prepare("SELECT idrem_gold FROM player_progress WHERE user_id=1")
          .get()
      ).idrem_gold,
      SECONDARY_REWARD,
    );
    await assert.rejects(() =>
      service.action(one, {
        action: "complete",
        slot: target.slot,
        missionId: target.missionId,
        revision: current.revision,
        index: -1,
      }),
    );

    const cooldown = await db
      .prepare("SELECT available_at FROM secondary_missions WHERE slot=?")
      .get(target.slot);
    assert.ok(
      Number(cooldown.available_at) > Date.now() + SECONDARY_RENEWAL_MS - 1000,
    );
    await db
      .prepare("UPDATE secondary_missions SET available_at=? WHERE slot=?")
      .run(Date.now() - 1, target.slot);
    await service.refresh();
    const renewed = service
      .stateForPeer(two)
      .missions.find((mission) => mission.slot === target.slot);
    assert.equal(renewed.status, "available");
    assert.notEqual(renewed.missionId, target.missionId);
  } finally {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a player can abandon an accepted mission so the global slot becomes available again", async () => {
  const { db, dir } = await fixture();
  try {
    const service = new SecondaryMissionService(db);
    await service.refresh();
    const peer = {
      id: 1,
      secondaryUnlocked: true,
      state: { p: [0, 0.55, 78] },
    };
    const mission = service.stateForPeer(peer).missions[0];
    await service.action(peer, {
      action: "accept",
      slot: mission.slot,
      missionId: mission.missionId,
      revision: mission.revision,
      index: -1,
    });
    const accepted = service
      .stateForPeer(peer)
      .missions.find((value) => value.slot === mission.slot);
    const otherMission = service
      .stateForPeer(peer)
      .missions.find((value) => value.slot !== mission.slot);
    await assert.rejects(
      () =>
        service.action(peer, {
          action: "accept",
          slot: otherMission.slot,
          missionId: otherMission.missionId,
          revision: otherMission.revision,
          index: -1,
        }),
      /mission secondaire en cours/i,
    );
    const abandoned = await service.action(peer, {
      action: "abandon",
      slot: mission.slot,
      missionId: mission.missionId,
      revision: accepted.revision,
      index: -1,
    });
    const available = abandoned.missions.find(
      (value) => value.slot === mission.slot,
    );
    assert.equal(available.status, "available");
    assert.equal(available.revision, accepted.revision + 1);
    const row = await db
      .prepare(
        "SELECT status,accepted_by,accepted_at,progress,revision FROM secondary_missions WHERE slot=?",
      )
      .get(mission.slot);
    assert.equal(row.status, "AVAILABLE");
    assert.equal(row.accepted_by, null);
    assert.equal(row.accepted_at, null);
    assert.equal(row.progress, "[]");
    assert.equal(Number(row.revision), accepted.revision + 1);
    assert.equal(
      await db
        .prepare("SELECT idrem_gold FROM player_progress WHERE user_id=1")
        .get(),
      undefined,
    );
    assert.equal(
      await db
        .prepare(
          "SELECT 1 FROM audit WHERE actor=1 AND action='secondary_mission_reward'",
        )
        .get(),
      undefined,
    );
    await service.action(
      { ...peer, id: 2 },
      {
        action: "accept",
        slot: mission.slot,
        missionId: mission.missionId,
        revision: available.revision,
        index: -1,
      },
    );
  } finally {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("unrewarded clan completion does not expose secondary missions", async () => {
  const { db, dir } = await fixture();
  try {
    await db
      .prepare("UPDATE clan_missions SET reward_claimed=0 WHERE user_id=1")
      .run();
    const service = new SecondaryMissionService(db);
    await service.refresh();
    assert.equal(
      service.stateForPeer({ id: 1, secondaryUnlocked: false }).unlocked,
      false,
    );
  } finally {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
