import React from 'react';
import { ArrowLeft, MessageCircle, PackageCheck, Store } from 'lucide-react';
import { AppLanguage } from '../types';
import { formatMoney } from '../utils/currency';
import { decodePublicCatalogOrder, makePublicCatalogUrl } from '../utils/publicCatalog';

interface PublicOrderPageProps {
  token: string;
}

const COPY: Record<AppLanguage, Record<string, string>> = {
  fr: {
    title: 'Demande de commande', reference: 'Référence', received: 'Créée le', customer: 'Coordonnées de l’acheteur', name: 'Nom', phone: 'WhatsApp', address: 'Adresse',
    items: 'Articles demandés', quantity: 'Qté', subtotal: 'Sous-total estimé', delivery: 'Livraison estimée', total: 'Total estimé',
    pending: 'Demande non payée. La boutique doit confirmer le stock, les frais de livraison et le montant final.',
    private: 'Toute personne qui possède ce lien peut consulter cette demande. Gardez-le privé.',
    contact: 'Répondre à l’acheteur sur WhatsApp', back: 'Retour au catalogue', invalid: 'Ce lien de commande est invalide ou incomplet.',
  },
  en: {
    title: 'Order request', reference: 'Reference', received: 'Created on', customer: 'Customer details', name: 'Name', phone: 'WhatsApp', address: 'Address',
    items: 'Requested items', quantity: 'Qty', subtotal: 'Estimated subtotal', delivery: 'Estimated delivery', total: 'Estimated total',
    pending: 'Unpaid request. The shop must confirm stock, delivery fees and the final amount.',
    private: 'Anyone with this link can view the request. Keep it private.',
    contact: 'Reply to customer on WhatsApp', back: 'Back to catalog', invalid: 'This order link is invalid or incomplete.',
  },
  ln: {
    title: 'Demande ya kosomba', reference: 'Numéro', received: 'Esalemi na', customer: 'Makambo ya mokili', name: 'Kombo', phone: 'WhatsApp', address: 'Adresse',
    items: 'Biloko oyo asengi', quantity: 'Motango', subtotal: 'Motuya ya biloko', delivery: 'Frais ya livraison (estimation)', total: 'Motuya mobimba (estimation)',
    pending: 'Demande efutami naino te. Boutique esengeli kondimisa stock, livraison mpe motuya ya suka.',
    private: 'Moto nyonso oyo azali na lien oyo akoki kotala demande. Bomba yango na sekele.',
    contact: 'Yanola mokili na WhatsApp', back: 'Zonga na catalogue', invalid: 'Lien ya demande oyo ezali ya solo te to ezangi makambo.',
  },
  sw: {
    title: 'Ombi la agizo', reference: 'Rejea', received: 'Limetengenezwa', customer: 'Maelezo ya mteja', name: 'Jina', phone: 'WhatsApp', address: 'Anwani',
    items: 'Bidhaa zilizoombwa', quantity: 'Idadi', subtotal: 'Jumla ndogo inayokadiriwa', delivery: 'Makadirio ya usafirishaji', total: 'Makadirio ya jumla',
    pending: 'Ombi halijalipwa. Duka lazima lithibitishe bidhaa, ada za usafirishaji na kiasi cha mwisho.',
    private: 'Mtu yeyote mwenye kiungo hiki anaweza kuona ombi. Kiweke siri.',
    contact: 'Mjibu mteja kwenye WhatsApp', back: 'Rudi kwenye katalogi', invalid: 'Kiungo hiki cha agizo si sahihi au hakijakamilika.',
  },
  zh: {
    title: '订单请求', reference: '编号', received: '创建时间', customer: '买家信息', name: '姓名', phone: 'WhatsApp', address: '地址',
    items: '请求商品', quantity: '数量', subtotal: '预计小计', delivery: '预计配送费', total: '预计总计',
    pending: '订单尚未付款。商家需确认库存、配送费和最终金额。',
    private: '任何拥有此链接的人都可以查看请求，请妥善保管。',
    contact: '通过 WhatsApp 回复买家', back: '返回商品目录', invalid: '此订单链接无效或不完整。',
  },
};

function detectLanguage(): AppLanguage {
  const browserLang = typeof navigator === 'undefined' ? 'fr' : navigator.language.toLowerCase();
  if (browserLang.startsWith('en')) return 'en';
  if (browserLang.startsWith('sw')) return 'sw';
  if (browserLang.startsWith('ln')) return 'ln';
  if (browserLang.startsWith('zh')) return 'zh';
  return 'fr';
}

