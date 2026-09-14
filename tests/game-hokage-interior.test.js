import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, root), "utf8");

test("the Hokage residence is a deliberate, collidable two-floor visit", () => {
  const interior = read("game/scripts/hokage_interior.gd");
  for (const section of [
    "ACCUEIL",
    "SALLE DU CONSEIL",
    "BUREAU DU HOKAGE",
    "BALCON",
    "_portrait_card",
    "_stairs",
    "StaticBody3D.new()",
    "ConvexPolygonShape3D.new()",
  ])
    assert.match(interior, new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  for (const name of [
    "Hashirama Senju",
    "Tobirama Senju",
    "Hiruzen Sarutobi",
    "Minato Namikaze",
    "Tsunade",
    "Kakashi Hatake",
    "Naruto Uzumaki",
  ])
    assert.ok(interior.includes(name));

  const visit = read("game/scripts/konoha_visit.gd");
  assert.doesNotMatch(visit, /ENTRER DANS LA RÉSIDENCE|RESSORTIR DE LA RÉSIDENCE/);
  assert.doesNotMatch(visit, /_toggle_hokage_residence/);
  assert.match(visit, /_update_hokage_portal/);
  assert.match(visit, /HokageInterior\.EXIT_POINT\.z\+0\.85/);
  assert.match(visit, /HOKAGE_PORTAL_HOLD_SECONDS/);
  assert.match(visit, /_begin_hokage_loading/);
  assert.match(visit, /loading_portal\.png/);
  const hud = read("game/scripts/konoha_hud.gd");
  assert.doesNotMatch(hud, /VISITER LA RÉSIDENCE/);
  assert.doesNotMatch(hud, /buttons\["residence"\]/);
  assert.match(visit, /_enter_hokage_residence/);
  assert.match(visit, /_exit_hokage_residence/);
  assert.match(visit, /transition_lock/);
  assert.match(visit, /EXIT_POINT \+ Vector3\(0,0,-4\.5\)/);
  assert.match(visit, /hokage_interior\.position = Vector3\(-140, 0, -110\)/);

  const architecture = read("game/scripts/konoha_architecture.gd");
  assert.match(architecture, /RÉSIDENCE DU HOKAGE/);
  assert.match(architecture, /HokageMainFacadeCollision/);
  assert.match(architecture, /HokageMainDoorCollision/);
  assert.match(architecture, /point\+Vector3\(0,1\.73,5\.78\)/);
  assert.match(architecture, /OmniLight3D\.new\(\)/);
  assert.match(architecture, /RESTER SUR LE SCEAU/);
  assert.doesNotMatch(architecture, /HALL OUVERT · E POUR ENTRER/);
  assert.match(read("game/scripts/konoha_map.gd"), /architecture\.main_door\(Vector3\(0,0,-78\)\)/);

  const loadingImage = readFileSync(new URL("game/assets/konoha/hokage/loading_portal.png", root));
  assert.equal(loadingImage.toString("hex", 0, 8), "89504e470d0a1a0a");
  const portraitDir = new URL("game/assets/konoha/hokage/", root);
  const portraits = readdirSync(portraitDir).filter((file) => file.endsWith("_portrait.png"));
  assert.equal(portraits.length, 7);
  for (const file of portraits) {
    const bytes = readFileSync(new URL(file, portraitDir));
    assert.equal(bytes.toString("hex", 0, 8), "89504e470d0a1a0a");
    assert.equal(bytes.readUInt32BE(16), 144);
    assert.equal(bytes.readUInt32BE(20), 528);
  }
  assert.match(read("game/assets/konoha/hokage/README.md"), /peakpx\.com/);
  assert.match(read("art_sources/konoha/hokage-gallery-source.json"), /license_verified/);
});
