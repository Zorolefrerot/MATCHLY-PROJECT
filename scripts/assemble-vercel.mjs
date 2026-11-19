import { createWriteStream } from 'node:fs';
import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const output = resolve(root, 'dist');
const shopflowDist = resolve(root, 'shopflow/dist');
const assets = resolve(output, 'site-assets');
const downloads = resolve(output, 'downloads');
const releaseBase = 'https://github.com/Zorolefrerot/MATCHLY-PROJECT/releases/download/shopflow-test-v1.0.3';
const releaseAssets = [
  { filename: 'ShopFlow-Android.apk', minimumBytes: 10 * 1024 * 1024 },
  { filename: 'ShopFlow-Windows.exe', minimumBytes: 50 * 1024 * 1024 },
];

await rm(output, { recursive: true, force: true });
await mkdir(assets, { recursive: true });
await mkdir(resolve(output, 'app'), { recursive: true });

await Promise.all([
  cp(resolve(root, 'index.html'), resolve(output, 'index.html')),
  cp(resolve(root, 'site.css'), resolve(output, 'site.css')),
  cp(resolve(root, 'motion'), resolve(output, 'motion'), { recursive: true }),
  cp(resolve(root, 'tutoriels'), resolve(output, 'tutoriels'), { recursive: true }),
  cp(resolve(root, 'shopflow/public/landing-hero-merchant.jpg'), resolve(assets, 'shopflow-hero.jpg')),
  cp(resolve(root, 'shopflow/public/shopflow-logo.png'), resolve(assets, 'shopflow-logo.png')),
  cp(resolve(root, 'shopflow/native-assets/shopflow-icon.png'), resolve(assets, 'shopflow-icon.png')),
  cp(resolve(root, 'shopflow/public/products/boissons-pack.jpg'), resolve(assets, 'step-checkout.jpg')),
  cp(resolve(root, 'shopflow/public/products/savon-menage.jpg'), resolve(assets, 'step-stock.jpg')),
  cp(resolve(root, 'shopflow/public/landing-hero-merchant.jpg'), resolve(assets, 'step-report.jpg')),
  cp(shopflowDist, resolve(output, 'app'), { recursive: true }),
]);

if (process.env.SHOPFLOW_SKIP_DOWNLOADS === '1') {
  console.log('Skipping installer files in this static-host build; downloads are served by the Render site.');
} else {
  await mkdir(downloads, { recursive: true });
  const results = await Promise.allSettled(releaseAssets.map(async (asset) => {
    const filePath = resolve(downloads, asset.filename);
    try {
      const url = `${releaseBase}/${asset.filename}`;
      const response = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(10 * 60 * 1000),
      });
      if (!response.ok || !response.body) throw new Error(`${asset.filename}: HTTP ${response.status}`);
      await pipeline(Readable.fromWeb(response.body), createWriteStream(filePath));
      const file = await stat(filePath);
      if (file.size < asset.minimumBytes) throw new Error(`${asset.filename}: unexpected size ${file.size}`);
      console.log(`${asset.filename} staged for direct same-site download (${file.size} bytes).`);
    } catch (error) {
      await rm(filePath, { force: true });
      throw error;
    }
  }));
  const failures = results.filter((result) => result.status === 'rejected');
  if (failures.length) {
    const message = failures.map((result) => result.reason?.message || String(result.reason)).join('; ');
    if (process.env.SHOPFLOW_REQUIRE_DOWNLOADS === '1') throw new Error(`Installer downloads are required for this host: ${message}`);
    console.warn(`Installer files could not be staged in this local build: ${message}`);
  }
}

console.log('Site output ready: /, /motion/, /tutoriels/, /app/, /downloads/ShopFlow-Android.apk, /downloads/ShopFlow-Windows.exe.');
