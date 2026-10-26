import { createWriteStream } from 'node:fs';
import { cp, mkdir, rm } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const output = resolve(root, 'dist');
const shopflowDist = resolve(root, 'shopflow/dist');
const assets = resolve(output, 'site-assets');
const downloads = resolve(output, 'downloads');

await rm(output, { recursive: true, force: true });
await mkdir(assets, { recursive: true });
await mkdir(downloads, { recursive: true });
await mkdir(resolve(output, 'app'), { recursive: true });

await Promise.all([
  cp(resolve(root, 'index.html'), resolve(output, 'index.html')),
  cp(resolve(root, 'site.css'), resolve(output, 'site.css')),
  cp(resolve(root, 'motion'), resolve(output, 'motion'), { recursive: true }),
  cp(resolve(root, 'tutoriels'), resolve(output, 'tutoriels'), { recursive: true }),
  cp(resolve(root, 'shopflow/public/landing-hero-merchant.jpg'), resolve(assets, 'shopflow-hero.jpg')),
  cp(resolve(root, 'shopflow/public/shopflow-logo.png'), resolve(assets, 'shopflow-logo.png')),
  cp(resolve(root, 'shopflow/native-assets/shopflow-icon.png'), resolve(assets, 'shopflow-icon.png')),
  cp(resolve(root, 'shopflow/public/landing-hero-merchant.jpg'), resolve(assets, 'step-checkout.jpg')),
  cp(resolve(root, 'shopflow/public/landing-hero-merchant.jpg'), resolve(assets, 'step-stock.jpg')),
  cp(resolve(root, 'shopflow/public/landing-hero-merchant.jpg'), resolve(assets, 'step-report.jpg')),
  cp(shopflowDist, resolve(output, 'app'), { recursive: true }),
]);

const apkUrl = 'https://github.com/Zorolefrerot/MATCHLY-PROJECT/releases/download/shopflow-android-test-v0.1.0/ShopFlow-Android.apk';
try {
  const response = await fetch(apkUrl, { redirect: 'follow' });
  if (!response.ok || !response.body) throw new Error(`APK download failed: HTTP ${response.status}`);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(resolve(downloads, 'ShopFlow-Android.apk')));
  console.log('Android APK bundled for a same-site, direct download.');
} catch (error) {
  if (process.env.SHOPFLOW_REQUIRE_ANDROID_APK === '1') throw error;
  console.warn(`Android APK not bundled in this local build: ${error.message}`);
}

console.log('Render/Vercel output ready: showcase at /, motion film at /motion/, tutorials at /tutoriels/, full PWA at /app/, APK download at /downloads/ShopFlow-Android.apk.');
