import React, { useState } from 'react';
import {
  CheckCircle2,
  History,
  Minus,
  Plus,
  ReceiptText,
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
  VisualReceiptPayload,
} from '../types';
import { formatMoney, fromDisplayAmount } from '../utils/currency';
import { formatSaleDateTime, formatSaleTime } from '../utils/saleDate';

interface PosSalesViewProps {
  settings: ShopSettings;
  products: Product[];
  sales: SaleRecord[];
  onQuickSellProduct: (product: Product) => void;
  onCompleteCartSale: (
    items: CartItem[],
    paymentMethod: PaymentMethod,
    customerName: string,
    customerPhone: string,
    customerAddress: string,
    deliveryFeeFC: number
  ) => void;
  onUndoSale: (saleId: string) => void;
  onOpenVisualReceipt: (payload: VisualReceiptPayload) => void;
  onOpenScanner: () => void;
  externalCartAddProduct?: { product: Product; nonce: number } | null;
}

const CATEGORIES = [
  'Tous',
  'Bijoux',
  'Accessoires',
  'Vêtements',
  'Chaussures',
  'E-books',
  'Alimentation',
  'Boissons',
  'Hygiène',
  'Mode & Accessoires',
  'Huiles & Lait',
] as const;

export const PosSalesView: React.FC<PosSalesViewProps> = ({
  settings,
  products,
  sales,
  onQuickSellProduct,
  onCompleteCartSale,
  onUndoSale,
  onOpenVisualReceipt,
  onOpenScanner,
  externalCartAddProduct,
}) => {
  const [subTab, setSubTab] = useState<'catalog' | 'history'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('mobile_money');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryInput, setDeliveryInput] = useState('');
  const [cashGivenInput, setCashGivenInput] = useState('');

  const fmt = (val: number) =>
    formatMoney(val, settings.currency, settings.usdRateFC);

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

  React.useEffect(() => {
    if (externalCartAddProduct) {
      addToCart(externalCartAddProduct.product);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalCartAddProduct?.nonce]);

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === 'Tous' || p.category === selectedCategory;
    const matchesSearch = p.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

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

  const deliveryFeeFC =
    deliveryInput !== ''
      ? fromDisplayAmount(
          parseFloat(deliveryInput) || 0,
          settings.currency,
          settings.usdRateFC
        )
      : settings.defaultDeliveryFeeFC;

  const cashGivenFC = fromDisplayAmount(
    parseFloat(cashGivenInput) || 0,
    settings.currency,
    settings.usdRateFC
  );
  const changeToReturnFC = Math.max(0, cashGivenFC - cartTotalCA);

  const handleCheckout = (openVisualReceiptAfter: boolean) => {
    if (cart.length === 0) return;

    const finalClient = customerName.trim() || 'Client Comptoir';
    const finalPhone = customerPhone.trim();
    const finalAddress = customerAddress.trim();

    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(
      now.getMonth() + 1
    ).padStart(2, '0')}/${now.getFullYear()}  ${String(
      now.getHours()
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const invoiceNum = `#2026-0${Math.floor(100 + Math.random() * 899)}`;
    const randomRef = `${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const methodText =
      paymentMethod === 'mobile_money'
        ? 'Mobile Money (M-Pesa / Airtel / Orange)'
        : paymentMethod === 'cash'
          ? 'Espèces (Cash Comptoir)'
          : paymentMethod === 'card'
            ? 'Carte Bancaire (Visa / Mastercard)'
            : 'À Crédit (Bon Client)';

    const snapshotPayload: VisualReceiptPayload = {
      invoiceNumber: invoiceNum,
      dateTime: dateFormatted,
      customerName: finalClient,
      customerPhone: finalPhone,
      customerAddress: finalAddress,
      paymentMethodLabel: methodText,
      paymentReference: randomRef,
      isPaid: paymentMethod !== 'credit',
      items: cart.map(({ product, quantity }, idx) => ({
        id: product.id,
        refCode: product.refCode || `SF-00${idx + 1}`,
        name: product.name,
        subtitle: product.unit,
        image: product.image,
        quantity,
        unitPriceFC: product.sellingPriceFC,
      })),
      deliveryFeeFC,
    };

    onCompleteCartSale(
      cart,
      paymentMethod,
      finalClient,
      finalPhone,
      finalAddress,
      deliveryFeeFC
    );
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCashGivenInput('');

    if (openVisualReceiptAfter) {
      onOpenVisualReceipt(snapshotPayload);
    }
  };

  const openReceiptFromSingleSale = (s: SaleRecord) => {
    const now = new Date();
    onOpenVisualReceipt({
      invoiceNumber: `#2026-${s.id.slice(-4)}`,
      dateTime: formatSaleDateTime(s.timestamp),
      customerName: s.customerName || 'Client Comptoir',
      customerPhone: s.customerPhone || '',
      customerAddress: s.customerAddress || '',
      paymentMethodLabel:
        s.paymentMethod === 'mobile_money'
          ? 'Mobile Money (M-Pesa / Vodacom)'
          : s.paymentMethod === 'credit'
            ? 'À Crédit (Bon Client)'
            : 'Espèces (Cash)',
      paymentReference: '8F7A-3D9B-6C1E',
      isPaid: s.paymentMethod !== 'credit',
      items: [
        {
          id: s.productId,
          refCode: 'SF-001',
          name: s.productName,
          subtitle: 'Article Boutique',
          image: s.productImage,
          quantity: s.quantity,
          unitPriceFC: s.unitSellingPriceFC,
        },
      ],
      deliveryFeeFC: s.deliveryFeeFC ?? settings.defaultDeliveryFeeFC,
    });
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
                ? 'bg-white text-[#081844] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="h-4 w-4 text-[#0A4DFF]" />
            <span>Caisse & Vente Rapide</span>
          </button>
          <button
            onClick={() => setSubTab('history')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              subTab === 'history'
                ? 'bg-white text-[#081844] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="h-4 w-4 text-[#0A4DFF]" />
            <span>Ventes du jour ({sales.length})</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl bg-emerald-50/80 px-4 py-2 text-xs @md:justify-end">
          <div>
            <span className="text-slate-600">CA Ventes : </span>
            <strong className="font-extrabold text-slate-900 tabular-nums">
              {fmt(totalSalesTodayCA)}
            </strong>
          </div>
          <span className="text-emerald-300">|</span>
          <div>
            <span className="text-emerald-800">Gain : </span>
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
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher une marchandise..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0A4DFF] focus:bg-white focus:outline-hidden"
                  />
                </div>

                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#081844] px-3.5 py-2.5 text-xs font-extrabold text-white transition hover:bg-slate-800"
                >
                  <ScanBarcode className="h-4 w-4 text-sky-400" />
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
                        ? 'bg-[#0A4DFF] text-white'
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
                    className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-blue-300 hover:shadow-xs"
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
                          {product.category} · {product.unit}
                        </span>
                        <h3 className="mt-0.5 line-clamp-1 text-sm font-bold text-slate-900">
                          {product.name}
                        </h3>

                        <div className="mt-2.5 flex items-baseline justify-between">
                          <span className="text-base font-extrabold text-slate-900 tabular-nums">
                            {fmt(product.sellingPriceFC)}
                          </span>
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 tabular-nums">
                            +{fmt(profitPerUnit)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50/70 p-3">
                      <button
                        onClick={() => onQuickSellProduct(product)}
                        disabled={product.stock <= 0}
                        className="flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95 disabled:bg-slate-300"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        <span>+1 Vendu</span>
                      </button>

                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                        className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 transition hover:border-[#0A4DFF] hover:bg-blue-50 hover:text-[#081844] disabled:opacity-50"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        <span>
                          {inCart ? `Panier (${inCart.quantity})` : 'Facture +'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Ticket & Visual WhatsApp Receipt Generator */}
          <div className="@lg:col-span-4">
            <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <ReceiptText className="h-4 w-4 text-[#0A4DFF]" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Ticket & Reçu WhatsApp ({cartTotalItems})
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
                    <ReceiptText className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-xs font-bold text-slate-700">
                    Ajoutez des articles avec « Facture + »
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Génère automatiquement le **vrai Reçu Image Haute Définition** (modèle officiel avec photos, code-barres & logo boutique) à envoyer sur WhatsApp !
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3.5">
                  <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
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
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold tabular-nums">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateCartQty(product.id, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mode de paiement */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Mode de paiement
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { id: 'mobile_money', label: 'Mobile Money' },
                          { id: 'cash', label: 'Cash Espèces' },
                          { id: 'card', label: 'Carte Bancaire' },
                          { id: 'credit', label: 'Bon / Crédit' },
                        ] as const
                      ).map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setPaymentMethod(mode.id)}
                          className={`rounded-xl border px-2.5 py-2 text-[11px] font-bold transition ${
                            paymentMethod === mode.id
                              ? 'border-[#0A4DFF] bg-blue-50 text-[#081844]'
                              : 'border-slate-200 bg-white text-slate-600'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Client & Livraison Details for Receipt */}
                  <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-xs">
                    <p className="text-[11px] font-extrabold text-slate-700">
                      Infos Client sur le Reçu WhatsApp :
                    </p>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nom du client (facultatif)"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+243 97..."
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="Commune / Quartier"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={deliveryInput}
                      onChange={(e) => setDeliveryInput(e.target.value)}
                      placeholder={`Frais de livraison (défaut: ${fmt(settings.defaultDeliveryFeeFC)})`}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs tabular-nums"
                    />
                  </div>

                  {paymentMethod === 'cash' && (
                    <div className="rounded-xl bg-emerald-50/50 p-2.5 text-xs">
                      <input
                        type="number"
                        min="0"
                        value={cashGivenInput}
                        onChange={(e) => setCashGivenInput(e.target.value)}
                        placeholder={`Billet remis (${settings.currency}) — calcul monnaie`}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold tabular-nums"
                      />
                      {cashGivenFC > cartTotalCA && (
                        <p className="mt-1 font-bold text-emerald-700 tabular-nums">
                          Monnaie à rendre : {fmt(changeToReturnFC)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Totals */}
                  <div className="space-y-1 border-t border-slate-100 pt-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Facture</span>
                      <span className="text-base font-extrabold text-slate-900 tabular-nums">
                        {fmt(cartTotalCA + deliveryFeeFC)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Bénéfice net</span>
                      <span className="font-bold text-emerald-700 tabular-nums">
                        +{fmt(cartTotalProfit)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => handleCheckout(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A4DFF] py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#0839C8]"
                    >
                      <ReceiptText className="h-4 w-4" />
                      <span>Valider + Générer Reçu Image WhatsApp</span>
                    </button>

                    <button
                      onClick={() => handleCheckout(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Encaisser rapidement sans reçu</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Daily Sales History Table with Direct Visual Receipt Button */
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="pb-4">
            <h2 className="text-base font-bold text-slate-900">
              Historique des ventes
            </h2>
            <p className="text-xs text-slate-500">
              Les ventes récentes sont affichées en premier. Ouvrez un reçu depuis une ligne pour le consulter ou l’envoyer au client.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400">
                  <th className="pb-3">Heure</th>
                  <th className="pb-3">Marchandise & Client</th>
                  <th className="pb-3 text-center">Qté</th>
                  <th className="pb-3 text-right">CA Vente</th>
                  <th className="pb-3 text-right">Revenu</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 pr-3 font-medium text-slate-500 tabular-nums">
                      {formatSaleTime(s.timestamp)}
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={s.productImage}
                          alt={s.productName}
                          className="h-9 w-9 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-bold text-slate-900">
                            {s.productName}
                          </p>
                          <span className="text-[11px] text-slate-500">
                            {s.customerName || 'Client Comptoir'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center font-bold text-slate-800 tabular-nums">
                      {s.quantity}
                    </td>
                    <td className="py-3 text-right font-bold text-slate-900 tabular-nums">
                      {fmt(s.totalRevenueFC)}
                    </td>
                    <td className="py-3 text-right font-extrabold text-emerald-700 tabular-nums">
                      +{fmt(s.netProfitFC)}
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openReceiptFromSingleSale(s)}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-[#0A4DFF] transition hover:bg-blue-100"
                        >
                          <ReceiptText className="h-3.5 w-3.5" />
                          <span>Reçu Image</span>
                        </button>
                        <button
                          onClick={() => onUndoSale(s.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
