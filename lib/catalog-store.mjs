import { createHash, timingSafeEqual } from 'node:crypto';

const TABLE_NAME = 'shopflow_catalogs';
const CATALOG_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WRITE_TOKEN_RE = /^[A-Za-z0-9_-]{40,64}$/;
const MAX_PRODUCTS = 300;
const MAX_PAYLOAD_BYTES = 750_000;

export class CatalogStoreError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'CatalogStoreError';
    this.status = status;
    this.code = code;
  }
}

function databaseConfig() {
  const baseUrl = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const serviceKey = String(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '');
  if (!baseUrl || !serviceKey) {
    throw new CatalogStoreError(503, 'catalog_storage_unconfigured', 'Le catalogue en direct n’est pas encore configuré.');
  }
  return { baseUrl, serviceKey };
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cleanText(value, maxLength, fallback = '') {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : fallback;
}

function cleanMoney(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(Math.round(numeric), 1_000_000_000)) : 0;
}

function publicImage(value) {
  if (typeof value !== 'string' || value.length > 2_000) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function sanitizePublicCatalog(input) {
  if (!isRecord(input) || input.version !== 1 || !isRecord(input.shop) || !Array.isArray(input.products)) {
    throw new CatalogStoreError(400, 'invalid_catalog', 'Le catalogue envoyé est invalide.');
  }
  if (input.products.length > MAX_PRODUCTS) {
    throw new CatalogStoreError(413, 'catalog_too_many_products', 'Un catalogue ne peut pas dépasser 300 articles.');
  }

  const shopName = cleanText(input.shop.name, 100);
  const whatsappNumber = cleanText(input.shop.whatsappNumber, 20).replace(/\D/g, '');
  if (!shopName || whatsappNumber.length < 8) {
    throw new CatalogStoreError(400, 'invalid_catalog_contact', 'Renseignez le nom de la boutique et un numéro WhatsApp valide.');
  }

  const products = input.products.map((candidate, index) => {
    if (!isRecord(candidate)) {
      throw new CatalogStoreError(400, 'invalid_catalog_product', `L’article ${index + 1} est invalide.`);
    }
    const id = cleanText(candidate.id, 100);
    const name = cleanText(candidate.name, 160);
    if (!id || !name) {
      throw new CatalogStoreError(400, 'invalid_catalog_product', `L’article ${index + 1} doit avoir un identifiant et un nom.`);
    }
    const image = publicImage(candidate.image);
    return {
      id,
      name,
      category: cleanText(candidate.category, 80),
      unit: cleanText(candidate.unit, 40),
      ...(image ? { image } : {}),
      priceFC: cleanMoney(candidate.priceFC),
      stock: Math.max(0, Math.min(1_000_000, Math.floor(Number(candidate.stock) || 0))),
    };
  });

  const usdRateFC = Number(input.shop.usdRateFC);
  const logo = publicImage(input.shop.logo);
  const payload = {
    version: 1,
    publishedAt: new Date().toISOString(),
    shop: {
      name: shopName,
      whatsappNumber,
      city: cleanText(input.shop.city, 100),
      ...(logo ? { logo } : {}),
      currency: input.shop.currency === 'USD' ? 'USD' : 'FC',
      usdRateFC: Number.isFinite(usdRateFC) && usdRateFC > 0 ? Math.min(usdRateFC, 1_000_000) : 1,
      deliveryFeeFC: cleanMoney(input.shop.deliveryFeeFC),
    },
    products,
  };

  if (Buffer.byteLength(JSON.stringify(payload), 'utf8') > MAX_PAYLOAD_BYTES) {
    throw new CatalogStoreError(413, 'catalog_payload_too_large', 'Le catalogue est trop volumineux. Réduisez le nombre d’articles ou d’images.');
  }
  return payload;
}

function validateId(id) {
  if (!CATALOG_ID_RE.test(String(id || ''))) {
    throw new CatalogStoreError(400, 'invalid_catalog_id', 'L’identifiant du catalogue est invalide.');
  }
  return id;
}

function tokenHash(token) {
  if (typeof token !== 'string' || !WRITE_TOKEN_RE.test(token)) {
    throw new CatalogStoreError(401, 'catalog_write_token_required', 'Autorisation de mise à jour manquante.');
  }
  return createHash('sha256').update(token).digest('hex');
}

function constantTimeEqualHex(left, right) {
  if (!/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
}

async function supabaseRequest(path, init = {}) {
  const { baseUrl, serviceKey } = databaseConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const headers = {
      apikey: serviceKey,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init.headers,
    };
    // Modern sb_secret keys are opaque API keys, not JWTs. Supabase requires them
    // on apikey only; the gateway supplies the service_role authorization itself.
    if (!serviceKey.startsWith('sb_secret_')) {
      headers.Authorization = `Bearer ${serviceKey}`;
    }
    const response = await fetch(`${baseUrl}/rest/v1/${TABLE_NAME}${path}`, {
      ...init,
      signal: controller.signal,
      headers,
    });
    const bodyText = await response.text();
    let body = null;
    if (bodyText) {
      try {
        body = JSON.parse(bodyText);
      } catch {
        body = null;
      }
    }
    return { response, body };
  } catch {
    throw new CatalogStoreError(503, 'catalog_storage_unavailable', 'Le stockage du catalogue est temporairement inaccessible.');
  } finally {
    clearTimeout(timeout);
  }
}

export async function createPublicCatalog({ id, token, payload }) {
  validateId(id);
  const hash = tokenHash(token);
  const safePayload = sanitizePublicCatalog(payload);
  const { response } = await supabaseRequest('', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      catalog_id: id,
      owner_token_hash: hash,
      payload: safePayload,
    }),
  });

  if (response.status === 409) {
    throw new CatalogStoreError(409, 'catalog_id_conflict', 'Un catalogue existe déjà avec cet identifiant. Réessayez.');
  }
  if (!response.ok) {
    throw new CatalogStoreError(503, 'catalog_storage_unavailable', 'Le catalogue n’a pas pu être publié. Vérifiez la configuration du stockage.');
  }
  return { id };
}

