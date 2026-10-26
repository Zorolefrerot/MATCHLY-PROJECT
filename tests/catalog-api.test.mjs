import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';

const catalogId = '4f0b7635-a286-4c17-87f1-eaaf6d7968bd';
const ownerToken = 'A'.repeat(43);
const serviceSecret = 'sb_secret_server-only-integration-secret';
const payload = {
  version: 1,
  publishedAt: '2026-10-26T10:00:00.000Z',
  shop: { name: 'Boutique', whatsappNumber: '243812345678', city: 'Kinshasa', currency: 'FC', usdRateFC: 2800, deliveryFeeFC: 500 },
  products: [{ id: 'product-1', name: 'Sac', category: 'Mode', unit: 'pièce', priceFC: 15000, stock: 4, purchasePriceFC: 8000 }],
};

async function freePort() {
  const probe = createServer();
  await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
  const { port } = probe.address();
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function waitUntilReady(url, child) {
  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline && child.exitCode === null) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The child has not bound its port yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  throw new Error(`API server did not start: ${child.exitCode}`);
}

test('catalog HTTP routes create, update and read a stable public URL without exposing service credentials', async (t) => {
  const rows = new Map();
  const database = createServer(async (req, res) => {
    assert.equal(req.headers.apikey, serviceSecret);
    assert.equal(req.headers.authorization, undefined);
    const url = new URL(req.url, 'http://supabase.test');
    const id = url.searchParams.get('catalog_id')?.replace(/^eq\./, '');
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bodyText = Buffer.concat(chunks).toString('utf8');
    if (req.method === 'POST') {
      const row = JSON.parse(bodyText);
      rows.set(row.catalog_id, row);
      res.writeHead(201).end();
      return;
    }
    if (req.method === 'PATCH') {
      const row = rows.get(id);
      const ownerHash = url.searchParams.get('owner_token_hash')?.replace(/^eq\./, '');
      if (!row || row.owner_token_hash !== ownerHash) {
        res.writeHead(200, { 'Content-Type': 'application/json' }).end('[]');
        return;
      }
      Object.assign(row, JSON.parse(bodyText));
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify([{ catalog_id: id }]));
      return;
    }
    const row = rows.get(id);
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(row ? [{ payload: row.payload, updated_at: row.updated_at }] : []));
  });
  await new Promise((resolve) => database.listen(0, '127.0.0.1', resolve));
  const databasePort = database.address().port;
  const appPort = await freePort();
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(appPort),
      SUPABASE_URL: `http://127.0.0.1:${databasePort}`,
      SUPABASE_SECRET_KEY: serviceSecret,
    },
    stdio: 'ignore',
  });
  t.after(async () => {
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('exit', resolve));
    await new Promise((resolve, reject) => database.close((error) => error ? reject(error) : resolve()));
  });

  const api = `http://127.0.0.1:${appPort}`;
  await waitUntilReady(`${api}/api/health`, child);
  const health = await (await fetch(`${api}/api/health`)).json();
  assert.equal(health.catalogConfigured, true);
  assert.equal(JSON.stringify(health).includes(serviceSecret), false);

  const create = await fetch(`${api}/api/catalogs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({ id: catalogId, snapshot: payload }),
  });
  assert.equal(create.status, 201);

  const updated = { ...payload, publishedAt: '2026-10-26T11:00:00.000Z', products: [{ ...payload.products[0], stock: 2, priceFC: 17000 }] };
  const update = await fetch(`${api}/api/catalogs/${catalogId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({ snapshot: updated }),
  });
  assert.equal(update.status, 200);

  const read = await fetch(`${api}/api/catalogs/${catalogId}`);
  assert.equal(read.status, 200);
  const current = await read.json();
  assert.equal(current.payload.products[0].stock, 2);
  assert.equal(current.payload.products[0].priceFC, 17000);
  assert.equal('purchasePriceFC' in current.payload.products[0], false);
  assert.equal(JSON.stringify(current).includes(serviceSecret), false);
});
