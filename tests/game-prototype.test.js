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
    assert.doesNotMatch(
      script,
      /HTTPClient\.new|WebSocketPeer\.new|DATABASE_URL|ADMIN_PASSWORD/,
    );
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
  assert.match(
    read("game/scripts/training.gd"),
    /village_entry_pending = true\s+account_api\.refresh\(\)/,
  );
  assert.match(read("game/scripts/account_panel.gd"), /ENTRER À KONOHA/);
});
