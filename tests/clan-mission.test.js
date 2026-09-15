import { test } from "node:test";
import assert from "node:assert/strict";
import {
  advanceClanMission,
  clanMissionState,
  rewardForStars,
} from "../server/clan-mission.js";

function progress(score) {
  let row = null;
  row = advanceClanMission(row, "accept", 0);
  row = advanceClanMission(row, "start", row.revision);
  row = advanceClanMission(row, "expire", row.revision, score);
  row = advanceClanMission(row, "report_pending", row.revision);
  return advanceClanMission(row, "report", row.revision);
}

test("clan mission has the exact state path and report-only completion", () => {
  let row = null;
  assert.equal(clanMissionState(row).status, "NOT_STARTED");
  row = advanceClanMission(row, "accept", 0);
  assert.equal(clanMissionState(row).status, "ACCEPTED");
  row = advanceClanMission(row, "start", 1);
  assert.equal(clanMissionState(row).status, "IN_PROGRESS");
  row = advanceClanMission(row, "expire", 2, 9);
  assert.equal(clanMissionState(row).status, "TIME_EXPIRED");
  row = advanceClanMission(row, "report_pending", 3);
  assert.equal(clanMissionState(row).status, "REPORT_PENDING");
  row = advanceClanMission(row, "report", 4);
  assert.equal(clanMissionState(row).status, "COMPLETED");
  assert.equal(row.reward_claimed, 1);
  assert.equal(advanceClanMission(row, "report", 5), null);
});

test("clan mission reward thresholds are exact and never duplicated", () => {
  const expected = new Map([
    [0, [5, 0]], [4, [5, 0]], [5, [10, 0]], [9, [10, 0]],
    [10, [0, 1]], [19, [0, 1]], [20, [10, 1]], [29, [10, 1]],
    [30, [10, 1]], [49, [10, 1]], [50, [30, 2]],
  ]);
  for (const [score, reward] of expected) {
    const actual = rewardForStars(score);
    assert.deepEqual([actual.idremGold, actual.level], reward);
    const final = progress(score);
    assert.deepEqual([final.score, final.reward_claimed], [score, 1]);
    assert.equal(rewardForStars(score).tier.length > 0, true);
  }
});

test("stale writes and impossible transitions are rejected", () => {
  const accepted = advanceClanMission(null, "accept", 0);
  assert.throws(
    () => advanceClanMission(accepted, "start", 0),
    { gameCode: "CLAN_MISSION_CONFLICT" },
  );
  assert.throws(
    () => advanceClanMission(accepted, "report", 1),
    { gameCode: "CLAN_MISSION_REPORT_REQUIRED" },
  );
});
