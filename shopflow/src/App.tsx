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
  Settings,
  ShoppingBag,
  Smartphone,
  Store,
  Wifi,
  X,
} from 'lucide-react';
import { AiAssistantView } from './components/AiAssistantView';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { CreditsView } from './components/CreditsView';
import { DashboardView } from './components/DashboardView';
import { ExpensesSettingsView } from './components/ExpensesSettingsView';
import { InventoryView } from './components/InventoryView';
import { OnlineStoreView } from './components/OnlineStoreView';
import { PosSalesView } from './components/PosSalesView';
import { SubscriptionView } from './components/SubscriptionView';
import { WhatsAppModal } from './components/WhatsAppModal';
import {
  INITIAL_CREDITS,
  INITIAL_EXPENSES,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_SETTINGS,
} from './data/initialData';
import {
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
} from './types';
import { formatMoney } from './utils/currency';

const STORAGE_KEY = 'shopflow_rdc_mockup_v2';

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

  // WhatsApp Preview Modal
  const [whatsAppModal, setWhatsAppModal] = useState<{
    title: string;
    recipient: string;
    message: string;
  } | null>(null);

  // Load saved mockup state from localStorage if available
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

  // Persist changes locally
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  };

  const fmt = (val: number) =>
    formatMoney(val, settings.currency, settings.usdRateFC);

  const nowTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  };

  // Sell N quantity directly (used by +1 Quick Sell AND AI Assistant!)
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
      `+${qty} ${product.name} vendu ! Revenu gagné : +${fmt(unitProfit * qty)}`
    );
  };

  // Multi-item Cart Checkout (Cash / Mobile Money / Credit "Bon")
  const handleCompleteCartSale = (
    items: CartItem[],
    paymentMethod: PaymentMethod,
    customerName: string,
    customerPhone: string
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
    showToast(`Vente enregistrée ! Bénéfice généré : +${fmt(totalGain)}`);
  };

  // Undo Sale (restores stock automatically)
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

  // Save New or Edited Product
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

  // Confirm Quick Restock
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

  // Daily Summary WhatsApp Builder
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

  const handleActivatePlan = (planId: SubscriptionPlanId, methodLabel: string) => {
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
      label: 'Tableau de bord',
      icon: LayoutDashboard,
    },
    {
      id: 'pos',
      label: 'Vendre & Scanner',
      icon: ShoppingBag,
      badge: sales.length,
    },
    {
      id: 'inventory',
      label: 'Marchandises & Stock',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    {
      id: 'ai',
      label: 'ShopFlow IA (Vocal)',
      icon: Bot,
      badge: 'IA',
      highlight: true,
    },
    {
      id: 'storefront',
      label: 'Boutique en Ligne',
      icon: Globe,
      badge: 'PRO',
    },
    {
      id: 'credits',
      label: 'Crédits « Bons »',
      icon: BookOpenCheck,
      badge: unpaidCreditsCount > 0 ? unpaidCreditsCount : undefined,
    },
    {
      id: 'subscription',
      label: 'Abonnement & Carte',
      icon: Crown,
      badge: settings.planPaid ? '✓' : undefined,
    },
    {
      id: 'expenses',
      label: 'Dépenses & Paramètres',
      icon: Settings,
    },
  ];

  // 5 Key Tabs for Mobile Bottom Bar (clean, thumb-friendly)
  const mobileBottomItems: {
    id: NavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
    { id: 'pos', label: 'Vendre', icon: ShoppingBag },
    { id: 'ai', label: 'IA Coach', icon: Bot },
    { id: 'inventory', label: 'Stock', icon: Package },
    { id: 'subscription', label: 'Abonnement', icon: Crown },
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
            : 'border-b border-emerald-900/10 bg-emerald-950 text-emerald-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
            MAQUETTE V2 PRO — SHOPFLOW RDC
          </span>
          <span className="text-slate-300">
            Nouveau : IA Coach Vocale, Scanner Caméra, Boutique en Ligne & Paiement Carte Bancaire / Mobile Money
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewViewport('hybrid')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition ${
              !isPhoneFrame
                ? 'bg-emerald-500 text-slate-950'
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
                ? 'bg-emerald-500 text-slate-950'
                : 'text-emerald-200 hover:bg-white/10'
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
              {/* Brand */}
              <div className="flex items-center gap-3 px-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-lg font-extrabold tracking-tight text-slate-900">
                    Shop<span className="text-emerald-600">Flow</span>
                  </span>
                  <p className="text-[11px] font-semibold text-emerald-700">
                    {settings.planPaid ? '★ Compte Pro Actif' : 'Essai Gratuit Pro'}
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
                          ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon
                          className={`h-4 w-4 ${
                            active
                              ? 'text-emerald-600'
                              : item.highlight
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                          }`}
                        />
                        <span>{item.label}</span>
                      </span>

                      {item.badge !== undefined && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold tabular-nums ${
                            item.id === 'ai' || item.id === 'storefront'
                              ? 'bg-emerald-600 text-white'
                              : item.id === 'inventory' || item.id === 'credits'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
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

            {/* Bottom Shop Card + Quick Currency Switch */}
            <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                  <Wifi className="h-3.5 w-3.5" />
                  Hors-ligne prêt
                </span>
                <button
                  onClick={() =>
                    setSettings((s) => ({
                      ...s,
                      currency: s.currency === 'FC' ? 'USD' : 'FC',
                    }))
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-extrabold text-slate-800 shadow-2xs hover:border-emerald-400"
                  title="Basculer rapidement entre FC et USD"
                >
                  <Coins className="h-3 w-3 text-emerald-600" />
                  <span>{settings.currency === 'FC' ? 'FC' : 'USD ($)'}</span>
                </button>
              </div>
              <div className="border-t border-slate-200/80 pt-2">
                <p className="truncate font-bold text-slate-900">
                  {settings.shopName}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {settings.city}
                </p>
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
          {/* Sticky Mobile Header + Secondary Pill Scroll Bar */}
          <header
            className={`sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs ${
              isPhoneFrame ? 'block' : 'lg:hidden'
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Store className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-sm font-extrabold text-slate-900">
                    Shop<span className="text-emerald-600">Flow</span>
                  </span>
                  <p className="max-w-[160px] truncate text-[10px] font-medium text-slate-500">
                    {settings.shopName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
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

                <button
                  onClick={() => setActiveTab('expenses')}
                  className="rounded-full bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200"
                  title="Dépenses & Paramètres"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Secondary quick pill bar on mobile so Storefront, Crédits & Dépenses are always 1 tap away */}
            <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 px-3 py-1.5 text-[11px]">
              {[
                { id: 'storefront' as NavTab, label: '🌐 Boutique en ligne' },
                {
                  id: 'credits' as NavTab,
                  label: `📒 Crédits (${unpaidCreditsCount})`,
                },
                { id: 'expenses' as NavTab, label: '🧾 Dépenses & Devise' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setActiveTab(pill.id)}
                  className={`shrink-0 rounded-full px-3 py-1 font-bold transition ${
                    activeTab === pill.id
                      ? 'bg-emerald-600 text-white'
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
                onOpenReceiptWhatsApp={(receiptText, customerLabel) =>
                  setWhatsAppModal({
                    title: 'Reçu Client WhatsApp',
                    recipient: customerLabel,
                    message: receiptText,
                  })
                }
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
                onExecuteAiSale={(prod, qty) =>
                  handleDirectSellQuantity(prod, qty, 'cash', 'Saisie IA Vocale')
                }
                onExecuteAiExpense={(label, amountFC) => {
                  setExpenses((prev) => [
                    {
                      id: `exp-${Date.now()}`,
                      label,
                      category: 'Autre',
                      amountFC,
                      timestamp: nowTime(),
                    },
                    ...prev,
                  ]);
                }}
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
                    `${customerName} (${quartier})`,
                    ''
                  );
                }}
                onShareWhatsAppOrder={(msg, label) =>
                  setWhatsAppModal({
                    title: 'Commande Client Boutique en Ligne',
                    recipient: label,
                    message: msg,
                  })
                }
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
                      ? 'text-emerald-700'
                      : isAi
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      active || isAi ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Floating Quick AI Button on Desktop when not already in AI tab */}
      {activeTab !== 'ai' && !isPhoneFrame && (
        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className="fixed right-6 bottom-6 z-40 hidden items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-xs font-extrabold text-white shadow-xl transition hover:scale-105 hover:bg-emerald-700 lg:flex"
        >
          <Bot className="h-4 w-4" />
          <span>Poser une question à l’IA</span>
        </button>
      )}

      {/* Live Feedback Toast */}
      {toastMessage && (
        <div className="fixed right-4 bottom-20 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-xl lg:bottom-20">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
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
              showToast(`${product.name} ajouté au panier client !`);
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
                  Nouvelle quantité reçue à ajouter ({restockTarget.unit}s)
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

      {/* WhatsApp Preview Modal */}
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
