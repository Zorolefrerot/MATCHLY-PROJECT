import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
const read = (file) =>
  readFileSync(new URL("../" + file, import.meta.url), "utf8");

test("offline training stays separate from explicit scoped HTTPS account access", () => {
  const project = read("game/project.godot");
  assert.match(project, /gl_compatibility/);
  assert.match(project, /textures\/vram_compression\/import_etc2_astc=true/);
  assert.match(project, /window\/handheld\/orientation=0/);
  const preset = read("game/export_presets.cfg");
  assert.match(preset, /permissions\/internet=true/);
  assert.match(preset, /package\/unique_name="org.idremzenkai.training"/);
  assert.match(preset, /gradle_build\/use_gradle_build=false/);
  // Standard APK templates have fixed SDK levels; overrides require Gradle.
  assert.match(preset, /gradle_build\/min_sdk=""/);
  assert.match(preset, /gradle_build\/target_sdk=""/);
  for (const name of readdirSync(
    new URL("../game/scripts/", import.meta.url),
  )) {
    const script = read("game/scripts/" + name);
    assert.doesNotMatch(script, /HTTPClient\.new|DATABASE_URL|ADMIN_PASSWORD/);
    if (name !== "village_link.gd")
      assert.doesNotMatch(script, /WebSocketPeer\.new/);
    if (name !== "account_api.gd")
      assert.doesNotMatch(script, /HTTPRequest\.new/);
  }
  const workflow = read("game/ci/android-prototype.yml");
  assert.match(workflow, /branches: \[arena\/01a08158-matchly-project\]/);
  assert.match(workflow, /retention-days: 7/);
  assert.doesNotMatch(workflow, /secrets\./);
});
test("prototype has four test techniques and a separate main scene", () => {
  const rules = read("game/scripts/rules.gd");
  for (const name of ["KATON", "RAITON", "FŪTON", "DOTON"])
    assert.ok(rules.includes(name));
  assert.match(
    read("game/scenes/training.tscn"),
    /res:\/\/scripts\/training.gd/,
  );
  assert.match(read("game/tools/check.sh"), /IDREM_SMOKE_FAILURES=0/);
  assert.match(read("game/tools/export_android.sh"), /apksigner.*verify/);
});

test("the combat HUD cannot display the oversized logo", () => {
  const hud = read("game/scripts/hud.gd");
  assert.doesNotMatch(hud, /TextureRect\.new|assets\/icon\.png/);
  assert.match(hud, /volume_changed/);
  assert.match(read("game/scripts/vfx.gd"), /MAX_GROUPS: int = 14/);
});

test("provided sounds and original warning are bounded offline PCM with traceable sources", () => {
  const dir = new URL("../game/assets/audio/", import.meta.url);
  const manifest = JSON.parse(read("game/assets/audio/manifest.json"));
  const sources = JSON.parse(read("game/audio_sources/sources.json"));
  const sha = (data) => createHash("sha256").update(data).digest("hex");
  const files = readdirSync(dir).filter((name) => name.endsWith(".wav"));
  assert.equal(files.length, 10);
  for (const name of files) {
    const data = readFileSync(new URL(name, dir));
    assert.equal(data.toString("ascii", 0, 4), "RIFF");
    assert.equal(data.toString("ascii", 8, 12), "WAVE");
    assert.equal(data.readUInt16LE(20), 1); // PCM
    assert.equal(data.readUInt16LE(22), 1); // mono
    assert.equal(data.readUInt32LE(24), 22050);
    assert.equal(data.readUInt16LE(34), 16);
    assert.equal(data.readUInt32LE(40), data.length - 44);
    const cue = name.replace(".wav", "");
    const record = manifest.clips[cue];
    assert.equal(
      sha(data),
      record.output_sha256,
      name + " matches prepared recording",
    );
    assert.ok(
      Math.abs((data.length - 44) / 44100 - record.duration_seconds) < 0.0001,
    );
    if (cue !== "warning") {
      const original = readFileSync(
        new URL("../" + record.source, import.meta.url),
      );
      assert.equal(sha(original), record.source_sha256);
      assert.equal(record.source_sha256, sources.files[cue + ".mp3"].sha256);
      assert.equal(record.source_commit, sources.commit);
      assert.equal(record.detected_codec, "aac");
      assert.ok(
        Math.abs(
          record.input_seconds -
            record.trim_start_seconds -
            record.trim_end_seconds -
            record.duration_seconds,
        ) < 0.0001,
      );
      assert.ok(
        record.gain_db <= 6.001,
        "do not excessively amplify source noise",
      );
    }
    let peak = 0,
      energy = 0;
    for (let pos = 44; pos < data.length; pos += 2) {
      const value = data.readInt16LE(pos) / 32768;
      peak = Math.max(peak, Math.abs(value));
      energy += value * value;
    }
    assert.ok(peak > 0.1 && peak < 0.8, name + " has audio headroom");
    assert.ok(
      Math.sqrt(energy / ((data.length - 44) / 2)) > 0.01,
      name + " is audible PCM",
    );
    if (name === "combat_loop.wav") {
      assert.ok(record.duration_seconds > 40 && record.duration_seconds < 43);
      assert.ok(
        Math.abs(data.readInt16LE(44) - data.readInt16LE(data.length - 2)) <
          800,
        "no large discontinuity at the loop boundary",
      );
    }
  }
});

