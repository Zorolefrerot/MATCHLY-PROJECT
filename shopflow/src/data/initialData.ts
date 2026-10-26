import {
  CreditEntry,
  ExpenseEntry,
  Product,
  SaleRecord,
  ShopSettings,
  ShopThemeConfig,
} from '../types';

export function sfAsset(relPath: string): string {
  const clean = relPath.replace(/^\//, '');
  const embeddedImages =
    typeof window !== 'undefined'
      ? (window as unknown as { __SF_IMGS__?: Record<string, string> })
          .__SF_IMGS__
      : undefined;
  // Standalone HTML bundles historically stored public paths with a leading slash;
  // accept both formats so the official logo and all embedded photos resolve.
  const embedded = embeddedImages?.[clean] ?? embeddedImages?.[`/${clean}`];
  // Keep all web assets inside the current PWA scope (/app/) and relative Capacitor bundle.
  return embedded || `./${clean}`;
}

export const SHOPFLOW_APP_LOGO = sfAsset('shopflow-logo.png');
export const LANDING_HERO_PHOTO = sfAsset('landing-hero-merchant.jpg');

export const THEME_PRESETS: {
  id: string;
  name: string;
  subtitle: string;
  config: ShopThemeConfig;
}[] = [
  {
    id: 'shopflow_royal',
    name: 'ShopFlow Royal (Officiel)',
    subtitle: 'Bleu Électrique, Bleu Nuit & Émeraude',
    config: {
      presetId: 'shopflow_royal',
      primaryColor: '#0A4DFF',
      primaryDarkColor: '#081844',
      accentColor: '#059669',
      colorMode: 'light',
      cornerStyle: 'modern',
      density: 'comfortable',
      defaultCatalogFormat: 'grid',
      fontStyle: 'modern',
    },
  },
  {
    id: 'emerald_rdc',
    name: 'Émeraude Croissance',
    subtitle: 'Vert Fintech Africaine & Blanc Pur',
    config: {
      presetId: 'emerald_rdc',
      primaryColor: '#059669',
      primaryDarkColor: '#064E3B',
      accentColor: '#0284C7',
      colorMode: 'light',
      cornerStyle: 'round',
      density: 'comfortable',
      defaultCatalogFormat: 'grid',
      fontStyle: 'modern',
    },
  },
  {
    id: 'otaku_crimson',
    name: 'Rouge Passion / Otaku',
    subtitle: 'Style MB_OTAKU STORE vibrant',
    config: {
      presetId: 'otaku_crimson',
      primaryColor: '#DC2626',
      primaryDarkColor: '#18181B',
      accentColor: '#EA580C',
      colorMode: 'light',
      cornerStyle: 'modern',
      density: 'comfortable',
      defaultCatalogFormat: 'grid',
      fontStyle: 'modern',
    },
  },
  {
    id: 'midnight_pro',
    name: 'Mode Sombre AMOLED Pro',
    subtitle: 'Économie de batterie & contraste nuit',
    config: {
      presetId: 'midnight_pro',
      primaryColor: '#3B82F6',
      primaryDarkColor: '#1E293B',
      accentColor: '#10B981',
      colorMode: 'dark',
      cornerStyle: 'modern',
      density: 'comfortable',
      defaultCatalogFormat: 'table',
      fontStyle: 'modern',
    },
  },
  {
    id: 'luxe_gold',
    name: 'Prestige Or & Papier Doux',
    subtitle: 'Boutique mode, cosmétique & bijouterie',
    config: {
      presetId: 'luxe_gold',
      primaryColor: '#B45309',
      primaryDarkColor: '#292524',
      accentColor: '#059669',
      colorMode: 'warm',
      cornerStyle: 'round',
      density: 'comfortable',
      defaultCatalogFormat: 'grid',
      fontStyle: 'editorial',
    },
  },
];

export const INITIAL_SETTINGS: ShopSettings = {
  shopName: 'Ma Boutique',
  ownerName: '',
  city: 'Kinshasa',
  whatsappNumber: '',
  shopLogo: '',
  shopSpecialties: '',
  shopTagline: '',
  instagramHandle: '',
  businessActivity: 'Commerce',
  defaultDeliveryFeeFC: 0,
  deliveryDelayText: '',
  returnPolicyText: '',
  receiptFooterSubtitle: '',
  receiptQuote: '',
  language: 'fr',
  currency: 'FC',
  usdRateFC: 2850,
  voiceModel: 'nova',
  autoSpeakAi: false,
  theme: THEME_PRESETS[0].config,
  offlineSyncEnabled: true,
  lowStockNotifications: true,
  ownerPin: '1234',
  activePlan: 'pro_ai',
  planPaid: false,
  trialStartedAt: '',
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-collier', refCode: 'SF-001', barcode: '6201045901001',
    name: 'Collier doré délicat', category: 'Bijoux', unit: 'Pièce',
    image: sfAsset('products/bijoux-collection.png'), stock: 12, minStockAlert: 4,
    purchasePriceFC: 28000, sellingPriceFC: 45000,
  },
  {
    id: 'prod-bracelet', refCode: 'SF-002', barcode: '6201045901018',
    name: 'Bracelet perlé', category: 'Bijoux', unit: 'Pièce',
    image: sfAsset('products/bijoux-collection.png'), stock: 18, minStockAlert: 5,
    purchasePriceFC: 16000, sellingPriceFC: 28000,
  },
  {
    id: 'prod-sac-main', refCode: 'SF-003', barcode: '6201045901025',
    name: 'Sac à main structuré', category: 'Accessoires', unit: 'Pièce',
    image: sfAsset('products/accessoires-boutique.png'), stock: 7, minStockAlert: 3,
    purchasePriceFC: 62000, sellingPriceFC: 85000,
  },
  {
    id: 'prod-lunettes', refCode: 'SF-004', barcode: '6201045901032',
    name: 'Lunettes de soleil', category: 'Accessoires', unit: 'Pièce',
    image: sfAsset('products/accessoires-boutique.png'), stock: 9, minStockAlert: 3,
    purchasePriceFC: 22000, sellingPriceFC: 35000,
  },
  {
    id: 'prod-blouse', refCode: 'SF-005', barcode: '6201045901049',
    name: 'Blouse en coton', category: 'Vêtements', unit: 'Pièce',
    image: sfAsset('products/mode-chaussures.png'), stock: 8, minStockAlert: 3,
    purchasePriceFC: 38000, sellingPriceFC: 55000,
  },
  {
    id: 'prod-chaussures', refCode: 'SF-006', barcode: '6201045901056',
    name: 'Mocassins classiques', category: 'Chaussures', unit: 'Paire',
    image: sfAsset('products/mode-chaussures.png'), stock: 4, minStockAlert: 5,
    purchasePriceFC: 48000, sellingPriceFC: 68000,
  },
  {
    id: 'prod-ebook', refCode: 'SF-007', barcode: '6201045901063',
    name: 'E-book pratique pour entrepreneurs', category: 'E-books', unit: 'Téléchargement',
    image: sfAsset('products/ebook-tablette.png'), stock: 30, minStockAlert: 5,
    purchasePriceFC: 4000, sellingPriceFC: 12000,
  },
  {
    id: 'prod-fruits', refCode: 'SF-008', barcode: '6201045901070',
    name: 'Panier de fruits et légumes', category: 'Alimentation', unit: 'Panier',
    image: sfAsset('products/produits-frais.png'), stock: 10, minStockAlert: 4,
    purchasePriceFC: 18000, sellingPriceFC: 26000,
  },
];

