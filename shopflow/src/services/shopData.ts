import type {
  CreditEntry,
  ExpenseEntry,
  Product,
  SaleRecord,
  ShopSettings,
} from '../types';
import { requireSupabase } from '../lib/supabase';

const PRIVATE_ASSET_BUCKET = 'shopflow-private-assets';

export interface ShopDataSnapshot {
  settings: ShopSettings;
  products: Product[];
  sales: SaleRecord[];
  credits: CreditEntry[];
  expenses: ExpenseEntry[];
}

interface CloudRecordInput {
  record_type: 'settings' | 'product' | 'sale' | 'credit' | 'expense';
  record_id: string;
  payload: Record<string, unknown>;
}

const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

function validateLocalSnapshot(snapshot: ShopDataSnapshot) {
  const isArrayOf = (value: unknown, required: Record<string, 'string' | 'number'>) =>
    Array.isArray(value) && value.every((item) =>
      Boolean(item && typeof item === 'object' && Object.entries(required).every(
        ([key, type]) => typeof (item as Record<string, unknown>)[key] === type,
      )),
    );
  if (
    !snapshot.settings || typeof snapshot.settings.shopName !== 'string' ||
    typeof snapshot.settings.ownerName !== 'string' ||
    !['FC', 'USD'].includes(snapshot.settings.currency) ||
    !isArrayOf(snapshot.products, { id: 'string', name: 'string', unit: 'string', image: 'string', stock: 'number', minStockAlert: 'number', purchasePriceFC: 'number', sellingPriceFC: 'number' }) ||
    !isArrayOf(snapshot.sales, { id: 'string', productId: 'string', productName: 'string', productImage: 'string', timestamp: 'string', quantity: 'number', totalRevenueFC: 'number', totalCostFC: 'number', netProfitFC: 'number' }) ||
    !isArrayOf(snapshot.credits, { id: 'string', customerName: 'string', phone: 'string', itemsSummary: 'string', createdAt: 'string', dueDate: 'string', totalAmountFC: 'number', paidAmountFC: 'number' }) ||
    !isArrayOf(snapshot.expenses, { id: 'string', label: 'string', category: 'string', timestamp: 'string', amountFC: 'number' })
  ) throw new Error('INVALID_LOCAL_BACKUP');
}

const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error('PHOTO_READ_FAILED');
  return response.blob();
};

const sha256 = async (blob: Blob): Promise<string> => {
  if (!globalThis.crypto?.subtle) throw new Error('SECURE_CRYPTO_UNAVAILABLE');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const fileExtension = (mimeType: string): string => {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
};

async function uploadDataUrl(
  shopId: string,
  image: string,
  oldPath?: string,
  oldHash?: string,
): Promise<{ path: string; hash: string }> {
  const blob = await dataUrlToBlob(image);
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(blob.type)) {
    throw new Error('PHOTO_FORMAT_NOT_SUPPORTED');
  }
  if (blob.size > 10 * 1024 * 1024) throw new Error('PHOTO_TOO_LARGE');
  const hash = await sha256(blob);
  const path = oldPath && oldHash === hash
    ? oldPath
    : `${shopId}/photos/${hash}.${fileExtension(blob.type)}`;
  if (oldHash !== hash) {
    const { error } = await requireSupabase().storage
      .from(PRIVATE_ASSET_BUCKET)
      .upload(path, blob, { contentType: blob.type, upsert: true, cacheControl: '3600' });
    if (error) throw error;
  }
  return { path, hash };
}

const privateImage = (value: unknown): boolean =>
  typeof value === 'string' && value.startsWith('data:');

async function normalizeProduct(shopId: string, product: Product): Promise<Product> {
  if (!privateImage(product.image)) return { ...product };
  const asset = await uploadDataUrl(shopId, product.image, product.cloudImagePath, product.cloudImageHash);
  return { ...product, cloudImagePath: asset.path, cloudImageHash: asset.hash };
}

async function normalizeSale(shopId: string, sale: SaleRecord, product?: Product): Promise<SaleRecord> {
  if (!privateImage(sale.productImage)) return { ...sale };
  if (product?.cloudImagePath && product.cloudImageHash) {
    return {
      ...sale,
      cloudImagePath: product.cloudImagePath,
      cloudImageHash: product.cloudImageHash,
    };
  }
  const asset = await uploadDataUrl(shopId, sale.productImage, sale.cloudImagePath, sale.cloudImageHash);
  return { ...sale, cloudImagePath: asset.path, cloudImageHash: asset.hash };
}

