import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CatalogStoreError,
  createPublicCatalog,
  readPublicCatalog,
  sanitizePublicCatalog,
  updatePublicCatalog,
} from '../lib/catalog-store.mjs';

const uuid = '4f0b7635-a286-4c17-87f1-eaaf6d7968bd';
const token = 'A'.repeat(43);
const sample = {
  version: 1,
  publishedAt: '2026-10-26T10:00:00.000Z',
  shop: { name: 'Boutique', whatsappNumber: '+243 812 345 678', city: 'Kinshasa', currency: 'FC', usdRateFC: 2800, deliveryFeeFC: 1000 },
  products: [{ id: 'p-1', name: 'Sac', category: 'Mode', unit: 'pièce', priceFC: 12000, stock: 5, purchasePriceFC: 7000, minStockAlert: 2 }],
};

function setDatabaseEnv(t) {
  const previous = {
    url: process.env.SUPABASE_URL,
    secret: process.env.SUPABASE_SECRET_KEY,
    legacyKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    fetch: globalThis.fetch,
  };
  process.env.SUPABASE_URL = 'https://project.supabase.co';
  process.env.SUPABASE_SECRET_KEY = 'server-only-test-key';
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  t.after(() => {
    if (previous.url === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previous.url;
    if (previous.secret === undefined) delete process.env.SUPABASE_SECRET_KEY;
    else process.env.SUPABASE_SECRET_KEY = previous.secret;
    if (previous.legacyKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previous.legacyKey;
    globalThis.fetch = previous.fetch;
  });
}

test('public catalog sanitation excludes internal purchase and stock-alert fields', () => {
  const safe = sanitizePublicCatalog(sample);
  assert.equal(safe.products[0].priceFC, 12000);
  assert.equal(safe.products[0].stock, 5);
  assert.equal('purchasePriceFC' in safe.products[0], false);
  assert.equal('minStockAlert' in safe.products[0], false);
});

test('catalog operations fail closed when Supabase server secrets are absent', async (t) => {
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousSecret = process.env.SUPABASE_SECRET_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SECRET_KEY;
  t.after(() => {
    if (previousUrl !== undefined) process.env.SUPABASE_URL = previousUrl;
    if (previousKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
    if (previousSecret !== undefined) process.env.SUPABASE_SECRET_KEY = previousSecret;
  });
  await assert.rejects(readPublicCatalog(uuid), (error) => error instanceof CatalogStoreError && error.status === 503);
});

test('create hashes the owner token; update and public read use the server-only key', async (t) => {
  setDatabaseEnv(t);
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (init.method === 'POST') return new Response('', { status: 201 });
    if (init.method === 'PATCH') return new Response(JSON.stringify([{ catalog_id: uuid }]), { status: 200 });
    return new Response(JSON.stringify([{ payload: sample, updated_at: sample.publishedAt }]), { status: 200 });
  };

  await createPublicCatalog({ id: uuid, token, payload: sample });
  await updatePublicCatalog({ id: uuid, token, payload: sample });
  const result = await readPublicCatalog(uuid);

  assert.equal(calls.length, 3);
  for (const call of calls) {
    assert.equal(call.init.headers.apikey, 'server-only-test-key');
    assert.equal(call.init.headers.Authorization, 'Bearer server-only-test-key');
  }
  const created = JSON.parse(calls[0].init.body);
  assert.notEqual(created.owner_token_hash, token);
  assert.equal(created.owner_token_hash.length, 64);
  assert.equal(JSON.stringify(created).includes(token), false);
  assert.equal(result.payload.shop.name, 'Boutique');
  assert.equal(result.updatedAt, sample.publishedAt);
});

test('updates reject a wrong owner token without returning database credentials', async (t) => {
  setDatabaseEnv(t);
  globalThis.fetch = async () => new Response('[]', { status: 200 });
  await assert.rejects(
    updatePublicCatalog({ id: uuid, token: 'B'.repeat(43), payload: sample }),
    (error) => error instanceof CatalogStoreError && error.status === 403
  );
});
