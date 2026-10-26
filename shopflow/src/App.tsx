import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  BookOpenCheck,
  Bot,
  CheckCircle2,
  Coins,
  Crown,
  ExternalLink,
  Globe,
  LayoutDashboard,
  Lock,
  Monitor,
  Package,
  PackagePlus,
  Palette,
  Settings,
  ShoppingBag,
  Smartphone,
  Unlock,
  Wifi,
  X,
} from 'lucide-react';
import { AiAssistantView, AiStoreAction } from './components/AiAssistantView';
import { FirstRunOnboarding } from './components/FirstRunOnboarding';
import {
  AuthModal,
  AuthModalMode,
  SignupPayload,
} from './components/AuthModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { CreditsView } from './components/CreditsView';
import { DashboardView } from './components/DashboardView';
import { ExpensesSettingsView } from './components/ExpensesSettingsView';
import { InventoryView } from './components/InventoryView';
import { LandingPageView } from './components/LandingPageView';
import { OnlineStoreView } from './components/OnlineStoreView';
import { PosSalesView } from './components/PosSalesView';
import { SubscriptionView } from './components/SubscriptionView';
import { VisualReceiptModal } from './components/VisualReceiptModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import {
  INITIAL_SETTINGS,
  PRESET_PRODUCT_PHOTOS,
  SHOPFLOW_APP_LOGO,
  sfAsset,
} from './data/initialData';
import {
  clearLegacyAITranslationCache,
  translateDOMWithLocalDictionary,
  translateStringSync,
} from './i18n/fullTranslator';
import { LANGUAGE_OPTIONS, TRANSLATIONS } from './i18n/translations';
import {
  AppLanguage,
  CartItem,
  CreditEntry,
  ExpenseEntry,
  NavTab,
  PaymentMethod,
  PreviewViewport,
  Product,
  SaleRecord,
  ShopSettings,
  SubscriptionPlanId,
  VisualReceiptPayload,
} from './types';
import { formatMoney } from './utils/currency';
import { getPublicCatalogAppBase, makePublicCatalogSnapshot, updateLivePublicCatalog } from './utils/publicCatalog';
import { parseSaleDate } from './utils/saleDate';

const STORAGE_KEY = 'shopflow_rdc_mockup_v4';
const FIRST_RUN_TOUR_KEY = 'shopflow_first_run_tour_done_v1';
const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const LEGACY_SAMPLE_IDS = new Set([
  'prod-riz-25', 'prod-huile-5l', 'prod-lait-900', 'prod-semoule-10',
  'prod-sucre-5', 'prod-oeufs-30', 'prod-savon-pack', 'prod-jus-pack',
  'sale-101', 'sale-102', 'sale-103', 'sale-104',
  'cred-1', 'cred-2', 'cred-3', 'exp-1', 'exp-2', 'exp-3',
]);

const removeLegacySampleRecords = <T extends { id?: string }>(records: unknown): T[] =>
  Array.isArray(records)
    ? records.filter((record): record is T => {
        if (!record || typeof record !== 'object') return false;
        const id = (record as { id?: unknown }).id;
        return typeof id === 'string' && !LEGACY_SAMPLE_IDS.has(id);
      })
    : [];

const sanitizeLegacySettings = (saved: Partial<ShopSettings>): ShopSettings => {
  const safeSaved = { ...saved } as Partial<ShopSettings> & Record<string, unknown>;
  // Drop legacy client-side provider configuration (including any old local API key).
  delete safeSaved.customAiApiKey;
  delete safeSaved.customAiEndpoint;
  delete safeSaved.customAiModel;
  const merged: ShopSettings = {
    ...INITIAL_SETTINGS,
    ...safeSaved,
    theme: { ...INITIAL_SETTINGS.theme, ...(saved.theme || {}) },
  };
  const oldExampleValues: Partial<ShopSettings> = {
    shopName: 'Alimentation Maman Grâce',
    ownerName: 'Grâce Kabongo',
    city: 'Kinshasa - Ngaliema',
    whatsappNumber: '+243 81 452 90 12',
    shopSpecialties: 'ALIMENTATION • GROS & DÉTAIL • LIVRAISON RAPIDE',
    shopTagline: 'Votre satisfaction, notre priorité !',
    instagramHandle: '@maman_grace_market',
    businessActivity: 'Importation & Distribution Alimentaire',
    defaultDeliveryFeeFC: 2000,
    deliveryDelayText: 'Livraison le jour même (1h à 24h)',
    returnPolicyText: 'Aucun retour accepté sauf produit défectueux. Merci de bien conserver ce reçu.',
    receiptFooterSubtitle: 'Plus qu’une boutique, une famille à votre service !',
    receiptQuote: '« La qualité au meilleur prix chaque jour pour nourrir votre foyer avec confiance. »',
  };
  for (const [key, value] of Object.entries(oldExampleValues)) {
    const settingKey = key as keyof ShopSettings;
    if (merged[settingKey] === value) {
      Object.assign(merged, { [settingKey]: INITIAL_SETTINGS[settingKey] });
    }
  }
  // Legacy local shops have no creation date; grant one 7-day transition period.
  if (merged.shopName !== INITIAL_SETTINGS.shopName && !merged.trialStartedAt) {
    merged.trialStartedAt = new Date().toISOString();
  }
  return merged;
};

