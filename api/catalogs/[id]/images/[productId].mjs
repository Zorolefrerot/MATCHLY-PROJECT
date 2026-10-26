import { CatalogStoreError, uploadPublicCatalogImage } from '../../../../lib/catalog-store.mjs';

const requestsPerMinute = new Map();
const nativeOrigins = new Set(['capacitor://localhost', 'http://localhost', 'https://localhost']);

function allowOrigin(req, res) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const protocol = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const sameOrigin = host && origin === `${protocol}://${host}`;
  if (!sameOrigin && origin !== process.env.PUBLIC_SITE_ORIGIN && !nativeOrigins.has(origin)) return false;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return true;
}

function isRateLimited(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : 'unknown';
  const now = Date.now();
  const bucket = requestsPerMinute.get(ip);
  if (!bucket || now - bucket.startedAt >= 60_000) {
    requestsPerMinute.set(ip, { startedAt: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > 360;
}

function parseBody(body) {
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return null; }
  }
  return body && typeof body === 'object' && !Array.isArray(body) ? body : null;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!allowOrigin(req, res)) {
    return res.status(403).json({ error: { code: 'origin_not_allowed', message: 'Origine non autorisée.' } });
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'PUT, OPTIONS');
    return res.status(405).json({ error: { code: 'method_not_allowed', message: 'Méthode non autorisée.' } });
  }
  if (Number(req.headers['content-length'] || 0) > 3_000_000) {
    return res.status(413).json({ error: { code: 'body_too_large', message: 'La photo est trop volumineuse.' } });
  }
  if (isRateLimited(req)) {
    return res.status(429).json({ error: { code: 'rate_limited', message: 'Trop de demandes. Réessayez dans une minute.' } });
  }
  const body = parseBody(req.body);
  if (!body) return res.status(400).json({ error: { code: 'invalid_json', message: 'La requête de photo est invalide.' } });
  const id = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
  const productId = Array.isArray(req.query?.productId) ? req.query.productId[0] : req.query?.productId;
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  try {
    const result = await uploadPublicCatalogImage({ id, productId, token, imageData: body.imageData });
    return res.status(200).json(result);
  } catch (error) {
    const status = error instanceof CatalogStoreError ? error.status : 400;
    const code = error instanceof CatalogStoreError ? error.code : 'catalog_image_upload_failed';
    const message = error instanceof CatalogStoreError ? error.message : 'Le téléversement de la photo a échoué.';
    return res.status(status).json({ error: { code, message } });
  }
}
