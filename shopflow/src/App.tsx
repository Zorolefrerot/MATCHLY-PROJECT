import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import {
  BookOpenCheck,
  Bot,
  CheckCircle2,
  Crown,
  Coins,
  ExternalLink,
  Globe,
  LayoutDashboard,
  LoaderCircle,
  Lock,
  LogOut,
  Package,
  PackagePlus,
  Settings,
  ShoppingBag,
  Store,
  Unlock,
  MoreHorizontal,
  X,
} from 'lucide-react';
import type { AiStoreAction } from './components/AiAssistantView';
const AiAssistantView = lazy(() => import('./components/AiAssistantView').then((module) => ({ default: module.AiAssistantView })));
const LandingPageView = lazy(() => import('./components/LandingPageView').then((module) => ({ default: module.LandingPageView })));
const SubscriptionView = lazy(() => import('./components/SubscriptionView').then((module) => ({ default: module.SubscriptionView })));
const CreditsView = lazy(() => import('./components/CreditsView').then((module) => ({ default: module.CreditsView })));
const DashboardView = lazy(() => import('./components/DashboardView').then((module) => ({ default: module.DashboardView })));
const ExpensesSettingsView = lazy(() => import('./components/ExpensesSettingsView').then((module) => ({ default: module.ExpensesSettingsView })));
const InventoryView = lazy(() => import('./components/InventoryView').then((module) => ({ default: module.InventoryView })));
const OnlineStoreView = lazy(() => import('./components/OnlineStoreView').then((module) => ({ default: module.OnlineStoreView })));
const PosSalesView = lazy(() => import('./components/PosSalesView').then((module) => ({ default: module.PosSalesView })));
const VisualReceiptModal = lazy(() => import('./components/VisualReceiptModal').then((module) => ({ default: module.VisualReceiptModal })));
const BarcodeScannerModal = lazy(() => import('./components/BarcodeScannerModal').then((module) => ({ default: module.BarcodeScannerModal })));
import { FirstRunOnboarding } from './components/FirstRunOnboarding';
import {
  AuthModal,
  AuthModalMode,
  SignupPayload,
} from './components/AuthModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import {
  INITIAL_SETTINGS,
  PRESET_PRODUCT_PHOTOS,
  SHOPFLOW_APP_LOGO,
  sfAsset,
} from './data/initialData';
import { translateStringSync } from './i18n/fullTranslator';
import { LANGUAGE_OPTIONS } from './i18n/translations';
import i18n, { LANGUAGE_STORAGE_KEY } from './i18n';
import {
  AppLanguage,
  CartItem,
  CreditEntry,
  ExpenseEntry,
  NavTab,
  PaymentMethod,
  Product,
  SaleRecord,
  ShopSettings,
  SubscriptionPlanId,
  VisualReceiptPayload,
} from './types';
import { formatMoney, fromDisplayAmount, toDisplayAmount } from './utils/currency';
import { getPublicCatalogAppBase, makePublicCatalogSnapshot, updateLivePublicCatalog } from './utils/publicCatalog';
import { parseSaleDate } from './utils/saleDate';
import {
  authRedirectUrl,
  isOAuthProviderEnabled,
  isSupabaseConfigured,
  supabase,
  type OAuthProvider,
} from './lib/supabase';
import {
  clearPendingOAuthShopSetup,
  createOwnedShop,
  getAuthErrorMessage,
  getMyBillingAccount,
  getPendingOAuthShopOwnerPin,
  getPendingOAuthShopSetup,
  getPendingOwnerPin,
  getShopOnboardingFromUser,
  clearPendingOwnerPin,
  listMyShops,
  sendPasswordReset,
  signInWithEmail,
  signInWithOAuth,
  updatePassword,
  type BillingAccountSummary,
  type ShopOnboardingInput,
  type ShopSummary,
} from './services/supabaseAuth';
import {
  importLocalSnapshotToShop,
  loadShopSnapshot,
  refreshCachedSnapshotImages,
  saveShopSnapshot,
  snapshotCounts,
  type ShopDataSnapshot,
} from './services/shopData';

const STORAGE_KEY = 'shopflow_rdc_mockup_v4';
const BILLING_TEST_MODE = true;
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
  // Normalize legacy or malformed locale values while preserving the five supported languages.
  if (!['fr', 'en', 'ln', 'sw', 'zh'].includes(merged.language)) merged.language = 'fr';
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

const shopStorageKey = (shopId: string) => `shopflow_account_shop_v1_${shopId}`;
const accountLegacyBackupKey = (userId: string) => `shopflow_legacy_backup_v1_${userId}`;
const legacyImportMarkerKey = (userId: string) => `shopflow_legacy_imported_by_${userId}`;

const readLocalSnapshot = (key: string): ShopDataSnapshot | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed.settings || typeof parsed.settings !== 'object') return null;
    return {
      settings: sanitizeLegacySettings(parsed.settings as Partial<ShopSettings>),
      products: removeLegacySampleRecords<Product>(parsed.products),
      sales: removeLegacySampleRecords<SaleRecord>(parsed.sales),
      credits: removeLegacySampleRecords<CreditEntry>(parsed.credits),
      expenses: removeLegacySampleRecords<ExpenseEntry>(parsed.expenses),
    };
  } catch {
    return null;
  }
};

const mergeShopSnapshots = (
  cached: ShopDataSnapshot | null,
  remote: ShopDataSnapshot | null,
): ShopDataSnapshot | null => {
  if (!cached) return remote;
  if (!remote) return cached;
  const mergeById = <T extends { id: string }>(remoteItems: T[], cachedItems: T[]): T[] => {
    const merged = new Map(remoteItems.map((item) => [item.id, item]));
    // Keep device-local additions/edits, while retaining records created on another device.
    for (const item of cachedItems) merged.set(item.id, item);
    return [...merged.values()];
  };
  return {
    settings: { ...remote.settings, ...cached.settings },
    products: mergeById(remote.products, cached.products),
    sales: mergeById(remote.sales, cached.sales),
    credits: mergeById(remote.credits, cached.credits),
    expenses: mergeById(remote.expenses, cached.expenses),
  };
};

const snapshotHasMerchantData = (snapshot: ShopDataSnapshot | null): boolean => {
  if (!snapshot) return false;
  const localOnlySettings = new Set(['ownerPin', 'activePlan', 'planPaid', 'trialStartedAt', 'publicCatalogToken']);
  const defaultSettings = INITIAL_SETTINGS as unknown as Record<string, unknown>;
  const settingsWereCustomized = Object.entries(snapshot.settings).some(([key, value]) =>
    !localOnlySettings.has(key) && JSON.stringify(value) !== JSON.stringify(defaultSettings[key])
  );
  return Boolean(
    snapshot.products.length || snapshot.sales.length || snapshot.credits.length ||
    snapshot.expenses.length || settingsWereCustomized
  );
};