export function App() {
  const appRootRef = useRef<HTMLDivElement | null>(null);

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isInstalledApp] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches;
    const isIOSStandalone =
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    return Boolean(Capacitor.isNativePlatform() || isStandalone || isIOSStandalone);
  });
  // The public site never embeds the app. Installed standalone sessions open the app directly.
  const [screenMode, setScreenMode] = useState<'landing' | 'app'>(() =>
    isInstalledApp ? 'app' : 'landing'
  );
  const [authModalConfig, setAuthModalConfig] = useState<{
    mode: AuthModalMode;
    plan?: SubscriptionPlanId;
  } | null>(null);
  const deferredInstallPromptRef = useRef<{
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  } | null>(null);

  const [previewViewport, setPreviewViewport] =
    useState<PreviewViewport>('hybrid');

  const [settings, setSettings] = useState<ShopSettings>(INITIAL_SETTINGS);
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);
  const [trialNow, setTrialNow] = useState(() => Date.now());
  const trialStartedAtMs = Date.parse(settings.trialStartedAt || '');
  const trialEndsAtMs = Number.isFinite(trialStartedAtMs) && trialStartedAtMs > 0
    ? trialStartedAtMs + TRIAL_DURATION_MS
    : null;
  const isTrialExpired = Boolean(
    trialEndsAtMs !== null && !settings.planPaid && trialNow >= trialEndsAtMs
  );
  const trialDaysRemaining = trialEndsAtMs === null
    ? 7
    : Math.max(0, Math.ceil((trialEndsAtMs - trialNow) / DAY_MS));
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogSyncStatus, setCatalogSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [catalogNetworkEpoch, setCatalogNetworkEpoch] = useState(0);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [credits, setCredits] = useState<CreditEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [showStartupSplash, setShowStartupSplash] = useState(isInstalledApp);
  const [showFirstRunTour, setShowFirstRunTour] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Real Patron vs Vendor/Cashier PIN Protection!
  const [isVendorLocked, setIsVendorLocked] = useState(false);
  const [showPinUnlockModal, setShowPinUnlockModal] = useState(false);
  const [pendingProtectedTab, setPendingProtectedTab] = useState<NavTab | null>(
    null
  );
  const [pinAttempt, setPinAttempt] = useState('');
  const [pinError, setPinError] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Restock Modal
  const [restockTarget, setRestockTarget] = useState<Product | null>(null);
  const [restockQtyInput, setRestockQtyInput] = useState('10');

  // Camera & Photo Barcode Scanner Modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedCartTrigger, setScannedCartTrigger] = useState<{
    product: Product;
    nonce: number;
  } | null>(null);

  // Official Graphical WhatsApp Receipt Modal
  const [visualReceipt, setVisualReceipt] =
    useState<VisualReceiptPayload | null>(null);

  // Text WhatsApp Modal
  const [whatsAppModal, setWhatsAppModal] = useState<{
    title: string;
    recipient: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.settings && typeof parsed.settings === 'object') {
          setSettings(sanitizeLegacySettings(parsed.settings));
        }
        // Strip only the old bundled examples; preserve every record created by the merchant.
        setProducts(removeLegacySampleRecords<Product>(parsed.products));
        setSales(removeLegacySampleRecords<SaleRecord>(parsed.sales));
        setCredits(removeLegacySampleRecords<CreditEntry>(parsed.credits));
        setExpenses(removeLegacySampleRecords<ExpenseEntry>(parsed.expenses));
      }
    } catch {
      // Ignore storage errors
    }
    setHasLoadedSettings(true);
  }, []);

  useEffect(() => {
    if (!isInstalledApp) return;
    const timer = window.setTimeout(() => {
      setShowStartupSplash(false);
      try {
        if (localStorage.getItem(FIRST_RUN_TOUR_KEY) !== 'done') setShowFirstRunTour(true);
      } catch {
        setShowFirstRunTour(true);
      }
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [isInstalledApp]);

  const finishFirstRunTour = (configureShop: boolean) => {
    try {
      localStorage.setItem(FIRST_RUN_TOUR_KEY, 'done');
    } catch {
      // The tutorial can still be dismissed if storage is unavailable.
    }
    setShowFirstRunTour(false);
    setOnboardingStep(0);
    if (configureShop) {
      setAuthModalConfig({ mode: 'signup', plan: 'pro_ai' });
    }
  };

  useEffect(() => {
    if (!hasLoadedSettings) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ settings, products, sales, credits, expenses })
      );
    } catch {
      // Ignore quota errors
    }
  }, [hasLoadedSettings, settings, products, sales, credits, expenses]);

  useEffect(() => {
    const retryCatalogSync = () => setCatalogNetworkEpoch((current) => current + 1);
    window.addEventListener('online', retryCatalogSync);
    return () => window.removeEventListener('online', retryCatalogSync);
  }, []);

  useEffect(() => {
    const { publicCatalogId, publicCatalogToken } = settings;
    if (!hasLoadedSettings || !publicCatalogId || !publicCatalogToken) return;
    let cancelled = false;
    setCatalogSyncStatus('syncing');
    const timer = window.setTimeout(async () => {
      try {
        const snapshot = makePublicCatalogSnapshot(settings, products, getPublicCatalogAppBase());
        await updateLivePublicCatalog(publicCatalogId, publicCatalogToken, snapshot);
        if (!cancelled) setCatalogSyncStatus('synced');
      } catch {
        if (!cancelled) setCatalogSyncStatus('error');
      }
    }, 650);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [hasLoadedSettings, settings, products, catalogNetworkEpoch]);

  useEffect(() => {
    if (trialEndsAtMs === null || settings.planPaid || Date.now() >= trialEndsAtMs) return;
    const remainingMs = trialEndsAtMs - Date.now();
    const untilNextDay = DAY_MS - (Date.now() % DAY_MS);
    const timer = window.setTimeout(
      () => setTrialNow(Date.now()),
      Math.min(remainingMs, untilNextDay) + 25
    );
    return () => window.clearTimeout(timer);
  }, [trialEndsAtMs, settings.planPaid, trialNow]);

  useEffect(() => {
    if (screenMode === 'app' && isTrialExpired && activeTab !== 'subscription') {
      setActiveTab('subscription');
    }
  }, [screenMode, isTrialExpired, activeTab]);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredInstallPromptRef.current = e as unknown as {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
      };
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () =>
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  useEffect(() => {
    clearLegacyAITranslationCache();
  }, []);

  // Apply reviewed translations locally after each view/language update; no translation API is called.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void translateDOMWithLocalDictionary(appRootRef.current, settings.language);
    }, 100);
    return () => clearTimeout(timer);
  }, [
    settings.language,
    screenMode,
    activeTab,
    isScannerOpen,
    visualReceipt,
    restockTarget,
    showPinUnlockModal,
    authModalConfig,
  ]);

  const handleCompleteSignup = (payload: SignupPayload) => {
    if (isTrialExpired) {
      setAuthModalConfig(null);
      setActiveTab('subscription');
      showToast('Votre essai est terminé. Choisissez une formule pour continuer.');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      shopName: payload.shopName,
      ownerName: payload.ownerName,
      city: payload.city,
      whatsappNumber: payload.whatsappNumber,
      currency: payload.currency,
      ownerPin: payload.ownerPin || '1234',
      activePlan: payload.selectedPlan,
      planPaid: false,
      trialStartedAt: new Date().toISOString(),
    }));
    setProducts([]);
    setSales([]);
    setCredits([]);
    setExpenses([]);
    setIsVendorLocked(false);
    setAuthModalConfig(null);
    setActiveTab('dashboard');
    setScreenMode('app');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(
      `🎉 Bienvenue ${payload.ownerName} ! Votre boutique « ${payload.shopName} » est prête !`
    );
  };

  const handleRequestTab = (targetTab: NavTab) => {
    if (isTrialExpired && targetTab !== 'subscription') {
      setActiveTab('subscription');
      showToast('Votre essai de 7 jours est terminé. Choisissez une formule pour continuer.');
      return;
    }
    const vendorAllowedTabs: NavTab[] = ['pos', 'storefront'];
    if (isVendorLocked && !vendorAllowedTabs.includes(targetTab)) {
      setPendingProtectedTab(targetTab);
      setPinAttempt('');
      setPinError(false);
      setShowPinUnlockModal(true);
      return;
    }
    setActiveTab(targetTab);
  };

  const handleActivateVendorMode = () => {
    setIsVendorLocked(true);
    setActiveTab('pos');
    showToast(
      `🔒 Mode Vendeur activé ! Bénéfices & paramètres protégés par le code ${settings.ownerPin || '1234'}`
    );
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = (settings.ownerPin || '1234').trim();
    if (pinAttempt.trim() === expected) {
      setIsVendorLocked(false);
      setShowPinUnlockModal(false);
      setPinError(false);
      if (pendingProtectedTab) {
        setActiveTab(pendingProtectedTab);
        setPendingProtectedTab(null);
      }
      showToast('🔓 Mode Patron déverrouillé !');
    } else {
      setPinError(true);
      setPinAttempt('');
    }
  };

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.fr;

  // Displayed localized products & sales seamlessly in every component!
  const localizedProducts = products.map((p) => ({
    ...p,
    name: translateStringSync(p.name, settings.language),
    image: p.image ? (p.image.startsWith('data:') ? p.image : sfAsset(p.image)) : '',
  }));

  const localizedSales = sales.map((s) => ({
    ...s,
    productName: translateStringSync(s.productName, settings.language),
    productImage: s.productImage.startsWith('data:')
      ? s.productImage
      : sfAsset(s.productImage),
  }));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  const fmt = (val: number) =>
    formatMoney(val, settings.currency, settings.usdRateFC);

  const nowTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  };


  const handleDirectSellQuantity = (
    product: Product,
    qty: number = 1,
    method: PaymentMethod = 'cash',
    label?: string
  ) => {
    const rawProduct = products.find((p) => p.id === product.id) || product;
    if (rawProduct.stock < qty || qty <= 0) return;

    const unitProfit = rawProduct.sellingPriceFC - rawProduct.purchasePriceFC;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === rawProduct.id ? { ...p, stock: Math.max(0, p.stock - qty) } : p
      )
    );

    const newSale: SaleRecord = {
      id: `sale-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: rawProduct.id,
      productName: rawProduct.name,
      productImage: rawProduct.image,
      quantity: qty,
      unitPurchasePriceFC: rawProduct.purchasePriceFC,
      unitSellingPriceFC: rawProduct.sellingPriceFC,
      totalRevenueFC: rawProduct.sellingPriceFC * qty,
      totalCostFC: rawProduct.purchasePriceFC * qty,
      netProfitFC: unitProfit * qty,
      paymentMethod: method,
      customerName: label,
      timestamp: new Date().toISOString(),
    };

    setSales((prev) => [newSale, ...prev]);
    showToast(
      `+${qty} ${product.name} → +${fmt(unitProfit * qty)}`
    );
  };

  const handleExecuteAiActions = (actions: AiStoreAction[]): string[] => {
    const badges: string[] = [];

    for (const act of actions) {
      if (act.type === 'sell' && act.productId) {
        const target = products.find((p) => p.id === act.productId);
        const qty = Math.max(1, act.quantity || 1);
        if (target && target.stock >= qty) {
          handleDirectSellQuantity(target, qty, 'cash', 'ShopFlow AI');
          badges.push(`${qty}× ${target.name}`);
        }
      } else if (act.type === 'add_product' && act.name) {
        const newProd: Product = {
          id: `prod-${Date.now()}`,
          refCode: `SF-0${products.length + 1}`,
          name: act.name,
          category: act.category || 'Bijoux',
          unit: act.unit || 'Pièce',
          image: PRESET_PRODUCT_PHOTOS[0].url,
          stock: Math.max(1, act.stock || 10),
          minStockAlert: 5,
          purchasePriceFC: act.purchasePriceFC || 10000,
          sellingPriceFC: act.sellingPriceFC || 15000,
        };
        setProducts((prev) => [newProd, ...prev]);
        badges.push(`+ ${newProd.name}`);
      } else if (
        act.type === 'update_price' &&
        act.productId &&
        act.sellingPriceFC
      ) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === act.productId
              ? { ...p, sellingPriceFC: act.sellingPriceFC! }
              : p
          )
        );
        badges.push(`Prix → ${fmt(act.sellingPriceFC)}`);
      } else if (act.type === 'add_expense' && act.amountFC) {
        setExpenses((prev) => [
          {
            id: `exp-${Date.now()}`,
            label: act.label || 'Charge IA',
            category: 'Autre',
            amountFC: act.amountFC!,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);
        badges.push(`− ${fmt(act.amountFC)}`);
      }
    }

    return badges;
  };

  const handleCompleteCartSale = (
    items: CartItem[],
    paymentMethod: PaymentMethod,
    customerName: string,
    customerPhone: string,
    customerAddress: string,
    deliveryFeeFC: number
  ) => {
    const time = nowTime();
    const newSales: SaleRecord[] = items.map(({ product, quantity }, idx) => ({
      id: `sale-${Date.now()}-${idx}`,
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      quantity,
      unitPurchasePriceFC: product.purchasePriceFC,
      unitSellingPriceFC: product.sellingPriceFC,
      totalRevenueFC: product.sellingPriceFC * quantity,
      totalCostFC: product.purchasePriceFC * quantity,
      netProfitFC:
        (product.sellingPriceFC - product.purchasePriceFC) * quantity,
      paymentMethod,
      customerName,
      customerPhone,
      customerAddress,
      deliveryFeeFC,
      timestamp: new Date().toISOString(),
    }));

    setProducts((prev) =>
      prev.map((p) => {
        const soldItem = items.find((i) => i.product.id === p.id);
        if (!soldItem) return p;
        return { ...p, stock: Math.max(0, p.stock - soldItem.quantity) };
      })
    );

    setSales((prev) => [...newSales, ...prev]);

    if (paymentMethod === 'credit') {
      const totalCreditFC = items.reduce(
        (s, i) => s + i.product.sellingPriceFC * i.quantity,
        0
      );
      const summary = items
        .map((i) => `${i.quantity}x ${i.product.name}`)
        .join(', ');

      setCredits((prev) => [
        {
          id: `cred-${Date.now()}`,
          customerName: customerName || 'Client Comptoir',
          phone: customerPhone || '+243 81 000 00 00',
          itemsSummary: summary,
          totalAmountFC: totalCreditFC,
          paidAmountFC: 0,
          createdAt: `Aujourd'hui, ${time}`,
          dueDate: 'Fin de semaine',
        },
        ...prev,
      ]);
    }

    const totalGain = newSales.reduce((s, r) => s + r.netProfitFC, 0);
    showToast(`Vente validée ! +${fmt(totalGain)}`);
  };

  const handleUndoSale = (saleId: string) => {
    const target = sales.find((s) => s.id === saleId);
    if (!target) return;

    setSales((prev) => prev.filter((s) => s.id !== saleId));
    setProducts((prev) =>
      prev.map((p) =>
        p.id === target.productId
          ? { ...p, stock: p.stock + target.quantity }
          : p
      )
    );
    showToast(`${target.quantity}x ${target.productName} remis en stock`);
  };

  const handleSaveProduct = (product: Product, isNew: boolean) => {
    if (isNew) {
      setProducts((prev) => [product, ...prev]);
      showToast(`« ${product.name} » ajouté au stock !`);
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? product : p))
      );
      showToast(`« ${product.name} » mis à jour !`);
    }
  };

  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockTarget) return;
    const added = Math.max(1, parseInt(restockQtyInput, 10) || 0);
    setProducts((prev) =>
      prev.map((p) =>
        p.id === restockTarget.id ? { ...p, stock: p.stock + added } : p
      )
    );
    showToast(`+${added} ajoutés à ${restockTarget.name}`);
    setRestockTarget(null);
  };

  const handleOpenDailyWhatsApp = () => {
    const today = new Date();
    const isToday = (timestamp: string) => {
      const date = parseSaleDate(timestamp);
      return Boolean(date && date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate());
    };
    const todaySales = sales.filter((sale) => isToday(sale.timestamp));
    const todayExpenses = expenses.filter((expense) => isToday(expense.timestamp));
    const totalCA = todaySales.reduce((a, s) => a + s.totalRevenueFC, 0);
    const totalCost = todaySales.reduce((a, s) => a + s.totalCostFC, 0);
    const totalExp = todayExpenses.reduce((a, e) => a + e.amountFC, 0);
    const netRev = totalCA - totalCost - totalExp;
    const totalQty = todaySales.reduce((a, s) => a + s.quantity, 0);

    const msg =
      `📊 *BILAN JOURNALIER — ${settings.shopName.toUpperCase()}*\n` +
      `📍 ${settings.city}\n` +
      `--------------------------\n` +
      `🛍️ Articles vendus : *${totalQty} unités* (${todaySales.length} ventes)\n` +
      `💰 Chiffre d’Affaires (CA) : *${fmt(totalCA)}*\n` +
      `📦 Coût d’achat marchandise : *${fmt(totalCost)}*\n` +
      `🧾 Dépenses boutique : *${fmt(totalExp)}*\n` +
      `--------------------------\n` +
      `✅ *REVENU NET RÉEL : ${netRev >= 0 ? '+' : ''}${fmt(netRev)}*`;

    setWhatsAppModal({
      title: 'Résumé WhatsApp de fin de journée',
      recipient: `${settings.ownerName} (${settings.whatsappNumber})`,
      message: msg,
    });
  };

  const handleActivatePlan = (
    planId: SubscriptionPlanId,
    methodLabel: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      activePlan: planId,
      planPaid: true,
    }));
    showToast(`Choix de formule enregistré en simulation (${methodLabel}) — aucun paiement réel.`);
  };

  const handleExportBackup = () => {
    try {
      const backup = {
        format: 'shopflow-local-backup',
        version: 1,
        exportedAt: new Date().toISOString(),
        settings,
        products,
        sales,
        credits,
        expenses,
        aiConversation: localStorage.getItem('shopflow_ai_conversation_v1'),
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shopflow-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Sauvegarde complète téléchargée sur cet appareil.');
    } catch {
      showToast('Impossible de créer la sauvegarde. Vérifiez l’espace disponible.');
    }
  };

  const handleImportBackup = async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== 'object') throw new Error('invalid backup');
      const backup = parsed as Record<string, unknown>;
      const isRecordArray = (value: unknown, shape: Record<string, 'string' | 'number'>) =>
        Array.isArray(value) && value.every((item) =>
          Boolean(
            item && typeof item === 'object' &&
            Object.entries(shape).every(([key, type]) => typeof (item as Record<string, unknown>)[key] === type)
          )
        );
      const importedSettings = backup.settings as Record<string, unknown> | undefined;
      if (
        !importedSettings || Array.isArray(importedSettings) ||
        typeof importedSettings.shopName !== 'string' ||
        typeof importedSettings.ownerName !== 'string' ||
        (importedSettings.currency !== 'FC' && importedSettings.currency !== 'USD') ||
        !isRecordArray(backup.products, { id: 'string', name: 'string', unit: 'string', image: 'string', stock: 'number', minStockAlert: 'number', purchasePriceFC: 'number', sellingPriceFC: 'number' }) ||
        !isRecordArray(backup.sales, { id: 'string', productId: 'string', productName: 'string', productImage: 'string', timestamp: 'string', quantity: 'number', totalRevenueFC: 'number', totalCostFC: 'number', netProfitFC: 'number' }) ||
        !isRecordArray(backup.credits, { id: 'string', customerName: 'string', phone: 'string', itemsSummary: 'string', createdAt: 'string', dueDate: 'string', totalAmountFC: 'number', paidAmountFC: 'number' }) ||
        !isRecordArray(backup.expenses, { id: 'string', label: 'string', category: 'string', timestamp: 'string', amountFC: 'number' })
      ) {
        throw new Error('backup missing required data');
      }
      if (!window.confirm('Remplacer les données actuelles par cette sauvegarde ? Cette action ne peut pas être annulée.')) return;

      setSettings(sanitizeLegacySettings(backup.settings as ShopSettings));
      setProducts(removeLegacySampleRecords<Product>(backup.products));
      setSales(removeLegacySampleRecords<SaleRecord>(backup.sales));
      setCredits(removeLegacySampleRecords<CreditEntry>(backup.credits));
      setExpenses(removeLegacySampleRecords<ExpenseEntry>(backup.expenses));
      try {
        localStorage.removeItem('shopflow_ai_conversation_v1');
        if (typeof backup.aiConversation === 'string') {
          JSON.parse(backup.aiConversation);
          localStorage.setItem('shopflow_ai_conversation_v1', backup.aiConversation);
        }
      } catch {
        // Keep the restored shop data even if local chat storage is unavailable.
      }
      setActiveTab('dashboard');
      showToast('Sauvegarde restaurée. Les données restent enregistrées localement.');
    } catch {
      showToast('Fichier invalide : sélectionnez une sauvegarde ShopFlow complète.');
    }
  };

  const handleResetDemo = () => {
    if (!window.confirm('Effacer les données de cette boutique sur cet appareil ? Cette action est définitive.')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('shopflow_ai_conversation_v1');
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith('shopflow_ai_conversations_v1:')) {
        localStorage.removeItem(key);
      }
    }
    setSettings(INITIAL_SETTINGS);
    setProducts([]);
    setSales([]);
    setCredits([]);
    setExpenses([]);
    showToast('Les données locales ont été effacées. Votre boutique est vide.');
  };

  const unpaidCreditsCount = credits.filter(
    (c) => c.totalAmountFC > c.paidAmountFC
  ).length;
  const lowStockCount = products.filter(
    (p) => p.stock <= p.minStockAlert
  ).length;

  const sidebarItems: {
    id: NavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: string | number;
    highlight?: boolean;
  }[] = [
    { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { id: 'pos', label: t.navPos, icon: ShoppingBag, badge: sales.length },
    {
      id: 'inventory',
      label: t.navInventory,
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    { id: 'ai', label: t.navAi, icon: Bot, badge: 'AI', highlight: true },
    { id: 'storefront', label: t.navStorefront, icon: Globe, badge: 'PRO' },
    {
      id: 'credits',
      label: t.navCredits,
      icon: BookOpenCheck,
      badge: unpaidCreditsCount > 0 ? unpaidCreditsCount : undefined,
    },
    {
      id: 'subscription',
      label: t.navSubscription,
      icon: Crown,
      badge: settings.planPaid ? '✓' : undefined,
    },
    { id: 'expenses', label: t.navSettings, icon: Settings },
  ];

  const mobileBottomItems: {
    id: NavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'dashboard', label: t.mobileHome, icon: LayoutDashboard },
    { id: 'pos', label: t.mobileSell, icon: ShoppingBag },
    { id: 'ai', label: t.mobileAi, icon: Bot },
    { id: 'inventory', label: t.mobileStock, icon: Package },
    { id: 'expenses', label: t.mobileSettings, icon: Settings },
  ];

  const isPhoneFrame = previewViewport === 'mobile';

  const themeInlineStyle = {
    '--sf-primary': settings.theme.primaryColor,
    '--sf-primary-dark': settings.theme.primaryDarkColor,
    '--sf-accent': settings.theme.accentColor,
  } as React.CSSProperties;

  return (
    <div
      id="shopflow-theme-root"
      ref={appRootRef}
      style={themeInlineStyle}
      data-mode={screenMode === 'landing' ? 'light' : settings.theme.colorMode}
      data-corners={settings.theme.cornerStyle}
      data-density={settings.theme.density}
      data-font={settings.theme.fontStyle}
      className={`min-h-screen transition-colors duration-200 ${
        screenMode === 'landing'
          ? 'bg-white'
          : isPhoneFrame
            ? 'bg-slate-900 px-3 py-6'
            : 'bg-slate-50'
      }`}
    >
      {screenMode === 'landing' ? (
        <LandingPageView
          language={settings.language}
          currency={settings.currency}
          usdRateFC={settings.usdRateFC}
          onChangeLanguage={(lang) =>
            setSettings((prev) => ({ ...prev, language: lang }))
          }
          onChangeCurrency={(curr) =>
            setSettings((prev) => ({ ...prev, currency: curr }))
          }
          onOpenAuthModal={(mode, preselectedPlan) =>
            setAuthModalConfig({ mode, plan: preselectedPlan })
          }
        />
      ) : (
        <>
          {/* Top Preview Switcher on Desktop */}
          <div
            className={`mx-auto mb-0 hidden items-center justify-between px-4 py-2 text-xs lg:flex ${
              isPhoneFrame
                ? 'mb-4 max-w-2xl rounded-2xl border border-slate-700 bg-slate-800 text-slate-200'
                : 'border-b border-black/10 bg-[#081844] text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setScreenMode('landing');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A4DFF] px-3 py-1 text-[11px] font-extrabold text-white transition hover:bg-blue-500"
              >
                <ExternalLink className="h-3 w-3" />
                <span>← Voir le Site Vitrine</span>
              </button>
              <span className="text-slate-200">
                Application ShopFlow Pro en direct • Boutique active :{' '}
                <strong className="text-white">{settings.shopName}</strong>
              </span>
            </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              isVendorLocked
                ? setShowPinUnlockModal(true)
                : handleActivateVendorMode()
            }
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold text-white transition ${
              isVendorLocked
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-white/15 hover:bg-white/25'
            }`}
          >
            {isVendorLocked ? (
              <Unlock className="h-3.5 w-3.5" />
            ) : (
              <Lock className="h-3.5 w-3.5" />
            )}
            <span>{isVendorLocked ? 'Mode Patron' : 'Mode Vendeur'}</span>
          </button>
          <button
            onClick={() => handleRequestTab('expenses')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1 font-bold text-white transition hover:bg-white/25"
          >
            <Palette className="h-3.5 w-3.5" />
            <span>Thème</span>
          </button>
          <button
            onClick={() => setPreviewViewport('hybrid')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition ${
              !isPhoneFrame
                ? 'bg-white text-slate-950'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>PC / Tablette</span>
          </button>
          <button
            onClick={() => setPreviewViewport('mobile')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition ${
              isPhoneFrame
                ? 'bg-white text-slate-950'
                : 'text-sky-100 hover:bg-white/10'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Smartphone</span>
          </button>
        </div>
      </div>

      {/* Main Shell */}
      <div
        className={
          isPhoneFrame
            ? 'relative mx-auto flex h-[820px] w-full max-w-[400px] flex-col overflow-hidden rounded-[40px] border-[10px] border-slate-950 bg-slate-50 shadow-2xl ring-2 ring-slate-700'
            : 'flex min-h-[calc(100vh-40px)] w-full'
        }
      >
        {/* Sidebar */}
        {!isPhoneFrame && (
          <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-slate-200 bg-white p-5 lg:flex">
            <div className="space-y-5">
              <div className="flex items-center gap-3 px-1">
                <img
                  src={SHOPFLOW_APP_LOGO}
                  alt="ShopFlow"
                  className="h-12 w-12 shrink-0 rounded-2xl object-contain shadow-xs ring-1 ring-slate-200/80"
                />
                <div className="min-w-0">
                  <span className="text-lg font-black tracking-tight text-slate-900">
                    Shop<span className="text-[#0A4DFF]">Flow</span>
                  </span>
                  <p className="truncate text-[10px] font-bold text-emerald-700">
                    {settings.planPaid
                      ? t.proActive
                      : isTrialExpired
                        ? 'Essai terminé'
                        : trialEndsAtMs === null
                          ? 'Essai au démarrage de la boutique'
                          : `Essai de 7 jours · ${trialDaysRemaining} j restants`}
                  </p>
                </div>
              </div>

              {isInstalledApp && trialEndsAtMs === null && (
                <button
                  type="button"
                  onClick={() => setAuthModalConfig({ mode: 'signup', plan: 'pro_ai' })}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A4DFF] px-3 py-3 text-xs font-extrabold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  <PackagePlus className="h-4 w-4" />
                  Créer ma boutique
                </button>
              )}

              <nav className="space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleRequestTab(item.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                        active
                          ? 'bg-[#0A4DFF] text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon
                          className={`h-4 w-4 ${
                            active
                              ? 'text-white'
                              : item.highlight
                                ? 'text-[#0A4DFF]'
                                : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>

                      {isVendorLocked &&
                      item.id !== 'pos' &&
                      item.id !== 'storefront' ? (
                        <Lock className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        item.badge !== undefined && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold tabular-nums ${
                              active
                                ? 'bg-white/20 text-white'
                                : item.id === 'ai'
                                  ? 'bg-[#0A4DFF] text-white'
                                  : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="mt-4 space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
              <div className="flex items-center justify-between gap-1.5">
                <select
                  aria-label="Langue"
                  value={settings.language}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      language: e.target.value as AppLanguage,
                    }))
                  }
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-extrabold text-slate-800"
                >
                  {LANGUAGE_OPTIONS.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.nativeLabel}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() =>
                    setSettings((s) => ({
                      ...s,
                      currency: s.currency === 'FC' ? 'USD' : 'FC',
                    }))
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-extrabold text-slate-800"
                >
                  <Coins className="h-3 w-3 text-emerald-600" />
                  <span>{settings.currency}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleRequestTab('expenses')}
                className="flex w-full items-center gap-2.5 border-t border-slate-200/80 pt-2.5 text-left"
              >
                {settings.shopLogo ? (
                  <img
                    src={settings.shopLogo}
                    alt={settings.shopName}
                    className="h-9 w-9 shrink-0 rounded-full border border-slate-300 object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0A4DFF] text-[11px] font-black text-white">
                    {settings.shopName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">
                    {settings.shopName}
                  </p>
                  <p className="truncate text-[10px] font-semibold text-[#0A4DFF]">
                    Thème, logo & paramètres →
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700">
                <Wifi className="h-3 w-3" />
                <span>{t.offlineReady}</span>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <div
          className={`@container flex flex-1 flex-col ${
            isPhoneFrame ? 'overflow-y-auto' : 'min-w-0'
          }`}
        >
          {/* Sticky Mobile Header */}
          <header
            className={`sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs ${
              isPhoneFrame ? 'sf-safe-top block' : 'sf-safe-top lg:hidden'
            }`}
          >
            <div className="flex min-w-0 items-center justify-between gap-2 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <img
                  src={SHOPFLOW_APP_LOGO}
                  alt="ShopFlow"
                  className="h-9 w-9 shrink-0 rounded-xl object-contain ring-1 ring-slate-200/80"
                />
                <div className="min-w-0">
                  <span className="text-sm font-black tracking-tight text-slate-900">
                    Shop<span className="text-[#0A4DFF]">Flow</span>
                  </span>
                  <p className="max-w-[100px] truncate text-[10px] font-semibold text-slate-500">
                    {settings.shopName}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <select
                  aria-label="Langue"
                  value={settings.language}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      language: e.target.value as AppLanguage,
                    }))
                  }
                  className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-extrabold text-slate-800"
                >
                  {LANGUAGE_OPTIONS.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.code.toUpperCase()}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() =>
                    setSettings((s) => ({
                      ...s,
                      currency: s.currency === 'FC' ? 'USD' : 'FC',
                    }))
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-800"
                >
                  <Coins className="h-3 w-3 text-emerald-600" />
                  <span>{settings.currency}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-3 py-2 text-[11px]">
              <button
                onClick={() => {
                  setScreenMode('landing');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="shrink-0 rounded-full bg-[#0A4DFF] px-3 py-1 font-bold text-white"
              >
                🌐 Site Vitrine
              </button>
              {isInstalledApp && trialEndsAtMs === null && (
                <button
                  onClick={() => setAuthModalConfig({ mode: 'signup', plan: 'pro_ai' })}
                  className="shrink-0 rounded-full bg-emerald-600 px-3 py-1 font-bold text-white"
                >
                  ＋ Créer ma boutique
                </button>
              )}
              <button
                onClick={() => setIsScannerOpen(true)}
                className="shrink-0 rounded-full bg-emerald-600 px-3 py-1 font-bold text-white"
              >
                📷 Scanner Photo
              </button>
              <button
                onClick={() =>
                  isVendorLocked
                    ? setShowPinUnlockModal(true)
                    : handleActivateVendorMode()
                }
                className={`shrink-0 rounded-full px-3 py-1 font-bold text-white ${
                  isVendorLocked ? 'bg-amber-600' : 'bg-slate-700'
                }`}
              >
                {isVendorLocked ? '🔓 Déverrouiller Patron' : '🔒 Mode Vendeur'}
              </button>
              {[
                { id: 'storefront' as NavTab, label: '🌐 Boutique' },
                {
                  id: 'credits' as NavTab,
                  label: `📒 Crédits (${unpaidCreditsCount})`,
                },
                { id: 'subscription' as NavTab, label: '👑 Abonnement' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => handleRequestTab(pill.id)}
                  className={`shrink-0 rounded-full px-3 py-1 font-bold transition ${
                    activeTab === pill.id
                      ? 'bg-[#0A4DFF] text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </header>

          {/* Main View Container */}
          <main
            className={`sf-app-main mx-auto max-w-7xl flex-1 p-4 @md:p-6 ${
              isPhoneFrame ? 'pb-24' : 'pb-24 lg:pb-8'
            }`}
          >
            {trialEndsAtMs !== null && !settings.planPaid && !isTrialExpired && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-950" role="status">
                <span>Essai gratuit : {trialDaysRemaining} jour{trialDaysRemaining === 1 ? '' : 's'} restant{trialDaysRemaining === 1 ? '' : 's'} · débute à la création de la boutique.</span>
                <button type="button" onClick={() => handleRequestTab('subscription')} className="font-extrabold text-blue-800 underline">Voir les formules</button>
              </div>
            )}
            {activeTab === 'dashboard' && (
              <DashboardView
                settings={settings}
                products={localizedProducts}
                sales={localizedSales}
                expenses={expenses}
                credits={credits}
                onNavigate={(targetTab) => handleRequestTab(targetTab)}
                onQuickSellProduct={(p) => handleDirectSellQuantity(p, 1)}
                onRestockProduct={(prod) => {
                  setRestockTarget(prod);
                  setRestockQtyInput('10');
                }}
                onOpenDailyWhatsApp={handleOpenDailyWhatsApp}
                onOpenScanner={() => setIsScannerOpen(true)}
              />
            )}

            {activeTab === 'pos' && (
              <PosSalesView
                settings={settings}
                products={localizedProducts}
                sales={localizedSales}
                onQuickSellProduct={(p) => handleDirectSellQuantity(p, 1)}
                onCompleteCartSale={handleCompleteCartSale}
                onUndoSale={handleUndoSale}
                onOpenVisualReceipt={(payload) => setVisualReceipt(payload)}
                onOpenScanner={() => setIsScannerOpen(true)}
                externalCartAddProduct={scannedCartTrigger}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryView
                settings={settings}
                products={localizedProducts}
                sales={localizedSales}
                onSaveProduct={handleSaveProduct}
                onRestockProduct={(prod) => {
                  setRestockTarget(prod);
                  setRestockQtyInput('10');
                }}
                onQuickSellProduct={(p) => handleDirectSellQuantity(p, 1)}
              />
            )}

            {activeTab === 'ai' && (
              <AiAssistantView
                settings={settings}
                products={localizedProducts}
                sales={localizedSales}
                expenses={expenses}
                credits={credits}
                onExecuteAiActions={handleExecuteAiActions}
                onUpdateVoiceSettings={(autoSpeak: boolean) =>
                  setSettings((prev) => ({ ...prev, autoSpeakAi: autoSpeak }))
                }
              />
            )}

            {activeTab === 'storefront' && (
              <OnlineStoreView
                settings={settings}
                products={products}
                onSettingsChange={setSettings}
                syncStatus={catalogSyncStatus}
              />
            )}

            {activeTab === 'credits' && (
              <CreditsView
                settings={settings}
                credits={credits}
                onRecordCreditPayment={(creditId, amountFC) => {
                  setCredits((prev) =>
                    prev.map((c) =>
                      c.id === creditId
                        ? {
                            ...c,
                            paidAmountFC: Math.min(
                              c.totalAmountFC,
                              c.paidAmountFC + amountFC
                            ),
                          }
                        : c
                    )
                  );
                  showToast(`Avance de ${fmt(amountFC)} enregistrée !`);
                }}
                onAddCreditEntry={(entry) => {
                  setCredits((prev) => [entry, ...prev]);
                  showToast(
                    `Bon de crédit enregistré pour ${entry.customerName}`
                  );
                }}
                onSendCreditReminder={(message, customerName) =>
                  setWhatsAppModal({
                    title: 'Rappel Client WhatsApp',
                    recipient: customerName,
                    message,
                  })
                }
              />
            )}

            {activeTab === 'subscription' && (
              <SubscriptionView
                settings={settings}
                onActivatePlan={handleActivatePlan}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpensesSettingsView
                settings={settings}
                expenses={expenses}
                onAddExpense={(exp) => {
                  setExpenses((prev) => [exp, ...prev]);
                  showToast(`Dépense ajoutée (${fmt(exp.amountFC)})`);
                }}
                onDeleteExpense={(id) => {
                  setExpenses((prev) => prev.filter((e) => e.id !== id));
                  showToast('Dépense retirée');
                }}
                onUpdateSettings={setSettings}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
                onResetDemo={handleResetDemo}
                onActivateVendorLock={handleActivateVendorMode}
              />
            )}
          </main>

          {/* Bottom Navigation Bar */}
          <nav
            className={`${
              isPhoneFrame
                ? 'sticky bottom-0 flex'
                : 'fixed right-0 bottom-0 left-0 flex lg:hidden'
            } sf-safe-bottom z-30 items-center justify-around border-t border-slate-200 bg-white px-1 pt-2 shadow-lg`}
          >
            {mobileBottomItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleRequestTab(item.id)}
                  className={`relative flex flex-1 flex-col items-center gap-1 py-1 text-[11px] font-bold transition ${
                    active ? 'text-[#0A4DFF]' : 'text-slate-400'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      active ? 'text-[#0A4DFF]' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Floating Quick AI Button on Desktop */}
      {activeTab !== 'ai' && !isPhoneFrame && (
        <button
          type="button"
          onClick={() => handleRequestTab('ai')}
          className="fixed right-6 bottom-6 z-40 hidden items-center gap-2 rounded-full bg-[#0A4DFF] px-5 py-3 text-xs font-extrabold text-white shadow-xl transition hover:scale-105 lg:flex"
        >
          <Bot className="h-4 w-4" />
          <span>{t.askAiBtn}</span>
        </button>
      )}
        </>
      )}

      {/* Auth / Signup / Login / Install App Modal */}
      {authModalConfig && (
        <AuthModal
          initialMode={authModalConfig.mode}
          preselectedPlan={authModalConfig.plan}
          defaultCurrency={settings.currency}
          onCompleteSignup={handleCompleteSignup}
          onLoginExisting={(loginId) => {
            setAuthModalConfig(null);
            setIsVendorLocked(false);
            setScreenMode('app');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            showToast(`Bon retour ! Connecté à votre espace (${loginId}).`);
          }}
          onTriggerNativeInstall={async () => {
            if (deferredInstallPromptRef.current) {
              await deferredInstallPromptRef.current.prompt();
              const res = await deferredInstallPromptRef.current.userChoice;
              deferredInstallPromptRef.current = null;
              return res.outcome === 'accepted';
            }
            return false;
          }}
          onClose={() => setAuthModalConfig(null)}
        />
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed right-4 bottom-20 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-xl lg:bottom-20">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Visual Receipt Modal */}
      {visualReceipt && (
        <VisualReceiptModal
          settings={settings}
          receipt={visualReceipt}
          onClose={() => setVisualReceipt(null)}
        />
      )}

      {/* Repaired Photo + Live Camera Barcode Scanner Modal */}
      {isScannerOpen && (
        <BarcodeScannerModal
          settings={settings}
          products={localizedProducts}
          onScanAction={(product, mode) => {
            if (mode === 'instant_sell') {
              handleDirectSellQuantity(product, 1, 'cash', 'Scan Photo/Caméra');
            } else {
              setActiveTab('pos');
              setScannedCartTrigger({ product, nonce: Date.now() });
              showToast(`${product.name} ajouté à la facture !`);
            }
          }}
          onBindBarcodeOrCreateProduct={(prod, isNew, mode) => {
            handleSaveProduct(prod, isNew);
            if (mode === 'instant_sell') {
              setTimeout(() => {
                setSales((prev) => [
                  {
                    id: `sale-${Date.now()}`,
                    productId: prod.id,
                    productName: prod.name,
                    productImage: prod.image,
                    quantity: 1,
                    unitPurchasePriceFC: prod.purchasePriceFC,
                    unitSellingPriceFC: prod.sellingPriceFC,
                    totalRevenueFC: prod.sellingPriceFC,
                    totalCostFC: prod.purchasePriceFC,
                    netProfitFC: prod.sellingPriceFC - prod.purchasePriceFC,
                    paymentMethod: 'cash',
                    customerName: 'Scan Photo',
                    timestamp: new Date().toISOString(),
                  },
                  ...prev,
                ]);
              }, 50);
            } else {
              setActiveTab('pos');
              setScannedCartTrigger({ product: prod, nonce: Date.now() });
            }
          }}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {/* Quick Restock Modal */}
      {restockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PackagePlus className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Réapprovisionner le stock
                </h3>
              </div>
              <button
                onClick={() => setRestockTarget(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleConfirmRestock}
              className="mt-4 space-y-4 text-xs"
            >
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <img
                  src={restockTarget.image}
                  alt={restockTarget.name}
                  className="h-12 w-12 rounded-xl object-cover"
                />
                <div>
                  <p className="font-bold text-slate-900">
                    {restockTarget.name}
                  </p>
                  <p className="text-slate-500">
                    Stock actuel : <strong>{restockTarget.stock}</strong>
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Nouvelle quantité reçue à ajouter
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQtyInput}
                  onChange={(e) => setRestockQtyInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-extrabold text-slate-900 tabular-nums"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRestockTarget(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Text WhatsApp Modal */}
      {whatsAppModal && (
        <WhatsAppModal
          title={whatsAppModal.title}
          recipientLabel={whatsAppModal.recipient}
          message={whatsAppModal.message}
          onClose={() => setWhatsAppModal(null)}
        />
      )}

      {screenMode === 'app' && showStartupSplash && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-white" aria-label="Ouverture de ShopFlow">
          <div className="flex flex-col items-center" style={{ animation: 'sf-logo-pop 1s cubic-bezier(.2,.8,.2,1) both' }}>
            <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] bg-white p-4 shadow-xl ring-1 ring-slate-200/80">
              <img src={SHOPFLOW_APP_LOGO} alt="Logo ShopFlow" className="h-full w-full object-contain" />
            </div>
            <p className="mt-5 text-lg font-black tracking-tight text-slate-900">Shop<span className="text-[#0A4DFF]">Flow</span></p>
          </div>
        </div>
      )}

      {screenMode === 'app' && showFirstRunTour && !showStartupSplash && (
        <FirstRunOnboarding
          step={onboardingStep}
          onStepChange={setOnboardingStep}
          onFinish={finishFirstRunTour}
        />
      )}

      {/* Boss 4-Digit PIN Unlock Modal */}
      {showPinUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Unlock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Accès Réservé au Patron
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Saisissez votre Code PIN Propriétaire
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPinUnlockModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUnlockSubmit} className="mt-5 space-y-4">
              <div>
                <input
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  value={pinAttempt}
                  onChange={(e) => {
                    setPinError(false);
                    setPinAttempt(e.target.value);
                  }}
                  placeholder="••••"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-center font-mono text-2xl font-black tracking-[0.5em] text-slate-900 focus:border-[#0A4DFF] focus:bg-white focus:outline-none"
                />
                {pinError && (
                  <p className="mt-2 text-center text-xs font-bold text-red-600">
                    Code incorrect. Réessayez (code par défaut : 1234).
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinUnlockModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600"
                >
                  Rester en Mode Vendeur
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#0A4DFF] py-2.5 text-xs font-extrabold text-white shadow-xs"
                >
                  Déverrouiller
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