export const PublicOrderPage: React.FC<PublicOrderPageProps> = ({ token }) => {
  const language = detectLanguage();
  const order = decodePublicCatalogOrder(token);
  const text = COPY[language];

  if (!order) {
    return <MessagePage message={text.invalid} />;
  }

  const fmt = (amount: number) => formatMoney(amount, order.shop.currency, order.shop.usdRateFC);
  const locale = language === 'zh' ? 'zh-CN' : language === 'en' ? 'en' : language === 'sw' ? 'sw' : 'fr-FR';
  const createdDate = new Date(order.createdAt);
  const createdText = Number.isNaN(createdDate.getTime()) ? '' : createdDate.toLocaleString(locale);
  const buyerPhone = order.customer.phone.replace(/\D/g, '');
  const whatsappUrl = buyerPhone
    ? `https://wa.me/${buyerPhone}?text=${encodeURIComponent(`Bonjour ${order.customer.name}, nous avons bien reçu votre demande ${order.reference} auprès de ${order.shop.name}.` )}`
    : '';

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          {order.shop.logo ? (
            <img src={order.shop.logo} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-slate-100 bg-white p-1 object-contain" />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0A4DFF]"><Store className="h-6 w-6" /></span>
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-black">{order.shop.name}</p>
            {order.shop.city && <p className="truncate text-xs text-slate-500">{order.shop.city}</p>}
          </div>
        </header>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white p-5 sm:p-7">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0A4DFF] shadow-sm"><PackageCheck className="h-5 w-5" /></span>
              <div className="min-w-0">
                <h1 className="text-xl font-black sm:text-2xl">{text.title}</h1>
                <p className="mt-1 text-sm text-slate-600">{text.reference}: <strong className="text-slate-900">{order.reference}</strong></p>
                {createdText && <p className="mt-1 text-xs text-slate-500">{text.received} {createdText}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-7">
            <div className="rounded-2xl bg-slate-50 p-4">
              <h2 className="text-sm font-extrabold">{text.customer}</h2>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-slate-500">{text.name}</dt><dd className="break-words font-semibold">{order.customer.name}</dd></div>
                <div><dt className="text-xs text-slate-500">{text.phone}</dt><dd className="break-words font-semibold">{order.customer.phone}</dd></div>
                <div className="sm:col-span-2"><dt className="text-xs text-slate-500">{text.address}</dt><dd className="break-words font-semibold">{order.customer.address}</dd></div>
              </dl>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-extrabold">{text.items}</h2>
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100">
                {order.items.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex items-start justify-between gap-4 p-3.5 text-sm">
                    <span className="min-w-0"><strong>{item.quantity} ×</strong> {item.name}{item.unit ? <span className="ml-1 text-xs text-slate-500">({item.unit})</span> : null}</span>
                    <strong className="shrink-0 tabular-nums">{fmt(item.unitPriceFC * item.quantity)}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-4 text-sm">
              <PriceRow label={text.subtotal} amount={fmt(order.subtotalFC)} />
              <PriceRow label={text.delivery} amount={fmt(order.deliveryFeeFC)} />
              <PriceRow label={text.total} amount={fmt(order.totalFC)} bold />
            </div>

            <p className="rounded-xl bg-amber-50 p-3 text-xs font-medium leading-relaxed text-amber-900">{text.pending}</p>
            <p className="text-center text-[11px] leading-relaxed text-slate-500">{text.private}</p>

            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-extrabold text-white">
                <MessageCircle className="h-4 w-4" /> {text.contact}
              </a>
            )}
            {order.catalogId && (
              <a href={makePublicCatalogUrl(order.catalogId)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700">
                <ArrowLeft className="h-4 w-4" /> {text.back}
              </a>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

const PriceRow: React.FC<{ label: string; amount: string; bold?: boolean }> = ({ label, amount, bold }) => (
  <div className={`flex items-center justify-between gap-3 ${bold ? 'pt-2 text-base font-black' : 'text-slate-600'}`}>
    <span>{label}</span><span className="shrink-0 tabular-nums">{amount}</span>
  </div>
);

const MessagePage: React.FC<{ message: string }> = ({ message }) => (
  <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5 text-center">
    <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <Store className="mx-auto h-10 w-10 text-slate-400" />
      <h1 className="mt-4 text-xl font-black text-slate-900">ShopFlow</h1>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
    </div>
  </main>
);