export const INITIAL_SALES: SaleRecord[] = [
  {
    id: 'sale-201', productId: 'prod-bracelet', productName: 'Bracelet perlé',
    productImage: sfAsset('products/bijoux-collection.png'), quantity: 2,
    unitPurchasePriceFC: 16000, unitSellingPriceFC: 28000,
    totalRevenueFC: 56000, totalCostFC: 32000, netProfitFC: 24000,
    paymentMethod: 'cash', customerName: 'Client boutique', timestamp: '08:42',
  },
  {
    id: 'sale-202', productId: 'prod-sac-main', productName: 'Sac à main structuré',
    productImage: sfAsset('products/accessoires-boutique.png'), quantity: 1,
    unitPurchasePriceFC: 62000, unitSellingPriceFC: 85000,
    totalRevenueFC: 85000, totalCostFC: 62000, netProfitFC: 23000,
    paymentMethod: 'mobile_money', customerName: 'Client boutique', timestamp: '09:15',
  },
  {
    id: 'sale-203', productId: 'prod-ebook', productName: 'E-book pratique pour entrepreneurs',
    productImage: sfAsset('products/ebook-tablette.png'), quantity: 1,
    unitPurchasePriceFC: 4000, unitSellingPriceFC: 12000,
    totalRevenueFC: 12000, totalCostFC: 4000, netProfitFC: 8000,
    paymentMethod: 'cash', customerName: 'Commande en ligne', timestamp: '10:30',
  },
  {
    id: 'sale-204', productId: 'prod-chaussures', productName: 'Mocassins classiques',
    productImage: sfAsset('products/mode-chaussures.png'), quantity: 1,
    unitPurchasePriceFC: 48000, unitSellingPriceFC: 68000,
    totalRevenueFC: 68000, totalCostFC: 48000, netProfitFC: 20000,
    paymentMethod: 'credit', customerName: 'Client boutique', timestamp: '11:48',
  },
];

