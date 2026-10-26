import { createHash, timingSafeEqual } from 'node:crypto';

const TABLE_NAME = 'shopflow_catalogs';
const IMAGE_BUCKET = 'shopflow-catalog-images';
const MAX_IMAGE_BYTES = 1_500_000;
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

function supabaseApiHeaders(serviceKey, extra = {}) {
  const headers = {
    apikey: serviceKey,
    Accept: 'application/json',
    ...extra,
  };
  // Modern sb_secret keys are opaque API keys, not JWTs. Supabase requires them
  // on apikey only; the gateway supplies the service_role authorization itself.
  if (!serviceKey.startsWith('sb_secret_')) {
    headers.Authorization = `Bearer ${serviceKey}`;
  }
  return headers;
}

async function supabaseRequest(path, init = {}) {
  const { baseUrl, serviceKey } = databaseConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const headers = supabaseApiHeaders(serviceKey, {
      'Content-Type': 'application/json',
      ...init.headers,
    });
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
  } catch (error) {
    console.error('[catalog-store] Supabase REST request failed', {
      name: error?.name || 'Error',
      code: error?.cause?.code || undefined,
    });
    throw new CatalogStoreError(503, 'catalog_storage_unavailable', 'Le stockage du catalogue est temporairement inaccessible.');
  } finally {
    clearTimeout(timeout);
  }
}

function logSupabaseResponseFailure(operation, response, body) {
  const diagnostic = {
    status: response?.status,
    code: typeof body?.code === 'string' ? body.code.slice(0, 80) : undefined,
    message: typeof body?.message === 'string' ? body.message.slice(0, 240) : undefined,
  };
  console.error(`[catalog-store] Supabase ${operation} failed`, diagnostic);
}

export async function checkPublicCatalogStorage() {
  try {
    const { baseUrl, serviceKey } = databaseConfig();
    const tableCheckPromise = supabaseRequest('?select=catalog_id&limit=0');
    const bucketCheckPromise = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8_000);
      try {
        const response = await fetch(`${baseUrl}/storage/v1/bucket/${IMAGE_BUCKET}`, {
          signal: controller.signal,
          headers: supabaseApiHeaders(serviceKey),
        });
        const body = response.ok ? null : await response.json().catch(() => null);
        return { response, body };
      } finally {
        clearTimeout(timeout);
      }
    })();
    const [tableResult, bucketResult] = await Promise.allSettled([tableCheckPromise, bucketCheckPromise]);
    const tableCheck = tableResult.status === 'fulfilled' ? tableResult.value : null;
    const bucketCheck = bucketResult.status === 'fulfilled' ? bucketResult.value : null;
    if (tableCheck && !tableCheck.response.ok) logSupabaseResponseFailure('catalog health table check', tableCheck.response, tableCheck.body);
    if (bucketCheck && !bucketCheck.response.ok) logSupabaseResponseFailure('catalog image bucket check', bucketCheck.response, bucketCheck.body);
    if (tableResult.status === 'rejected') console.error('[catalog-store] Catalog table health check could not reach Supabase.');
    if (bucketResult.status === 'rejected') console.error('[catalog-store] Catalog image bucket health check could not reach Supabase.');
    return {
      databaseReady: Boolean(tableCheck?.response.ok),
      imageBucketReady: Boolean(bucketCheck?.response.ok),
    };
  } catch {
    return { databaseReady: false, imageBucketReady: false };
  }
}

