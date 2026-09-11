import { test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openStore } from "../server/store.js";
import { villageContract } from "./helpers/village-contract.js";
test("real WebSocket admission, two avatars, movement, RP, reconnect and deletion contract", async () => {
  const dir = mkdtempSync(join(tmpdir(), "idrem-village-"));
  const db = await openStore(join(dir, "test.sqlite"));
  try {
    await villageContract(db);
  } finally {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
