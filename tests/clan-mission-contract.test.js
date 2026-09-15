import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("clan mission is generic, clan-gated and preserves Aoi's mission", () => {
  const manager = read("game/scripts/clan_mission_manager.gd");
  const visit = read("game/scripts/konoha_visit.gd");
  const aoi = read("game/scripts/welcome_mission.gd");
  assert.match(manager, /class_name ClanMissionManager/);
  assert.match(manager, /identity\.get\("clan_id", identity\.get\("clan"/);
  assert.match(manager, /ClanAccessBarrier_/);
  assert.match(manager, /Accès refusé\. Cette cour est réservée aux membres de ce clan/);
  assert.doesNotMatch(manager, /reset_at|teleport|village_link|remote_avatars/);
  assert.equal((manager.match(/"leader":"Chef /g) || []).length, 14);
  assert.equal((manager.match(/"clan_id":"/g) || []).length, 14);
  assert.equal(new Set([...manager.matchAll(/"leader":"([^"]+)"/g)].map((m) => m[1])).size, 14);
  assert.match(visit, /Aoi · Ta première mission/);
  assert.match(visit, /clan_manager\.is_near_own_leader/);
  assert.match(aoi, /konoha_welcome/);
});

test("stars are local, replenished to ten and never sent through village presence", () => {
  const manager = read("game/scripts/clan_mission_manager.gd");
  const mission = read("game/scripts/clan_mission.gd");
  assert.equal((manager.match(/Vector3\(/g) || []).length >= 20, true);
  assert.match(mission, /DURATION_SECONDS: float = 300\.0/);
  assert.match(mission, /STAR_COUNT: int = 10/);
  assert.match(manager, /var active_stars: Dictionary/);
  assert.match(manager, /Area3D\.new\(\)/);
  assert.match(manager, /active_stars\.size\(\) >= ClanMission\.STAR_COUNT/);
  assert.match(manager, /_spawn_next_star\(last_collected_slot\)/);
  assert.match(manager, /star\.queue_free\(\)/);
  assert.doesNotMatch(manager, /VillageLink|send\(|pose\s*=|remote/);
});

test("the HUD exposes a private timer/counter without replacing the existing combat HUD", () => {
  const hud = read("game/scripts/konoha_hud.gd");
  assert.match(hud, /clan_mission_status/);
  assert.match(hud, /set_clan_mission_hud/);
  assert.match(hud, /combat_status/);
});
