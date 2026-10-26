import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { callGeminiProxy } from './lib/gemini-proxy.mjs';
import { createPublicCatalog, readPublicCatalog, updatePublicCatalog, uploadPublicCatalogImage, CatalogStoreError } from './lib/catalog-store.mjs';

const ROOT_DIR = fileURLToPath(new URL('.', import.meta.url));
const DIST_DIR = resolve(ROOT_DIR, 'dist');
const PORT = Number(process.env.PORT) || 3000;
const MAX_BODY_BYTES = 3_000_000;
const AI_REQUESTS_PER_MINUTE = 30;
const CATALOG_REQUESTS_PER_MINUTE = 120;
const rateBuckets = new Map();
const catalogRateBuckets = new Map();
const catalogImageRateBuckets = new Map();
const nativeOrigins = new Set(['capacitor://localhost', 'http://localhost', 'https://localhost']);
const mimeTypes = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.apk': 'application/vnd.android.package-archive',
};

function setSecurityHeaders(response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('X-Frame-Options', 'SAMEORIGIN');
}

function setApiCors(request, response) {
  const origin = request.headers.origin;
  if (!origin) return true;

  const forwardedProto = String(request.headers['x-forwarded-proto'] || 'https')
    .split(',')[0]
    .trim();
  const host = request.headers['x-forwarded-host'] || request.headers.host;
  const sameOrigin = host && origin === `${forwardedProto}://${host}`;
  const configuredOrigin = process.env.PUBLIC_SITE_ORIGIN && origin === process.env.PUBLIC_SITE_ORIGIN;

  if (!sameOrigin && !configuredOrigin && !nativeOrigins.has(origin)) return false;

  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Vary', 'Origin');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return true;
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(body));
}

function getClientIp(request) {
  const forwardedFor = request.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim().slice(0, 80);
  }
  return request.socket.remoteAddress || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.startedAt >= 60_000) {
    rateBuckets.set(ip, { startedAt: now, count: 1 });
  } else {
    bucket.count += 1;
    if (bucket.count > AI_REQUESTS_PER_MINUTE) return true;
  }

  if (rateBuckets.size > 2_000) {
    for (const [key, value] of rateBuckets) {
      if (now - value.startedAt >= 60_000) rateBuckets.delete(key);
    }
  }
  return false;
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error('body_too_large'), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('invalid_json'), { status: 400 });
  }
}

