export type CurrencyCode = 'FC' | 'USD';

export type AppLanguage = 'fr' | 'en' | 'ln' | 'sw' | 'zh';

export type VoiceModelId =
  | 'nova'
  | 'onyx'
  | 'shimmer'
  | 'echo'
  | 'alloy'
  | 'device_native';

export type ColorMode = 'light' | 'dark' | 'warm';
export type CornerRadiusStyle = 'sharp' | 'modern' | 'round';
export type LayoutDensity = 'comfortable' | 'compact';
export type CatalogDefaultFormat = 'grid' | 'table';
export type FontStyleChoice = 'modern' | 'editorial' | 'mono';

export interface ShopThemeConfig {
  presetId: string;
  primaryColor: string;
  primaryDarkColor: string;
  accentColor: string;
  colorMode: ColorMode;
  cornerStyle: CornerRadiusStyle;
  density: LayoutDensity;
  defaultCatalogFormat: CatalogDefaultFormat;
  fontStyle: FontStyleChoice;
}

export type PaymentMethod = 'cash' | 'mobile_money' | 'credit' | 'card';

export type NavTab =
  | 'dashboard'
  | 'pos'
  | 'inventory'
  | 'ai'
  | 'storefront'
  | 'credits'
  | 'subscription'
  | 'expenses';

export type SubscriptionPlanId = 'starter' | 'pro_ai' | 'business';

export type PreviewViewport = 'hybrid' | 'mobile';

export interface Product {
  id: string;
  refCode?: string;
  barcode?: string;
  name: string;
  category:
    | 'Bijoux'
    | 'Accessoires'
    | 'Vêtements'
    | 'Chaussures'
    | 'E-books'
    | 'Alimentation'
    | 'Boissons'
    | 'Hygiène'
    | 'Mode & Accessoires'
    | 'Huiles & Lait';
  unit: string;
  image: string;
  stock: number;
  minStockAlert: number;
  purchasePriceFC: number;
  sellingPriceFC: number;
}

export interface SaleRecord {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPurchasePriceFC: number;
  unitSellingPriceFC: number;
  totalRevenueFC: number;
  totalCostFC: number;
  netProfitFC: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  deliveryFeeFC?: number;
  timestamp: string;
}

export interface CreditEntry {
  id: string;
  customerName: string;
  phone: string;
  itemsSummary: string;
  totalAmountFC: number;
  paidAmountFC: number;
  createdAt: string;
  dueDate: string;
}

export interface ExpenseEntry {
  id: string;
  label: string;
  category: 'Transport' | 'Emballage' | 'Énergie / Courant' | 'Autre';
  amountFC: number;
  timestamp: string;
}

export interface ReceiptLineItem {
  id: string;
  refCode: string;
  name: string;
  subtitle: string;
  image: string;
  quantity: number;
  unitPriceFC: number;
}

export interface VisualReceiptPayload {
  invoiceNumber: string;
  dateTime: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethodLabel: string;
  paymentReference: string;
  isPaid: boolean;
  items: ReceiptLineItem[];
  deliveryFeeFC: number;
}

export interface ShopSettings {
  shopName: string;
  ownerName: string;
  city: string;
  whatsappNumber: string;
  shopLogo: string;
  shopSpecialties: string;
  shopTagline: string;
  instagramHandle: string;
  businessActivity: string;
  defaultDeliveryFeeFC: number;
  deliveryDelayText: string;
  returnPolicyText: string;
  receiptFooterSubtitle: string;
  receiptQuote: string;
  language: AppLanguage;
  currency: CurrencyCode;
  usdRateFC: number;
  voiceModel: VoiceModelId;
  autoSpeakAi: boolean;
  theme: ShopThemeConfig;
  offlineSyncEnabled: boolean;
  lowStockNotifications: boolean;
  ownerPin: string;
  activePlan: SubscriptionPlanId;
  planPaid: boolean;
  trialStartedAt: string;
  /** Private local credentials for syncing this shop's public catalog. Never publish the token. */
  publicCatalogId?: string;
  publicCatalogToken?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
