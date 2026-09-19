import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (file) => readFileSync(new URL("../" + file, import.meta.url), "utf8");

test("Academy reception refreshes at the counter and renders actionable team notifications", () => {
  const manager = read("game/scripts/team_manager.gd");
  const link = read("game/scripts/village_link.gd");
  const room = read("server/village-room.js");
  const service = read("server/team-system.js");
  assert.doesNotMatch(room, /academy_action|academy_state|validAcademyAction/);
  assert.doesNotMatch(read("game/scripts/village_link.gd"), /academy_action|academy_state/);
  const sensei = read("game/scripts/team_sensei.gd");
  assert.match(manager, /_request_refresh\(\)/);
  assert.match(manager, /📱 NOTIFICATION · INVITATION D’ÉQUIPE/);
  assert.match(manager, /fromName/);
  assert.match(manager, /fromClan/);
  assert.match(manager, /fromLevel/);
  assert.match(manager, /fromAppearance/);
  assert.match(link, /func team_refresh\(\)/);
  assert.match(room, /\["refresh", "apply", "withdraw"/);
  assert.match(service, /if \(action === "refresh"\)/);
  assert.match(sensei, /func show_dialogue\(text: String\)/);
  assert.match(manager, /show_dialogue\(spoken_line\)/);
  assert.match(manager, /hud\.blocked = true/);
  assert.match(manager, /hud\.blocked = false/);
  assert.doesNotMatch(read("game/scripts/academy.gd"), /À VENIR|affichage à venir/);
});
