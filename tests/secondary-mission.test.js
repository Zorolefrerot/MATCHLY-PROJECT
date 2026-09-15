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
    const accepted = await service.action(one, {
      action: "accept",
      slot: target.slot,
      missionId: target.missionId,
      revision: target.revision,
      index: -1,
    });
    assert.equal(
      accepted.state.missions.find((mission) => mission.slot === target.slot)
        .status,
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
      completed.state.missions.find((mission) => mission.slot === target.slot)
        .status,
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
    // The acknowledgement carries the server-read balance so the HUD badge can
    // display the authoritative total without recomputing anything.
    assert.deepEqual(completed.wallet, {
      idremGold: SECONDARY_REWARD,
      level: 0,
    });
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

test("one active secondary mission at a time, abandonable and re-bookable", async () => {
  const { db, dir } = await fixture();
  try {
    const service = new SecondaryMissionService(db);
    await service.refresh();
    const one = { id: 1, secondaryUnlocked: true, state: { p: [0, 0.55, 78] } };
    const state = service.stateForPeer(one);
    const [first, second] = state.missions;

    await service.action(one, {
      action: "accept",
      slot: first.slot,
      missionId: first.missionId,
      revision: first.revision,
      index: -1,
    });

    // A second acceptance is refused while the first mission is active, even
    // on another slot with a fresh revision.
    const secondSlot = await assert.rejects(
      () =>
        service.action(one, {
          action: "accept",
          slot: second.slot,
          missionId: second.missionId,
          revision: second.revision,
          index: -1,
        }),
      (error) => {
        assert.equal(error.gameCode, "SECONDARY_ALREADY_ACTIVE");
        return true;
      },
    );
    assert.equal(secondSlot, undefined);

    // Partial progress is kept while active, then dropped by the abandon.
    const objective = JSON.parse(
      (
        await db
          .prepare("SELECT objective FROM secondary_missions WHERE slot=?")
          .get(first.slot)
      ).objective,
    );
    if (objective.targets.length > 1) {
      one.state.p = objective.targets[0];
      const collected = await service.action(one, {
        action: "collect",
        slot: first.slot,
        missionId: first.missionId,
        revision: first.revision,
        index: 0,
      });
      assert.deepEqual(
        collected.state.missions.find((mission) => mission.slot === first.slot)
          .progress,
        [0],
      );
    }

    const active = await db
      .prepare("SELECT * FROM secondary_missions WHERE slot=?")
      .get(first.slot);
    const abandoned = await service.action(one, {
      action: "abandon",
      slot: first.slot,
      missionId: first.missionId,
      revision: Number(active.revision),
      index: -1,
    });
    const freed = abandoned.state.missions.find(
      (mission) => mission.slot === first.slot,
    );
    assert.equal(freed.status, "available");
    assert.deepEqual(freed.progress, []);
    assert.ok(Number(freed.revision) > Number(active.revision));
    // No reward and no cooldown are written by an abandon.
    const progressRow = await db
      .prepare("SELECT idrem_gold FROM player_progress WHERE user_id=1")
      .get();
    assert.equal(progressRow, undefined);
    assert.deepEqual(abandoned.wallet, { idremGold: 0, level: 0 });
    const freedRow = await db
      .prepare(
        "SELECT status,available_at FROM secondary_missions WHERE slot=?",
      )
      .get(first.slot);
    assert.equal(freedRow.status, "AVAILABLE");
    assert.ok(Number(freedRow.available_at) <= Date.now());
    const audit = await db
      .prepare("SELECT action FROM audit WHERE actor=1 ORDER BY id DESC")
      .get();
    assert.equal(audit.action, "secondary_mission_abandoned");

    // Abandoning twice, or abandoning someone else's mission, is refused.
    await assert.rejects(
      () =>
        service.action(one, {
          action: "abandon",
          slot: first.slot,
          missionId: first.missionId,
          revision: Number(freed.revision),
          index: -1,
        }),
      /active pour toi/i,
    );

    // The freed slot, and any other slot, can be accepted again immediately.
    const rebooked = await service.action(one, {
      action: "accept",
      slot: second.slot,
      missionId: second.missionId,
      revision: second.revision,
      index: -1,
    });
    assert.equal(
      rebooked.state.missions.find((mission) => mission.slot === second.slot)
        .status,
      "accepted",
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
