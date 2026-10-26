import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Copy, ExternalLink, Globe, Package, Share2, Sparkles } from 'lucide-react';
import { AppLanguage, Product, ShopSettings } from '../types';
import { formatMoney } from '../utils/currency';
import {
  createLivePublicCatalog,
  getPublicCatalogAppBase,
  makePublicCatalogSnapshot,
  makePublicCatalogUrl,
  updateLivePublicCatalog,
} from '../utils/publicCatalog';

interface OnlineStoreViewProps {
  settings: ShopSettings;
  products: Product[];
  onSettingsChange: React.Dispatch<React.SetStateAction<ShopSettings>>;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
}

const STORE_COPY: Record<AppLanguage, Record<string, string>> = {
  fr: {
    shareTitle: 'Catalogue de', shareMessage: 'Les prix et la disponibilité seront confirmés par la boutique.', badge: 'CATALOGUE PUBLIC À PARTAGER', title: 'Publiez le catalogue de', description: 'Créez un lien stable hébergé sous /app/ et envoyez-le à vos clients. Les changements de prix et de stock sont synchronisés automatiquement. Ils choisissent leurs articles, vérifient le récapitulatif et transmettent leur demande à votre WhatsApp.', generate: 'Créer / actualiser le lien stable', url: 'Lien public du catalogue', copied: 'Lien copié', copy: 'Copier le lien', share: 'Partager…', test: 'Tester le lien', empty: 'Ajoutez d’abord des articles au catalogue.', copyFail: 'La copie automatique est bloquée. Sélectionnez et copiez le lien affiché.', shareFail: 'Le partage a échoué. Copiez le lien et envoyez-le manuellement.', published: 'Lien stable prêt. Les articles, prix et stocks seront synchronisés automatiquement.', copiedNotice: 'Lien copié. Vous pouvez le coller dans WhatsApp ou le partager ailleurs.', preview: 'Aperçu du catalogue', stock: 'Stock relevé :', items: 'article(s)', addProducts: '{t.addProducts}', more: 'autres articles inclus dans le lien.', how: '{t.how}', step1: '{t.step1}', step2: '{t.step2}', step3: 'Il envoie la demande à votre numéro WhatsApp; son téléphone propose une application si plusieurs sont installées.', know: '{t.know}', terms1: '{t.terms1}', terms2: '{t.terms2}', terms3: 'Les coûts d’achat, le code PIN et les réglages privés ne sont pas partagés. Les photos des articles sont publiées avec le catalogue.', stockZero: 'Tous les articles sont actuellement à stock zéro; le lien les affichera comme indisponibles.', limitItems: 'La limite est de 300 articles par catalogue.', linkTooLong: 'Le lien est trop long. Réduisez le nombre d’articles ou de photos hébergées.',
  },
  en: {
    shareTitle: 'Catalog from', shareMessage: 'Prices and availability will be confirmed by the shop.', badge: 'PUBLIC CATALOG TO SHARE', title: 'Publish the catalog for', description: 'Create a stable link hosted under /app/ and send it to customers. Price and stock changes sync automatically. They choose items, review the summary and send their request to your WhatsApp.', generate: 'Create / refresh stable link', url: 'Public catalog link', copied: 'Link copied', copy: 'Copy link', share: 'Share…', test: 'Test link', empty: 'Add products to your catalog first.', copyFail: 'Automatic copying is blocked. Select and copy the link shown.', shareFail: 'Sharing failed. Copy the link and send it manually.', published: 'Stable link ready. Products, prices and stock sync automatically.', copiedNotice: 'Link copied. Paste it into WhatsApp or share it elsewhere.', preview: 'Catalog preview', stock: 'Stock at publish:', items: 'item(s)', addProducts: 'The catalog is empty. Add products under “Products & Stock” before creating a link.', more: 'more items included in the link.', how: 'How it works', step1: 'Publish a catalog snapshot and share its link.', step2: 'Customers choose items, enter their details and review the summary.', step3: 'They send the request to your WhatsApp number; their phone offers an app choice if several are installed.', know: 'Please note', terms1: 'The link is stable; price and stock changes sync automatically while the app is online.', terms2: 'A WhatsApp request does not record a sale or confirm payment.', terms3: 'Purchase costs, PIN and private settings are excluded. Product photos are published with the catalog.', stockZero: 'All products currently have zero stock; the link will show them as unavailable.', limitItems: 'The limit is 300 products per catalog.', linkTooLong: 'The link is too long. Reduce the number of products or hosted photos.',
  },
  ln: {
    shareTitle: 'Catalogue ya', shareMessage: 'Boutique ekondimisa mituya mpe biloko oyo ezali.', badge: 'CATALOGUE YA KOTINDELA BATO', title: 'Bimisá catalogue ya', description: 'Sala lien ya seko na /app/ mpe tinda yango epai ya bakiliya. Mituya mpe stock ebongwanaka yango moko. Bakopona biloko, bakotalela résumé mpe bakotinda demande na WhatsApp na yo.', generate: 'Sala / bongisa lien ya seko', url: 'Lien ya catalogue', copied: 'Lien ekopiami', copy: 'Kopiá lien', share: 'Tinda…', test: 'Meka lien', empty: 'Bakisa biloko na catalogue liboso.', copyFail: 'Navigateur endimi kopi te. Poná lien mpe kopi yango.', shareFail: 'Kotinda elongi te. Kopiá lien mpe tinda yango yo moko.', published: 'Lien ya seko esalemi. Biloko, mituya mpe stock ekobongwanaka yango moko.', copiedNotice: 'Lien ekopiami. Okoki kotia yango na WhatsApp to kotinda yango esika mosusu.', preview: 'Talá catalogue', stock: 'Stock ntango ebimisami:', items: 'eloko', addProducts: 'Catalogue ezali mpamba. Bakisa biloko na « Marchandises & Stock » liboso ya kosala lien.', more: 'biloko mosusu ezali na lien.', how: 'Ndenge esalaka', step1: 'Bimisá copie ya catalogue mpe tinda lien na yango.', step2: 'Mokili akopona biloko, akotia makambo na ye mpe akotalela résumé.', step3: 'Akotinda demande na WhatsApp na yo; telefone ekolakisa ba-app oyo ezali mpo na kopona.', know: 'Yeba', terms1: 'Lien ezali ya seko; mituya mpe stock ebongwanaka yango moko soki application ezali na internet.', terms2: 'Demande ya WhatsApp ekomaka vente te mpe endimisi kofuta te.', terms3: 'Prix ya kosomba, PIN mpe ba réglages ya sekele etindamaka te. Bafoto ya biloko ebimisamaka elongo na catalogue.', stockZero: 'Biloko nyonso ezali na stock zéro; lien ekolakisa yango lokola esili.', limitItems: 'Limite ezali biloko 300 na lien moko.', linkTooLong: 'Lien eleki molai. Kitisa motango ya biloko to bafoto oyo ebimisami na Internet.',
  },
  sw: {
    shareTitle: 'Katalogi ya', shareMessage: 'Duka litathibitisha bei na bidhaa zinazopatikana.', badge: 'KATALOGI YA UMMA YA KUSHIRIKI', title: 'Chapisha katalogi ya', description: 'Tengeneza kiungo cha kudumu cha /app/ na uwatumie wateja. Bei na stoo husasishwa kiotomatiki. Watachagua bidhaa, kukagua muhtasari na kutuma ombi kwa WhatsApp yako.', generate: 'Tengeneza / sasisha kiungo cha kudumu', url: 'Kiungo cha katalogi', copied: 'Kiungo kimenakiliwa', copy: 'Nakili kiungo', share: 'Shiriki…', test: 'Jaribu kiungo', empty: 'Ongeza bidhaa kwenye katalogi kwanza.', copyFail: 'Kunakili kiotomatiki kumezuiwa. Chagua na unakili kiungo kilichoonyeshwa.', shareFail: 'Kushiriki kumeshindwa. Nakili kiungo na utume mwenyewe.', published: 'Kiungo cha kudumu kiko tayari. Bidhaa, bei na stoo husasishwa kiotomatiki.', copiedNotice: 'Kiungo kimenakiliwa. Bandika kwenye WhatsApp au kishiriki kwingine.', preview: 'Muonekano wa katalogi', stock: 'Stoo ilipochapishwa:', items: 'bidhaa', addProducts: 'Katalogi haina bidhaa. Ongeza bidhaa kwenye “Products & Stock” kabla ya kutengeneza kiungo.', more: 'bidhaa nyingine zimejumuishwa kwenye kiungo.', how: 'Jinsi inavyofanya kazi', step1: 'Chapisha nakala ya katalogi na ushiriki kiungo chake.', step2: 'Mteja anachagua bidhaa, anaweka maelezo yake na kukagua muhtasari.', step3: 'Anatuma ombi kwa nambari yako ya WhatsApp; simu itaonyesha programu za kuchagua ikiwa zipo kadhaa.', know: 'Tafadhali kumbuka', terms1: 'Kiungo ni cha kudumu; bei na stoo husasishwa kiotomatiki programu ikiwa mtandaoni.', terms2: 'Ombi la WhatsApp halirekodi mauzo wala kuthibitisha malipo.', terms3: 'Gharama za ununuzi, PIN na mipangilio ya faragha hazishirikishwi. Picha za bidhaa huchapishwa pamoja na katalogi.', stockZero: 'Bidhaa zote zina stoo sifuri sasa; kiungo kitazionyesha kuwa hazipatikani.', limitItems: 'Kikomo ni bidhaa 300 kwa kila kiungo.', linkTooLong: 'Kiungo ni kirefu mno. Punguza bidhaa au picha zilizohifadhiwa mtandaoni.',
  },
  zh: {
    shareTitle: '来自店铺的目录：', shareMessage: '价格和库存由商家确认。', badge: '可分享的公开商品目录', title: '发布店铺目录：', description: '生成 /app/ 下的固定链接并发送给顾客；价格和库存会自动同步。顾客选择商品、核对摘要，然后将请求发送到您的 WhatsApp。', generate: '创建 / 更新固定链接', url: '公开目录链接', copied: '已复制链接', copy: '复制链接', share: '分享…', test: '测试链接', empty: '请先在目录中添加商品。', copyFail: '浏览器阻止了自动复制，请手动选择并复制链接。', shareFail: '分享失败，请复制链接后手动发送。', published: '固定链接已就绪，商品、价格和库存将自动同步。', copiedNotice: '链接已复制，可粘贴到 WhatsApp 或分享至其他平台。', preview: '目录预览', stock: '发布时库存：', items: '件商品', addProducts: '目录为空。请先在“商品与库存”中添加商品。', more: '件商品也包含在链接中。', how: '使用流程', step1: '发布目录快照并分享链接。', step2: '顾客选择商品、填写信息并核对摘要。', step3: '顾客向您的 WhatsApp 号码发送请求；若安装了多个应用，手机会提供选择。', know: '请注意', terms1: '这是固定链接；应用联网时，价格和库存会自动同步。', terms2: 'WhatsApp 请求不会自动记录销售，也不代表已付款。', terms3: '不公开进货成本、PIN 或私人设置。商品照片会随目录一同发布。', stockZero: '所有商品当前库存为零；链接会显示为缺货。', limitItems: '每个链接最多包含 300 件商品。', linkTooLong: '链接太长，请减少商品数量或托管图片。',
  },
};