function settingsForCloud(settings: ShopSettings): Record<string, unknown> {
  const safe = { ...settings } as Record<string, unknown>;
  // Device-only locks, subscription flags and catalog write credentials stay local/server-side.
  delete safe.ownerPin;
  delete safe.publicCatalogToken;
  delete safe.planPaid;
  delete safe.activePlan;
  delete safe.trialStartedAt;
  return safe;
}

function recordPayload<T extends Record<string, unknown>>(
  source: T,
  imageKey?: 'image' | 'productImage',
): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...source };
  if (imageKey && privateImage(payload[imageKey])) payload[imageKey] = '';
  return payload;
}

export async function importLocalSnapshotToShop(
  shopId: string,
  snapshot: ShopDataSnapshot,
): Promise<ShopDataSnapshot> {
  validateLocalSnapshot(snapshot);
  const normalizedProducts = await Promise.all(
    snapshot.products.map((product) => normalizeProduct(shopId, product)),
  );
  const productsById = new Map(normalizedProducts.map((product) => [product.id, product]));
  const normalizedSales = await Promise.all(
    snapshot.sales.map((sale) => normalizeSale(shopId, sale, productsById.get(sale.productId))),
  );

  const records: CloudRecordInput[] = [
    { record_type: 'settings', record_id: 'current', payload: settingsForCloud(snapshot.settings) },
    ...normalizedProducts.map((product) => ({
      record_type: 'product' as const,
      record_id: product.id,
      payload: recordPayload(product as unknown as Record<string, unknown>, 'image'),
    })),
    ...normalizedSales.map((sale) => ({
      record_type: 'sale' as const,
      record_id: sale.id,
      payload: recordPayload(sale as unknown as Record<string, unknown>, 'productImage'),
    })),
    ...snapshot.credits.map((credit) => ({
      record_type: 'credit' as const,
      record_id: credit.id,
      payload: { ...credit } as unknown as Record<string, unknown>,
    })),
    ...snapshot.expenses.map((expense) => ({
      record_type: 'expense' as const,
      record_id: expense.id,
      payload: { ...expense } as unknown as Record<string, unknown>,
    })),
  ];

  const { data: insertedRows, error } = await requireSupabase().rpc('shopflow_import_shop_records', {
    p_shop_id: shopId,
    p_records: records,
  });
  if (error) throw error;
  if (insertedRows !== records.length) throw new Error('IMPORT_VERIFY_FAILED');

  const verified = await loadShopSnapshot(shopId);
  const sameIds = <T extends { id: string }>(expected: T[], actual: T[]) => {
    if (expected.length !== actual.length) return false;
    const actualIds = new Set(actual.map((record) => record.id));
    return expected.every((record) => actualIds.has(record.id));
  };
  if (
    !verified ||
    verified.settings.shopName !== settingsForCloud(snapshot.settings).shopName ||
    !sameIds(normalizedProducts, verified.products) ||
    !sameIds(normalizedSales, verified.sales) ||
    !sameIds(snapshot.credits, verified.credits) ||
    !sameIds(snapshot.expenses, verified.expenses)
  ) throw new Error('IMPORT_VERIFY_FAILED');

  const photosVerified = normalizedProducts.every((product) => {
    if (!product.cloudImagePath) return true;
    const remote = verified.products.find((item) => item.id === product.id);
    return remote?.cloudImagePath === product.cloudImagePath && Boolean(remote.image);
  }) && normalizedSales.every((sale) => {
    if (!sale.cloudImagePath) return true;
    const remote = verified.sales.find((item) => item.id === sale.id);
    return remote?.cloudImagePath === sale.cloudImagePath && Boolean(remote.productImage);
  });
  if (!photosVerified) throw new Error('IMPORT_VERIFY_FAILED');

  return {
    ...snapshot,
    products: normalizedProducts,
    sales: normalizedSales,
  };
}

