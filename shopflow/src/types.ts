export type CurrencyCode = 'FC' | 'USD';

export type PaymentMethod = 'cash' | 'mobile_money' | 'credit';

export type NavTab = 'dashboard' | 'pos' | 'inventory' | 'credits' | 'expenses';

export type PreviewViewport = 'hybrid' | 'mobile';

export interface Product {
  id: string;
  name: string;
  category: 'Alimentation' | 'Huiles & Lait' | 'Boissons' | 'Hygiène';
  unit: string;
  image: string;
  stock: number;
  minStockAlert: number;
  /** Stored internally in FC (Congolese Francs) for exact math */
  purchasePriceFC: number;
  /** Stored internally in FC (Congolese Francs) for exact math */
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
  totalRevenueFC: number; // CA
  totalCostFC: number; // Coût d'achat
  netProfitFC: number; // Revenu / Bénéfice
  paymentMethod: PaymentMethod;
  customerName?: string;
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

export interface ShopSettings {
  shopName: string;
  ownerName: string;
  city: string;
  whatsappNumber: string;
  currency: CurrencyCode;
  /** Conversion reference used seamlessly when merchant chooses USD vs FC */
  usdRateFC: number;
  offlineSyncEnabled: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