export const OnlineStoreView: React.FC<OnlineStoreViewProps> = ({ settings, products, onSettingsChange, syncStatus }) => {
  const [publicUrl, setPublicUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (settings.publicCatalogId) setPublicUrl(makePublicCatalogUrl(settings.publicCatalogId));
  }, [settings.publicCatalogId]);

  const t = STORE_COPY[settings.language];
  const currency = (amount: number) =>
    formatMoney(amount, settings.currency, settings.usdRateFC);

  const generateLink = async (): Promise<string> => {
    setError('');
    setNotice('');
    setCopied(false);
    if (publishing) return '';
    setPublishing(true);
    try {
      if (products.length === 0) {
        setError(t.empty);
        return '';
      }
      const snapshot = makePublicCatalogSnapshot(settings, products, getPublicCatalogAppBase());
      let catalogId = settings.publicCatalogId;
      let ownerToken = settings.publicCatalogToken;
      if (!catalogId || !ownerToken) {
        const credentials = await createLivePublicCatalog(snapshot);
        catalogId = credentials.id;
        ownerToken = credentials.token;
        onSettingsChange((previous) => ({
          ...previous,
          publicCatalogId: credentials.id,
          publicCatalogToken: credentials.token,
        }));
      }
      await updateLivePublicCatalog(catalogId, ownerToken, snapshot);
      const url = makePublicCatalogUrl(catalogId);
      setPublicUrl(url);
      setNotice(t.published);
      return url;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '';
      setError(message === 'catalog_limit' ? t.limitItems : message === 'catalog_payload_too_large' || message === 'catalog_url_too_long' ? t.linkTooLong : message || t.shareFail);
      return '';
    } finally {
      setPublishing(false);
    }
  };

  const copyLink = async () => {
    const url = publicUrl || await generateLink();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setNotice(t.copiedNotice);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setError(t.copyFail);
    }
  };

  const shareLink = async () => {
    const url = publicUrl || await generateLink();
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${t.shareTitle} ${settings.shopName}`,
          text: `${t.shareTitle} ${settings.shopName}. ${t.shareMessage}`,
          url,
        });
      } catch (caught) {
        if (caught instanceof Error && caught.name !== 'AbortError') {
          setError(t.shareFail);
        }
      }
      return;
    }
    await copyLink();
  };

  const availableProducts = products.filter((product) => product.stock > 0);

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 p-5 text-white shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 @lg:flex-row @lg:items-center @lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-[11px] font-extrabold text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />
              {t.badge}
            </span>
            <h1 className="mt-3 text-xl font-extrabold @md:text-2xl">
              {t.title} {settings.shopName}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-emerald-100/90">
              {t.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void generateLink()}
            disabled={publishing}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-emerald-950 transition hover:bg-emerald-50"
          >
            <Globe className="h-4 w-4" />
            {publishing ? (settings.language === 'fr' ? 'Publication…' : 'Publishing…') : t.generate}
          </button>
        </div>

        {publicUrl && (
          <div className="mt-5 rounded-2xl border border-white/15 bg-white/10 p-3 sm:p-4">
            <label htmlFor="public-catalog-url" className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-emerald-100">
              {t.url}
            </label>
            <input
              id="public-catalog-url"
              readOnly
              value={publicUrl}
              onFocus={(event) => event.currentTarget.select()}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2.5 text-xs text-white outline-none"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={copyLink} className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-xs font-extrabold text-emerald-950">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? t.copied : t.copy}
              </button>
              <button type="button" onClick={shareLink} className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-3.5 py-2.5 text-xs font-extrabold text-emerald-950">
                <Share2 className="h-4 w-4" /> {t.share}
              </button>
              <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-3.5 py-2.5 text-xs font-bold text-white">
                <ExternalLink className="h-4 w-4" /> {t.test}
              </a>
            </div>
          </div>
        )}
        {settings.publicCatalogId && (
          <p role="status" className="mt-3 text-xs font-semibold text-emerald-100">
            {syncStatus === 'syncing' ? (settings.language === 'fr' ? 'Synchronisation du catalogue…' : 'Syncing catalog…') : syncStatus === 'synced' ? (settings.language === 'fr' ? 'Catalogue à jour.' : 'Catalog is up to date.') : syncStatus === 'error' ? (settings.language === 'fr' ? 'Synchronisation en attente. Vérifiez votre connexion et la configuration du serveur.' : 'Sync pending. Check your connection and server configuration.') : ''}
          </p>
        )}
        {error && <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-red-100 p-3 text-xs font-bold text-red-900"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
        {notice && !error && <p role="status" className="mt-4 text-xs font-semibold text-emerald-100">{notice}</p>}
      </section>

      <div className="grid grid-cols-1 gap-5 @lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 @lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{t.preview}</p>
              <h2 className="mt-1 text-lg font-extrabold text-slate-900">{settings.shopName}</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{products.length} {t.items}</span>
          </div>
          {products.length ? (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {products.slice(0, 6).map((product) => (
                <article key={product.id} className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="h-32 bg-slate-100">
                    {product.image && !product.image.startsWith('data:') ? (
                      <img src={product.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400"><Package className="h-8 w-8" /></div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-1 text-sm font-bold">{product.name}</p>
                    <p className="mt-1 text-sm font-extrabold text-emerald-700">{currency(product.sellingPriceFC)}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{t.stock} {product.stock}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">{t.addProducts}</p>
          )}
          {products.length > 6 && <p className="mt-3 text-xs text-slate-500">+ {products.length - 6} {t.more}</p>}
        </section>

        <aside className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-5 @lg:col-span-1">
          <h2 className="text-sm font-extrabold text-slate-900">{t.how}</h2>
          <ol className="space-y-3 text-xs leading-relaxed text-slate-700">
            <li><strong>1.</strong> {t.step1}</li>
            <li><strong>2.</strong> {t.step2}</li>
            <li><strong>3.</strong> {t.step3}</li>
          </ol>
          <div className="rounded-xl border border-blue-200 bg-white p-3 text-[11px] leading-relaxed text-slate-600">
            <p className="font-extrabold text-slate-900">{t.know}</p>
            <p className="mt-1">{t.terms1} {t.terms2}</p>
            <p className="mt-2">{t.terms3}</p>
          </div>
          {availableProducts.length === 0 && products.length > 0 && (
            <p className="rounded-lg bg-amber-100 p-2 text-[11px] font-semibold text-amber-900">{t.stockZero}</p>
          )}
        </aside>
      </div>
    </div>
  );
};
