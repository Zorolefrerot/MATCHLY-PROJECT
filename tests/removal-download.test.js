import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { openStore } from "../server/store.js";
import { downloadInfo, androidBuild } from "../server/android-build.js";
import { removalContract } from "./helpers/removal-contract.js";

test("accepted account removal, gated download and safe seat reuse survive restart", async () => {
  const dir = mkdtempSync(join(tmpdir(), "idrem-removal-"));
  let db = await openStore(join(dir, "test.sqlite"));
  try {
    const id = await removalContract(db);
    await db.close();
    db = await openStore(join(dir, "test.sqlite"));
    assert.ok(
      await db
        .prepare("SELECT user_id FROM deleted_accounts WHERE user_id=?")
        .get(id),
    );
    assert.equal(
      (await db.prepare("SELECT COUNT(*) AS n FROM allocations").get()).n,
      20,
    );
    assert.equal(
      (await db.prepare("SELECT SUM(mokuton) AS n FROM allocations").get()).n,
      3,
    );
  } finally {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("installer metadata closes expired links without disclosing a URL in profile metadata", () => {
  const expiry = Date.parse(androidBuild.expiresAt);
  assert.equal(downloadInfo(expiry - 1).available, true);
  assert.equal(downloadInfo(expiry).available, false);
  assert.equal(downloadInfo(expiry + 1).available, false);
  assert.equal(downloadInfo().url, undefined);
});
test("owner village music is traceable, lightweight and distinct from combat", () => {
  const read = (p) => readFileSync(new URL("../" + p, import.meta.url));
  const manifest = JSON.parse(read("game/assets/village_audio/manifest.json"));
  const digest = (b) => createHash("sha256").update(b).digest("hex");
  const output = read("game/assets/village_audio/village_loop.ogg");
  assert.equal(digest(read(manifest.source)), manifest.source_sha256);
  assert.equal(digest(output), manifest.output_sha256);
  assert.equal(output.subarray(0, 4).toString(), "OggS");
  assert.ok(output.length < 600000);
  assert.ok(manifest.duration_seconds > 78 && manifest.duration_seconds < 79);
  assert.ok(manifest.gain_db <= 6 && manifest.peak <= 0.6);
  const visit = read("game/scripts/konoha_visit.gd").toString();
  assert.match(visit, /stream.loop = true/);
  assert.match(visit, /music.stop\(\)/);
  assert.match(visit, /NOTIFICATION_APPLICATION_FOCUS_OUT/);
  assert.doesNotMatch(read("game/scripts/audio.gd").toString(), /village_loop/);
});
