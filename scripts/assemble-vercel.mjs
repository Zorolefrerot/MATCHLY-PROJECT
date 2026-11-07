import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const output = resolve(root, 'dist');
const shopflowDist = resolve(root, 'shopflow/dist');
const assets = resolve(output, 'site-assets');

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

console.log('Site output ready: /, /motion/, /tutoriels/, /app/. Android and Windows downloads redirect to the verified GitHub test release.');