/** Persist the current authenticated shop snapshot atomically without touching local storage. */
export async function saveShopSnapshot(
  shopId: string,
  snapshot: ShopDataSnapshot,
): Promise<ShopDataSnapshot> {
  validateLocalSnapshot(snapshot);
  const normalizedProducts = await Promise.all(
    snapshot.products.map((product) => normalizeProduct(shopId, product)),
  );
  const productsById = new Map(normalizedProducts.map((product) => [product.id, product]));
  const normalizedSales = await Promise.all(
    snapshot.sales.map((sale) => normalizeSale(shopId, sale, productsById.get(sale.productId))),
  );
  const records: CloudRecordInput[] = [
    { record_type: 'settings', record_id: 'current', payload: settingsForCloud(snapshot.settings) },
    ...normalizedProducts.map((product) => ({
      record_type: 'product' as const,
      record_id: product.id,
      payload: recordPayload(product as unknown as Record<string, unknown>, 'image'),
    })),
    ...normalizedSales.map((sale) => ({
      record_type: 'sale' as const,
      record_id: sale.id,
      payload: recordPayload(sale as unknown as Record<string, unknown>, 'productImage'),
    })),
    ...snapshot.credits.map((credit) => ({
      record_type: 'credit' as const,
      record_id: credit.id,
      payload: { ...credit } as unknown as Record<string, unknown>,
    })),
    ...snapshot.expenses.map((expense) => ({
      record_type: 'expense' as const,
      record_id: expense.id,
      payload: { ...expense } as unknown as Record<string, unknown>,
    })),
  ];

  const { data, error } = await requireSupabase().rpc('shopflow_sync_shop_records', {
    p_shop_id: shopId,
    p_records: records,
  });
  if (error) throw error;
  if (typeof data !== 'number') throw new Error('SYNC_VERIFY_FAILED');

  return {
    ...snapshot,
    products: normalizedProducts,
    sales: normalizedSales,
  };
}

async function signedImageUrl(path: string): Promise<string> {
  const { data, error } = await requireSupabase().storage
    .from(PRIVATE_ASSET_BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

export async function refreshCachedSnapshotImages(
  snapshot: ShopDataSnapshot,
): Promise<ShopDataSnapshot> {
  const paths = new Set<string>();
  for (const product of snapshot.products) {
    if (product.cloudImagePath && !product.image.startsWith('data:')) paths.add(product.cloudImagePath);
  }
  for (const sale of snapshot.sales) {
    if (sale.cloudImagePath && !sale.productImage.startsWith('data:')) paths.add(sale.cloudImagePath);
  }
  const signedUrls = new Map<string, string>();
  await Promise.all([...paths].map(async (path) => {
    try { signedUrls.set(path, await signedImageUrl(path)); } catch { /* keep last known local URL */ }
  }));
  return {
    ...snapshot,
    products: snapshot.products.map((product) => ({
      ...product,
      image: product.cloudImagePath && !product.image.startsWith('data:')
        ? signedUrls.get(product.cloudImagePath) || product.image
        : product.image,
    })),
    sales: snapshot.sales.map((sale) => ({
      ...sale,
      productImage: sale.cloudImagePath && !sale.productImage.startsWith('data:')
        ? signedUrls.get(sale.cloudImagePath) || sale.productImage
        : sale.productImage,
    })),
  };
}

export async function loadShopSnapshot(shopId: string): Promise<ShopDataSnapshot | null> {
  const client = requireSupabase();
  const rows: Array<{ record_type: string; record_id: string; payload: unknown }> = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client
      .from('shopflow_records')
      .select('record_type, record_id, payload')
      .eq('shop_id', shopId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []) as Array<{ record_type: string; record_id: string; payload: unknown }>);
    if (!data || data.length < pageSize) break;
  }
  if (!rows.length) return null;

  const settingsRow = rows.find((row) => row.record_type === 'settings' && row.record_id === 'current');
  const products = rows.filter((row) => row.record_type === 'product').map((row) => asObject(row.payload) as unknown as Product);
  const sales = rows.filter((row) => row.record_type === 'sale').map((row) => asObject(row.payload) as unknown as SaleRecord);
  const credits = rows.filter((row) => row.record_type === 'credit').map((row) => asObject(row.payload) as unknown as CreditEntry);
  const expenses = rows.filter((row) => row.record_type === 'expense').map((row) => asObject(row.payload) as unknown as ExpenseEntry);

  const paths = new Set<string>();
  for (const record of [...products, ...sales]) {
    if (record.cloudImagePath) paths.add(record.cloudImagePath);
  }
  const signedUrls = new Map<string, string>();
  await Promise.all([...paths].map(async (path) => {
    try { signedUrls.set(path, await signedImageUrl(path)); } catch { /* photo is optional */ }
  }));

  const signedProducts = products.map((product) => ({
    ...product,
    image: product.cloudImagePath ? signedUrls.get(product.cloudImagePath) || '' : product.image || '',
  }));
  const signedSales = sales.map((sale) => ({
    ...sale,
    productImage: sale.cloudImagePath ? signedUrls.get(sale.cloudImagePath) || '' : sale.productImage || '',
  }));

  return {
    settings: asObject(settingsRow?.payload) as unknown as ShopSettings,
    products: signedProducts,
    sales: signedSales,
    credits,
    expenses,
  };
}

export function snapshotCounts(snapshot: ShopDataSnapshot) {
  return {
    products: snapshot.products.length,
    sales: snapshot.sales.length,
    credits: snapshot.credits.length,
    expenses: snapshot.expenses.length,
  };
}
