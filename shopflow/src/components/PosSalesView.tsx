import React, { useState } from 'react';
import {
  CheckCircle2,
  History,
  MessageCircle,
  Minus,
  Plus,
  RotateCcw,
  ScanBarcode,
  Search,
  ShoppingCart,
  Zap,
} from 'lucide-react';
import {
  CartItem,
  PaymentMethod,
  Product,
  SaleRecord,
  ShopSettings,
} from '../types';
import { formatMoney, fromDisplayAmount } from '../utils/currency';

interface PosSalesViewProps {
  settings: ShopSettings;
  products: Product[];
  sales: SaleRecord[];
  onQuickSellProduct: (product: Product) => void;
  onCompleteCartSale: (
    items: CartItem[],
    paymentMethod: PaymentMethod,
    customerName: string,
    customerPhone: string
  ) => void;
  onUndoSale: (saleId: string) => void;
  onOpenReceiptWhatsApp: (receiptText: string, customerLabel: string) => void;
  onOpenScanner: () => void;
  externalCartAddProduct?: { product: Product; nonce: number } | null;
}

const CATEGORIES = ['Tous', 'Alimentation', 'Huiles & Lait', 'Hygiène', 'Boissons'] as const;

export const PosSalesView: React.FC<PosSalesViewProps> = ({
  settings,
  products,
  sales,
  onQuickSellProduct,
  onCompleteCartSale,
  onUndoSale,
  onOpenReceiptWhatsApp,
  onOpenScanner,
  externalCartAddProduct,
}) => {
  const [subTab, setSubTab] = useState<'catalog' | 'history'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [cashGivenInput, setCashGivenInput] = useState('');

  React.useEffect(() => {
    if (externalCartAddProduct) {
      addToCart(externalCartAddProduct.product);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalCartAddProduct?.nonce]);

  const fmt = (val: number) => formatMoney(val, settings.currency, settings.usdRateFC);

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'Tous' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          if (nextQty > item.product.stock) return item;
          return { ...item, quantity: nextQty };
        })
        .filter((x): x is CartItem => x !== null)
    );
  };

  const cartTotalCA = cart.reduce(
    (sum, i) => sum + i.product.sellingPriceFC * i.quantity,
    0
  );
  const cartTotalProfit = cart.reduce(
    (sum, i) =>
      sum + (i.product.sellingPriceFC - i.product.purchasePriceFC) * i.quantity,
    0
  );
  const cartTotalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  const cashGivenFC = fromDisplayAmount(
    parseFloat(cashGivenInput) || 0,
    settings.currency,
    settings.usdRateFC
  );
  const changeToReturnFC = Math.max(0, cashGivenFC - cartTotalCA);

  const handleCheckout = (sendWhatsAppAfter: boolean) => {
    if (cart.length === 0) return;
    const clientLabel =
      customerName.trim() ||
      (paymentMethod === 'credit' ? 'Client habituel' : 'Client comptoir');

    const lines = cart
      .map(
        (i) =>
          `• ${i.quantity}x ${i.product.name} = ${fmt(
            i.product.sellingPriceFC * i.quantity
          )}`
      )
      .join('\n');

    const receiptMsg =
      `🧾 *REÇU DE VENTE — ${settings.shopName.toUpperCase()}*\n` +
      `📍 ${settings.city}\n` +
      `--------------------------\n` +
      `${lines}\n` +
      `--------------------------\n` +
      `💰 *TOTAL PAYÉ : ${fmt(cartTotalCA)}*\n` +
      `💳 Mode : ${
        paymentMethod === 'cash'
          ? 'Espèces (Cash)'
          : paymentMethod === 'mobile_money'
            ? 'Mobile Money (M-Pesa / Orange / Airtel)'
            : `À Crédit (Bon — ${clientLabel})`
      }\n` +
      `Merci pour votre confiance ! 🙏`;

    onCompleteCartSale(cart, paymentMethod, clientLabel, customerPhone.trim());
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCashGivenInput('');

    if (sendWhatsAppAfter) {
      onOpenReceiptWhatsApp(receiptMsg, clientLabel);
    }
  };

  const totalSalesTodayCA = sales.reduce((s, r) => s + r.totalRevenueFC, 0);
  const totalSalesTodayProfit = sales.reduce((s, r) => s + r.netProfitFC, 0);

  return (
    <div className="space-y-5 pb-8">
      {/* Top Sub-Switch: Catalogue vs Journal des ventes */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 @md:flex-row @md:items-center @md:justify-between">
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setSubTab('catalog')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              subTab === 'catalog'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>Caisse & Vente Rapide</span>
          </button>
          <button
            onClick={() => setSubTab('history')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              subTab === 'history'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Ventes de la journée ({sales.length})</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl bg-emerald-50/80 px-4 py-2 text-xs @md:justify-end">
          <div>
            <span className="text-slate-600">CA Ventes du jour : </span>
            <strong className="font-extrabold text-slate-900 tabular-nums">
              {fmt(totalSalesTodayCA)}
            </strong>
          </div>
          <span className="text-emerald-300">|</span>
          <div>
            <span className="text-emerald-800">Gain sur ventes : </span>
            <strong className="font-extrabold text-emerald-700 tabular-nums">
              +{fmt(totalSalesTodayProfit)}
            </strong>
          </div>
        </div>
      </div>

      {subTab === 'catalog' ? (
        <div className="grid grid-cols-1 gap-6 @lg:grid-cols-12">
          {/* Left: Product Grid */}
          <div className="space-y-4 @lg:col-span-8">
            {/* Search & Scanner Bar */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher (riz, huile, lait...)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-extrabold text-white transition hover:bg-slate-800"
                >
                  <ScanBarcode className="h-4 w-4 text-emerald-400" />
                  <span>Scanner</span>
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Merchandise Cards */}
            <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const profitPerUnit =
                  product.sellingPriceFC - product.purchasePriceFC;
                const isLow = product.stock <= product.minStockAlert;
                const inCart = cart.find((c) => c.product.id === product.id);

                return (
                  <div
                    key={product.id}
                    className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-emerald-300 hover:shadow-xs"
                  >
                    <div>
                      <div className="relative h-36 w-full bg-slate-100">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                        <span
                          className={`absolute top-2.5 right-2.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-2xs ${
                            product.stock === 0
                              ? 'bg-red-600 text-white'
                              : isLow
                                ? 'bg-amber-500 text-white'
                                : 'bg-white/95 text-slate-800'
                          }`}
                        >
                          Stock : {product.stock}
                        </span>
                      </div>

                      <div className="p-4">
                        <span className="text-[11px] font-medium text-slate-400">
                          {product.category} · Par {product.unit}
                        </span>
                        <h3 className="mt-0.5 line-clamp-1 text-sm font-bold text-slate-900">
                          {product.name}
                        </h3>

                        <div className="mt-2.5 flex items-baseline justify-between">
                          <span className="text-base font-extrabold text-slate-900 tabular-nums">
                            {fmt(product.sellingPriceFC)}
                          </span>
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 tabular-nums">
                            Gain +{fmt(profitPerUnit)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Two clear actions: 1-Click Direct Sale OR Add to Ticket */}
                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50/70 p-3">
                      <button
                        onClick={() => onQuickSellProduct(product)}
                        disabled={product.stock <= 0}
                        className="flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300"
                        title="Enregistre immédiatement 1 vente cash"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        <span>+1 Vendu</span>
                      </button>

                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                        className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        <span>
                          {inCart ? `Panier (${inCart.quantity})` : 'Panier +'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Multi-item Ticket / Mobile Money / Credit ("Bon") */}
          <div className="@lg:col-span-4">
            <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Ticket Client ({cartTotalItems})
                  </h2>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Vider
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-slate-700">
                    Aucun article dans le ticket
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Utilisez <strong>« +1 Vendu »</strong> pour une vente express, ou{' '}
                    <strong>« Panier + »</strong> pour un client qui prend plusieurs articles ou à crédit.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {/* Cart items */}
                  <div className="max-h-56 space-y-2.5 overflow-y-auto pr-1">
                    {cart.map(({ product, quantity }) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-900">
                            {product.name}
                          </p>
                          <p className="text-[11px] text-slate-500 tabular-nums">
                            {fmt(product.sellingPriceFC * quantity)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            onClick={() => updateCartQty(product.id, -1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold tabular-nums">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateCartQty(product.id, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Mode de règlement client
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { id: 'cash', label: 'Cash' },
                          { id: 'mobile_money', label: 'Mobile Money' },
                          { id: 'credit', label: 'Bon / Crédit' },
                        ] as const
                      ).map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setPaymentMethod(mode.id)}
                          className={`rounded-xl border px-2 py-2 text-[11px] font-bold transition ${
                            paymentMethod === mode.id
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional change calculator for Cash OR Customer info for Credit */}
                  {paymentMethod === 'cash' && (
                    <div className="rounded-xl bg-slate-50 p-3">
                      <label className="block text-[11px] font-semibold text-slate-600">
                        Montant remis par le client ({settings.currency}) — optionnel
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={cashGivenInput}
                        onChange={(e) => setCashGivenInput(e.target.value)}
                        placeholder={`Ex: ${settings.currency === 'FC' ? '100000' : '50'}`}
                        className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 tabular-nums focus:border-emerald-500 focus:outline-hidden"
                      />
                      {cashGivenFC > cartTotalCA && (
                        <p className="mt-1.5 text-xs font-bold text-emerald-700 tabular-nums">
                          Monnaie à rendre : {fmt(changeToReturnFC)}
                        </p>
                      )}
                    </div>
                  )}

                  {(paymentMethod === 'credit' || paymentMethod === 'mobile_money') && (
                    <div className="space-y-2 rounded-xl bg-amber-50/60 p-3">
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder={
                          paymentMethod === 'credit'
                            ? 'Nom du client (ex: Maman Bijou)'
                            : 'Réf / Nom (ex: M-Pesa Client)'
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                      />
                      {paymentMethod === 'credit' && (
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Téléphone WhatsApp (+243...)"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                        />
                      )}
                    </div>
                  )}

                  {/* Totals Summary */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total à encaisser (CA)</span>
                      <span className="text-base font-extrabold text-slate-900 tabular-nums">
                        {fmt(cartTotalCA)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Bénéfice net calculé</span>
                      <span className="font-bold text-emerald-700 tabular-nums">
                        +{fmt(cartTotalProfit)}
                      </span>
                    </div>
                  </div>

                  {/* Checkout buttons */}
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => handleCheckout(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Valider la vente ({fmt(cartTotalCA)})</span>
                    </button>

                    <button
                      onClick={() => handleCheckout(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Valider + Reçu WhatsApp</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Full Daily Sales History View */
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Détail complet des ventes de la journée
              </h2>
              <p className="text-xs text-slate-500">
                En cas d’erreur de saisie, cliquez sur « Annuler » pour remettre automatiquement l’article en stock.
              </p>
            </div>
          </div>

          {sales.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Aucune vente enregistrée pour le moment aujourd’hui.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400">
                    <th className="pb-3">Heure</th>
                    <th className="pb-3">Marchandise</th>
                    <th className="pb-3 text-center">Qté</th>
                    <th className="pb-3 text-right">Prix d’achat total</th>
                    <th className="pb-3 text-right">CA Vente</th>
                    <th className="pb-3 text-right">Revenu Gagné</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-3 font-medium text-slate-500 tabular-nums">
                        {s.timestamp}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={s.productImage}
                            alt={s.productName}
                            className="h-9 w-9 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{s.productName}</p>
                            <span className="text-[11px] text-slate-500">
                              {s.paymentMethod === 'cash'
                                ? 'Espèces (Cash)'
                                : s.paymentMethod === 'mobile_money'
                                  ? s.customerName || 'Mobile Money'
                                  : `Bon Crédit · ${s.customerName || 'Client'}`}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-center font-bold text-slate-800 tabular-nums">
                        {s.quantity}
                      </td>
                      <td className="py-3 text-right text-slate-600 tabular-nums">
                        {fmt(s.totalCostFC)}
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900 tabular-nums">
                        {fmt(s.totalRevenueFC)}
                      </td>
                      <td className="py-3 text-right font-extrabold text-emerald-700 tabular-nums">
                        +{fmt(s.netProfitFC)}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onUndoSale(s.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-red-600 transition hover:bg-red-50"
                          title="Annuler cette vente et remettre en stock"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Annuler</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
