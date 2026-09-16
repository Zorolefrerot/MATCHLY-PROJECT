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
  assert.match(exterior, /_build_distant_mountains/);
  assert.match(exterior, /_build_boundaries/);
  assert.match(exterior, /_update_collision_lod/);
  assert.match(exterior, /left_konoha/);
  assert.match(exterior, /returned_to_konoha/);
  assert.match(visit, /exterior\.build\(\)/);
  assert.match(visit, /exterior\.update\(player\.position, delta\)/);
  assert.match(visit, /exterior\.clamp_player\(player\)/);
  assert.match(map, /_gate\(Vector3\(0, 0, 158\.5\), PI\/2, "PORTE SUD DE KONOHA", true\)/);
  assert.match(map, /for x in \[-120, -60, 60, 120\]/);
  // The region reuses the Konoha world and its authored sky; it does not add a
  // second Environment or a private combat implementation.
  assert.doesNotMatch(exterior, /WorldEnvironment\.new|Environment\.new|Combat/);
  assert.match(map, /sky_mountain_panorama\.png/);
});

test("the shared network envelope covers the exterior and still rejects its edge", () => {
  const client = read("game/scripts/village_link.gd");
  const server = read("server/village-room.js");
  assert.match(client, /float\(value\[2\]\) <= 428/);
  assert.match(server, /p\[2\] <= 428/);
  assert.match(server, /p\[2\] >= -158/);
});
