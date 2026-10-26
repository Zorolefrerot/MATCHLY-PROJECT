import { checkPublicCatalogStorage } from '../lib/catalog-store.mjs';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: { message: 'Méthode non autorisée.' } });
  }
  const catalogConfigured = Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
  const catalogStorage = catalogConfigured
    ? await checkPublicCatalogStorage()
    : {
        databaseReady: false,
        databaseStatus: 0,
        databaseErrorCode: 'not_configured',
        imageBucketReady: false,
        imageBucketStatus: 0,
        imageBucketErrorCode: 'not_configured',
      };
  return res.status(200).json({
    ok: true,
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    catalogConfigured,
    catalogDatabaseReady: catalogStorage.databaseReady,
    catalogDatabaseStatus: catalogStorage.databaseStatus,
    catalogDatabaseErrorCode: catalogStorage.databaseErrorCode,
    catalogImagesReady: catalogStorage.imageBucketReady,
    catalogImagesStatus: catalogStorage.imageBucketStatus,
    catalogImagesErrorCode: catalogStorage.imageBucketErrorCode,
  });
}
