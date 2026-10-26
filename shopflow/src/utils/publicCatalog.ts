import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';
import { CurrencyCode, Product, ShopSettings } from '../types';

export const PUBLIC_CATALOG_QUERY = 'catalog';
export const PUBLIC_CATALOG_MAX_TOKEN_LENGTH = 12_000;
const MAX_CATALOG_PRODUCTS = 300;
const MAX_DECOMPRESSED_LENGTH = 300_000;

export interface PublicCatalogProduct {
  id: string;
  name: string;
  category: string;
  unit: string;
  image?: string;
  priceFC: number;
  stock: number;
}

export interface PublicCatalogSnapshot {
  version: 1;
  publishedAt: string;
  shop: {
    name: string;
    whatsappNumber: string;
    city: string;
    logo?: string;
    currency: CurrencyCode;
    usdRateFC: number;
    deliveryFeeFC: number;
  };
  products: PublicCatalogProduct[];
}

function safeImage(value: string | undefined, publicBase: string): string | undefined {
  if (!value || value.length > 2_000 || /^(data:|blob:|javascript:)/i.test(value)) {
    return undefined;
  }
  try {
    const resolved = new URL(value, publicBase);
    if (resolved.protocol !== 'https:' && resolved.protocol !== 'http:') return undefined;
    return resolved.href;
  } catch {
    return undefined;
  }
}

export function makePublicCatalogSnapshot(
  settings: ShopSettings,
  products: Product[],
  publicBase: string
): PublicCatalogSnapshot {
  if (products.length > MAX_CATALOG_PRODUCTS) {
    throw new Error('catalog_limit');
  }

  return {
    version: 1,
    publishedAt: new Date().toISOString(),
    shop: {
      name: settings.shopName.trim().slice(0, 100) || 'ShopFlow',
      whatsappNumber: settings.whatsappNumber.replace(/[^\d]/g, '').slice(0, 20),
      city: settings.city.trim().slice(0, 100),
      logo: safeImage(settings.shopLogo, publicBase),
      currency: settings.currency === 'USD' ? 'USD' : 'FC',
      usdRateFC:
        Number.isFinite(settings.usdRateFC) && settings.usdRateFC > 0
          ? Math.min(settings.usdRateFC, 1_000_000)
          : 1,
      deliveryFeeFC: clampMoney(settings.defaultDeliveryFeeFC),
    },
    products: products.map((product) => ({
      id: String(product.id).slice(0, 100),
      name: String(product.name).trim().slice(0, 160) || 'Article',
      category: String(product.category || '').slice(0, 80),
      unit: String(product.unit || '').slice(0, 40),
      image: safeProductImage(product.image, publicBase),
      priceFC: clampMoney(product.sellingPriceFC),
      stock: Math.max(0, Math.min(1_000_000, Math.floor(Number(product.stock) || 0))),
    })),
  };
}

function safeProductImage(value: string | undefined, publicBase: string): string | undefined {
  if (typeof value === 'string' && /^data:image\/[^;,]+;base64,/i.test(value)) return value;
  return safeImage(value, publicBase);
}

export function encodePublicCatalog(snapshot: PublicCatalogSnapshot): string {
  if (snapshot.products.length > MAX_CATALOG_PRODUCTS) {
    throw new Error('catalog_limit');
  }
  const token = compressToEncodedURIComponent(JSON.stringify(snapshot));
  if (!token || token.length > PUBLIC_CATALOG_MAX_TOKEN_LENGTH) {
    throw new Error(
      'catalog_url_too_long'
    );
  }
  return token;
}