export async function createPublicCatalog({ id, token, payload }) {
  validateId(id);
  const hash = tokenHash(token);
  const safePayload = sanitizePublicCatalog(payload);
  const { response, body } = await supabaseRequest('', {
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
    logSupabaseResponseFailure('insert catalog', response, body);
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
    logSupabaseResponseFailure('update catalog', response, body);
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
    logSupabaseResponseFailure('read catalog', response, body);
    throw new CatalogStoreError(503, 'catalog_storage_unavailable', 'Le catalogue est temporairement inaccessible.');
  }
  if (!Array.isArray(body) || body.length === 0 || !isRecord(body[0].payload)) {
    throw new CatalogStoreError(404, 'catalog_not_found', 'Ce catalogue n’existe pas ou n’est plus publié.');
  }
  return { payload: body[0].payload, updatedAt: body[0].updated_at };
}

export async function uploadPublicCatalogImage({ id, token, productId, imageData }) {
  validateId(id);
  const hash = tokenHash(token);
  if (typeof productId !== 'string' || !/^[A-Za-z0-9._-]{1,100}$/.test(productId)) {
    throw new CatalogStoreError(400, 'invalid_catalog_product_id', 'L’identifiant de l’article est invalide.');
  }
  if (typeof imageData !== 'string' || imageData.length > 2_100_000) {
    throw new CatalogStoreError(413, 'catalog_image_too_large', 'La photo est trop volumineuse. Réduisez-la puis réessayez.');
  }
  const match = imageData.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/i);
  if (!match) {
    throw new CatalogStoreError(400, 'invalid_catalog_image', 'Format de photo non pris en charge. Utilisez une image JPEG, PNG ou WebP.');
  }
  const imageBuffer = Buffer.from(match[2], 'base64');
  if (!imageBuffer.length || imageBuffer.length > MAX_IMAGE_BYTES) {
    throw new CatalogStoreError(413, 'catalog_image_too_large', 'La photo dépasse la limite de 1,5 Mo après compression.');
  }

  const ownerQuery = new URLSearchParams({
    catalog_id: `eq.${id}`,
    owner_token_hash: `eq.${hash}`,
    select: 'catalog_id',
    limit: '1',
  });
  const ownerCheck = await supabaseRequest(`?${ownerQuery}`);
  if (!ownerCheck.response.ok) {
    logSupabaseResponseFailure('verify catalog owner', ownerCheck.response, ownerCheck.body);
    throw new CatalogStoreError(503, 'catalog_storage_unavailable', 'Impossible de vérifier le propriétaire du catalogue.');
  }
  if (!Array.isArray(ownerCheck.body) || ownerCheck.body.length === 0) {
    throw new CatalogStoreError(403, 'catalog_write_not_authorized', 'La clé locale de ce catalogue est invalide.');
  }

  const { baseUrl, serviceKey } = databaseConfig();
  const mimeType = match[1].toLowerCase();
  const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/png' ? 'png' : 'webp';
  const contentHash = createHash('sha256').update(imageBuffer).digest('hex').slice(0, 16);
  const objectPath = `${id}/${productId}-${contentHash}.${extension}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${baseUrl}/storage/v1/object/${IMAGE_BUCKET}/${objectPath}`, {
      method: 'POST',
      signal: controller.signal,
      headers: supabaseApiHeaders(serviceKey, {
        'Content-Type': mimeType,
        'x-upsert': 'true',
      }),
      body: imageBuffer,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      logSupabaseResponseFailure('upload catalog image', response, body);
      throw new CatalogStoreError(503, 'catalog_image_storage_unconfigured', 'Le stockage des photos n’est pas prêt. Vérifiez le bucket shopflow-catalog-images dans Supabase.');
    }
  } catch (error) {
    if (error instanceof CatalogStoreError) throw error;
    throw new CatalogStoreError(503, 'catalog_image_storage_unavailable', 'Le téléversement de la photo a échoué. Vérifiez la connexion et réessayez.');
  } finally {
    clearTimeout(timeout);
  }
  return { url: `${baseUrl}/storage/v1/object/public/${IMAGE_BUCKET}/${objectPath}` };
}

export function verifyCatalogTokenForTests(candidate, expectedHash) {
  try {
    return constantTimeEqualHex(tokenHash(candidate), expectedHash);
  } catch {
    return false;
  }
}
