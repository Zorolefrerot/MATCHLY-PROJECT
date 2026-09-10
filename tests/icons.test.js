import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("artwork favicons and mobile icons are real square PNG files at the declared sizes", () => {
  for (const [file, size] of [
    ["favicon-32x32.png", 32],
    ["favicon-48x48.png", 48],
    ["apple-touch-icon.png", 180],
    ["icon-192.png", 192],
    ["icon-512.png", 512],
  ]) {
    const png = readFileSync(new URL(`../public/${file}`, import.meta.url));
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
  const ico = readFileSync(new URL("../public/favicon.ico", import.meta.url));
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 4);
});

test("page and mobile manifest reference the new artwork instead of the old monogram favicon", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.ok(!html.includes("/favicon.svg"));
  for (const resource of [
    "favicon.ico",
    "favicon-32x32.png",
    "favicon-48x48.png",
    "apple-touch-icon.png",
    "site.webmanifest",
  ])
    assert.ok(html.includes(`/${resource}?v=idrem-art-1`));
  const manifest = JSON.parse(
    readFileSync(
      new URL("../public/site.webmanifest", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(manifest.name, "IDREM ZENKAI");
  assert.equal(manifest.display, "browser");
  assert.deepEqual(
    manifest.icons.map((icon) => icon.sizes),
    ["192x192", "512x512"],
  );
  // Every referenced resource is supplied locally, without a third-party host.
  for (const icon of manifest.icons) {
    assert.ok(icon.src.startsWith("/"));
    readFileSync(
      new URL(`../public${icon.src.split("?")[0]}`, import.meta.url),
    );
  }
});
