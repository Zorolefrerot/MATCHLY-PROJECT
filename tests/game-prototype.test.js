import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
const read = (file) =>
  readFileSync(new URL("../" + file, import.meta.url), "utf8");

test("Android prototype is isolated and does not gain access to live accounts", () => {
  const project = read("game/project.godot");
  assert.match(project, /gl_compatibility/);
  assert.match(project, /textures\/vram_compression\/import_etc2_astc=true/);
  assert.match(project, /window\/handheld\/orientation=0/);
  const preset = read("game/export_presets.cfg");
  assert.match(preset, /permissions\/internet=false/);
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
      /HTTPRequest\.new|HTTPClient\.new|WebSocketPeer\.new|DATABASE_URL|ADMIN_PASSWORD/,
    );
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

test("original offline sounds are non-silent bounded PCM, including a smooth music loop", () => {
  const dir = new URL("../game/assets/audio/", import.meta.url);
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
      assert.ok(data.length > 700000 && data.length < 900000);
      assert.ok(
        Math.abs(data.readInt16LE(44) - data.readInt16LE(data.length - 2)) <
          800,
        "no large discontinuity at the loop boundary",
      );
    }
  }
});