export async function updatePublicCatalog({ id, token, payload }) {
  validateId(id);
  const hash = tokenHash(token);
  const safePayload = sanitizePublicCatalog(payload);
  const query = new URLSearchParams({
    catalog_id: `eq.${id}`,
    owner_token_hash: `eq.${hash}`,
    select: 'catalog_id',
  });
  const { response, body } = await supabaseRequest(`?${query}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ payload: safePayload, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) {
    throw new CatalogStoreError(503, 'catalog_storage_unavailable', 'La mise à jour du catalogue a échoué.');
  }
  if (!Array.isArray(body) || body.length === 0) {
    throw new CatalogStoreError(403, 'catalog_write_not_authorized', 'La clé locale de ce catalogue est invalide.');
  }
  return { id };
}

export async function readPublicCatalog(id) {
  validateId(id);
  const query = new URLSearchParams({
    catalog_id: `eq.${id}`,
    select: 'payload,updated_at',
    limit: '1',
  });
  const { response, body } = await supabaseRequest(`?${query}`);
  if (!response.ok) {
    throw new CatalogStoreError(503, 'catalog_storage_unavailable', 'Le catalogue est temporairement inaccessible.');
  }
  if (!Array.isArray(body) || body.length === 0 || !isRecord(body[0].payload)) {
    throw new CatalogStoreError(404, 'catalog_not_found', 'Ce catalogue n’existe pas ou n’est plus publié.');
  }
  return { payload: body[0].payload, updatedAt: body[0].updated_at };
}

export function verifyCatalogTokenForTests(candidate, expectedHash) {
  try {
    return constantTimeEqualHex(tokenHash(candidate), expectedHash);
  } catch {
    return false;
  }
}
