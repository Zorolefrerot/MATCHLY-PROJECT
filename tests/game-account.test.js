import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../server/store.js";
import { validAppearance, appearanceLimits } from "../server/game.js";
import { gameContract, appearance } from "./helpers/game-contract.js";

test("native account lifecycle: admission, scoped auth, atomic cosmetic saves, isolation and revocation", async () => {
  const dir = mkdtempSync(join(tmpdir(), "idrem-character-"));
  let db = await openStore(join(dir, "test.sqlite"));
  try {
    const id = await gameContract(db);
    await db.close();
    db = await openStore(join(dir, "test.sqlite"));
    assert.deepEqual(
      JSON.parse(
        (
          await db
            .prepare(
              "SELECT appearance FROM character_appearances WHERE user_id=?",
            )
            .get(id)
        ).appearance,
      ),
      appearance,
      "survives restart and idempotent additive schema migration",
    );
    assert.equal(
      (await db.prepare("SELECT COUNT(*) AS n FROM allocations").get()).n,
      2,
    );
  } finally {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("cosmetic schema v1 matches Godot catalogs and rejects unsupported values", () => {
  assert.ok(validAppearance(appearance));
  for (const bad of [
    null,
    [],
    {},
    { ...appearance, hp: 999 },
    { ...appearance, hair: NaN },
    { ...appearance, eyes: Infinity },
  ])
    assert.ok(!validAppearance(bad));
  const gd = readFileSync(
    new URL("../game/scripts/appearance.gd", import.meta.url),
    "utf8",
  );
  for (const [key, array] of Object.entries({
    model: "MODELS",
    hair: "HAIR",
    hair_color: "HAIR_NAMES",
    eyes: "EYE_NAMES",
    skin: "SKIN_NAMES",
    top: "TOPS",
    top_color: "CLOTH_NAMES",
    bottom: "BOTTOMS",
    bottom_color: "CLOTH_NAMES",
  })) {
    const values = gd.match(
      new RegExp(`const ${array}: Array\\[String\\] = (\\[[^\\n]+\\])`),
    );
    assert.equal(JSON.parse(values[1]).length, appearanceLimits[key]);
  }
  const api = readFileSync(
    new URL("../game/scripts/account_api.gd", import.meta.url),
    "utf8",
  );
  assert.match(api, /max_redirects = 0/);
  assert.match(api, /body_size_limit = 32768/);
  assert.doesNotMatch(
    api,
    /FileAccess|ConfigFile|TLSOptions\.client_unsafe|print\(/,
  );
  const creator = readFileSync(
    new URL("../game/scripts/creator.gd", import.meta.url),
    "utf8",
  );
  assert.ok(
    creator.indexOf("remote_save_requested.emit") <
      creator.indexOf("CharacterAppearance.save_local"),
  );
});