export function App() {
  const appRootRef = useRef<HTMLDivElement | null>(null);
  const { t: i18nText } = useTranslation();

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
  } | null>(() => isInstalledApp && !supabase ? { mode: 'signup', plan: 'pro_ai' } : null);
  const [authBootstrapComplete, setAuthBootstrapComplete] = useState(!isInstalledApp || !supabase);
  const [startupDelayElapsed, setStartupDelayElapsed] = useState(!isInstalledApp);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [accountShops, setAccountShops] = useState<ShopSummary[]>([]);
  const [activeShop, setActiveShop] = useState<ShopSummary | null>(null);
  const [billingAccount, setBillingAccount] = useState<BillingAccountSummary | null>(null);
  const [activeStorageKey, setActiveStorageKey] = useState(STORAGE_KEY);
  const [shopDataReady, setShopDataReady] = useState(false);
  const [legacyImportPending, setLegacyImportPending] = useState(false);
  const [importSource, setImportSource] = useState<'legacy' | 'shop_cache' | null>(null);
  const [importPreviewCounts, setImportPreviewCounts] = useState({ products: 0, sales: 0, credits: 0, expenses: 0 });
  const [isImportingLocal, setIsImportingLocal] = useState(false);
  const [accountLoadError, setAccountLoadError] = useState<string | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [cloudSyncRetryEpoch, setCloudSyncRetryEpoch] = useState(0);
  const authUserRef = useRef<User | null>(null);
  const authProcessingRef = useRef(false);
  const accountLoadedUserRef = useRef<string | null>(null);
  const shopActivationRef = useRef<string | null>(null);
  const shopActivationSequenceRef = useRef(0);
  const deferredInstallPromptRef = useRef<{
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  } | null>(null);


  const [settings, setSettings] = useState<ShopSettings>(INITIAL_SETTINGS);
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);
  const [trialNow, setTrialNow] = useState(() => Date.now());
  const trialStartedAtMs = Date.parse(settings.trialStartedAt || '');
  const trialEndsAtMs = !BILLING_TEST_MODE && Number.isFinite(trialStartedAtMs) && trialStartedAtMs > 0
    ? trialStartedAtMs + TRIAL_DURATION_MS
    : null;
  const isTrialExpired = Boolean(
    !BILLING_TEST_MODE && trialEndsAtMs !== null && !settings.planPaid && trialNow >= trialEndsAtMs
  );
  const trialDaysRemaining = trialEndsAtMs === null
    ? 7
    : Math.max(0, Math.ceil((trialEndsAtMs - trialNow) / DAY_MS));
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogSyncStatus, setCatalogSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [catalogNetworkEpoch, setCatalogNetworkEpoch] = useState(0);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const productImagesRef = useRef(products);
  const saleImagesRef = useRef(sales);
  productImagesRef.current = products;
  saleImagesRef.current = sales;
  const [credits, setCredits] = useState<CreditEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [showStartupSplash, setShowStartupSplash] = useState(isInstalledApp);
  const [showFirstRunTour, setShowFirstRunTour] = useState(false);

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
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedCartTrigger, setScannedCartTrigger] = useState<{ product: Product; nonce: number } | null>(null);

  // Quick sale: make delivery charges an explicit seller choice.
  const [quickSaleTarget, setQuickSaleTarget] = useState<Product | null>(null);
  const [quickSaleWithDelivery, setQuickSaleWithDelivery] = useState(false);
  const [quickSaleDeliveryInput, setQuickSaleDeliveryInput] = useState('');


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
    const snapshot = readLocalSnapshot(STORAGE_KEY);
    let storedLanguage: AppLanguage | null = null;
    try {
      const candidate = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (candidate && ['fr', 'en', 'ln', 'sw', 'zh'].includes(candidate)) storedLanguage = candidate as AppLanguage;
    } catch { /* Use the saved shop setting if browser storage is unavailable. */ }
    if (snapshot) {
      setSettings({ ...snapshot.settings, language: storedLanguage || snapshot.settings.language, activePlan: 'starter', planPaid: false, trialStartedAt: '' });
      setProducts(snapshot.products);
      setSales(snapshot.sales);
      setCredits(snapshot.credits);
      setExpenses(snapshot.expenses);
    } else if (storedLanguage) {
      setSettings({ ...INITIAL_SETTINGS, language: storedLanguage });
    }
    setActiveStorageKey(STORAGE_KEY);
    setHasLoadedSettings(true);
  }, []);

  useEffect(() => {
    if (!isInstalledApp) return;
    const timer = window.setTimeout(() => setStartupDelayElapsed(true), 800);
    return () => window.clearTimeout(timer);
  }, [isInstalledApp]);

  useEffect(() => {
    if (isInstalledApp && startupDelayElapsed && authBootstrapComplete) {
      setShowStartupSplash(false);
    }
  }, [isInstalledApp, startupDelayElapsed, authBootstrapComplete]);

  useEffect(() => {
    if (!isInstalledApp || !authUser || !activeShop || !shopDataReady) return;
    let alreadyCompleted = false;
    try { alreadyCompleted = localStorage.getItem(FIRST_RUN_TOUR_KEY) === 'done'; } catch { /* optional */ }
    if (alreadyCompleted) return;
    const timer = window.setTimeout(() => setShowFirstRunTour(true), 350);
    return () => window.clearTimeout(timer);
  }, [isInstalledApp, authUser, activeShop, shopDataReady]);

  const finishFirstRunTour = () => {
    try {
      localStorage.setItem(FIRST_RUN_TOUR_KEY, 'done');
    } catch {
      // The tutorial can still be dismissed if storage is unavailable.
    }
    setShowFirstRunTour(false);
  };

  useEffect(() => {
    if (!hasLoadedSettings || (authUserRef.current && !shopDataReady)) return;
    try {
      localStorage.setItem(
        activeStorageKey,
        JSON.stringify({ settings, products, sales, credits, expenses })
      );
    } catch {
      // Ignore quota errors
    }
  }, [hasLoadedSettings, activeStorageKey, shopDataReady, settings, products, sales, credits, expenses]);

  // Supabase signed photo URLs expire; refresh them during long sessions and when a PWA returns to foreground.
  useEffect(() => {
    if (!authUser || !activeShop || !shopDataReady) return;
    let cancelled = false;
    let refreshing = false;
    const refreshImages = async () => {
      if (refreshing) return;
      const currentProducts = productImagesRef.current;
      const currentSales = saleImagesRef.current;
      if (![...currentProducts, ...currentSales].some((item) => item.cloudImagePath)) return;
      refreshing = true;
      try {
        const refreshed = await refreshCachedSnapshotImages({
          settings: INITIAL_SETTINGS,
          products: currentProducts,
          sales: currentSales,
          credits: [],
          expenses: [],
        });
        if (cancelled) return;
        const productUrls = new Map(refreshed.products.map((product) => [product.id, product.image]));
        const saleUrls = new Map(refreshed.sales.map((sale) => [sale.id, sale.productImage]));
        setProducts((current) => current.map((product) => {
          const image = productUrls.get(product.id);
          return image && image !== product.image ? { ...product, image } : product;
        }));
        setSales((current) => current.map((sale) => {
          const productImage = saleUrls.get(sale.id);
          return productImage && productImage !== sale.productImage ? { ...sale, productImage } : sale;
        }));
      } catch {
        // Keep local copies visible if cloud signing is briefly unavailable.
      } finally {
        refreshing = false;
      }
    };
    const interval = window.setInterval(() => { void refreshImages(); }, 45 * 60 * 1000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refreshImages();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [authUser, activeShop?.id, shopDataReady]);

  // Save each authenticated shop snapshot to Supabase after local edits; the device cache
  // remains the fast/offline copy, while this push preserves sales across sessions/devices.
  useEffect(() => {
    if (!authUser || !activeShop || !shopDataReady || isImportingLocal || legacyImportPending) return;
    let cancelled = false;
    const shopId = activeShop.id;
    const snapshot: ShopDataSnapshot = { settings, products, sales, credits, expenses };
    const timer = window.setTimeout(async () => {
      setCloudSyncStatus('syncing');
      try {
        const saved = await saveShopSnapshot(shopId, snapshot);
        if (cancelled) return;
        const savedProducts = new Map(saved.products.map((product) => [product.id, product]));
        const savedSales = new Map(saved.sales.map((sale) => [sale.id, sale]));
        setProducts((current) => current.map((product) => {
          const persisted = savedProducts.get(product.id);
          return persisted && (persisted.cloudImagePath !== product.cloudImagePath || persisted.cloudImageHash !== product.cloudImageHash)
            ? { ...product, cloudImagePath: persisted.cloudImagePath, cloudImageHash: persisted.cloudImageHash }
            : product;
        }));
        setSales((current) => current.map((sale) => {
          const persisted = savedSales.get(sale.id);
          return persisted && (persisted.cloudImagePath !== sale.cloudImagePath || persisted.cloudImageHash !== sale.cloudImageHash)
            ? { ...sale, cloudImagePath: persisted.cloudImagePath, cloudImageHash: persisted.cloudImageHash }
            : sale;
        }));
        setCloudSyncStatus('synced');
      } catch {
        if (!cancelled) setCloudSyncStatus('error');
      }
    }, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [authUser, activeShop?.id, shopDataReady, isImportingLocal, legacyImportPending, cloudSyncRetryEpoch, settings, products, sales, credits, expenses]);

  useEffect(() => {
    const retryCatalogSync = () => {
      setCatalogNetworkEpoch((current) => current + 1);
      setCloudSyncRetryEpoch((current) => current + 1);
    };
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
    if (BILLING_TEST_MODE || trialEndsAtMs === null || settings.planPaid || Date.now() >= trialEndsAtMs) return;
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
    if (!hasLoadedSettings) return;
    void i18n.changeLanguage(settings.language);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, settings.language);
    } catch { /* Settings remain saved with the shop data if local storage is unavailable. */ }
  }, [hasLoadedSettings, settings.language]);

  const handleCompleteSignup = async (payload: SignupPayload): Promise<void> => {
    if (!authUserRef.current) throw new Error('SOCIAL_SIGNUP_REQUIRED');
    const onboarding: ShopOnboardingInput = {
      shopName: payload.shopName,
      ownerName: payload.ownerName,
      city: payload.city,
      whatsappNumber: payload.whatsappNumber,
      currency: payload.currency,
      selectedPlan: payload.selectedPlan,
    };

    const createdShopId = await createOwnedShop(onboarding);
    clearPendingOAuthShopSetup();
    const [shops, billing] = await Promise.all([listMyShops(), getMyBillingAccount()]);
    setAccountShops(shops);
    setBillingAccount(billing);
    const newShop = shops.find((shop) => shop.id === createdShopId);
    if (!newShop) throw new Error('SHOP_CREATION_FAILED');
    await activateAccountShop(newShop, shops, billing);
    setSettings((previous) => ({ ...previous, ownerPin: payload.ownerPin || previous.ownerPin }));
    setActiveTab('dashboard');
    setAuthModalConfig(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`La boutique « ${newShop.name} » est prête.`);
  };

  const handleLoginExisting = async (email: string, password: string) => {
    const { error } = await signInWithEmail(email, password);
    if (error) throw error;
  };

  const handleOAuthSignIn = async (provider: OAuthProvider, payload?: SignupPayload) => {
    const onboarding = payload ? {
      shopName: payload.shopName,
      ownerName: payload.ownerName,
      city: payload.city,
      whatsappNumber: payload.whatsappNumber,
      currency: payload.currency,
      selectedPlan: payload.selectedPlan,
    } satisfies ShopOnboardingInput : undefined;
    const { error } = await signInWithOAuth(provider, onboarding, payload?.ownerPin);
    if (error) throw error;
  };

  const handlePasswordReset = async (email: string) => {
    if (!email.trim()) throw new Error('EMAIL_REQUIRED');
    const { error } = await sendPasswordReset(email);
    if (error) throw error;
  };

  const handlePasswordUpdate = async (password: string) => {
    await updatePassword(password);
    setAuthModalConfig(null);
    showToast('Votre mot de passe a été mis à jour.');
  };

  useEffect(() => {
    if (!hasLoadedSettings || !supabase) return;
    let cancelled = false;

    const processAuthUser = async (user: User | null) => {
      if (cancelled) return;
      if (!user) {
        if (!authUserRef.current) {
          if (isInstalledApp) {
            setScreenMode('app');
            setAuthModalConfig({ mode: 'signup', plan: 'pro_ai' });
          }
          setAuthBootstrapComplete(true);
          return;
        }
        shopActivationSequenceRef.current += 1;
        shopActivationRef.current = null;
        authUserRef.current = null;
        accountLoadedUserRef.current = null;
        setAuthUser(null);
        setAccountShops([]);
        setActiveShop(null);
        setBillingAccount(null);
        setActiveStorageKey(STORAGE_KEY);
        setShopDataReady(false);
        setLegacyImportPending(false);
        setImportSource(null);
        setImportPreviewCounts({ products: 0, sales: 0, credits: 0, expenses: 0 });
        const local = readLocalSnapshot(STORAGE_KEY);
        setSettings(local ? { ...local.settings, activePlan: 'starter', planPaid: false, trialStartedAt: '' } : INITIAL_SETTINGS);
        setProducts(local?.products || []);
        setSales(local?.sales || []);
        setCredits(local?.credits || []);
        setExpenses(local?.expenses || []);
        setAuthModalConfig(isInstalledApp ? { mode: 'signup', plan: 'pro_ai' } : null);
        setScreenMode(isInstalledApp ? 'app' : 'landing');
        setAuthBootstrapComplete(true);
        return;
      }
      const profileLanguage = user.user_metadata?.shopflow_language;
      if (typeof profileLanguage === 'string' && ['fr', 'en', 'ln', 'sw', 'zh'].includes(profileLanguage)) {
        const savedLanguage = profileLanguage as AppLanguage;
        setSettings((previous) => ({ ...previous, language: savedLanguage }));
        void i18n.changeLanguage(savedLanguage);
        try { localStorage.setItem(LANGUAGE_STORAGE_KEY, savedLanguage); } catch { /* Auth metadata remains available. */ }
      }
      if (accountLoadedUserRef.current === user.id || authProcessingRef.current) return;
      authProcessingRef.current = true;
      try {
        authUserRef.current = user;
        setAuthUser(user);
        setScreenMode('app');
        setAccountLoadError(null);
        let [shops, billing] = await Promise.all([listMyShops(), getMyBillingAccount()]);
        let createdFromPendingSetup = false;
        let pendingOwnerPin: string | null = null;
        if (!shops.length) {
          const metadataOnboarding = getShopOnboardingFromUser(user);
          const oauthOnboarding = getPendingOAuthShopSetup();
          const onboarding = metadataOnboarding || oauthOnboarding;
          if (onboarding) {
            pendingOwnerPin = getPendingOAuthShopOwnerPin() || (user.email ? getPendingOwnerPin(user.email) : null);
            await createOwnedShop(onboarding);
            createdFromPendingSetup = true;
            clearPendingOAuthShopSetup();
            if (user.email) clearPendingOwnerPin(user.email);
            [shops, billing] = await Promise.all([listMyShops(), getMyBillingAccount()]);
          }
        } else {
          clearPendingOAuthShopSetup();
          if (user.email) clearPendingOwnerPin(user.email);
        }
        if (!shops.length) {
          setAccountShops([]);
          setBillingAccount(billing);
          setScreenMode('app');
          setAuthModalConfig({ mode: 'signup', plan: 'pro_ai' });
          accountLoadedUserRef.current = user.id;
          return;
        }
        setAccountShops(shops);
        setBillingAccount(billing);
        const selected = shops[0];
        await activateAccountShop(selected, shops, billing);
        if (createdFromPendingSetup && pendingOwnerPin) {
          setSettings((previous) => ({ ...previous, ownerPin: pendingOwnerPin! }));
        }
        accountLoadedUserRef.current = user.id;
        setAuthModalConfig(null);
        setActiveTab('dashboard');
        showToast(`Compte connecté : ${shops.length} boutique(s) disponible(s).`);
      } catch (error) {
        setAccountLoadError(getAuthErrorMessage(error));
        showToast(getAuthErrorMessage(error));
      } finally {
        authProcessingRef.current = false;
        setAuthBootstrapComplete(true);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      window.setTimeout(() => {
        void (async () => {
          await processAuthUser(session?.user || null);
          if (event === 'PASSWORD_RECOVERY') setAuthModalConfig({ mode: 'reset_password' });
        })();
      }, 0);
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      void processAuthUser(data.session?.user || null);
    }).catch((error) => {
      if (!cancelled) {
        setAccountLoadError(getAuthErrorMessage(error));
        if (isInstalledApp) setAuthModalConfig({ mode: 'signup', plan: 'pro_ai' });
        setAuthBootstrapComplete(true);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [hasLoadedSettings, isInstalledApp]);

  const handleRequestTab = (targetTab: NavTab) => {
    if (isTrialExpired && targetTab !== 'subscription') {
      setActiveTab('subscription');
      showToast('Votre essai de 7 jours est terminé. Choisissez une formule pour continuer.');
      return;
    }
    const vendorAllowedTabs: NavTab[] = ['pos', 'storefront', 'more'];
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

  const persistLanguageChoice = (language: AppLanguage) => {
    void i18n.changeLanguage(language);
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, language); } catch { /* Use the shop/profile setting as backup. */ }
    if (supabase && authUserRef.current) {
      void supabase.auth.updateUser({ data: { shopflow_language: language } })
        .then(({ data, error }) => {
          if (!error && data.user) {
            authUserRef.current = data.user;
            setAuthUser(data.user);
          }
        })
        .catch(() => { /* Language remains persisted locally and with the shop snapshot. */ });
    }
  };

  const handleLanguageChange = (language: AppLanguage) => {
    setSettings((previous) => ({ ...previous, language }));
    persistLanguageChoice(language);
  };

  const handleUpdateSettings = (next: ShopSettings) => {
    setSettings(next);
    if (next.language !== settings.language) persistLanguageChoice(next.language);
  };

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

  const activateAccountShop = async (
    shop: ShopSummary,
    shops: ShopSummary[],
    billing: BillingAccountSummary | null,
  ) => {
    if (shopActivationRef.current === shop.id) return;
    const activationSequence = ++shopActivationSequenceRef.current;
    shopActivationRef.current = shop.id;
    setShopDataReady(false);
    setAccountLoadError(null);
    try {
      const storageKey = shopStorageKey(shop.id);
      const cachedSnapshot = readLocalSnapshot(storageKey);
      let remoteSnapshot: ShopDataSnapshot | null = null;
      try {
        remoteSnapshot = await loadShopSnapshot(shop.id);
      } catch (error) {
        if (!cachedSnapshot) throw error;
        setAccountLoadError('Connexion indisponible : données locales de cette boutique chargées.');
      }
      if (activationSequence !== shopActivationSequenceRef.current) return;
      let legacySnapshot: ShopDataSnapshot | null = null;
      const importingUserId = authUserRef.current?.id;
      if (importingUserId) {
        const backupKey = accountLegacyBackupKey(importingUserId);
        try {
          if (!localStorage.getItem(legacyImportMarkerKey(importingUserId)) && !localStorage.getItem(backupKey)) {
            const originalLocalData = localStorage.getItem(STORAGE_KEY);
            if (originalLocalData) localStorage.setItem(backupKey, originalLocalData);
          }
          legacySnapshot = readLocalSnapshot(backupKey);
        } catch { /* Never block cloud shop access if local backup storage is unavailable. */ }
      } else {
        legacySnapshot = readLocalSnapshot(STORAGE_KEY);
      }
      // Merge the device cache with the cloud snapshot so unsynced sales survive and records
      // created on other devices are not replaced by an older local copy.
      const refreshedCache = cachedSnapshot
        ? await refreshCachedSnapshotImages(cachedSnapshot)
        : null;
      const selectedSnapshot = mergeShopSnapshots(refreshedCache, remoteSnapshot);
      if (activationSequence !== shopActivationSequenceRef.current) return;
      const profileLanguageValue = authUserRef.current?.user_metadata?.shopflow_language;
      const profileLanguage = typeof profileLanguageValue === 'string' && ['fr', 'en', 'ln', 'sw', 'zh'].includes(profileLanguageValue)
        ? profileLanguageValue as AppLanguage
        : null;
      let deviceLanguage: AppLanguage | null = null;
      try {
        const candidate = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (candidate && ['fr', 'en', 'ln', 'sw', 'zh'].includes(candidate)) deviceLanguage = candidate as AppLanguage;
      } catch { /* Use the account's saved setting when local storage is unavailable. */ }
      const initialSettings = sanitizeLegacySettings({
        ...INITIAL_SETTINGS,
        ...(selectedSnapshot?.settings || {}),
        shopName: shop.name,
        city: shop.city,
        whatsappNumber: shop.whatsapp_number,
        currency: shop.currency,
        language: profileLanguage || deviceLanguage || selectedSnapshot?.settings.language || INITIAL_SETTINGS.language,
        activePlan: billing?.plan_id || 'starter',
        planPaid: billing?.status === 'active',
        trialStartedAt: billing?.trial_started_at || '',
        ownerPin: cachedSnapshot?.settings.ownerPin || INITIAL_SETTINGS.ownerPin,
        publicCatalogId: cachedSnapshot?.settings.publicCatalogId,
        publicCatalogToken: cachedSnapshot?.settings.publicCatalogToken,
      });
      setAuthUser(authUserRef.current);
      setAccountShops(shops);
      setBillingAccount(billing);
      setActiveShop(shop);
      setSettings(initialSettings);
      setProducts(selectedSnapshot?.products || []);
      setSales(selectedSnapshot?.sales || []);
      setCredits(selectedSnapshot?.credits || []);
      setExpenses(selectedSnapshot?.expenses || []);
      setActiveStorageKey(storageKey);
      let legacyAlreadyImported = false;
      try {
        const userId = authUserRef.current?.id;
        legacyAlreadyImported = Boolean(userId && localStorage.getItem(legacyImportMarkerKey(userId)));
      } catch { /* local import marker is only a duplicate-warning aid */ }
      const nextImportSource = !remoteSnapshot && snapshotHasMerchantData(cachedSnapshot)
        ? 'shop_cache'
        : !remoteSnapshot && !cachedSnapshot && !legacyAlreadyImported && snapshotHasMerchantData(legacySnapshot)
          ? 'legacy'
          : null;
      setImportSource(nextImportSource);
      const importPreview = nextImportSource === 'shop_cache' ? cachedSnapshot : nextImportSource === 'legacy' ? legacySnapshot : null;
      setImportPreviewCounts(importPreview ? snapshotCounts(importPreview) : { products: 0, sales: 0, credits: 0, expenses: 0 });
      setLegacyImportPending(Boolean(nextImportSource));
      setAuthModalConfig(null);
      setIsVendorLocked(false);
      setScreenMode('app');
      setShopDataReady(true);
    } catch (error) {
      setAccountLoadError(getAuthErrorMessage(error));
      setShopDataReady(Boolean(activeShop));
      showToast('Impossible de charger cette boutique. Vérifiez la connexion puis réessayez.');
    } finally {
      if (activationSequence === shopActivationSequenceRef.current) {
        shopActivationRef.current = null;
      }
    }
  };

  const importLocalDataToAccount = async () => {
    if (!activeShop || !importSource || isImportingLocal) return;
    const sourceKey = importSource === 'legacy' && authUserRef.current
      ? accountLegacyBackupKey(authUserRef.current.id)
      : importSource === 'legacy' ? STORAGE_KEY : activeStorageKey;
    const source = readLocalSnapshot(sourceKey);
    if (!source || !snapshotHasMerchantData(source)) {
      setLegacyImportPending(false);
      setImportSource(null);
      setImportPreviewCounts({ products: 0, sales: 0, credits: 0, expenses: 0 });
      showToast('Aucune donnée de boutique à importer n’a été trouvée.');
      return;
    }
    const counts = snapshotCounts(source);
    const countText = `les paramètres de boutique, ${counts.products} article(s), ${counts.sales} vente(s), ${counts.credits} crédit(s) et ${counts.expenses} dépense(s)`;
    if (!window.confirm(`Importer ${countText} dans « ${activeShop.name} » ? La sauvegarde locale d’origine restera conservée. L’import ne peut être effectué que vers une boutique cloud vide.`)) return;

    setIsImportingLocal(true);
    try {
      const imported = await importLocalSnapshotToShop(activeShop.id, source);
      const settingsForShop = sanitizeLegacySettings({
        ...imported.settings,
        shopName: activeShop.name,
        city: activeShop.city || imported.settings.city,
        whatsappNumber: activeShop.whatsapp_number || imported.settings.whatsappNumber,
        currency: activeShop.currency,
        activePlan: billingAccount?.plan_id || imported.settings.activePlan,
        planPaid: billingAccount?.status === 'active',
        trialStartedAt: billingAccount?.trial_started_at || imported.settings.trialStartedAt,
      });
      setSettings(settingsForShop);
      setProducts(imported.products);
      setSales(imported.sales);
      setCredits(imported.credits);
      setExpenses(imported.expenses);
      if (importSource === 'legacy' && authUserRef.current) {
        try { localStorage.setItem(legacyImportMarkerKey(authUserRef.current.id), activeShop.id); } catch { /* backup remains intact */ }
      }
      setLegacyImportPending(false);
      setImportSource(null);
      setImportPreviewCounts({ products: 0, sales: 0, credits: 0, expenses: 0 });
      showToast('Import terminé. La sauvegarde locale d’origine n’a pas été supprimée.');
    } catch (error) {
      setAccountLoadError(getAuthErrorMessage(error));
      showToast('L’import a échoué; la sauvegarde locale est restée intacte.');
    } finally {
      setIsImportingLocal(false);
    }
  };

  const handleSelectAccountShop = async (shopId: string) => {
    const shop = accountShops.find((candidate) => candidate.id === shopId);
    if (!shop || !billingAccount) return;
    await activateAccountShop(shop, accountShops, billingAccount);
    setActiveTab('dashboard');
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      showToast('La déconnexion a échoué. Réessayez.');
      return;
    }
    showToast('Compte déconnecté. Vos sauvegardes locales sont conservées.');
  };

  const fmt = (val: number) =>
    formatMoney(val, settings.currency, settings.usdRateFC);
  const nextCurrency = settings.currency === 'FC' ? 'USD' : 'FC';
  const currencyToggleLabel = i18nText('currency.change', { currency: nextCurrency });
  const toggleCurrency = () => setSettings((previous) => ({
    ...previous,
    currency: previous.currency === 'FC' ? 'USD' : 'FC',
  }));

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
    label?: string,
    deliveryFeeFC: number = 0
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
      deliveryFeeFC,
      timestamp: new Date().toISOString(),
    };

    setSales((prev) => [newSale, ...prev]);
    showToast(
      `+${qty} ${product.name} → +${fmt(unitProfit * qty)}`
    );
  };

  const openQuickSale = (product: Product) => {
    setQuickSaleTarget(product);
    setQuickSaleWithDelivery(false);
    setQuickSaleDeliveryInput(
      settings.defaultDeliveryFeeFC > 0
        ? String(toDisplayAmount(settings.defaultDeliveryFeeFC, settings.currency, settings.usdRateFC))
        : ''
    );
  };

  const confirmQuickSale = () => {
    if (!quickSaleTarget) return;
    const deliveryFeeFC = quickSaleWithDelivery
      ? fromDisplayAmount(Number(quickSaleDeliveryInput) || 0, settings.currency, settings.usdRateFC)
      : 0;
    handleDirectSellQuantity(quickSaleTarget, 1, 'cash', undefined, deliveryFeeFC);
    setQuickSaleTarget(null);
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
      const itemTotalFC = items.reduce(
        (s, i) => s + i.product.sellingPriceFC * i.quantity,
        0
      );
      const totalCreditFC = itemTotalFC + deliveryFeeFC;
      const summary = [
        ...items.map((i) => `${i.quantity}x ${i.product.name}`),
        ...(deliveryFeeFC > 0 ? [`Livraison : ${fmt(deliveryFeeFC)}`] : []),
      ].join(', ');

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

  const handleDeleteProduct = (product: Product) => {
    setProducts((prev) => prev.filter((item) => item.id !== product.id));
    showToast(`« ${product.name} » supprimé du stock et du catalogue.`);
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

      setSettings({
        ...sanitizeLegacySettings(backup.settings as ShopSettings),
        activePlan: billingAccount?.plan_id || 'starter',
        planPaid: billingAccount?.status === 'active',
        trialStartedAt: billingAccount?.trial_started_at || '',
      });
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
    localStorage.removeItem(activeStorageKey);
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

  const sidebarItems: {
    id: NavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'dashboard', label: i18nText('nav.dashboard'), icon: LayoutDashboard },
    { id: 'pos', label: i18nText('nav.sell'), icon: ShoppingBag },
    { id: 'inventory', label: i18nText('nav.inventory'), icon: Package },
    { id: 'more', label: i18nText('nav.more'), icon: MoreHorizontal },
  ];

  const mobileBottomItems: {
    id: NavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'dashboard', label: i18nText('nav.home'), icon: LayoutDashboard },
    { id: 'pos', label: i18nText('nav.mobileSell'), icon: ShoppingBag },
    { id: 'inventory', label: i18nText('nav.mobileStock'), icon: Package },
    { id: 'more', label: i18nText('nav.mobileMore'), icon: MoreHorizontal },
  ];

  const moreCopy = {
    title: i18nText('more.title'),
    subtitle: i18nText('more.subtitle'),
    ai: i18nText('more.ai'),
    store: i18nText('more.store'),
    credits: i18nText('more.credits'),
    settings: i18nText('more.settings'),
    plans: i18nText('more.plans'),
    site: i18nText('more.site'),
    vendor: i18nText('more.vendor'),
    patron: i18nText('more.patron'),
  };
  const moreItems: { id: NavTab; title: string; description: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'storefront', title: i18nText('nav.storefront'), description: moreCopy.store, icon: Globe },
    { id: 'credits', title: i18nText('nav.credits'), description: moreCopy.credits, icon: BookOpenCheck },
    { id: 'expenses', title: i18nText('nav.settings'), description: moreCopy.settings, icon: Settings },
    { id: 'ai', title: i18nText('nav.ai'), description: moreCopy.ai, icon: Bot },
    { id: 'subscription', title: i18nText('nav.subscription'), description: moreCopy.plans, icon: Crown },
  ];


  const themeInlineStyle = {
    '--sf-primary': settings.theme.primaryColor,
    '--sf-primary-dark': settings.theme.primaryDarkColor,
    '--sf-accent': settings.theme.accentColor,
  } as React.CSSProperties;
  const renderLanguageSelector = (className: string) => (
    <label className={`inline-flex items-center rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 ${className}`}>
      <span className="sr-only">{i18nText('language.select')}</span>
      <select
        aria-label={i18nText('language.select')}
        title={i18nText('language.select')}
        value={settings.language}
        onChange={(event) => handleLanguageChange(event.target.value as AppLanguage)}
        className="max-w-full cursor-pointer bg-transparent py-2 outline-none"
      >
        {LANGUAGE_OPTIONS.map((language) => (
          <option key={language.code} value={language.code}>{language.flag} {language.code.toUpperCase()}</option>
        ))}
      </select>
    </label>
  );

  return (
    <div
      id="shopflow-theme-root"
      ref={appRootRef}
      style={themeInlineStyle}
      data-mode={screenMode === 'landing' ? 'light' : settings.theme.colorMode}
      data-corners={settings.theme.cornerStyle}
      data-density={settings.theme.density}
      data-font={settings.theme.fontStyle}
      className={`min-h-screen transition-colors duration-200 ${screenMode === 'landing' ? 'bg-white' : 'bg-slate-50'}`}
    >
      {screenMode === 'landing' ? (
        <Suspense fallback={<div className="mx-auto min-h-screen max-w-6xl px-5 py-16 text-sm text-slate-500" role="status">Chargement du site ShopFlow…</div>}>
        <LandingPageView
          language={settings.language}
          currency={settings.currency}
          billingTestMode={BILLING_TEST_MODE}
          onChangeLanguage={handleLanguageChange}
          onChangeCurrency={(curr) =>
            setSettings((prev) => ({ ...prev, currency: curr }))
          }
          onOpenAuthModal={(mode, preselectedPlan) =>
            setAuthModalConfig({ mode, plan: preselectedPlan })
          }
        />
        </Suspense>
      ) : (
        <>
      {authUser && activeShop && legacyImportPending && (
        <section className="mx-auto flex max-w-7xl flex-col gap-2 border-b border-emerald-200 bg-emerald-50 px-3 py-3 text-xs sm:px-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-extrabold text-emerald-950">Sauvegarde locale détectée</p>
            <p className="mt-0.5 text-emerald-900">Les paramètres de la boutique et {importPreviewCounts.products} article(s), {importPreviewCounts.sales} vente(s), {importPreviewCounts.credits} crédit(s), {importPreviewCounts.expenses} dépense(s) seront importés. La sauvegarde source restera sur cet appareil.</p>
          </div>
          <button type="button" disabled={isImportingLocal || !shopDataReady} onClick={() => { void importLocalDataToAccount(); }} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 font-extrabold text-white disabled:opacity-50">
            {isImportingLocal ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
            {isImportingLocal ? 'Import en cours…' : `Importer dans ${activeShop.name}`}
          </button>
        </section>
      )}

      {/* Main Shell */}
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
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
                  <p className="truncate text-[10px] font-semibold text-slate-500">{settings.shopName}</p>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-1">
                  {renderLanguageSelector('max-w-[72px]')}
                  <button type="button" onClick={toggleCurrency} title={currencyToggleLabel} aria-label={currencyToggleLabel} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-extrabold text-slate-700 hover:border-blue-200 hover:bg-blue-50">
                    <Coins className="h-3.5 w-3.5 text-[#0A4DFF]" />{settings.currency}
                  </button>
                </div>
              </div>

              {isInstalledApp && !activeShop && (
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
                      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition ${
                        active ? 'bg-[#0A4DFF] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

        </aside>

        {/* Main Content */}
        <div className="@container flex min-w-0 flex-1 flex-col">
          {/* Sticky Mobile Header */}
          <header
            className="relative z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs sf-safe-top lg:hidden"
          >
            <div className="flex min-w-0 items-center justify-between gap-2 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <img src={SHOPFLOW_APP_LOGO} alt="ShopFlow" className="h-9 w-9 shrink-0 rounded-xl object-contain ring-1 ring-slate-200/80" />
                <div className="min-w-0">
                  <span className="text-sm font-black tracking-tight text-slate-900">Shop<span className="text-[#0A4DFF]">Flow</span></span>
                  <p className="max-w-[180px] truncate text-[10px] font-semibold text-slate-500">{settings.shopName}</p>
                </div>
              </div>
              {renderLanguageSelector('ml-auto max-w-[70px]')}
              <button type="button" onClick={toggleCurrency} title={currencyToggleLabel} aria-label={currencyToggleLabel} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-extrabold text-slate-700 hover:border-blue-200 hover:bg-blue-50">
                <Coins className="h-3.5 w-3.5 text-[#0A4DFF]" />{settings.currency}
              </button>
              {isInstalledApp && !activeShop && (
                <button type="button" onClick={() => setAuthModalConfig({ mode: 'signup', plan: 'pro_ai' })} className="shrink-0 rounded-xl bg-[#0A4DFF] px-3 py-2 text-xs font-extrabold text-white">Créer ma boutique</button>
              )}
            </div>
          </header>

          {/* Main View Container */}
          <main className="sf-app-main mx-auto max-w-7xl flex-1 p-4 pb-24 @md:p-6 lg:pb-8">
            {!BILLING_TEST_MODE && trialEndsAtMs !== null && !settings.planPaid && !isTrialExpired && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-950" role="status">
                <span>Essai gratuit : {trialDaysRemaining} jour{trialDaysRemaining === 1 ? '' : 's'} restant{trialDaysRemaining === 1 ? '' : 's'} · débute à la création de la boutique.</span>
                <button type="button" onClick={() => handleRequestTab('subscription')} className="font-extrabold text-blue-800 underline">Voir les formules</button>
              </div>
            )}
            <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500" role="status">Chargement de ShopFlow…</div>}>
            {activeTab === 'dashboard' && (
              <DashboardView
                settings={settings}
                products={localizedProducts}
                sales={localizedSales}
                expenses={expenses}
                credits={credits}
                onNavigate={(targetTab) => handleRequestTab(targetTab)}
                onQuickSellProduct={openQuickSale}
                onRestockProduct={(prod) => {
                  setRestockTarget(prod);
                  setRestockQtyInput('10');
                }}
              />
            )}

            {activeTab === 'pos' && (
              <PosSalesView
                settings={settings}
                products={localizedProducts}
                sales={localizedSales}
                onQuickSellProduct={openQuickSale}
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
                onDeleteProduct={handleDeleteProduct}
                onRestockProduct={(prod) => {
                  setRestockTarget(prod);
                  setRestockQtyInput('10');
                }}
                onQuickSellProduct={openQuickSale}
              />
            )}

            {activeTab === 'more' && (
              <section className="space-y-5">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{moreCopy.title}</h1>
                  <p className="mt-1 text-sm text-slate-600">{moreCopy.subtitle}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {moreItems.filter((item) => !isVendorLocked || item.id === 'storefront').map((item) => {
                    const Icon = item.icon;
                    return (
                      <button key={item.id} type="button" onClick={() => handleRequestTab(item.id)} className="group flex min-h-28 items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/40">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0A4DFF]"><Icon className="h-5 w-5" /></span>
                        <span className="min-w-0">
                          <span className="block text-sm font-extrabold text-slate-900">{item.title}</span>
                          <span className="mt-1 block text-xs leading-relaxed text-slate-600">{item.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                  <button type="button" onClick={() => { setScreenMode('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                    <ExternalLink className="h-4 w-4" /> {moreCopy.site}
                  </button>
                  <button type="button" onClick={() => isVendorLocked ? setShowPinUnlockModal(true) : handleActivateVendorMode()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                    {isVendorLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    {isVendorLocked ? moreCopy.patron : moreCopy.vendor}
                  </button>
                </div>
              </section>
            )}

            {activeTab === 'ai' && (
              <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500" role="status">Chargement de l’assistant…</div>}>
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
              </Suspense>
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
              <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500" role="status">Chargement des formules…</div>}>
              <SubscriptionView settings={settings} />
              </Suspense>
            )}

            {activeTab === 'expenses' && (
              <>
                {authUser && activeShop && (
                  <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-4">
                      <h2 className="text-base font-extrabold text-slate-900">Compte et boutique</h2>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">Gérez ici votre compte connecté et la boutique ouverte dans ShopFlow.</p>
                    </div>
                    <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end">
                      <div className="min-w-0">
                        <p className="mb-1.5 text-xs font-bold text-slate-600">E-mail du compte</p>
                        <p className="break-all rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800">{authUser.email || 'Compte ShopFlow'}</p>
                      </div>
                      <div className="min-w-0">
                        <label className="mb-1.5 block text-xs font-bold text-slate-600" htmlFor="active-shop-picker">Boutique active</label>
                        <select
                          id="active-shop-picker"
                          value={activeShop.id}
                          onChange={(event) => { void handleSelectAccountShop(event.target.value); }}
                          className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-extrabold text-slate-800"
                        >
                          {accountShops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {billingAccount?.plan_id === 'business' && (
                        <button type="button" onClick={() => setAuthModalConfig({ mode: 'signup', plan: 'business' })} className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A4DFF] px-3 py-2.5 text-xs font-extrabold text-white">
                          <Store className="h-3.5 w-3.5" /> Ajouter une boutique
                        </button>
                      )}
                      <button type="button" onClick={() => { void handleSignOut(); }} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-extrabold text-slate-700">
                        <LogOut className="h-3.5 w-3.5" /> Déconnexion
                      </button>
                      {!shopDataReady && <span className="text-xs text-slate-500">Chargement de la boutique…</span>}
                      {shopDataReady && cloudSyncStatus !== 'idle' && (
                        <span role="status" aria-live="polite" className={`text-xs ${cloudSyncStatus === 'error' ? 'text-amber-700' : 'text-slate-500'}`}>
                          {i18nText(`sync.${cloudSyncStatus}`)}
                        </span>
                      )}
                    </div>
                    {accountLoadError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-800">{accountLoadError}</p>}
                  </section>
                )}
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
                onUpdateSettings={handleUpdateSettings}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
                onResetDemo={handleResetDemo}
                onActivateVendorLock={handleActivateVendorMode}
                />
              </>
            )}
            </Suspense>
          </main>

          {/* Bottom Navigation Bar */}
          <nav className="fixed right-0 bottom-0 left-0 z-30 flex items-center justify-around border-t border-slate-200 bg-white px-1 pt-2 shadow-lg sf-safe-bottom lg:hidden">
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

      {/* Auth / Signup / Login / Install App Modal */}
      {authModalConfig && (
        <AuthModal
          billingTestMode={BILLING_TEST_MODE}
          initialMode={authModalConfig.mode}
          preselectedPlan={authModalConfig.plan}
          defaultCurrency={settings.currency}
          authConfigured={isSupabaseConfigured}
          oauthProvidersEnabled={{
            google: isOAuthProviderEnabled('google') && Boolean(authRedirectUrl),
            github: isOAuthProviderEnabled('github') && Boolean(authRedirectUrl),
            facebook: isOAuthProviderEnabled('facebook') && Boolean(authRedirectUrl),
          }}
          requireAuthentication={isInstalledApp}
          isAuthenticated={Boolean(authUser)}
          onCompleteSignup={handleCompleteSignup}
          onLoginExisting={handleLoginExisting}
          onOAuthSignIn={handleOAuthSignIn}
          onResetPassword={handlePasswordReset}
          onUpdatePassword={handlePasswordUpdate}
          onSignOut={handleSignOut}
          onTriggerNativeInstall={async () => {
            if (deferredInstallPromptRef.current) {
              await deferredInstallPromptRef.current.prompt();
              const res = await deferredInstallPromptRef.current.userChoice;
              deferredInstallPromptRef.current = null;
              return res.outcome === 'accepted';
            }
            return false;
          }}
          onClose={() => {
            if (isInstalledApp && (!authUser || !activeShop)) return;
            setAuthModalConfig(null);
          }}
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
        <Suspense fallback={<div className="sr-only" role="status">Préparation du reçu…</div>}>
        <VisualReceiptModal
          settings={settings}
          receipt={visualReceipt}
          onClose={() => setVisualReceipt(null)}
        />
        </Suspense>
      )}

      {isScannerOpen && (
        <Suspense fallback={<div role="status" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 text-sm font-bold text-white">Ouverture du scanner…</div>}>
        <BarcodeScannerModal
          settings={settings}
          products={localizedProducts}
          onScanAction={(product, mode) => {
            if (mode === 'instant_sell') {
              handleDirectSellQuantity(product, 1, 'cash', 'Scan photo/caméra');
            } else {
              setActiveTab('pos');
              setScannedCartTrigger({ product, nonce: Date.now() });
              showToast(`${product.name} ajouté à la facture !`);
            }
          }}
          onBindBarcodeOrCreateProduct={(product, isNew, mode) => {
            handleSaveProduct(product, isNew);
            if (mode === 'instant_sell') {
              handleDirectSellQuantity(product, 1, 'cash', 'Scan photo/caméra');
            } else {
              setActiveTab('pos');
              setScannedCartTrigger({ product, nonce: Date.now() });
            }
          }}
          onClose={() => setIsScannerOpen(false)}
        />
        </Suspense>
      )}

      {/* Quick Sale Delivery Choice */}
      {quickSaleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">
          <section role="dialog" aria-modal="true" aria-labelledby="quick-sale-title" className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">Vente rapide</p>
                <h2 id="quick-sale-title" className="mt-1 text-base font-extrabold text-slate-900">Confirmer la vente</h2>
              </div>
              <button type="button" onClick={() => setQuickSaleTarget(null)} aria-label="Fermer" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <img src={quickSaleTarget.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{quickSaleTarget.name}</p>
                <p className="text-xs text-slate-500">1 × {fmt(quickSaleTarget.sellingPriceFC)}</p>
              </div>
            </div>
            <fieldset className="mt-4 space-y-2">
              <legend className="mb-2 text-xs font-extrabold text-slate-800">Frais de livraison</legend>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" aria-pressed={!quickSaleWithDelivery} onClick={() => setQuickSaleWithDelivery(false)} className={`rounded-xl border px-3 py-2.5 text-xs font-bold ${!quickSaleWithDelivery ? 'border-[#0A4DFF] bg-blue-50 text-[#0A4DFF]' : 'border-slate-200 bg-white text-slate-600'}`}>Sans frais</button>
                <button type="button" aria-pressed={quickSaleWithDelivery} onClick={() => setQuickSaleWithDelivery(true)} className={`rounded-xl border px-3 py-2.5 text-xs font-bold ${quickSaleWithDelivery ? 'border-[#0A4DFF] bg-blue-50 text-[#0A4DFF]' : 'border-slate-200 bg-white text-slate-600'}`}>Avec frais</button>
              </div>
              {quickSaleWithDelivery && (
                <label className="block text-xs font-semibold text-slate-600">
                  Montant de la livraison ({settings.currency})
                  <input type="number" min="0" step={settings.currency === 'USD' ? '0.01' : '1'} value={quickSaleDeliveryInput} onChange={(event) => setQuickSaleDeliveryInput(event.target.value)} placeholder={String(toDisplayAmount(settings.defaultDeliveryFeeFC, settings.currency, settings.usdRateFC))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900" />
                </label>
              )}
            </fieldset>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
              <span className="font-semibold text-slate-600">Total à facturer</span>
              <strong className="text-base font-black text-slate-900 tabular-nums">{fmt(quickSaleTarget.sellingPriceFC + (quickSaleWithDelivery ? fromDisplayAmount(Number(quickSaleDeliveryInput) || 0, settings.currency, settings.usdRateFC) : 0))}</strong>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setQuickSaleTarget(null)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700">Annuler</button>
              <button type="button" onClick={confirmQuickSale} className="rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700">Confirmer la vente</button>
            </div>
          </section>
        </div>
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
          language={settings.language}
          onStart={() => {
            finishFirstRunTour();
            handleRequestTab('inventory');
          }}
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
      </>
      )}
    </div>
  );
}

export default App;
