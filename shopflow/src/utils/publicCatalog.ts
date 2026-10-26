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

export function makePublicCatalogSnapshot(
  settings: ShopSettings,
  products: Product[],
  publicBase: string
): PublicCatalogSnapshot {
  if (products.length > MAX_CATALOG_PRODUCTS) {
    throw new Error('catalog_limit');
  }

  const safeImage = (value: string | undefined): string | undefined => {
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
  };

  return {
    version: 1,
    publishedAt: new Date().toISOString(),
    shop: {
      name: settings.shopName.trim().slice(0, 100) || 'ShopFlow',
      whatsappNumber: settings.whatsappNumber.replace(/[^\d]/g, '').slice(0, 20),
      city: settings.city.trim().slice(0, 100),
      logo: safeImage(settings.shopLogo),
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
      image: safeImage(product.image),
      priceFC: clampMoney(product.sellingPriceFC),
      stock: Math.max(0, Math.min(1_000_000, Math.floor(Number(product.stock) || 0))),
    })),
  };
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

export function makePublicCatalogUrl(token: string): string {
  const appBase = getPublicCatalogAppBase();
  const url = new URL(appBase);
  url.searchParams.set(PUBLIC_CATALOG_QUERY, token);
  return url.toString();
}

export function getPublicCatalogAppBase(): string {
  const fallback = 'https://shopflow.cd/app/';
  if (typeof window === 'undefined') return fallback;
  const currentOrigin = window.location.origin;
  if (currentOrigin.startsWith('capacitor:') || currentOrigin === 'null') return fallback;
  const path = window.location.pathname.startsWith('/app/') ? '/app/' : '/';
  return new URL(path, currentOrigin).toString();
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
