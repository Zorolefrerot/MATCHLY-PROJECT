import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { CartItem, Product, ShopSettings } from '../types';
import { formatMoney } from '../utils/currency';

interface OnlineStoreViewProps {
  settings: ShopSettings;
  products: Product[];
  onSimulateOnlineOrderReceived: (
    items: CartItem[],
    customerName: string,
    deliveryQuartier: string
  ) => void;
  onShareWhatsAppOrder: (msg: string, label: string) => void;
}

export const OnlineStoreView: React.FC<OnlineStoreViewProps> = ({
  settings,
  products,
  onSimulateOnlineOrderReceived,
  onShareWhatsAppOrder,
}) => {
  const [customerCart, setCustomerCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Maman Mireille');
  const [quartier, setQuartier] = useState('Gombe — Rond-Point Forescom');
  const [copiedLink, setCopiedLink] = useState(false);

  const fmt = (val: number) =>
    formatMoney(val, settings.currency, settings.usdRateFC);

  const slug = settings.shopName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const storePublicUrl = `https://shopflow.cd/${slug || 'ma-boutique'}`;

  const addItem = (product: Product) => {
    if (product.stock <= 0) return;
    setCustomerCart((prev) => {
      const found = prev.find((i) => i.product.id === product.id);
      if (found) {
        if (found.quantity >= product.stock) return prev;
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setCustomerCart((prev) =>
      prev
        .map((i) => {
          if (i.product.id !== id) return i;
          const next = i.quantity + delta;
          if (next <= 0) return null;
          if (next > i.product.stock) return i;
          return { ...i, quantity: next };
        })
        .filter((x): x is CartItem => x !== null)
    );
  };

  const totalOrderFC = customerCart.reduce(
    (s, i) => s + i.product.sellingPriceFC * i.quantity,
    0
  );

  const handleCopyStoreLink = async () => {
    try {
      await navigator.clipboard.writeText(storePublicUrl);
    } catch {
      // Ignore clipboard restriction
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendWhatsAppOrder = () => {
    if (customerCart.length === 0) return;
    const lines = customerCart
      .map(
        (i) =>
          `• ${i.quantity}x ${i.product.name} (${fmt(
            i.product.sellingPriceFC * i.quantity
          )})`
      )
      .join('\n');

    const msg =
      `🛍️ *NOUVELLE COMMANDE EN LIGNE — ${settings.shopName.toUpperCase()}*\n` +
      `👤 Client : *${customerName || 'Client Web'}*\n` +
      `📍 Livraison : *${quartier || 'À confirmer'}*\n` +
      `--------------------------\n` +
      `${lines}\n` +
      `--------------------------\n` +
      `💰 *TOTAL COMMANDE : ${fmt(totalOrderFC)}*`;

    onSimulateOnlineOrderReceived(customerCart, customerName, quartier);
    setCustomerCart([]);
    onShareWhatsAppOrder(msg, `${settings.shopName} (${settings.whatsappNumber})`);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Merchant Control Banner: Shareable Link for WhatsApp Status / Facebook / TikTok */}
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 @lg:flex-row @lg:items-center @lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-[11px] font-extrabold text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />
              FONCTION PRO : MINI-BOUTIQUE EN LIGNE AUTOMATIQUE
            </span>
            <h1 className="mt-2 text-lg font-extrabold @md:text-xl">
              Votre Catalogue Client « Commander sur WhatsApp »
            </h1>
            <p className="mt-0.5 text-xs text-emerald-100/90">
              Partagez ce lien en Statut WhatsApp, Facebook ou TikTok : vos clients commandent tout seuls et votre stock se met à jour !
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/10 p-2 backdrop-blur-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-emerald-100">
              <Globe className="h-4 w-4 text-emerald-300" />
              <span className="truncate">{storePublicUrl}</span>
            </div>

            <button
              type="button"
              onClick={handleCopyStoreLink}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-extrabold text-emerald-950 transition hover:bg-emerald-50"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Lien copié !</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copier le lien</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Customer-Facing Storefront Live Simulation */}
      <div className="grid grid-cols-1 gap-6 @lg:grid-cols-12">
        {/* Catalog visible by Customers */}
        <div className="space-y-4 @lg:col-span-8">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                Aperçu en direct côté client
              </span>
              <h2 className="text-base font-extrabold text-slate-900">
                Bienvenue chez {settings.shopName}
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
              <ExternalLink className="h-3.5 w-3.5" />
              En stock réel
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @xl:grid-cols-3">
            {products
              .filter((p) => p.stock > 0)
              .map((prod) => {
                const inBasket = customerCart.find(
                  (c) => c.product.id === prod.id
                );
                return (
                  <div
                    key={prod.id}
                    className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-emerald-300"
                  >
                    <div>
                      <div className="relative h-36 bg-slate-100">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute top-2.5 left-2.5 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                          Disponible ({prod.stock})
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="text-[11px] text-slate-400">
                          {prod.category}
                        </p>
                        <h3 className="mt-0.5 line-clamp-1 text-sm font-bold text-slate-900">
                          {prod.name}
                        </h3>
                        <p className="mt-2 text-base font-extrabold text-emerald-700 tabular-nums">
                          {fmt(prod.sellingPriceFC)}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 p-3">
                      <button
                        type="button"
                        onClick={() => addItem(prod)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-600"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>
                          {inBasket
                            ? `Ajouté au panier (${inBasket.quantity})`
                            : '+ Ajouter à ma commande'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right: Customer Order Checkout via WhatsApp */}
        <div className="@lg:col-span-4">
          <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-extrabold text-slate-900">
              Panier Client en Ligne ({customerCart.reduce((a, b) => a + b.quantity, 0)})
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Testez comment un client de Kinshasa vous envoie sa commande prête :
            </p>

            {customerCart.length === 0 ? (
              <div className="my-8 rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-500">
                Cliquez sur <strong>« + Ajouter à ma commande »</strong> sur un produit pour simuler la commande d’un client.
              </div>
            ) : (
              <div className="mt-4 space-y-4 text-xs">
                <div className="space-y-2">
                  {customerCart.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">
                          {product.name}
                        </p>
                        <p className="text-[11px] font-semibold text-emerald-700 tabular-nums">
                          {fmt(product.sellingPriceFC * quantity)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => changeQty(product.id, -1)}
                          className="rounded-lg border border-slate-200 bg-white p-1"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center font-bold tabular-nums">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeQty(product.id, 1)}
                          className="rounded-lg border border-slate-200 bg-white p-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <label className="block font-bold text-slate-700">
                    Coordonnées de livraison client
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Votre nom"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium"
                  />
                  <input
                    type="text"
                    value={quartier}
                    onChange={(e) => setQuartier(e.target.value)}
                    placeholder="Commune / Quartier / Référence"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="font-bold text-slate-600">Total à payer</span>
                  <span className="text-base font-extrabold text-slate-900 tabular-nums">
                    {fmt(totalOrderFC)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSendWhatsAppOrder}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Commander sur WhatsApp & Encaisser</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
