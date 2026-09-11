import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL("../" + p, import.meta.url));
test("combat image atlas is traced, bounded, padded, and exported without raw AI source", () => {
  const m = JSON.parse(read("game/assets/vfx/combat/manifest.json"));
  const hash = (b) => createHash("sha256").update(b).digest("hex");
  assert.equal(hash(read(m.source)), m.source_sha256);
  const atlas = read(m.output);
  assert.equal(hash(atlas), m.output_sha256);
  assert.equal(atlas.readUInt32BE(16), 1024);
  assert.equal(atlas.readUInt32BE(20), 1024);
  assert.equal(m.cells.length, 16);
  assert.equal(new Set(m.cells).size, 16);
  assert.equal(m.padding, 16);
  assert.ok(atlas.length < 650000);
  assert.ok(
    read("game/export_presets.cfg")
      .toString()
      .includes("assets/vfx/combat/manifest.json"),
  );
  const visual = read("game/scripts/spectacle.gd").toString();
  assert.match(visual, /no_depth_test = false/);
  assert.match(visual, /MAX_SPRITES: int = 10/);
  assert.doesNotMatch(visual, /take_damage|\.health|HTTPRequest|time_scale/);
});
test("ultimate catalogue has fourteen distinct clan proposals without granting account powers", () => {
  const code = read("game/scripts/ultimate_rules.gd").toString();
  const clans = [...code.matchAll(/"clan":"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(clans, [
    "Uchiwa",
    "Uzumaki",
    "Senju",
    "Hyūga",
    "Akimichi",
    "Yamanaka",
    "Aburame",
    "Inuzuka",
    "Fushiguro",
    "Itadori",
    "Kurosaki",
    "Shunsui",
    "Yeager",
    "Ackerman",
  ]);
  assert.equal(
    new Set([...code.matchAll(/"motif":(\d+)/g)].map((m) => m[1])).size,
    14,
  );
  assert.doesNotMatch(
    code,
    /Mokuton|Sharingan|Mangekyō|Nara|save_|HTTPRequest/,
  );
  const hud = read("game/scripts/hud.gd").toString();
  assert.match(hud, /_button\([^\n]+"ultimate"\)/);
  assert.match(
    read("game/scripts/ultimate_lab.gd").toString(),
    /SIMULATION HORS LIGNE/,
  );
  for (const file of [
    "game/scripts/village_link.gd",
    "server/village-room.js",
    "server/game.js",
  ])
    assert.doesNotMatch(
      read(file).toString(),
      /TrainingUltimateRules|cast_ultimate|ultimate_damage/,
    );
});
