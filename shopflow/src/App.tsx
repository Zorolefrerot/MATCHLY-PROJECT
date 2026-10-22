import React, { useEffect, useState } from 'react';
import {
  BookOpenCheck,
  Bot,
  CheckCircle2,
  Coins,
  Crown,
  Globe,
  LayoutDashboard,
  Monitor,
  Package,
  PackagePlus,
  ReceiptText,
  Settings,
  ShoppingBag,
  Smartphone,
  Wifi,
  X,
} from 'lucide-react';
import { AiAssistantView, AiStoreAction } from './components/AiAssistantView';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { CreditsView } from './components/CreditsView';
import { DashboardView } from './components/DashboardView';
import { ExpensesSettingsView } from './components/ExpensesSettingsView';
import { InventoryView } from './components/InventoryView';
import { OnlineStoreView } from './components/OnlineStoreView';
import { PosSalesView } from './components/PosSalesView';
import { SubscriptionView } from './components/SubscriptionView';
import { VisualReceiptModal } from './components/VisualReceiptModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import {
  INITIAL_CREDITS,
  INITIAL_EXPENSES,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_SETTINGS,
  PRESET_PRODUCT_PHOTOS,
  SHOPFLOW_APP_LOGO,
} from './data/initialData';
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

const STORAGE_KEY = 'shopflow_rdc_mockup_v3';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [previewViewport, setPreviewViewport] =
    useState<PreviewViewport>('hybrid');

  const [settings, setSettings] = useState<ShopSettings>(INITIAL_SETTINGS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [sales, setSales] = useState<SaleRecord[]>(INITIAL_SALES);
  const [credits, setCredits] = useState<CreditEntry[]>(INITIAL_CREDITS);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(INITIAL_EXPENSES);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Restock Modal
  const [restockTarget, setRestockTarget] = useState<Product | null>(null);
  const [restockQtyInput, setRestockQtyInput] = useState('10');

  // Camera Barcode Scanner Modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedCartTrigger, setScannedCartTrigger] = useState<{
    product: Product;
    nonce: number;
  } | null>(null);

  // Official Graphical WhatsApp Receipt Modal (MB_OTAKU STORE layout!)
  const [visualReceipt, setVisualReceipt] =
    useState<VisualReceiptPayload | null>(null);

  // Text WhatsApp Modal (for daily owner summary & polite credit reminders)
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
        if (parsed.settings)
          setSettings({ ...INITIAL_SETTINGS, ...parsed.settings });
        if (parsed.products) setProducts(parsed.products);
        if (parsed.sales) setSales(parsed.sales);
        if (parsed.credits) setCredits(parsed.credits);
        if (parsed.expenses) setExpenses(parsed.expenses);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ settings, products, sales, credits, expenses })
      );
    } catch {
      // Ignore quota errors
    }
  }, [settings, products, sales, credits, expenses]);

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.fr;

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

  // Build sample / latest receipt preview matching the exact graphical model
  const openSampleGraphicalReceipt = () => {
    const sampleItems = products.slice(0, 4).map((p, i) => ({
      id: p.id,
      refCode: p.refCode || `SF-00${i + 1}`,
      name: p.name,
      subtitle: p.unit,
      image: p.image,
      quantity: i === 2 ? 2 : 1,
      unitPriceFC: p.sellingPriceFC,
    }));

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(
      now.getMonth() + 1
    ).padStart(2, '0')}/${now.getFullYear()}  ${nowTime()}`;

    setVisualReceipt({
      invoiceNumber: '#2026-0427',
      dateTime: dateStr,
      customerName: 'KABASELE Merdi',
      customerPhone: '+243 97 123 4567',
      customerAddress: 'Kinshasa - Mont-Ngafula',
      paymentMethodLabel: 'Mobile Money (M-Pesa / Vodacom)',
      paymentReference: '8F7A-3D9B-6C1E',
      isPaid: true,
      items: sampleItems,
      deliveryFeeFC: settings.defaultDeliveryFeeFC,
    });
  };

  // Direct Quick Sale
  const handleDirectSellQuantity = (
    product: Product,
    qty: number = 1,
    method: PaymentMethod = 'cash',
    label?: string
  ) => {
    if (product.stock < qty || qty <= 0) return;

    const unitProfit = product.sellingPriceFC - product.purchasePriceFC;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, stock: Math.max(0, p.stock - qty) } : p
      )
    );

    const newSale: SaleRecord = {
      id: `sale-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      quantity: qty,
      unitPurchasePriceFC: product.purchasePriceFC,
      unitSellingPriceFC: product.sellingPriceFC,
      totalRevenueFC: product.sellingPriceFC * qty,
      totalCostFC: product.purchasePriceFC * qty,
      netProfitFC: unitProfit * qty,
      paymentMethod: method,
      customerName: label,
      timestamp: nowTime(),
    };

    setSales((prev) => [newSale, ...prev]);
    showToast(
      `+${qty} ${product.name} vendu ! Revenu : +${fmt(unitProfit * qty)}`
    );
  };

  // Execute Real Actions emitted dynamically by ShopFlow LLM AI
  const handleExecuteAiActions = (actions: AiStoreAction[]): string[] => {
    const badges: string[] = [];

    for (const act of actions) {
      if (act.type === 'sell' && act.productId) {
        const target = products.find((p) => p.id === act.productId);
        const qty = Math.max(1, act.quantity || 1);
        if (target && target.stock >= qty) {
          handleDirectSellQuantity(target, qty, 'cash', 'Vente ShopFlow IA');
          badges.push(`Vente IA : ${qty}× ${target.name}`);
        }
      } else if (act.type === 'add_product' && act.name) {
        const newProd: Product = {
          id: `prod-${Date.now()}`,
          refCode: `SF-0${products.length + 1}`,
          name: act.name,
          category: act.category || 'Alimentation',
          unit: act.unit || 'Pièce',
          image: PRESET_PRODUCT_PHOTOS[0].url,
          stock: Math.max(1, act.stock || 10),
          minStockAlert: 5,
          purchasePriceFC: act.purchasePriceFC || 10000,
          sellingPriceFC: act.sellingPriceFC || 15000,
        };
        setProducts((prev) => [newProd, ...prev]);
        badges.push(`Produit ajouté : ${newProd.name}`);
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
        badges.push(`Prix mis à jour (${fmt(act.sellingPriceFC)})`);
      } else if (act.type === 'add_expense' && act.amountFC) {
        setExpenses((prev) => [
          {
            id: `exp-${Date.now()}`,
            label: act.label || 'Charge enregistrée par IA',
            category: 'Autre',
            amountFC: act.amountFC!,
            timestamp: nowTime(),
          },
          ...prev,
        ]);
        badges.push(`Dépense notée : ${fmt(act.amountFC)}`);
      }
    }

    return badges;
  };

  // Multi-item Cart Checkout
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
      timestamp: time,
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
    showToast(`Vente validée ! Bénéfice généré : +${fmt(totalGain)}`);
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
    showToast(
      `Vente annulée : ${target.quantity}x ${target.productName} remis en stock`
    );
  };

  const handleSaveProduct = (product: Product, isNew: boolean) => {
    if (isNew) {
      setProducts((prev) => [product, ...prev]);
      showToast(`Marchandise « ${product.name} » ajoutée au stock !`);
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? product : p))
      );
      showToast(`Fiche « ${product.name} » mise à jour !`);
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
    showToast(
      `+${added} ${restockTarget.unit}s ajoutés à ${restockTarget.name}`
    );
    setRestockTarget(null);
  };

  const handleOpenDailyWhatsApp = () => {
    const totalCA = sales.reduce((a, s) => a + s.totalRevenueFC, 0);
    const totalCost = sales.reduce((a, s) => a + s.totalCostFC, 0);
    const totalExp = expenses.reduce((a, e) => a + e.amountFC, 0);
    const netRev = totalCA - totalCost - totalExp;
    const totalQty = sales.reduce((a, s) => a + s.quantity, 0);

    const msg =
      `📊 *BILAN JOURNALIER — ${settings.shopName.toUpperCase()}*\n` +
      `📍 ${settings.city}\n` +
      `--------------------------\n` +
      `🛍️ Articles vendus : *${totalQty} unités* (${sales.length} ventes)\n` +
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
    showToast(`Abonnement activé via ${methodLabel} !`);
  };

  const handleResetDemo = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings(INITIAL_SETTINGS);
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setCredits(INITIAL_CREDITS);
    setExpenses(INITIAL_EXPENSES);
    showToast('Données de démonstration réinitialisées !');
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
    {
      id: 'dashboard',
      label: t.navDashboard,
      icon: LayoutDashboard,
    },
    {
      id: 'pos',
      label: t.navPos,
      icon: ShoppingBag,
      badge: sales.length,
    },
    {
      id: 'inventory',
      label: t.navInventory,
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    {
      id: 'ai',
      label: t.navAi,
      icon: Bot,
      badge: 'IA',
      highlight: true,
    },
    {
      id: 'storefront',
      label: t.navStorefront,
      icon: Globe,
      badge: 'PRO',
    },
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
    {
      id: 'expenses',
      label: t.navSettings,
      icon: Settings,
    },
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

  return (
    <div
      className={`min-h-screen ${
        isPhoneFrame ? 'bg-slate-900 px-3 py-6' : 'bg-slate-50'
      }`}
    >
      {/* Top Mockup Mode Switcher Banner on Desktop */}
      <div
        className={`mx-auto mb-0 hidden items-center justify-between px-4 py-2 text-xs lg:flex ${
          isPhoneFrame
            ? 'mb-4 max-w-2xl rounded-2xl border border-slate-700 bg-slate-800 text-slate-200'
            : 'border-b border-slate-800 bg-[#081844] text-sky-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[#0A4DFF] px-2 py-0.5 text-[11px] font-extrabold text-white">
            SHOPFLOW V3 PRO
          </span>
          <span className="text-slate-300">
            Logo officiel + Reçu Image WhatsApp HD + IA Réflexive Temps Réel + Logo Boutique & 5 Langues
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openSampleGraphicalReceipt}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 font-bold text-white transition hover:bg-emerald-500"
          >
            <ReceiptText className="h-3.5 w-3.5" />
            <span>Voir le Reçu WhatsApp</span>
          </button>
          <button
            onClick={() => setPreviewViewport('hybrid')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition ${
              !isPhoneFrame
                ? 'bg-white text-[#081844]'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Vue PC / Tablette</span>
          </button>
          <button
            onClick={() => setPreviewViewport('mobile')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition ${
              isPhoneFrame
                ? 'bg-white text-[#081844]'
                : 'text-sky-200 hover:bg-white/10'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Simuler Smartphone</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Shell */}
      <div
        className={
          isPhoneFrame
            ? 'relative mx-auto flex h-[820px] w-full max-w-[400px] flex-col overflow-hidden rounded-[40px] border-[10px] border-slate-950 bg-slate-50 shadow-2xl ring-2 ring-slate-700'
            : 'flex min-h-[calc(100vh-40px)] w-full'
        }
      >
        {/* Left Sidebar (Desktop/Tablet) */}
        {!isPhoneFrame && (
          <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-slate-200 bg-white p-5 lg:flex">
            <div className="space-y-5">
              {/* Official ShopFlow Brand Logo */}
              <div className="flex items-center gap-3 px-1">
                <img
                  src={SHOPFLOW_APP_LOGO}
                  alt="ShopFlow"
                  className="h-12 w-12 shrink-0 rounded-2xl object-contain shadow-xs ring-1 ring-slate-200/80"
                />
                <div className="min-w-0">
                  <span className="text-lg font-black tracking-tight text-[#081844]">
                    Shop<span className="text-[#0A7AFF]">Flow</span>
                  </span>
                  <p className="truncate text-[10px] font-bold text-emerald-700">
                    {settings.planPaid ? t.proActive : t.freeTrial}
                  </p>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                        active
                          ? 'bg-blue-50 text-[#081844] ring-1 ring-blue-200'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon
                          className={`h-4 w-4 ${
                            active || item.highlight
                              ? 'text-[#0A4DFF]'
                              : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>

                      {item.badge !== undefined && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold tabular-nums ${
                            item.id === 'ai'
                              ? 'bg-[#0A4DFF] text-white'
                              : item.id === 'storefront'
                                ? 'bg-emerald-600 text-white'
                                : item.id === 'inventory' ||
                                    item.id === 'credits'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Shop Owner Card + Language & Currency Switchers */}
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
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-extrabold text-slate-800 shadow-2xs hover:border-[#0A4DFF]"
                >
                  <Coins className="h-3 w-3 text-emerald-600" />
                  <span>{settings.currency}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('expenses')}
                className="flex w-full items-center gap-2.5 border-t border-slate-200/80 pt-2.5 text-left"
                title="Modifier le logo et les infos de la boutique"
              >
                {settings.shopLogo ? (
                  <img
                    src={settings.shopLogo}
                    alt={settings.shopName}
                    className="h-9 w-9 shrink-0 rounded-full border border-slate-300 object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#081844] text-[11px] font-black text-white">
                    {settings.shopName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">
                    {settings.shopName}
                  </p>
                  <p className="truncate text-[10px] font-semibold text-[#0A4DFF]">
                    Modifier logo & infos →
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

        {/* Main Content Container */}
        <div
          className={`@container flex flex-1 flex-col ${
            isPhoneFrame ? 'overflow-y-auto' : 'min-w-0'
          }`}
        >
          {/* Sticky Mobile Header featuring Official ShopFlow Logo + Language/Currency Switchers */}
          <header
            className={`sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs ${
              isPhoneFrame ? 'block' : 'lg:hidden'
            }`}
          >
            <div className="flex items-center justify-between px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <img
                  src={SHOPFLOW_APP_LOGO}
                  alt="ShopFlow"
                  className="h-10 w-10 shrink-0 rounded-xl object-contain ring-1 ring-slate-200/80"
                />
                <div>
                  <span className="text-sm font-black tracking-tight text-[#081844]">
                    Shop<span className="text-[#0A7AFF]">Flow</span>
                  </span>
                  <p className="max-w-[140px] truncate text-[10px] font-semibold text-slate-500">
                    {settings.shopName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
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

            {/* Quick Mobile Action Strip */}
            <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 px-3 py-1.5 text-[11px]">
              <button
                onClick={openSampleGraphicalReceipt}
                className="shrink-0 rounded-full bg-[#081844] px-3 py-1 font-bold text-white"
              >
                🧾 Reçu WhatsApp
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
                  onClick={() => setActiveTab(pill.id)}
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
            className={`mx-auto w-full max-w-7xl flex-1 p-4 @md:p-6 ${
              isPhoneFrame ? 'pb-24' : 'pb-24 lg:pb-8'
            }`}
          >
            {activeTab === 'dashboard' && (
              <DashboardView
                settings={settings}
                products={products}
                sales={sales}
                expenses={expenses}
                credits={credits}
                onNavigate={setActiveTab}
                onQuickSellProduct={(p) => handleDirectSellQuantity(p, 1)}
                onRestockProduct={(prod) => {
                  setRestockTarget(prod);
                  setRestockQtyInput('10');
                }}
                onOpenDailyWhatsApp={handleOpenDailyWhatsApp}
                onOpenSampleReceipt={openSampleGraphicalReceipt}
                onOpenScanner={() => setIsScannerOpen(true)}
              />
            )}

            {activeTab === 'pos' && (
              <PosSalesView
                settings={settings}
                products={products}
                sales={sales}
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
                products={products}
                sales={sales}
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
                products={products}
                sales={sales}
                expenses={expenses}
                credits={credits}
                onExecuteAiActions={handleExecuteAiActions}
              />
            )}

            {activeTab === 'storefront' && (
              <OnlineStoreView
                settings={settings}
                products={products}
                onSimulateOnlineOrderReceived={(
                  items,
                  customerName,
                  quartier
                ) => {
                  handleCompleteCartSale(
                    items,
                    'mobile_money',
                    customerName,
                    '+243 97 000 0000',
                    quartier,
                    settings.defaultDeliveryFeeFC
                  );

                  const now = new Date();
                  setVisualReceipt({
                    invoiceNumber: `#2026-0${Math.floor(100 + Math.random() * 899)}`,
                    dateTime: `${String(now.getDate()).padStart(2, '0')}/${String(
                      now.getMonth() + 1
                    ).padStart(2, '0')}/${now.getFullYear()}  ${nowTime()}`,
                    customerName,
                    customerPhone: '+243 97 000 0000',
                    customerAddress: quartier,
                    paymentMethodLabel: 'Mobile Money (Commande en ligne)',
                    paymentReference: '9B2E-4K8M-7P1A',
                    isPaid: true,
                    items: items.map(({ product, quantity }, idx) => ({
                      id: product.id,
                      refCode: product.refCode || `SF-00${idx + 1}`,
                      name: product.name,
                      subtitle: product.unit,
                      image: product.image,
                      quantity,
                      unitPriceFC: product.sellingPriceFC,
                    })),
                    deliveryFeeFC: settings.defaultDeliveryFeeFC,
                  });
                }}
                onShareWhatsAppOrder={() => {
                  // Visual receipt modal opens directly above!
                }}
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
                  showToast(
                    `Dépense ajoutée (${fmt(exp.amountFC)}) — Revenu net mis à jour`
                  );
                }}
                onDeleteExpense={(id) => {
                  setExpenses((prev) => prev.filter((e) => e.id !== id));
                  showToast('Dépense retirée');
                }}
                onUpdateSettings={setSettings}
                onPreviewSampleReceipt={openSampleGraphicalReceipt}
                onResetDemo={handleResetDemo}
              />
            )}
          </main>

          {/* Bottom Navigation Bar (Mobile / Smartphone Simulator) */}
          <nav
            className={`${
              isPhoneFrame
                ? 'sticky bottom-0 flex'
                : 'fixed right-0 bottom-0 left-0 flex lg:hidden'
            } z-30 items-center justify-around border-t border-slate-200 bg-white px-1 py-2 shadow-lg`}
          >
            {mobileBottomItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              const isAi = item.id === 'ai';
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex flex-1 flex-col items-center gap-1 py-1 text-[11px] font-bold transition ${
                    active
                      ? 'text-[#0A4DFF]'
                      : isAi
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      active
                        ? 'text-[#0A4DFF]'
                        : isAi
                          ? 'text-emerald-600'
                          : 'text-slate-400'
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
          onClick={() => setActiveTab('ai')}
          className="fixed right-6 bottom-6 z-40 hidden items-center gap-2 rounded-full bg-gradient-to-r from-[#081844] to-[#0A4DFF] px-5 py-3 text-xs font-extrabold text-white shadow-xl transition hover:scale-105 lg:flex"
        >
          <Bot className="h-4 w-4" />
          <span>{t.askAiBtn}</span>
        </button>
      )}

      {/* Live Feedback Toast */}
      {toastMessage && (
        <div className="fixed right-4 bottom-20 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-xl lg:bottom-20">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Official Visual Graphical WhatsApp Receipt Modal */}
      {visualReceipt && (
        <VisualReceiptModal
          settings={settings}
          receipt={visualReceipt}
          onClose={() => setVisualReceipt(null)}
        />
      )}

      {/* Barcode Camera Scanner Modal */}
      {isScannerOpen && (
        <BarcodeScannerModal
          settings={settings}
          products={products}
          onScanAction={(product, mode) => {
            if (mode === 'instant_sell') {
              handleDirectSellQuantity(product, 1, 'cash', 'Scan Code-Barres');
            } else {
              setActiveTab('pos');
              setScannedCartTrigger({ product, nonce: Date.now() });
              showToast(`${product.name} ajouté à la facture !`);
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
                    Stock actuel :{' '}
                    <strong>
                      {restockTarget.stock} {restockTarget.unit}s
                    </strong>
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
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-extrabold text-slate-900 tabular-nums focus:border-emerald-500 focus:outline-hidden"
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
                  className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700"
                >
                  Mettre à jour le stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Text WhatsApp Modal (Daily Summary / Credit Reminder) */}
      {whatsAppModal && (
        <WhatsAppModal
          title={whatsAppModal.title}
          recipientLabel={whatsAppModal.recipient}
          message={whatsAppModal.message}
          onClose={() => setWhatsAppModal(null)}
        />
      )}
    </div>
  );
}

export default App;
