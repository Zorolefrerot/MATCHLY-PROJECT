import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, ImageOff, ShoppingBag, Store } from 'lucide-react';
import { AppLanguage } from '../types';
import { formatMoney } from '../utils/currency';
import { decodePublicCatalog, PublicCatalogProduct } from '../utils/publicCatalog';

interface PublicCatalogPageProps {
  token: string;
}

type CatalogStep = 'browse' | 'details' | 'review';
interface BasketLine {
  product: PublicCatalogProduct;
  quantity: number;
}

const COPY: Record<AppLanguage, Record<string, string>> = {
  fr: {
    catalog: 'Catalogue', available: 'disponible(s)', soldOut: 'Épuisé', add: 'Ajouter',
    basket: 'Ma sélection', empty: 'Choisissez un ou plusieurs articles pour commencer.',
    continue: 'Continuer', details: 'Vos coordonnées', name: 'Nom complet', phone: 'Votre numéro WhatsApp',
    address: 'Commune, quartier et repère', back: 'Retour', preview: 'Générer le reçu provisoire',
    review: 'Vérifiez le reçu de demande', reference: 'Référence de demande', item: 'Article', quantity: 'Qté',
    subtotal: 'Sous-total', delivery: 'Livraison estimée', total: 'Total estimé',
    send: 'Ouvrir WhatsApp pour envoyer', edit: 'Modifier ma sélection',
    notPaid: 'Demande non payée — disponibilité, frais et total à confirmer par la boutique.',
    snapshot: 'Catalogue publié le', snapshotNote: 'Les prix et stocks sont une photo au moment de la publication. La boutique les confirmera avant toute vente.',
    deliveryNote: 'Frais de livraison indicatifs; la boutique les confirmera.',
    chooser: 'Si plusieurs applications WhatsApp sont installées, choisissez celle proposée par votre téléphone. Vérifiez le message dans WhatsApp puis touchez Envoyer.',
    privacy: 'Vos coordonnées restent dans cette page jusqu’à l’ouverture de WhatsApp. ShopFlow ne les enregistre pas sur un serveur.',
    noContact: 'La boutique n’a pas renseigné de numéro WhatsApp.',
    unavailable: 'Ce catalogue est invalide ou n’est plus disponible.',
    emptyCatalog: 'Aucun article n’est affiché pour le moment.',
    selectError: 'Ajoutez au moins un article et remplissez votre nom, votre numéro et votre adresse.',
    waError: 'Impossible d’ouvrir WhatsApp. Vérifiez que l’application ou WhatsApp Web est disponible.',
    city: 'Ville',
  },
  en: {
    catalog: 'Catalog', available: 'available', soldOut: 'Sold out', add: 'Add',
    basket: 'My selection', empty: 'Choose one or more items to get started.',
    continue: 'Continue', details: 'Your details', name: 'Full name', phone: 'Your WhatsApp number',
    address: 'City, district and directions', back: 'Back', preview: 'Create draft order receipt',
    review: 'Review the request receipt', reference: 'Request reference', item: 'Item', quantity: 'Qty',
    subtotal: 'Subtotal', delivery: 'Estimated delivery', total: 'Estimated total',
    send: 'Open WhatsApp to send', edit: 'Edit my selection',
    notPaid: 'Unpaid request — the shop must confirm availability, fees and total.',
    snapshot: 'Catalog published on', snapshotNote: 'Prices and stock reflect the time of publication. The shop will confirm them before any sale.',
    deliveryNote: 'Delivery fee is an estimate and must be confirmed by the shop.',
    chooser: 'If you have multiple WhatsApp apps, choose the one shown by your phone. Review the message in WhatsApp and tap Send.',
    privacy: 'Your details stay on this page until WhatsApp opens. ShopFlow does not store them on a server.',
    noContact: 'The shop has not provided a WhatsApp number.',
    unavailable: 'This catalog is invalid or no longer available.',
    emptyCatalog: 'No items are listed yet.',
    selectError: 'Add at least one item and enter your name, number and address.',
    waError: 'Could not open WhatsApp. Check that the app or WhatsApp Web is available.',
    city: 'City',
  },
  ln: {
    catalog: 'Catalogue', available: 'ezali', soldOut: 'Esili', add: 'Bakisa',
    basket: 'Biloko naponi', empty: 'Poná biloko moko to mingi mpo na kobanda.',
    continue: 'Koba', details: 'Makambo na yo', name: 'Kombo mobimba', phone: 'Numero na yo ya WhatsApp',
    address: 'Engumba, quartier mpe esika ya koyeba', back: 'Zonga', preview: 'Sala reçu ya demande',
    review: 'Talá malamu reçu ya demande', reference: 'Numéro ya demande', item: 'Eloko', quantity: 'Motango',
    subtotal: 'Mokuse ya motuya', delivery: 'Frais ya livraison (estimation)', total: 'Motuya mobimba (estimation)',
    send: 'Fungola WhatsApp mpo na kotinda', edit: 'Bongola biloko oyo naponi',
    notPaid: 'Demande efutami naino te — boutique ekondimisa stock, frais mpe motuya.',
    snapshot: 'Catalogue ebimisamaki na', snapshotNote: 'Mituya mpe stock ezali ndenge ezalaki ntango catalogue ebimisamaki. Boutique ekondimisa yango liboso ya koteka.',
    deliveryNote: 'Frais ya livraison ezali estimation; boutique ekondimisa yango.',
    chooser: 'Soki ozali na ba-app WhatsApp mibale, poná oyo telefone na yo ekolakisa. Talá message na WhatsApp mpe finá Tinda.',
    privacy: 'Makambo na yo etikalaka na lokasa oyo kino WhatsApp efungwami. ShopFlow ebombaka yango na serveur te.',
    noContact: 'Boutique epesi numéro ya WhatsApp te.',
    unavailable: 'Catalogue oyo ezali ya solo te to ezali lisusu te.',
    emptyCatalog: 'Eloko moko te ezali awa naino.',
    selectError: 'Bakisa eloko moko mpe kotisa kombo, numéro mpe adresse na yo.',
    waError: 'WhatsApp efungwami te. Talá soki application to WhatsApp Web ezali.',
    city: 'Engumba',
  },
  sw: {
    catalog: 'Katalogi', available: 'inapatikana', soldOut: 'Imeisha', add: 'Ongeza',
    basket: 'Chaguo langu', empty: 'Chagua bidhaa moja au zaidi ili kuanza.',
    continue: 'Endelea', details: 'Maelezo yako', name: 'Jina kamili', phone: 'Nambari yako ya WhatsApp',
    address: 'Mji, mtaa na maelekezo', back: 'Rudi', preview: 'Tengeneza risiti ya ombi',
    review: 'Kagua risiti ya ombi', reference: 'Nambari ya ombi', item: 'Bidhaa', quantity: 'Idadi',
    subtotal: 'Jumla ndogo', delivery: 'Makadirio ya usafirishaji', total: 'Makadirio ya jumla',
    send: 'Fungua WhatsApp ili kutuma', edit: 'Badilisha chaguo langu',
    notPaid: 'Ombi halijalipwa — duka litathibitisha bidhaa, ada na jumla.',
    snapshot: 'Katalogi ilichapishwa tarehe', snapshotNote: 'Bei na stoo ni za wakati katalogi ilipotolewa. Duka litathibitisha kabla ya mauzo.',
    deliveryNote: 'Ada ya usafirishaji ni makadirio; duka litathibitisha.',
    chooser: 'Ikiwa una WhatsApp zaidi ya moja, chagua programu inayoonyeshwa na simu yako. Kagua ujumbe kwenye WhatsApp kisha uguse Tuma.',
    privacy: 'Maelezo yako hubaki kwenye ukurasa huu hadi WhatsApp ifunguke. ShopFlow haihifadhi kwenye seva.',
    noContact: 'Duka halijaweka nambari ya WhatsApp.',
    unavailable: 'Katalogi hii si sahihi au haipatikani tena.',
    emptyCatalog: 'Hakuna bidhaa zilizowekwa kwa sasa.',
    selectError: 'Ongeza bidhaa angalau moja na ujaze jina, nambari na anwani yako.',
    waError: 'WhatsApp haikufunguka. Hakikisha programu au WhatsApp Web inapatikana.',
    city: 'Mji',
  },
  zh: {
    catalog: '商品目录', available: '件可售', soldOut: '缺货', add: '加入',
    basket: '我的选择', empty: '请选择一个或多个商品开始。',
    continue: '继续', details: '您的信息', name: '姓名', phone: '您的 WhatsApp 号码',
    address: '城市、街区和位置说明', back: '返回', preview: '生成临时订单收据',
    review: '请核对订单请求收据', reference: '订单请求编号', item: '商品', quantity: '数量',
    subtotal: '小计', delivery: '预计配送费', total: '预计总计',
    send: '打开 WhatsApp 发送', edit: '修改我的选择',
    notPaid: '订单尚未付款 — 商家需确认库存、费用和总额。',
    snapshot: '目录发布于', snapshotNote: '价格和库存为发布时快照。商家会在销售前确认。',
    deliveryNote: '配送费为估算值，需由商家确认。',
    chooser: '如果安装了多个 WhatsApp 应用，请在手机提示时选择。请在 WhatsApp 中核对消息并点击发送。',
    privacy: '在打开 WhatsApp 前，您的信息仅保留在本页面。ShopFlow 不会将其保存在服务器上。',
    noContact: '商家尚未填写 WhatsApp 号码。',
    unavailable: '此目录无效或已不可用。',
    emptyCatalog: '目前没有商品。',
    selectError: '请至少添加一件商品，并填写姓名、电话和地址。',
    waError: '无法打开 WhatsApp。请检查应用或 WhatsApp 网页版是否可用。',
    city: '城市',
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

export const PublicCatalogPage: React.FC<PublicCatalogPageProps> = ({ token }) => {
  const snapshot = useMemo(() => decodePublicCatalog(token), [token]);
  const [language, setLanguage] = useState<AppLanguage>(detectLanguage);
  const [step, setStep] = useState<CatalogStep>('browse');
  const [basket, setBasket] = useState<BasketLine[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [reference] = useState(() => `SF-${Date.now().toString(36).slice(-6).toUpperCase()}`);
  const [error, setError] = useState('');
  const [imageFailed, setImageFailed] = useState<string[]>([]);

  if (!snapshot) {
    return <MessagePage message={COPY[language].unavailable} />;
  }

  const text = COPY[language];
  const fmt = (amount: number) =>
    formatMoney(amount, snapshot.shop.currency, snapshot.shop.usdRateFC);
  const itemCount = basket.reduce((total, line) => total + line.quantity, 0);
  const subtotal = basket.reduce(
    (total, line) => total + line.product.priceFC * line.quantity,
    0
  );
  const deliveryFee = basket.length ? snapshot.shop.deliveryFeeFC : 0;
  const total = subtotal + deliveryFee;
  const addItem = (product: PublicCatalogProduct) => {
    if (product.stock < 1) return;
    setBasket((current) => {
      const found = current.find((line) => line.product.id === product.id);
      if (found) {
        if (found.quantity >= product.stock) return current;
        return current.map((line) =>
          line.product.id === product.id
            ? { ...line, quantity: line.quantity + 1 }
            : line
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  };
  const changeQuantity = (productId: string, delta: number) => {
    setBasket((current) =>
      current
        .map((line) => {
          if (line.product.id !== productId) return line;
          const quantity = line.quantity + delta;
          if (quantity < 1) return null;
          if (quantity > line.product.stock) return line;
          return { ...line, quantity };
        })
        .filter((line): line is BasketLine => line !== null)
    );
  };

  const createReview = () => {
    if (!basket.length || !customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      setError(text.selectError);
      return;
    }
    setError('');
    setStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sendToWhatsApp = () => {
    if (snapshot.shop.whatsappNumber.length < 8) {
      setError(text.noContact);
      return;
    }
    const lines = basket.map(({ product, quantity }) =>
      `• ${quantity} × ${product.name} — ${fmt(product.priceFC * quantity)}`
    );
    const message = [
      `🛍️ DEMANDE DE COMMANDE — ${snapshot.shop.name}`,
      `Référence : ${reference}`,
      `Client : ${customerName.trim()}`,
      `WhatsApp client : ${customerPhone.trim()}`,
      `Adresse : ${deliveryAddress.trim()}`,
      '',
      ...lines,
      '',
      `Sous-total : ${fmt(subtotal)}`,
      `Livraison estimée : ${fmt(deliveryFee)}`,
      `TOTAL ESTIMÉ : ${fmt(total)}`,
      '',
      'Non payé. Merci de confirmer le stock, la livraison et le montant final.',
    ].join('\n');
    const url = `https://wa.me/${snapshot.shop.whatsappNumber}?text=${encodeURIComponent(message)}`;
    try {
      window.location.assign(url);
    } catch {
      setError(text.waError);
    }
  };

  const publishedDate = snapshot.publishedAt
    ? new Date(snapshot.publishedAt).toLocaleDateString(language === 'zh' ? 'zh-CN' : language === 'en' ? 'en' : language === 'sw' ? 'sw' : 'fr-FR')
    : '';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {snapshot.shop.logo ? (
              <img src={snapshot.shop.logo} alt="" className="h-11 w-11 rounded-xl object-contain" />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0A4DFF]">
                <Store className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-base font-black">{snapshot.shop.name}</p>
              <p className="truncate text-xs text-slate-500">{snapshot.shop.city}</p>
            </div>
          </div>
          <select
            aria-label="Language"
            value={language}
            onChange={(event) => setLanguage(event.target.value as AppLanguage)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="ln">Lingála</option>
            <option value="sw">Kiswahili</option>
            <option value="zh">中文</option>
          </select>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-9">
        <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-relaxed text-blue-950">
          <p className="font-extrabold">{text.snapshotNote}</p>
          {publishedDate && <p className="mt-1">{text.snapshot} {publishedDate}.</p>}
        </div>

        {step === 'browse' && (
          <>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#0A4DFF]">{text.catalog}</p>
                <h1 className="mt-1 text-2xl font-black sm:text-3xl">{snapshot.shop.name}</h1>
              </div>
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm">
                {itemCount} {text.basket.toLowerCase()}
              </span>
            </div>

            {snapshot.products.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {snapshot.products.map((product) => {
                  const selected = basket.find((line) => line.product.id === product.id)?.quantity || 0;
                  const hasImage = Boolean(product.image && !imageFailed.includes(product.id));
                  return (
                    <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="relative flex h-48 items-center justify-center bg-slate-100">
                        {hasImage ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-cover"
                            onError={() => setImageFailed((items) => [...items, product.id])}
                          />
                        ) : (
                          <ImageOff className="h-9 w-9 text-slate-400" />
                        )}
                        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm">
                          {product.stock > 0 ? `${product.stock} ${text.available}` : text.soldOut}
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="text-[11px] font-semibold text-slate-500">{product.category}</p>
                        <h2 className="mt-1 line-clamp-2 min-h-10 text-base font-extrabold">{product.name}</h2>
                        <p className="mt-2 text-lg font-black text-emerald-700">{fmt(product.priceFC)}</p>
                        {product.unit && <p className="mt-0.5 text-xs text-slate-500">{product.unit}</p>}
                        <button
                          type="button"
                          disabled={product.stock < 1}
                          onClick={() => addItem(product)}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          <ShoppingBag className="h-4 w-4" />
                          {selected ? `${text.add} (${selected})` : text.add}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                {text.emptyCatalog}
              </div>
            )}

            {basket.length > 0 && (
              <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-lg backdrop-blur-sm">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-1 sm:px-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">{text.basket} · {itemCount}</p>
                    <p className="font-black">{fmt(subtotal)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('details');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="rounded-xl bg-[#0A4DFF] px-5 py-3 text-sm font-extrabold text-white"
                  >
                    {text.continue}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {step === 'details' && (
          <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <button type="button" onClick={() => setStep('browse')} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-600">
              <ArrowLeft className="h-4 w-4" /> {text.back}
            </button>
            <h1 className="text-2xl font-black">{text.details}</h1>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-bold">{text.name}
                <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 font-medium outline-none focus:border-blue-500" autoComplete="name" />
              </label>
              <label className="block text-sm font-bold">{text.phone}
                <input required type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 font-medium outline-none focus:border-blue-500" autoComplete="tel" />
              </label>
              <label className="block text-sm font-bold">{text.address}
                <textarea required rows={3} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 font-medium outline-none focus:border-blue-500" autoComplete="street-address" />
              </label>
            </div>
            <p className="rounded-xl bg-blue-50 p-3 text-xs leading-relaxed text-blue-900">{text.privacy}</p>
            {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
            <button type="button" onClick={createReview} className="mt-6 w-full rounded-xl bg-[#0A4DFF] px-4 py-3.5 text-sm font-extrabold text-white">
              {text.preview}
            </button>
          </section>
        )}

        {step === 'review' && (
          <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <button type="button" onClick={() => setStep('details')} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-600">
              <ArrowLeft className="h-4 w-4" /> {text.back}
            </button>
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-5 sm:p-6">
              <div className="border-b border-dashed border-slate-300 pb-4 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{text.reference}</p>
                <p className="mt-1 text-sm font-black">{reference}</p>
                <h1 className="mt-3 text-xl font-black">{snapshot.shop.name}</h1>
                {snapshot.shop.city && <p className="mt-1 text-xs text-slate-500">{snapshot.shop.city}</p>}
                <p className="mt-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-[11px] font-extrabold text-amber-800">{text.notPaid}</p>
              </div>
              <div className="space-y-3 border-b border-dashed border-slate-300 py-4 text-sm">
                <p><strong>{text.name}:</strong> {customerName}</p>
                <p><strong>{text.phone}:</strong> {customerPhone}</p>
                <p><strong>{text.address}:</strong> {deliveryAddress}</p>
              </div>
              <div className="space-y-3 py-4">
                {basket.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0"><strong>{quantity} ×</strong> {product.name}</span>
                    <strong className="shrink-0">{fmt(product.priceFC * quantity)}</strong>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-dashed border-slate-300 pt-4 text-sm">
                <PriceRow label={text.subtotal} amount={fmt(subtotal)} />
                <PriceRow label={text.delivery} amount={fmt(deliveryFee)} />
                <PriceRow label={text.total} amount={fmt(total)} bold />
                <p className="pt-1 text-[11px] leading-relaxed text-slate-500">{text.deliveryNote}</p>
              </div>
            </div>
            {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
            <button type="button" onClick={() => setStep('browse')} className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-800">
              {text.edit}
            </button>
            <button type="button" onClick={sendToWhatsApp} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-extrabold text-white">
              <Check className="h-4 w-4" /> {text.send}
            </button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500">{text.chooser}</p>
          </section>
        )}
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
