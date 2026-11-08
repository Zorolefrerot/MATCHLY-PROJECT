import { AppLanguage } from '../types';

export interface LanguageOption {
  code: AppLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'fr', label: 'Français', nativeLabel: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'Anglais', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'ln', label: 'Lingala', nativeLabel: 'Lingala (RDC)', flag: '🇨🇩' },
];

export interface UITranslations {
  tagline: string;
  navDashboard: string;
  navPos: string;
  navInventory: string;
  navMore: string;
  navAi: string;
  navStorefront: string;
  navCredits: string;
  navSubscription: string;
  navSettings: string;
  mobileHome: string;
  mobileSell: string;
  mobileAi: string;
  mobileStock: string;
  mobileMore: string;
  mobileSettings: string;
  helloShop: string;
  dashboardSubtitle: string;
  kpiCA: string;
  kpiCost: string;
  kpiExpenses: string;
  kpiNetProfit: string;
  quickSaleBtn: string;
  askAiBtn: string;
  onlineStoreTitle: string;
  subscriptionTitle: string;
  offlineReady: string;
  proActive: string;
  freeTrial: string;
}

export const TRANSLATIONS: Record<AppLanguage, UITranslations> = {
  fr: {
    tagline: 'Gérez • Calculez • Faites grandir',
    navDashboard: 'Accueil',
    navPos: 'Vendre & Caisse',
    navInventory: 'Articles',
    navMore: 'Plus',
    navAi: 'ShopFlow IA',
    navStorefront: 'Boutique en Ligne',
    navCredits: 'Crédits « Bons »',
    navSubscription: 'Abonnement Pro',
    navSettings: 'Dépenses & Paramètres',
    mobileHome: 'Accueil',
    mobileSell: 'Vendre',
    mobileAi: 'IA',
    mobileStock: 'Articles',
    mobileMore: 'Plus',
    mobileSettings: 'Paramètres',
    helloShop: 'Bonjour',
    dashboardSubtitle:
      'Ajoutez vos articles, puis enregistrez vos ventes. ShopFlow garde le reste à portée de main.',
    kpiCA: 'Chiffre d’Affaires (CA)',
    kpiCost: 'Coût d’Achat Ventes',
    kpiExpenses: 'Dépenses Boutique',
    kpiNetProfit: 'Revenu / Bénéfice Net',
    quickSaleBtn: 'Vente rapide',
    askAiBtn: 'Demander à ShopFlow IA',
    onlineStoreTitle: 'Boutique en Ligne WhatsApp',
    subscriptionTitle: 'Abonnement & Formules',
    offlineReady: 'Hors-ligne actif',
    proActive: '★ Abonnement Pro Actif',
    freeTrial: 'Essai Gratuit Pro',
  },
  en: {
    tagline: 'Manage • Calculate • Grow',
    navDashboard: 'Home',
    navPos: 'Point of Sale',
    navInventory: 'Items',
    navMore: 'More',
    navAi: 'ShopFlow AI',
    navStorefront: 'Online Store',
    navCredits: 'Customer Credits',
    navSubscription: 'Pro Subscription',
    navSettings: 'Expenses & Settings',
    mobileHome: 'Home',
    mobileSell: 'Sell',
    mobileAi: 'AI',
    mobileStock: 'Items',
    mobileMore: 'More',
    mobileSettings: 'Settings',
    helloShop: 'Welcome',
    dashboardSubtitle:
      'Add your items, then record sales. ShopFlow keeps the rest within easy reach.',
    kpiCA: 'Gross Revenue (Sales)',
    kpiCost: 'Cost of Goods Sold',
    kpiExpenses: 'Daily Expenses',
    kpiNetProfit: 'True Net Profit',
    quickSaleBtn: 'Quick Sale',
    askAiBtn: 'Ask ShopFlow AI',
    onlineStoreTitle: 'WhatsApp Online Store',
    subscriptionTitle: 'Subscription & Plans',
    offlineReady: 'Offline Ready',
    proActive: '★ Pro Plan Active',
    freeTrial: 'Free Pro Trial',
  },
  ln: {
    tagline: 'Batelá • Tángá • Kólisá mombongo',
    navDashboard: 'Ebandeli',
    navPos: 'Teka & Caisse',
    navInventory: 'Biloko',
    navMore: 'Misala mosusu',
    navAi: 'ShopFlow Mayele (IA)',
    navStorefront: 'Boutique na Internet',
    navCredits: 'Ba Crédits (Bons)',
    navSubscription: 'Abonnement Pro',
    navSettings: 'Depenses & Paramètres',
    mobileHome: 'Ebandeli',
    mobileSell: 'Teka',
    mobileAi: 'IA',
    mobileStock: 'Biloko',
    mobileMore: 'Mosusu',
    mobileSettings: 'Paramètres',
    helloShop: 'Mbote',
    dashboardSubtitle:
      'Bakisa biloko na yo, sima koma boteki. ShopFlow ekobatela makambo mosusu pene na yo.',
    kpiCA: 'Mbongo Ekoti Lelo (CA)',
    kpiCost: 'Mbongo ya Kosomba Stock',
    kpiExpenses: 'Depenses ya Boutique',
    kpiNetProfit: 'Litomba ya Solo (Revenu)',
    quickSaleBtn: 'Teka noki',
    askAiBtn: 'Tuná ShopFlow IA',
    onlineStoreTitle: 'Boutique WhatsApp na Ligne',
    subscriptionTitle: 'Abonnement mpe ba Formule',
    offlineReady: 'Esalaka ata sans connexion',
    proActive: '★ Konte Pro Aktif',
    freeTrial: ' komeka Ofele Pro',
  },
};