export const INITIAL_CREDITS: CreditEntry[] = [
  {
    id: 'cred-1', customerName: 'Client boutique', phone: '',
    itemsSummary: '1x Collier doré, 1x Bracelet perlé',
    totalAmountFC: 73000, paidAmountFC: 30000, createdAt: 'Hier', dueDate: 'Samedi',
  },
  {
    id: 'cred-2', customerName: 'Client boutique', phone: '',
    itemsSummary: '1x Mocassins classiques',
    totalAmountFC: 68000, paidAmountFC: 20000, createdAt: "Aujourd'hui, 11:48", dueDate: 'Fin du mois',
  },
  {
    id: 'cred-3', customerName: 'Commande en ligne', phone: '',
    itemsSummary: '2x E-book pratique pour entrepreneurs',
    totalAmountFC: 24000, paidAmountFC: 12000, createdAt: 'Il y a 3 jours', dueDate: 'Demain',
  },
];

export const INITIAL_EXPENSES: ExpenseEntry[] = [
  {
    id: 'exp-1',
    label: 'Transport moto réapprovisionnement dépôt',
    category: 'Transport',
    amountFC: 8500,
    timestamp: '08:15',
  },
  {
    id: 'exp-2',
    label: 'Rouleaux de sachets d’emballage clients',
    category: 'Emballage',
    amountFC: 4500,
    timestamp: '10:05',
  },
  {
    id: 'exp-3',
    label: 'Carburant groupe électrogène (2h coupure)',
    category: 'Énergie / Courant',
    amountFC: 6000,
    timestamp: '13:40',
  },
];

export const WEEKLY_HISTORY_DAYS = [
  { day: 'Lun', caFC: 485000, netProfitFC: 72000 },
  { day: 'Mar', caFC: 530000, netProfitFC: 81500 },
  { day: 'Mer', caFC: 440000, netProfitFC: 63000 },
  { day: 'Jeu', caFC: 615000, netProfitFC: 94000 },
  { day: 'Ven', caFC: 690000, netProfitFC: 112000 },
  { day: 'Sam', caFC: 780000, netProfitFC: 129500 },
];

export const PRESET_PRODUCT_PHOTOS = [
  { label: 'Bijoux', url: sfAsset('products/bijoux-collection.png') },
  { label: 'Sac & accessoires', url: sfAsset('products/accessoires-boutique.png') },
  { label: 'Vêtements & chaussures', url: sfAsset('products/mode-chaussures.png') },
  { label: 'E-book / numérique', url: sfAsset('products/ebook-tablette.png') },
  { label: 'Fruits & légumes', url: sfAsset('products/produits-frais.png') },
];