function isCatalogRateLimited(ip) {
  const now = Date.now();
  const bucket = catalogRateBuckets.get(ip);
  if (!bucket || now - bucket.startedAt >= 60_000) {
    catalogRateBuckets.set(ip, { startedAt: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  if (bucket.count > CATALOG_REQUESTS_PER_MINUTE) return true;
  if (catalogRateBuckets.size > 2_000) {
    for (const [key, value] of catalogRateBuckets) {
      if (now - value.startedAt >= 60_000) catalogRateBuckets.delete(key);
    }
  }
  return false;
}

function isCatalogImageRateLimited(ip) {
  const now = Date.now();
  const bucket = catalogImageRateBuckets.get(ip);
  if (!bucket || now - bucket.startedAt >= 60_000) {
    catalogImageRateBuckets.set(ip, { startedAt: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > 360;
}

function sendCatalogError(response, error) {
  const status = error instanceof CatalogStoreError ? error.status : Number(error?.status) || 400;
  const code = error instanceof CatalogStoreError ? error.code : 'catalog_request_failed';
  const message = error instanceof CatalogStoreError
    ? error.message
    : status === 413
      ? 'La requête du catalogue est trop volumineuse.'
      : 'La requête du catalogue est invalide.';
  sendJson(response, status, { error: { code, message } });
}

async function handleApi(request, response, pathname) {
  setSecurityHeaders(response);
  if (!setApiCors(request, response)) {
    sendJson(response, 403, { error: { message: 'Origine non autorisée.' } });
    return;
  }
  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  if (pathname === '/api/health' && request.method === 'GET') {
    sendJson(response, 200, {
      ok: true,
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
      catalogConfigured: Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)),
    });
    return;
  }

  const clientIp = getClientIp(request);
  if (pathname === '/api/catalogs' && request.method === 'POST') {
    if (isCatalogRateLimited(clientIp)) {
      sendJson(response, 429, { error: { code: 'rate_limited', message: 'Trop de demandes. Réessayez dans une minute.' } });
      return;
    }
    try {
      const payload = await readJsonBody(request);
      const token = String(request.headers.authorization || '').replace(/^Bearer\s+/i, '');
      const result = await createPublicCatalog({ id: payload?.id, token, payload: payload?.snapshot });
      sendJson(response, 201, result);
    } catch (error) {
      sendCatalogError(response, error);
    }
    return;
  }

  const catalogImageMatch = pathname.match(/^\/api\/catalogs\/([0-9a-f-]+)\/images\/([A-Za-z0-9._-]+)$/i);
  if (catalogImageMatch) {
    if (request.method !== 'PUT') {
      response.setHeader('Allow', 'PUT, OPTIONS');
      sendJson(response, 405, { error: { code: 'method_not_allowed', message: 'Méthode non autorisée.' } });
      return;
    }
    if (isCatalogImageRateLimited(clientIp)) {
      sendJson(response, 429, { error: { code: 'rate_limited', message: 'Trop de demandes. Réessayez dans une minute.' } });
      return;
    }
    try {
      const payload = await readJsonBody(request);
      const token = String(request.headers.authorization || '').replace(/^Bearer\s+/i, '');
      const result = await uploadPublicCatalogImage({
        id: catalogImageMatch[1],
        productId: catalogImageMatch[2],
        token,
        imageData: payload?.imageData,
      });
      sendJson(response, 200, result);
    } catch (error) {
      sendCatalogError(response, error);
    }
    return;
  }

  const catalogMatch = pathname.match(/^\/api\/catalogs\/([0-9a-f-]+)$/i);
  if (catalogMatch) {
    const catalogId = catalogMatch[1];
    if (isCatalogRateLimited(clientIp)) {
      sendJson(response, 429, { error: { code: 'rate_limited', message: 'Trop de demandes. Réessayez dans une minute.' } });
      return;
    }
    if (request.method === 'GET') {
      try {
        const result = await readPublicCatalog(catalogId);
        sendJson(response, 200, result);
      } catch (error) {
        sendCatalogError(response, error);
      }
      return;
    }
    if (request.method === 'PUT') {
      try {
        const payload = await readJsonBody(request);
        const token = String(request.headers.authorization || '').replace(/^Bearer\s+/i, '');
        const result = await updatePublicCatalog({ id: catalogId, token, payload: payload?.snapshot });
        sendJson(response, 200, result);
      } catch (error) {
        sendCatalogError(response, error);
      }
      return;
    }
    response.setHeader('Allow', 'GET, PUT, OPTIONS');
    sendJson(response, 405, { error: { code: 'method_not_allowed', message: 'Méthode non autorisée.' } });
    return;
  }

  if (pathname !== '/api/ai') {
    sendJson(response, 404, { error: { message: 'Route introuvable.' } });
    return;
  }
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST, OPTIONS');
    sendJson(response, 405, { error: { message: 'Méthode non autorisée.' } });
    return;
  }
  if (isRateLimited(clientIp)) {
    sendJson(response, 429, { error: { message: 'Trop de demandes. Réessayez dans une minute.' } });
    return;
  }

  try {
    const payload = await readJsonBody(request);
    const result = await callGeminiProxy(payload);
    sendJson(response, result.status, result.body);
  } catch (error) {
    const status = Number(error?.status) || 400;
    sendJson(response, status, {
      error: {
        message: status === 413 ? 'La requête IA est trop volumineuse.' : 'La requête IA est invalide.',
      },
    });
  }
}

async function serveStatic(request, response, pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    response.writeHead(400);
    response.end('Bad Request');
    return;
  }

  if (decodedPath === '/app') {
    response.writeHead(308, { Location: '/app/' });
    response.end();
    return;
  }

  let relativePath = decodedPath.replace(/^\/+/, '');
  if (!relativePath || decodedPath.endsWith('/')) relativePath = `${relativePath}index.html`;
  const filePath = resolve(DIST_DIR, relativePath);
  if (!filePath.startsWith(`${DIST_DIR}${sep}`) && filePath !== DIST_DIR) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const fileInfo = await stat(filePath);
    if (!fileInfo.isFile()) {
      response.writeHead(404);
      response.end('Not Found');
      return;
    }
    const extension = extname(filePath).toLowerCase();
    const headers = {
      'Content-Type': mimeTypes[extension] || 'application/octet-stream',
      'Content-Length': fileInfo.size,
      'X-Content-Type-Options': 'nosniff',
    };
    if (decodedPath === '/app/sw.js') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    } else if (decodedPath.includes('/assets/')) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    } else if (extension === '.html' || extension === '.webmanifest') {
      headers['Cache-Control'] = 'no-cache';
    }
    if (extension === '.apk') {
      headers['Content-Disposition'] = 'attachment; filename="ShopFlow-Android.apk"';
    }
    response.writeHead(200, headers);
    if (request.method === 'HEAD') response.end();
    else createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not Found');
  }
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url || '/', 'http://localhost');
  const pathname = requestUrl.pathname;
  if (pathname.startsWith('/api/')) {
    await handleApi(request, response, pathname);
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method Not Allowed');
    return;
  }
  await serveStatic(request, response, pathname);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`ShopFlow web service listening on port ${PORT}`);
});
