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
  { code: 'sw', label: 'Swahili', nativeLabel: 'Kiswahili (RDC)', flag: '🇨🇩' },
  { code: 'zh', label: 'Chinois', nativeLabel: '中文 (简体)', flag: '🇨🇳' },
];

export interface UITranslations {
  tagline: string;
  navDashboard: string;
  navPos: string;
  navInventory: string;
  navAi: string;
  navStorefront: string;
  navCredits: string;
  navSubscription: string;
  navSettings: string;
  mobileHome: string;
  mobileSell: string;
  mobileAi: string;
  mobileStock: string;
  mobileSettings: string;
  helloShop: string;
  dashboardSubtitle: string;
  kpiCA: string;
  kpiCost: string;
  kpiExpenses: string;
  kpiNetProfit: string;
  quickSaleBtn: string;
  scannerBtn: string;
  whatsappSummaryBtn: string;
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
    navDashboard: 'Tableau de bord',
    navPos: 'Vendre & Caisse',
    navInventory: 'Marchandises & Stock',
    navAi: 'ShopFlow IA',
    navStorefront: 'Boutique en Ligne',
    navCredits: 'Crédits « Bons »',
    navSubscription: 'Abonnement Pro',
    navSettings: 'Dépenses & Paramètres',
    mobileHome: 'Accueil',
    mobileSell: 'Vendre',
    mobileAi: 'IA',
    mobileStock: 'Stock',
    mobileSettings: 'Paramètres',
    helloShop: 'Bonjour',
    dashboardSubtitle:
      'Suivez vos ventes, stocks, reçus WhatsApp et bénéfices nets en temps réel.',
    kpiCA: 'Chiffre d’Affaires (CA)',
    kpiCost: 'Coût d’Achat Ventes',
    kpiExpenses: 'Dépenses Boutique',
    kpiNetProfit: 'Revenu / Bénéfice Net',
    quickSaleBtn: 'Vente rapide',
    scannerBtn: 'Scanner',
    whatsappSummaryBtn: 'Bilan WhatsApp',
    askAiBtn: 'Demander à ShopFlow IA',
    onlineStoreTitle: 'Boutique en Ligne WhatsApp',
    subscriptionTitle: 'Abonnement & Formules',
    offlineReady: 'Hors-ligne actif',
    proActive: '★ Abonnement Pro Actif',
    freeTrial: 'Essai Gratuit Pro',
  },
  en: {
    tagline: 'Manage • Calculate • Grow',
    navDashboard: 'Dashboard',
    navPos: 'Point of Sale',
    navInventory: 'Products & Stock',
    navAi: 'ShopFlow AI',
    navStorefront: 'Online Store',
    navCredits: 'Customer Credits',
    navSubscription: 'Pro Subscription',
    navSettings: 'Expenses & Settings',
    mobileHome: 'Home',
    mobileSell: 'Sell',
    mobileAi: 'AI',
    mobileStock: 'Stock',
    mobileSettings: 'Settings',
    helloShop: 'Welcome',
    dashboardSubtitle:
      'Track your daily sales, stock levels, WhatsApp receipts, and true net profit.',
    kpiCA: 'Gross Revenue (Sales)',
    kpiCost: 'Cost of Goods Sold',
    kpiExpenses: 'Daily Expenses',
    kpiNetProfit: 'True Net Profit',
    quickSaleBtn: 'Quick Sale',
    scannerBtn: 'Scanner',
    whatsappSummaryBtn: 'WhatsApp Report',
    askAiBtn: 'Ask ShopFlow AI',
    onlineStoreTitle: 'WhatsApp Online Store',
    subscriptionTitle: 'Subscription & Plans',
    offlineReady: 'Offline Ready',
    proActive: '★ Pro Plan Active',
    freeTrial: 'Free Pro Trial',
  },
  ln: {
    tagline: 'Batelá • Tángá • Kólisá mombongo',
    navDashboard: 'Bilan ya Lelo',
    navPos: 'Teka & Caisse',
    navInventory: 'Biloko na Stock',
    navAi: 'ShopFlow Mayele (IA)',
    navStorefront: 'Boutique na Internet',
    navCredits: 'Ba Crédits (Bons)',
    navSubscription: 'Abonnement Pro',
    navSettings: 'Depenses & Paramètres',
    mobileHome: 'Ebandeli',
    mobileSell: 'Teka',
    mobileAi: 'IA',
    mobileStock: 'Stock',
    mobileSettings: 'Paramètres',
    helloShop: 'Mbote',
    dashboardSubtitle:
      'Landá moteki ya lelo, stock ya biloko, reçu WhatsApp mpe litomba na yo ya solo.',
    kpiCA: 'Mbongo Ekoti Lelo (CA)',
    kpiCost: 'Mbongo ya Kosomba Stock',
    kpiExpenses: 'Depenses ya Boutique',
    kpiNetProfit: 'Litomba ya Solo (Revenu)',
    quickSaleBtn: 'Teka noki',
    scannerBtn: 'Scanner',
    whatsappSummaryBtn: 'Bilan WhatsApp',
    askAiBtn: 'Tuná ShopFlow IA',
    onlineStoreTitle: 'Boutique WhatsApp na Ligne',
    subscriptionTitle: 'Abonnement mpe ba Formule',
    offlineReady: 'Esalaka ata sans connexion',
    proActive: '★ Konte Pro Aktif',
    freeTrial: ' komeka Ofele Pro',
  },
  sw: {
    tagline: 'Simamia • Hesabu • Kuza Biashara',
    navDashboard: 'Dashibodi ya Leo',
    navPos: 'Uza & Kaunta',
    navInventory: 'Bidhaa na Stoo',
    navAi: 'ShopFlow Akili (IA)',
    navStorefront: 'Duka Mtandaoni',
    navCredits: 'Mikopo ya Wateja',
    navSubscription: 'Kifurushi cha Pro',
    navSettings: 'Matumizi & Mipangilio',
    mobileHome: 'Mwanzo',
    mobileSell: 'Uza',
    mobileAi: 'IA',
    mobileStock: 'Stoo',
    mobileSettings: 'Mipangilio',
    helloShop: 'Habari',
    dashboardSubtitle:
      'Fuatilia mauzo ya leo, bidhaa stoo, risiti za WhatsApp na faida halisi.',
    kpiCA: 'Mapato ya Mauzo (CA)',
    kpiCost: 'Gharama ya Manunuzi',
    kpiExpenses: 'Matumizi ya Duka',
    kpiNetProfit: 'Faida Halisi Mfukoni',
    quickSaleBtn: 'Uza Haraka',
    scannerBtn: 'Skana',
    whatsappSummaryBtn: 'Ripoti WhatsApp',
    askAiBtn: 'Uliza ShopFlow IA',
    onlineStoreTitle: 'Duka la WhatsApp Mtandaoni',
    subscriptionTitle: 'Usajili na vifurushi',
    offlineReady: 'Inafanya kazi bila intaneti',
    proActive: '★ Akaunti ya Pro Iko Hai',
    freeTrial: 'Majaribio ya Bure',
  },
  zh: {
    tagline: '轻松管理 • 自动核算 • 生意兴隆',
    navDashboard: '今日总览',
    navPos: '快速收银台',
    navInventory: '商品与库存',
    navAi: 'ShopFlow 智能助手',
    navStorefront: 'WhatsApp 线上微店',
    navCredits: '客户赊账本',
    navSubscription: '会员订阅',
    navSettings: '店铺支出与设置',
    mobileHome: '首页',
    mobileSell: '收银',
    mobileAi: 'AI助手',
    mobileStock: '库存',
    mobileSettings: '设置',
    helloShop: '您好',
    dashboardSubtitle: '实时掌握今日营业额、库存预警、WhatsApp 电子小票与真实纯利润。',
    kpiCA: '今日营业额 (CA)',
    kpiCost: '售出商品进货成本',
    kpiExpenses: '今日店铺日常支出',
    kpiNetProfit: '今日真实纯利润',
    quickSaleBtn: '快速开单',
    scannerBtn: '扫码收银',
    whatsappSummaryBtn: 'WhatsApp 日报',
    askAiBtn: '咨询 ShopFlow AI',
    onlineStoreTitle: 'WhatsApp 线上商城',
    subscriptionTitle: '订阅与方案',
    offlineReady: '支持离线收银',
    proActive: '★ 专业版会员已激活',
    freeTrial: '专业版免费试用中',
  },
};
