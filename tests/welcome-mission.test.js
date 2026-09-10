import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../server/store.js";
import { missionContract } from "./helpers/mission-contract.js";
import {
  advanceWelcome,
  welcomeState,
  welcomeEvents,
  welcomePlaces,
} from "../server/welcome-mission.js";

test("welcome mission: ordered, idempotent, account-scoped, persistent and reward-free", async () => {
  const dir = mkdtempSync(join(tmpdir(), "idrem-mission-"));
  let db = await openStore(join(dir, "test.sqlite"));
  try {
    const id = await missionContract(db);
    await db.close();
    db = await openStore(join(dir, "test.sqlite"));
    const row = await db
      .prepare(
        "SELECT phase,visited,revision FROM welcome_missions WHERE user_id=?",
      )
      .get(id);
    assert.deepEqual(
      { ...row },
      { phase: "completed", visited: 7, revision: 5 },
      "survives restart and additive schema initialization",
    );
  } finally {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("mission event catalogs agree and native saves never write the whole progress or positions", () => {
  const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
  const model = read("game/scripts/welcome_mission.gd");
  for (const id of [...welcomeEvents, ...welcomePlaces])
    assert.ok(model.includes(`"${id}"`));
  assert.match(
    read("game/scripts/account_api.gd"),
    /"event": event, "expectedRevision": state\["revision"\]/,
  );
  assert.doesNotMatch(
    read("game/scripts/konoha_visit.gd"),
    /FileAccess|save_local|HTTPRequest|try_cast/,
  );
  assert.match(read("game/scripts/konoha_visit.gd"), /nearest != expected/);
  assert.match(read("game/scripts/konoha_hud.gd"), /ScrollContainer\.new/);
  assert.match(
    read("server/game.js"),
    /authenticate\(req\)[\s\S]*advanceWelcome/,
  );
});

test("all six landmark visit orders complete once, with stale writes rejected", () => {
  for (const order of [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ]) {
    let row = advanceWelcome(null, "accept", 0);
    for (const index of order) {
      assert.throws(
        () => advanceWelcome(row, "read_" + welcomePlaces[index], 0),
        { gameCode: "MISSION_CONFLICT" },
      );
      row = advanceWelcome(row, "read_" + welcomePlaces[index], row.revision);
    }
    row = advanceWelcome(row, "report", 4);
    assert.equal(welcomeState(row).status, "completed");
    assert.equal(advanceWelcome(row, "report", 4), null);
    assert.equal(advanceWelcome(row, "accept", 0), null);
  }
});
