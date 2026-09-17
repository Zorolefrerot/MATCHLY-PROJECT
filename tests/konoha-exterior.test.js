import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL("../" + file, import.meta.url), "utf8");

test("Konoha's first exterior is a compact same-world region with a real return route", () => {
  const exterior = read("game/scripts/konoha_exterior.gd");
  const visit = read("game/scripts/konoha_visit.gd");
  const map = read("game/scripts/konoha_map.gd");
  assert.match(exterior, /const EXTERIOR_SPAWN/);
  assert.match(exterior, /const KONOHA_RETURN_SPAWN/);
  for (const name of [
    "PLAIN_ZONE",
    "FOREST_ZONE",
    "AMBUSH_ZONE",
    "CONTINUATION_ZONE",
    "KonohaExitTrigger",
    "KonohaReturnTrigger",
    "KonohaInteriorSpawn",
    "KonohaExteriorSpawn",
    "KonohaReturnSpawn",
  ])
    assert.match(exterior, new RegExp(name));
  assert.match(exterior, /_build_distant_landscape/);
  assert.match(exterior, /SKY_ART/);
  assert.match(exterior, /_build_distant_mountains/);
  assert.doesNotMatch(exterior, /_build_boundaries/);
  assert.match(exterior, /_cylinder\(radius, height, point \+ Vector3\(0, height \* 0\.5, 0\).*true/);
  assert.match(exterior, /_update_collision_lod/);
  assert.match(exterior, /left_konoha/);
  assert.match(exterior, /returned_to_konoha/);
  assert.match(visit, /exterior\.build\(\)/);
  assert.match(visit, /exterior\.update\(player\.position, delta\)/);
  assert.match(visit, /exterior\.clamp_player\(player\)/);
  assert.match(map, /_gate\(Vector3\(0, 0, 158\.5\), PI\/2, "PORTE SUD DE KONOHA", true\)/);
  assert.match(map, /_village_wall\(Vector3\(302\.3, wall_height, wall_thickness\)/);
  assert.match(map, /const gate_half_width := 7\.0/);
  assert.match(map, /No collider or wall occupies x \[-7, 7\]/);
  // The region reuses the Konoha world and its authored sky; it does not add a
  // second Environment or a private combat implementation.
  assert.doesNotMatch(exterior, /WorldEnvironment\.new|Environment\.new|Combat/);
  assert.match(map, /sky_mountain_panorama\.png/);
});

test("the long road returns through the open gate and the HUD has IG and level marks", () => {
  const exterior = read("game/scripts/konoha_exterior.gd");
  const hud = read("game/scripts/konoha_hud.gd");
  assert.match(exterior, /GATE_INSIDE_Z/);
  assert.match(exterior, /GATE_OUTSIDE_Z/);
  assert.match(exterior, /Use the player coordinate as the source of truth/);
  assert.match(exterior, /Vector3\(0, 0, 620\)/);
  assert.match(hud, /idrem_gold_icon\.png/);
  assert.match(hud, /level_badge\.png/);
  for (const file of ["idrem_gold_icon.png", "level_badge.png"]) {
    const bytes = readFileSync(new URL("../game/assets/ui/" + file, import.meta.url));
    assert.equal(bytes.toString("hex", 0, 8), "89504e470d0a1a0a");
    assert.equal(bytes.readUInt32BE(16), 256);
    assert.equal(bytes.readUInt32BE(20), 256);
  }
});

test("the shared network envelope covers the exterior and still rejects its edge", () => {
  const client = read("game/scripts/village_link.gd");
  const server = read("server/village-room.js");
  assert.match(client, /float\(value\[2\]\) <= 628/);
  assert.match(server, /p\[2\] <= 628/);
  assert.match(server, /p\[2\] >= -158/);
});