test("raw uploads stay out of the Godot import/export and the warning generator cannot replace them", () => {
  assert.ok(read("game/audio_sources/.gdignore").length > 0);
  const preset = read("game/export_presets.cfg");
  assert.ok(preset.includes("audio_sources/*"));
  assert.ok(preset.includes("assets/audio/manifest.json"));
  const generator = read("game/tools/generate_audio.py");
  assert.match(generator, /warning\.wav/);
  assert.doesNotMatch(generator, /katon|raiton|futon|combat_loop/);
  assert.match(read("game/scripts/audio.gd"), /get_meta\("cue"/);
});

test("Katon has a real flame atlas and Raiton has bounded batched electrical branches", () => {
  const atlas = readFileSync(
    new URL("../game/assets/vfx/flame_atlas.png", import.meta.url),
  );
  assert.equal(atlas.toString("hex", 0, 8), "89504e470d0a1a0a");
  assert.equal(atlas.readUInt32BE(16), 1024);
  assert.equal(atlas.readUInt32BE(20), 192);
  assert.equal(atlas[25], 6, "RGBA transparency is preserved");
  const flame = read("game/scripts/flame.gd");
  assert.match(flame, /sprite\.no_depth_test = false/);
  assert.match(flame, /FRAMES: int = 8/);
  assert.match(flame, /sprite\.frame =/);
  const bolt = read("game/scripts/bolt.gd");
  assert.match(bolt, /redraws < 3/);
  assert.match(bolt, /range\(3\)/);
  assert.match(bolt, /ArrayMesh\.new/);
  assert.match(bolt, /branch_count: int/);
  assert.match(read("game/scripts/training.gd"), /vfx\.fire_impact/);
  assert.doesNotMatch(read("game/scripts/training.gd"), /_orb\(/);
});

test("character customization is bounded, cosmetic and saved only on the device", () => {
  const appearance = read("game/scripts/appearance.gd");
  assert.match(appearance, /user:\/\/appearance-v1\.json/);
  for (const key of [
    "model",
    "hair",
    "hair_color",
    "eyes",
    "skin",
    "top",
    "top_color",
    "bottom",
    "bottom_color",
  ])
    assert.ok(appearance.includes(`"${key}"`));
  assert.match(appearance, /Masculin/);
  assert.match(appearance, /Féminin/);
  assert.match(appearance, /get_length\(\) > 8192/);
  assert.match(appearance, /rename_absolute/);
  assert.match(read("game/scripts/creator.gd"), /SubViewport.UPDATE_DISABLED/);
  assert.match(read("game/scripts/fighter.gd"), /func apply_appearance/);
});

test("Konoha is a separate account-avatar visit, not a renamed training arena", () => {
  const village = read("game/scripts/konoha_visit.gd");
  assert.match(village, /viewport\.own_world_3d = true/);
  assert.match(village, /account_profile\.get\("appearance"\)/);
  assert.doesNotMatch(
    village,
    /save_local|HTTPRequest|\.save_appearance|\.try_cast/,
  );
  const map = read("game/scripts/konoha_map.gd");
  for (const name of ["Académie", "Marché", "Résidence du Hokage"])
    assert.ok(map.includes(name));
  assert.doesNotMatch(map, /super\.build\(/);
  assert.equal((map.match(/\t_gate\(/g) || []).length, 4);
  assert.match(map, /Four closed Konoha gates/);
  assert.match(map, /ACCÈS EXTÉRIEUR FERMÉ/);
  assert.match(
    read("game/scripts/training.gd"),
    /village_entry_pending = true\s+account_api\.refresh\(\)/,
  );
  assert.match(read("game/scripts/account_panel.gd"), /ENTRER À KONOHA/);
});

test("Konoha reference-derived textures are bounded, mipmapped and traceable", () => {
  const manifest = JSON.parse(read("game/assets/konoha/manifest.json"));
  const sha = (data) => createHash("sha256").update(data).digest("hex");
  assert.equal(manifest.sources.length, 3);
  assert.equal(manifest.outputs.length, 7);
  assert.deepEqual(
    manifest.environment_outputs.map((entry) => entry.file),
    ["sky_mountain_panorama.png", "earth_ground_texture.png", "river_water_texture.png"],
  );
  assert.equal(manifest.head_count, 4);
  assert.equal(manifest.texture_scope, "environment-only-generated-art");
  assert.deepEqual(manifest.cliff_crop, [0, 0, 382, 225]);
  for (const source of manifest.sources) {
    const bytes = readFileSync(
      new URL("../art_sources/konoha/" + source.file, import.meta.url),
    );
    assert.equal(sha(bytes), source.sha256);
  }
  let total = 0;
  for (const output of manifest.outputs) {
    const path = "game/assets/konoha/" + output.file;
    const bytes = readFileSync(new URL("../" + path, import.meta.url));
    total += bytes.length;
    assert.equal(sha(bytes), output.sha256);
    assert.equal(bytes.toString("hex", 0, 8), "89504e470d0a1a0a");
    assert.equal(bytes.readUInt32BE(16), output.size[0]);
    assert.equal(bytes.readUInt32BE(20), output.size[1]);
    assert.ok(output.size.every((n) => n === 256 || n === 512));
    if (/atlas|cliff/.test(path)) assert.equal(bytes[25], 6);
    assert.match(read(path + ".import"), /mipmaps\/generate=true/);
    assert.match(read(path + ".import"), /compress\/mode=0/);
  }
  assert.ok(total < 1600000, "prepared PNG budget stays below 1.6 MB");
  const preset = read("game/export_presets.cfg");
  assert.ok(preset.includes("assets/konoha/manifest.json"));
  assert.ok(preset.includes("assets/konoha/README.md"));
});

test("generated sky and earth art stays limited to environment surfaces", () => {
  const map = read("game/scripts/konoha_map.gd");
  for (const asset of [
    "sky_mountain_panorama.png",
    "earth_ground_texture.png",
    "river_water_texture.png",
  ]) {
    const bytes = readFileSync(
      new URL("../game/assets/konoha/" + asset, import.meta.url),
    );
    assert.equal(bytes.toString("hex", 0, 8), "89504e470d0a1a0a");
    assert.ok(bytes.length > 10000, asset + " is not an empty generated texture");
  }
  assert.match(map, /const SKY_ART/);
  assert.match(map, /const EARTH_ART/);
  assert.match(map, /const RIVER_ART/);
  assert.match(map, /PanoramaSkyMaterial/);
  assert.match(map, /uv1_scale = Vector3\(1\.0, maxf/);
  assert.doesNotMatch(map, /HOMES_ART|MARKET_ART|SHRINE_ART|ANIMAL_ART|_build_generated_art/);
});

test("fourteen clan sanctuary references are traced and kept out of runtime textures", () => {
  const manifest = JSON.parse(read("art_sources/konoha/sanctuaries/manifest.json"));
  const sha = (data) => createHash("sha256").update(data).digest("hex");
  const clans = [
    "Uchiwa", "Uzumaki", "Senju", "Hyūga", "Akimichi", "Yamanaka", "Aburame",
    "Inuzuka", "Fushiguro", "Itadori", "Kurosaki", "Shunsui", "Yeager", "Ackerman",
  ];
  assert.deepEqual(manifest.models.map((entry) => entry.clan), clans);
  assert.equal(manifest.models.length, 14);
  assert.match(manifest.runtime_policy, /reference-only/);
  for (const entry of manifest.models) {
    const path = "art_sources/konoha/sanctuaries/" + entry.file;
    const bytes = readFileSync(new URL("../" + path, import.meta.url));
    assert.equal(sha(bytes), entry.sha256);
    assert.equal(bytes.readUInt16BE(0), 0xffd8);
  }
  const map = read("game/scripts/konoha_map.gd");
  for (const clan of clans) assert.match(map, new RegExp(`CLAN ${clan.toUpperCase()}`));
  assert.match(map, /DOMAINE DU/);
  assert.match(map, /former sanctuary plot|Former sanctuary volumes/);
  assert.match(map, /residential_hall/);
  assert.match(map, /CLAN_SANCTUARIES: Array\[PackedScene\]/);
  assert.match(map, /_build_blender_sanctuary/);
  assert.match(map, /sanctuary\.scale = Vector3\.ONE \* 1\.35/);
  assert.match(read("game/scripts/konoha_architecture.gd"), /register_external_sanctuary/);
  for (const file of [
    "01_uchiwa.glb", "02_uzumaki.glb", "03_senju.glb", "04_hyuga.glb",
    "05_akimichi.glb", "06_yamanaka.glb", "07_aburame.glb", "08_inuzuka.glb",
    "09_fushiguro.glb", "10_itadori.glb", "11_kurosaki.glb", "12_shunsui.glb",
    "13_yeager.glb", "14_ackerman.glb",
  ]) assert.ok(readFileSync(new URL("../game/assets/konoha/sanctuaries/" + file, import.meta.url)).length > 1000, file + " missing");
  assert.match(map, /func _district_access/);
  assert.match(map, /func _sanctuary_domain/);
  assert.match(map, /func _sanctuary_flag/);
  assert.match(map, /ClanEmblem_/);
  assert.match(map, /SanctuaryFootprint/);
  assert.match(map, /simple Godot block collider/);
  assert.match(map, /old solid welcome block/);
  assert.doesNotMatch(map, /Color\("b55d4c"\), true/);
  assert.match(map, /SolidStairRun/);
  assert.match(map, /clan_variant \+= 1/);
  assert.match(map, /Vector3\(-7,0,-78\)/);
  assert.match(read("game/tests/smoke.gd"), /Hokage|monument/);
  assert.match(read("game/scripts/konoha_visit.gd"), /Only a genuine fall through the world respawns/);
  assert.match(read("game/scripts/konoha_architecture.gd"), /_sanctuary_geometry/);
  assert.match(read("game/scripts/konoha_architecture.gd"), /13: # Ackerman/);
  assert.match(read("game/scripts/konoha_architecture.gd"), /HokageImageWallCollision/);
  assert.doesNotMatch(read("game/scripts/konoha_architecture.gd"), /_sculpted_face|face_rock|face_highlight/);
  assert.match(read("game/scripts/konoha_architecture.gd"), /z0: float = -101\.5/);
});

test("Konoha remodels silhouettes and batches facade details without changing combat", () => {
  const architecture = read("game/scripts/konoha_architecture.gd");
  assert.match(architecture, /ConvexPolygonShape3D\.new/);
  assert.match(architecture, /func lathe/);
  assert.match(architecture, /details = _mesh\(detail_vertices/);
  assert.match(architecture, /LINEAR_WITH_MIPMAPS/);
  assert.doesNotMatch(
    architecture,
    /func _process|func _physics_process|Image\.new|HTTPRequest/,
  );
  assert.match(read("game/scripts/konoha_map.gd"), /architecture\.house/);
  for (const filename of [
    "training.gd",
    "arena.gd",
    "fighter.gd",
    "rules.gd",
    "audio.gd",
  ])
    assert.doesNotMatch(
      read("game/scripts/" + filename),
      /KonohaArchitecture|assets\/konoha/,
    );
  assert.match(read("game/tests/capture.gd"), /konoha-house/);
  assert.match(read("game/tests/capture.gd"), /konoha-palace/);
  const version = read("game/VERSION").trim();
  assert.equal(version, "0.12.0");
  assert.ok(
    read("game/export_presets.cfg").includes(`version/name="${version}"`),
  );
  assert.match(read("game/scripts/konoha_hud.gd"), /PROTO 0\.11/);
});
