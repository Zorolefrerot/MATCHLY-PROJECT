import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
const read = (file) =>
  readFileSync(new URL("../" + file, import.meta.url), "utf8");

test("Android prototype is isolated and does not gain access to live accounts", () => {
  const project = read("game/project.godot");
  assert.match(project, /gl_compatibility/);
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
