import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const output = resolve(root, 'dist');
const shopflowDist = resolve(root, 'shopflow/dist');

await rm(output, { recursive: true, force: true });
await mkdir(resolve(output, 'site-assets'), { recursive: true });
await mkdir(resolve(output, 'app'), { recursive: true });

await Promise.all([
  cp(resolve(root, 'index.html'), resolve(output, 'index.html')),
  cp(resolve(root, 'site.css'), resolve(output, 'site.css')),
  cp(resolve(root, 'shopflow/public/landing-hero-merchant.jpg'), resolve(output, 'site-assets/shopflow-hero.jpg')),
  cp(resolve(root, 'shopflow/public/shopflow-logo.png'), resolve(output, 'site-assets/shopflow-logo.png')),
  cp(resolve(root, 'shopflow/native-assets/shopflow-icon.png'), resolve(output, 'site-assets/shopflow-icon.png')),
  cp(shopflowDist, resolve(output, 'app'), { recursive: true }),
]);

console.log('Vercel output ready: marketing site at / and the installable ShopFlow PWA at /app/.');