export function decodePublicCatalog(token: string): PublicCatalogSnapshot | null {
  if (!token || token.length > PUBLIC_CATALOG_MAX_TOKEN_LENGTH) return null;
  try {
    const json = decompressFromEncodedURIComponent(token);
    if (!json || json.length > MAX_DECOMPRESSED_LENGTH) return null;
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return null;
    const snapshot = parsed as Partial<PublicCatalogSnapshot>;
    if (
      snapshot.version !== 1 ||
      !snapshot.shop ||
      typeof snapshot.shop.name !== 'string' ||
      typeof snapshot.shop.whatsappNumber !== 'string' ||
      !Array.isArray(snapshot.products) ||
      snapshot.products.length > MAX_CATALOG_PRODUCTS
    ) {
      return null;
    }

    const products: PublicCatalogProduct[] = [];
    for (const candidate of snapshot.products) {
      if (!candidate || typeof candidate !== 'object') continue;
      const item = candidate as Partial<PublicCatalogProduct>;
      if (
        typeof item.id !== 'string' ||
        typeof item.name !== 'string' ||
        !Number.isFinite(item.priceFC) ||
        !Number.isFinite(item.stock)
      ) {
        continue;
      }
      products.push({
        id: item.id.slice(0, 100),
        name: item.name.slice(0, 160),
        category: typeof item.category === 'string' ? item.category.slice(0, 80) : '',
        unit: typeof item.unit === 'string' ? item.unit.slice(0, 40) : '',
        image: safeHttpUrl(item.image),
        priceFC: clampMoney(item.priceFC),
        stock: Math.max(0, Math.min(1_000_000, Math.floor(Number(item.stock)))),
      });
    }

    return {
      version: 1,
      publishedAt:
        typeof snapshot.publishedAt === 'string' ? snapshot.publishedAt.slice(0, 40) : '',
      shop: {
        name: snapshot.shop.name.slice(0, 100),
        whatsappNumber: snapshot.shop.whatsappNumber.replace(/[^\d]/g, '').slice(0, 20),
        city: typeof snapshot.shop.city === 'string' ? snapshot.shop.city.slice(0, 100) : '',
        logo: safeHttpUrl(snapshot.shop.logo),
        currency: snapshot.shop.currency === 'USD' ? 'USD' : 'FC',
        usdRateFC:
          Number.isFinite(snapshot.shop.usdRateFC) && Number(snapshot.shop.usdRateFC) > 0
            ? Math.min(Number(snapshot.shop.usdRateFC), 1_000_000)
            : 1,
        deliveryFeeFC: clampMoney(snapshot.shop.deliveryFeeFC),
      },
      products,
    };
  } catch {
    return null;
  }
}

export function makePublicCatalogUrl(catalogId: string): string {
  const appBase = getPublicCatalogAppBase();
  const url = new URL(appBase);
  url.searchParams.set(PUBLIC_CATALOG_QUERY, catalogId);
  return url.toString();
}

export interface PublicCatalogCredentials {
  id: string;
  token: string;
}

export async function createLivePublicCatalog(
  snapshot: PublicCatalogSnapshot
): Promise<PublicCatalogCredentials> {
  const credentials = createCatalogCredentials();
  await catalogApiRequest('/api/catalogs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${credentials.token}` },
    body: JSON.stringify({ id: credentials.id, snapshot: withoutDeviceImages(snapshot) }),
  });
  return credentials;
}


