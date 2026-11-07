import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Calculator,
  Crown,
  Globe,
  PackagePlus,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import {
  CreditEntry,
  ExpenseEntry,
  NavTab,
  Product,
  SaleRecord,
  ShopSettings,
} from '../types';
import { parseSaleDate, formatSaleTime } from '../utils/saleDate';
import { TRANSLATIONS } from '../i18n/translations';
import { formatMoney } from '../utils/currency';

interface DashboardViewProps {
  settings: ShopSettings;
  products: Product[];
  sales: SaleRecord[];
  expenses: ExpenseEntry[];
  credits: CreditEntry[];
  onNavigate: (tab: NavTab) => void;
  onQuickSellProduct: (product: Product) => void;
  onRestockProduct: (product: Product) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  settings,
  products,
  sales,
  expenses,
  credits,
  onNavigate,
  onQuickSellProduct,
  onRestockProduct,
}) => {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(6); // Today by default

  const today = new Date();
  const isToday = (timestamp: string) => {
    const date = parseSaleDate(timestamp);
    return Boolean(date && date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate());
  };
  const todaySales = sales.filter((sale) => isToday(sale.timestamp));
  const todayExpenses = expenses.filter((expense) => isToday(expense.timestamp));
  const totalCA = todaySales.reduce((acc, s) => acc + s.totalRevenueFC, 0);
  const totalPurchaseCost = todaySales.reduce((acc, s) => acc + s.totalCostFC, 0);
  const grossMargin = totalCA - totalPurchaseCost;
  const totalExpenses = todayExpenses.reduce((acc, e) => acc + e.amountFC, 0);
  const realNetRevenue = grossMargin - totalExpenses;
  const totalUnitsSold = todaySales.reduce((acc, s) => acc + s.quantity, 0);
  const totalCreditsUnpaid = credits.reduce(
    (acc, c) => acc + Math.max(0, c.totalAmountFC - c.paidAmountFC),
    0
  );

  const lowStockProducts = products.filter((p) => p.stock <= p.minStockAlert);

  const chartDays = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - idx));
    const daySales = sales.filter((sale) => {
      const saleDate = parseSaleDate(sale.timestamp);
      return Boolean(
        saleDate &&
          saleDate.getFullYear() === date.getFullYear() &&
          saleDate.getMonth() === date.getMonth() &&
          saleDate.getDate() === date.getDate()
      );
    });
    return {
      day: idx === 6 ? 'Auj.' : new Intl.DateTimeFormat('fr-CD', { weekday: 'short' }).format(date).replace('.', ''),
      caFC: daySales.reduce((sum, sale) => sum + sale.totalRevenueFC, 0),
      // SaleRecord.netProfitFC is the margin after purchase cost; it does not include dated expenses.
      netProfitFC: daySales.reduce((sum, sale) => sum + sale.netProfitFC, 0),
    };
  });
  const hasWeekSales = chartDays.some((day) => day.caFC > 0);
  const maxCA = Math.max(...chartDays.map((d) => d.caFC), 100000);
  const activeDay = chartDays[selectedDayIdx] || chartDays[chartDays.length - 1];

  const costRatio = totalCA > 0 ? Math.min(100, Math.round((totalPurchaseCost / totalCA) * 100)) : 0;
  const expenseRatio = totalCA > 0 ? Math.min(100 - costRatio, Math.round((totalExpenses / totalCA) * 100)) : 0;
  const profitRatio = Math.max(0, 100 - costRatio - expenseRatio);

  const fmt = (val: number) => formatMoney(val, settings.currency, settings.usdRateFC);
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.fr;
  const guideCopy = settings.language === 'en' ? {
    startTitle: 'Start here', startSubtitle: 'Just two steps to get going.', addTitle: 'Add your items', addHint: 'Enter the item name, price and quantity.', addDone: (count: number) => `${count} item${count === 1 ? '' : 's'} added.`, addButton: 'Open stock', editItems: 'Manage items', sellTitle: 'Record a sale', sellHint: 'Choose the items and confirm the payment.', sellLocked: 'Add an item first to open the register.', sellButton: 'Open register', today: 'Today:', revenue: 'Sales', net: 'Net', details: 'See detailed activity',
  } : settings.language === 'ln' ? {
    startTitle: 'Bandá awa', startSubtitle: 'Etape mibale kaka mpo na kobanda.', addTitle: 'Bakisa biloko na yo', addHint: 'Koma kombo, motuya mpe motango ya biloko.', addDone: (count: number) => `Biloko ${count} ebakisami.`, addButton: 'Fungola stock', editItems: 'Talá biloko', sellTitle: 'Komá moteki', sellHint: 'Poná biloko mpe ndima kofuta.', sellLocked: 'Bakisa eloko liboso ya kofungola caisse.', sellButton: 'Fungola caisse', today: 'Lelo:', revenue: 'Moteki', net: 'Litomba', details: 'Talá makambo nyonso',
  } : {
    startTitle: 'Commencez ici', startSubtitle: 'Deux étapes simples pour démarrer.', addTitle: 'Ajoutez vos articles', addHint: 'Saisissez le nom, le prix et la quantité.', addDone: (count: number) => `${count} article${count === 1 ? '' : 's'} ajouté${count === 1 ? '' : 's'}.`, addButton: 'Ouvrir le stock', editItems: 'Gérer mes articles', sellTitle: 'Enregistrez une vente', sellHint: 'Choisissez les articles et confirmez le paiement.', sellLocked: 'Ajoutez d’abord un article pour ouvrir la caisse.', sellButton: 'Ouvrir la caisse', today: 'Aujourd’hui :', revenue: 'Ventes', net: 'Bénéfice net', details: 'Voir le suivi détaillé',
  };

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3">
          {settings.shopLogo && <img src={settings.shopLogo} alt="" className="h-12 w-12 rounded-2xl object-cover" />}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">{t.tagline}</p>
            <h1 className="mt-1 truncate text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              {t.helloShop}, {settings.shopName}
            </h1>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{t.dashboardSubtitle}</p>
      </section>

      <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/70 p-5 sm:p-6">
        <div className="mb-4">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#0A4DFF]">{guideCopy.startTitle}</p>
          <p className="mt-1 text-sm text-slate-600">{guideCopy.startSubtitle}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <article className={`rounded-2xl border p-4 ${products.length ? 'border-emerald-200 bg-emerald-50/70' : 'border-blue-200 bg-white'}`}>
            <div className="flex items-start gap-3">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${products.length ? 'bg-emerald-600 text-white' : 'bg-blue-100 text-blue-800'}`}>{products.length ? '✓' : '1'}</span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-extrabold text-slate-900">{guideCopy.addTitle}</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{products.length ? guideCopy.addDone(products.length) : guideCopy.addHint}</p>
                <button type="button" onClick={() => onNavigate('inventory')} className="mt-3 rounded-xl bg-[#0A4DFF] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-blue-700">
                  {products.length ? guideCopy.editItems : guideCopy.addButton}
                </button>
              </div>
            </div>
          </article>
          <article className={`rounded-2xl border p-4 ${todaySales.length ? 'border-emerald-200 bg-emerald-50/70' : products.length ? 'border-blue-200 bg-white' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-start gap-3">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${todaySales.length ? 'bg-emerald-600 text-white' : products.length ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-500'}`}>{todaySales.length ? '✓' : '2'}</span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-extrabold text-slate-900">{guideCopy.sellTitle}</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{products.length ? guideCopy.sellHint : guideCopy.sellLocked}</p>
                <button type="button" disabled={!products.length} onClick={() => onNavigate('pos')} className="mt-3 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                  {guideCopy.sellButton}
                </button>
              </div>
            </div>
          </article>
        </div>
        {todaySales.length > 0 && (
          <p className="mt-4 rounded-xl bg-white/80 px-4 py-3 text-xs font-semibold text-slate-700">
            {guideCopy.today} {todaySales.length} · {guideCopy.revenue} {fmt(totalCA)} · {guideCopy.net} {fmt(realNetRevenue)}
          </p>
        )}
      </section>

      <details className="group rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <summary className="cursor-pointer list-none text-sm font-extrabold text-slate-800 marker:hidden">
          <span className="inline-flex items-center gap-2">{guideCopy.details}<ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" /></span>
        </summary>
        <div className="mt-5 space-y-6">
      {/* Pro Features Quick Access Strip (AI, Online WhatsApp Store, Subscription) */}
      <div className="grid grid-cols-1 gap-3 @md:grid-cols-3">
        <button
          type="button"
          onClick={() => onNavigate('ai')}
          className="flex items-center justify-between rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-emerald-50 p-4 text-left transition hover:shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0A4DFF] text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">
                {t.askAiBtn}
              </p>
              <p className="text-[11px] text-slate-600">
                Assistant IA ShopFlow · réponses en ligne selon connexion et disponibilité.
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-[#0A4DFF]" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('storefront')}
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#081844] text-sky-400">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">
                {t.onlineStoreTitle}
              </p>
              <p className="text-[11px] text-slate-500">
                Lien catalogue à partager aux clients
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('subscription')}
          className="flex items-center justify-between rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 text-left transition hover:border-amber-300 hover:shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">
                {t.subscriptionTitle}
              </p>
              <p className="text-[11px] text-slate-600">
                Essai de 7 jours à la création · paiement réel non connecté
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-amber-700" />
        </button>
      </div>

      {/* 4 Main Automatic KPI Cards */}
      <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @xl:grid-cols-4">
        {/* 1. Chiffre d'affaires */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {t.kpiCA}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900 tabular-nums">
            {fmt(totalCA)}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            <strong className="font-semibold text-slate-700">{totalUnitsSold} articles</strong> vendus en {todaySales.length} ventes aujourd’hui
          </p>
        </div>

        {/* 2. Coût d'achat marchandise */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {t.kpiCost}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0A4DFF]">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900 tabular-nums">
            {fmt(totalPurchaseCost)}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Capital à garder pour racheter le stock vendu
          </p>
        </div>

        {/* 3. Dépenses du jour */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {t.kpiExpenses}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900 tabular-nums">
            {fmt(totalExpenses)}
          </div>
          <button
            onClick={() => onNavigate('expenses')}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline"
          >
            <span>{todayExpenses.length} charges enregistrées aujourd’hui</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* 4. Revenu Net Réel */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-[#081844] via-[#0A4DFF] to-emerald-600 p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-sky-100 uppercase">
              {t.kpiNetProfit}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-white tabular-nums">
            {realNetRevenue >= 0 ? `+${fmt(realNetRevenue)}` : fmt(realNetRevenue)}
          </div>
          <p className="mt-1.5 text-xs text-sky-100">
            Gain net réel dans votre poche (après achat & dépenses)
          </p>
        </div>
      </div>

      {/* Automatic Formula Visual Breakdown — Simple for every merchant */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-2 @md:flex-row @md:items-center @md:justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Calcul automatique ShopFlow : Où va l’argent de votre Chiffre d’Affaires ({fmt(totalCA)}) ?
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Mis à jour à chaque vente
          </span>
        </div>

        {/* Segmented Progress Bar */}
        <div className="mt-4 flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            style={{ width: `${costRatio}%` }}
            className="bg-slate-400 transition-all duration-300"
            title="Coût d'achat marchandise"
          />
          <div
            style={{ width: `${expenseRatio}%` }}
            className="bg-amber-400 transition-all duration-300"
            title="Dépenses du jour"
          />
          <div
            style={{ width: `${profitRatio}%` }}
            className="bg-emerald-500 transition-all duration-300"
            title="Marge sur ventes (avant frais)"
          />
        </div>

        <div className="mt-3.5 grid grid-cols-1 gap-3 text-xs @md:grid-cols-3">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5">
            <span className="flex items-center gap-2 font-medium text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              1. Prix d’achat stock ({costRatio}%)
            </span>
            <span className="font-bold text-slate-900 tabular-nums">{fmt(totalPurchaseCost)}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-amber-50/60 px-3.5 py-2.5">
            <span className="flex items-center gap-2 font-medium text-slate-700">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              2. Dépenses du jour ({expenseRatio}%)
            </span>
            <span className="font-bold text-amber-800 tabular-nums">− {fmt(totalExpenses)}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3.5 py-2.5">
            <span className="flex items-center gap-2 font-semibold text-emerald-900">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              3. Votre Revenu Net ({profitRatio}%)
            </span>
            <span className="font-extrabold text-emerald-700 tabular-nums">{fmt(realNetRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Middle 2-Column Section: 7-Day Chart + Low Stock & Credit Alerts */}
      <div className="grid grid-cols-1 gap-6 @lg:grid-cols-12">
        {/* Left: Weekly Evolution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 @lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Évolution de la semaine (CA et marge sur ventes)
              </h2>
              <p className="text-xs text-slate-500">
                Touchez un jour pour voir le détail exact
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-1.5 text-right text-xs">
              <span className="font-semibold text-slate-500">{activeDay.day} : </span>
              <span className="font-bold text-slate-900 tabular-nums">
                CA {fmt(activeDay.caFC)}
              </span>
              <span className="mx-1.5 text-slate-300">|</span>
              <span className="font-bold text-emerald-600 tabular-nums">
                Marge +{fmt(activeDay.netProfitFC)}
              </span>
            </div>
          </div>

          {/* Interactive chart uses only recorded sales; no demo bars are shown. */}
          {!hasWeekSales && (
            <p className="mt-5 rounded-xl bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
              Vos ventes apparaîtront ici après votre première transaction.
            </p>
          )}
          <div className="mt-6 grid h-48 grid-cols-7 items-end gap-2.5 pt-4">
            {chartDays.map((item, idx) => {
              const caHeightPct = hasWeekSales ? Math.max(14, Math.round((item.caFC / maxCA) * 100)) : 0;
              const profitHeightPct = hasWeekSales
                ? Math.max(8, Math.round((item.netProfitFC / maxCA) * 100))
                : 0;
              const isSelected = idx === selectedDayIdx;
              const isToday = idx === chartDays.length - 1;

              return (
                <button
                  key={item.day}
                  type="button"
                  onClick={() => setSelectedDayIdx(idx)}
                  className={`group flex h-full flex-col items-center justify-end rounded-xl p-1.5 transition ${
                    isSelected ? 'bg-emerald-50/70 ring-1 ring-emerald-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="relative flex h-full w-full max-w-[36px] items-end justify-center gap-1">
                    <div
                      style={{ height: `${caHeightPct}%` }}
                      className={`w-1/2 rounded-t-md transition-all ${
                        isSelected ? 'bg-slate-700' : 'bg-slate-200 group-hover:bg-slate-300'
                      }`}
                    />
                    <div
                      style={{ height: `${profitHeightPct}%` }}
                      className={`w-1/2 rounded-t-md transition-all ${
                        isSelected ? 'bg-emerald-600' : 'bg-emerald-400 group-hover:bg-emerald-500'
                      }`}
                    />
                  </div>
                  <span
                    className={`mt-2 text-xs font-semibold ${
                      isToday
                        ? 'text-emerald-700'
                        : isSelected
                          ? 'text-slate-900'
                          : 'text-slate-500'
                    }`}
                  >
                    {item.day}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-center gap-6 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-slate-700" />
              Chiffre d’Affaires (CA)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" />
              Marge sur ventes (avant frais)
            </span>
          </div>
        </div>

        {/* Right: Alerts Stock Faible + Résumé Crédits */}
        <div className="flex flex-col justify-between gap-4 @lg:col-span-5">
          {/* Stock Alerts Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-900">
                  Marchandises à racheter bientôt ({lowStockProducts.length})
                </h2>
              </div>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                Voir le stock
              </button>
            </div>

            {lowStockProducts.length === 0 ? (
              <p className="mt-4 rounded-xl bg-emerald-50 p-3.5 text-xs font-medium text-emerald-800">
                Tous vos produits ont un bon niveau de stock aujourd’hui.
              </p>
            ) : (
              <div className="mt-3.5 space-y-2.5">
                {lowStockProducts.slice(0, 3).map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover bg-white"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900">
                          {prod.name}
                        </p>
                        <p className="text-[11px] font-medium text-amber-700">
                          Reste seulement <strong>{prod.stock} {prod.unit}s</strong> (seuil : {prod.minStockAlert})
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onRestockProduct(prod)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-emerald-700 shadow-2xs ring-1 ring-slate-200 transition hover:bg-emerald-50"
                    >
                      <PackagePlus className="h-3.5 w-3.5" />
                      <span>+ Stock</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Credit Card ("Bon") */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Carnet « Bon / Crédit Clients »
                </span>
                <div className="mt-1 text-xl font-extrabold text-slate-900 tabular-nums">
                  {fmt(totalCreditsUnpaid)}{' '}
                  <span className="text-xs font-medium text-slate-500">dehors à récupérer</span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('credits')}
                className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800 transition hover:bg-emerald-600 hover:text-white"
              >
                Gérer ({credits.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Counter Strip + Latest Daily Sales */}
      <div className="grid grid-cols-1 gap-6 @lg:grid-cols-12">
        {/* Fast 1-Click Sale Strip */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 @lg:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Vente Éclair « 1 Clic » (Produits les plus vendus)
              </h2>
              <p className="text-xs text-slate-500">
                Appuyez sur +1 pour tester le calcul automatique immédiat
              </p>
            </div>
          </div>

          <div className="mt-3.5 space-y-2.5">
            {products.slice(0, 4).map((prod) => {
              const unitProfit = prod.sellingPriceFC - prod.purchasePriceFC;
              return (
                <div
                  key={prod.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-2.5 transition hover:border-emerald-200 hover:bg-slate-50/70"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="h-11 w-11 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900">{prod.name}</p>
                      <p className="text-[11px] text-slate-500 tabular-nums">
                        {fmt(prod.sellingPriceFC)} ·{' '}
                        <span className="font-semibold text-emerald-700">
                          Gain +{fmt(unitProfit)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onQuickSellProduct(prod)}
                    disabled={prod.stock <= 0}
                    className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>+1 Vendu</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Latest Sales Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 @lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Dernières ventes de la journée ({sales.length})
              </h2>
              <p className="text-xs text-slate-500">
                Chaque vente met à jour le stock, le CA et votre revenu net
              </p>
            </div>
            <button
              onClick={() => onNavigate('pos')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Tout voir →
            </button>
          </div>

          <div className="mt-3.5 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase text-slate-400">
                  <th className="pb-2.5">Marchandise</th>
                  <th className="pb-2.5 text-center">Qté</th>
                  <th className="pb-2.5 text-right">CA Vente</th>
                  <th className="pb-2.5 text-right">Revenu Gagné</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.slice(0, 5).map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={sale.productImage}
                          alt={sale.productName}
                          className="h-8 w-8 shrink-0 rounded-md object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {sale.productName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {sale.timestamp} ·{' '}
                            {sale.paymentMethod === 'cash'
                              ? 'Espèces'
                              : sale.paymentMethod === 'mobile_money'
                                ? sale.customerName || 'Mobile Money'
                                : `Crédit (${sale.customerName || 'Client'})`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-center font-bold text-slate-700 tabular-nums">
                      ×{sale.quantity}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-slate-900 tabular-nums">
                      {fmt(sale.totalRevenueFC)}
                    </td>
                    <td className="py-2.5 text-right font-bold text-emerald-700 tabular-nums">
                      +{fmt(sale.netProfitFC)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
        </div>
      </details>
    </div>
  );
};
