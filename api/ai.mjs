import { callGeminiProxy } from '../lib/gemini-proxy.mjs';

const requestsPerMinute = new Map();
const nativeOrigins = new Set(['capacitor://localhost', 'http://localhost', 'https://localhost']);

function allowedOrigin(req, res) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const protocol = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const sameOrigin = host && origin === `${protocol}://${host}`;
  const configuredOrigin = process.env.PUBLIC_SITE_ORIGIN && origin === process.env.PUBLIC_SITE_ORIGIN;
  if (!sameOrigin && !configuredOrigin && !nativeOrigins.has(origin)) return false;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return true;
}

function isRateLimited(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : 'unknown';
  const now = Date.now();
  const current = requestsPerMinute.get(ip);
  if (!current || now - current.startedAt >= 60_000) {
    requestsPerMinute.set(ip, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > 30;
}

export default async function handler(req, res) {
  if (!allowedOrigin(req, res)) {
    res.status(403).json({ error: { message: 'Origine non autorisée.' } });
    return;
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(405).json({ error: { message: 'Méthode non autorisée.' } });
    return;
  }
  if (Number(req.headers['content-length'] || 0) > 3_000_000) {
    res.status(413).json({ error: { message: 'La requête IA est trop volumineuse.' } });
    return;
  }
  if (isRateLimited(req)) {
    res.status(429).json({ error: { message: 'Trop de demandes. Réessayez dans une minute.' } });
    return;
  }

  const payload = typeof req.body === 'string' ? safelyParse(req.body) : req.body;
  if (!payload || typeof payload !== 'object') {
    res.status(400).json({ error: { message: 'La requête IA est invalide.' } });
    return;
  }
  const result = await callGeminiProxy(payload);
  res.setHeader('Cache-Control', 'no-store');
  res.status(result.status).json(result.body);
}

function safelyParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