export async function updateLivePublicCatalog(
  id: string,
  token: string,
  snapshot: PublicCatalogSnapshot
): Promise<void> {
  const snapshotWithHostedImages = await uploadDeviceImages(id, token, snapshot);
  await catalogApiRequest(`/api/catalogs/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ snapshot: snapshotWithHostedImages }),
  });
}

export async function readLivePublicCatalog(id: string): Promise<PublicCatalogSnapshot> {
  const response = await catalogApiRequest(`/api/catalogs/${encodeURIComponent(id)}`);
  const result = (await response.json()) as { payload?: PublicCatalogSnapshot };
  if (!result?.payload || result.payload.version !== 1 || !Array.isArray(result.payload.products)) {
    throw new Error('invalid_catalog_response');
  }
  return result.payload;
}

const pendingImageUploads = new Map<string, Promise<string>>();

function withoutDeviceImages(snapshot: PublicCatalogSnapshot): PublicCatalogSnapshot {
  return {
    ...snapshot,
    products: snapshot.products.map((product) => {
      if (product.image?.startsWith('data:image/')) {
        return { ...product, image: undefined };
      }
      return product;
    }),
  };
}

async function uploadDeviceImages(
  catalogId: string,
  token: string,
  snapshot: PublicCatalogSnapshot
): Promise<PublicCatalogSnapshot> {
  const products = await Promise.all(snapshot.products.map(async (product) => {
    if (!product.image?.startsWith('data:image/')) return product;
    const imageHash = await hashImage(product.image);
    const cacheKey = `shopflow_catalog_image:${catalogId}:${product.id}`;
    const cached = readImageCache(cacheKey);
    if (cached?.hash === imageHash) return { ...product, image: cached.url };

    const pendingKey = `${catalogId}:${product.id}:${imageHash}`;
    let upload = pendingImageUploads.get(pendingKey);
    if (!upload) {
      upload = (async () => {
        const compressed = await compressProductImage(product.image!);
        const response = await catalogApiRequest(
          `/api/catalogs/${encodeURIComponent(catalogId)}/images/${encodeURIComponent(product.id)}`,
          {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({ imageData: compressed }),
          }
        );
        const result = (await response.json()) as { url?: string };
        if (typeof result.url !== 'string' || !result.url.startsWith('https://')) {
          throw new Error('catalog_image_invalid_response');
        }
        writeImageCache(cacheKey, { hash: imageHash, url: result.url });
        return result.url;
      })().finally(() => pendingImageUploads.delete(pendingKey));
      pendingImageUploads.set(pendingKey, upload);
    }
    return { ...product, image: await upload };
  }));
  return { ...snapshot, products };
}

async function hashImage(imageData: string): Promise<string> {
  if (!globalThis.crypto?.subtle) return `${imageData.length}-${imageData.slice(-80)}`;
  const bytes = new TextEncoder().encode(imageData);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
}

function readImageCache(key: string): { hash: string; url: string } | null {
  try {
    const value = localStorage.getItem(key);
    if (!value) return null;
    const parsed = JSON.parse(value);
    return typeof parsed?.hash === 'string' && typeof parsed?.url === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

function writeImageCache(key: string, value: { hash: string; url: string }): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep the catalog functional if storage is unavailable; the image can be uploaded again later.
  }
}

async function compressProductImage(source: string): Promise<string> {
  const image = new Image();
  image.src = source;
  try {
    await image.decode();
  } catch {
    throw new Error('catalog_image_invalid');
  }
  const maxSide = 1280;
  let scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('catalog_image_invalid');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const compressed = canvas.toDataURL('image/jpeg', Math.max(0.55, 0.82 - attempt * 0.07));
    if (Math.floor((compressed.length - compressed.indexOf(',') - 1) * 0.75) <= 1_500_000) {
      return compressed;
    }
    scale *= 0.78;
  }
  throw new Error('catalog_image_too_large');
}

function createCatalogCredentials(): PublicCatalogCredentials {
  if (!globalThis.crypto?.getRandomValues) throw new Error('secure_random_unavailable');
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  const token = bytesToBase64Url(bytes);
  const idBytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(idBytes);
  idBytes[6] = (idBytes[6] & 0x0f) | 0x40;
  idBytes[8] = (idBytes[8] & 0x3f) | 0x80;
  const hex = Array.from(idBytes, (value) => value.toString(16).padStart(2, '0')).join('');
  const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  return { id, token };
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((value) => { binary += String.fromCharCode(value); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function catalogApiRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const configured = import.meta.env.VITE_CATALOG_API_URL as string | undefined;
  const apiBase = configured?.trim().replace(/\/+$/, '') || getCatalogApiBase();
  let response: Response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new Error('catalog_api_unavailable');
  }
  if (!response.ok) {
    let message = 'catalog_api_error';
    try {
      const body = await response.json();
      if (typeof body?.error?.message === 'string') message = body.error.message;
    } catch {
      // Keep a generic client-safe error when the API response is not JSON.
    }
    throw new Error(message);
  }
  return response;
}

function getCatalogApiBase(): string {
  if (typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol)) {
    return window.location.origin;
  }
  // Native builds use the configured production site; override at build time if hosting elsewhere.
  return 'https://shopflow.cd';
}

export function getPublicCatalogAppBase(): string {
  const fallback = 'https://shopflow.cd/app/';
  if (typeof window === 'undefined') return fallback;
  const currentOrigin = window.location.origin;
  if (currentOrigin.startsWith('capacitor:') || currentOrigin === 'null') return fallback;
  return new URL('/app/', currentOrigin).toString();
}

function clampMoney(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, Math.min(Math.round(amount), 1_000_000_000)) : 0;
}

function safeHttpUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 2_000) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}
