import React, { lazy, Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Coins,
  CreditCard,
  Download,
  Film,
  HelpCircle,
  Home,
  Images,
  Lock,
  Play,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  WifiOff,
  X,
} from 'lucide-react';
import { SHOPFLOW_APP_LOGO } from '../data/initialData';
import { LANGUAGE_OPTIONS } from '../i18n/translations';
import {
  AppLanguage,
  CurrencyCode,
  SubscriptionPlanId,
} from '../types';
import { AuthModalMode } from './AuthModal';
import { ANNUAL_SAVING_MONTHS, formatPlanPrice, planPriceUSD } from '../utils/pricing';
import {
  RevealOnScroll,
  ScrollProgressBar,
  StaggerGroup,
  StaggerItem,
} from './showcase/MotionPrimitives';
const PhoneScreenCapture = lazy(() => import('./showcase/ScreenshotsGuidePage').then((module) => ({ default: module.PhoneScreenCapture })));
const ScreenshotsGuidePage = lazy(() => import('./showcase/ScreenshotsGuidePage').then((module) => ({ default: module.ScreenshotsGuidePage })));
const VideosTutorialsPage = lazy(() => import('./showcase/VideosTutorialsPage').then((module) => ({ default: module.VideosTutorialsPage })));

export type ShowcaseSubPage =
  | 'home'
  | 'screenshots'
  | 'videos'
  | 'pricing'
  | 'faq';

interface LandingPageViewProps {
  language: AppLanguage;
  currency: CurrencyCode;
  billingTestMode: boolean;
  onChangeLanguage: (lang: AppLanguage) => void;
  onChangeCurrency: (curr: CurrencyCode) => void;
  onOpenAuthModal: (
    mode: AuthModalMode,
    preselectedPlan?: SubscriptionPlanId
  ) => void;
}

const MARQUEE_ITEMS = [
  'Tarifs mensuels en USD',
  'Gestion locale disponible hors connexion',
  'Assistant IA en ligne selon connexion et disponibilité',
  'Reçus partageables sur WhatsApp',
  'Mode Vendeur avec code PIN',
  'PWA installable sur iPhone depuis Safari',
  'APK natif uniquement via un lien de test vérifié',
];

const FAQ_LIST = [
  {
    q: 'Est-ce que ShopFlow fonctionne quand Internet coupe ?',
    a: 'La gestion et les données déjà enregistrées restent accessibles hors connexion. Les données restent enregistrées sur cet appareil; exportez régulièrement une sauvegarde avant de changer d’appareil.',
  },
  {
    q: 'Que se passe-t-il si je perds, casse ou change mon téléphone ?',
    a: 'Les données restent enregistrées séparément sur chaque appareil et ne se synchronisent pas automatiquement. Exportez une sauvegarde et conservez-la avant de changer de téléphone.',
  },
  {
    q: 'Mon vendeur peut-il utiliser la caisse sans voir mon bénéfice net ?',
    a: 'Oui. Activez le Mode Vendeur : votre employé peut encaisser les clients et préparer des reçus à partager sur WhatsApp, tandis que les bénéfices nets, prix d’achat et réglages sont réservés au patron et protégés par son code PIN.',
  },
  {
    q: 'Dois-je payer pour continuer pendant les tests ?',
    a: 'Non. Pendant la phase de test actuelle, l’accès à ShopFlow reste ouvert sans échéance et aucun paiement n’est obligatoire. Les tarifs affichés sont fournis à titre indicatif. ShopFlow ne demande jamais de PIN Mobile Money ni de données de carte.'
  },
];

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  language,
  currency,
  onChangeLanguage,
  onChangeCurrency,
  onOpenAuthModal,
  billingTestMode,
}) => {
  const [subPage, setSubPage] = useState<ShowcaseSubPage>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [scrolledHeader, setScrolledHeader] = useState(false);
  const [annualPricing, setAnnualPricing] = useState(false);
  const marqueeItems = [
    'Tarifs mensuels en USD',
    billingTestMode ? 'Accès sans échéance pendant les tests' : 'Essai de 7 jours dès la création de la boutique',
    billingTestMode ? 'Aucun paiement obligatoire pendant les tests' : 'Un paiement ne s’active qu’après confirmation serveur',
    ...MARQUEE_ITEMS.slice(1),
  ];
  const faqItems = FAQ_LIST.map((item) => item.q === 'Dois-je payer pour continuer pendant les tests ?' && !billingTestMode
    ? { ...item, q: 'Que se passe-t-il après les 7 jours d’essai ?', a: 'Après l’essai, l’accès dépendra de la formule choisie et du paiement confirmé par le prestataire. Ne saisissez jamais de PIN Mobile Money ou de données de carte dans ShopFlow.' }
    : item);

  useEffect(() => {
    const onScroll = () => setScrolledHeader(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const navigateToSubPage = (next: ShowcaseSubPage) => {
    setSubPage(next);
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fmtPlanPrice = (usd: number) => formatPlanPrice(usd, currency);

  const navMenuOptions: {
    id: ShowcaseSubPage;
    label: string;
    shortLabel: string;
    subtitle: string;
    badge?: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    {
      id: 'home',
      label: 'Accueil',
      shortLabel: 'Accueil',
      subtitle: 'Présentation dynamique de ShopFlow',
      icon: Home,
    },
    {
      id: 'screenshots',
      label: 'Fonctionnement en Captures',
      shortLabel: 'Captures',
      subtitle: 'Les 7 écrans essentiels expliqués pas à pas',
      badge: '7 écrans',
      icon: Images,
    },
    {
      id: 'videos',
      label: 'Tutoriels animés',
      shortLabel: 'Tutoriels',
      subtitle: 'Gestes simulés et explications écrites; aucune transaction réelle',
      badge: '7 démonstrations',
      icon: Film,
    },
    {
      id: 'pricing',
      label: 'Tarifs & Formules',
      shortLabel: 'Tarifs',
      subtitle: billingTestMode ? 'Formules mensuelles • accès de test sans paiement obligatoire' : 'Formules mensuelles confirmées',
      icon: CreditCard,
    },
    {
      id: 'faq',
      label: 'Télécharger l’App & Aide',
      shortLabel: 'Aide & App',
      subtitle: 'Installation Android / iPhone, sauvegarde & questions',
      icon: HelpCircle,
    },
  ];

  const homeCopyByLanguage = {
    fr: {
      eyebrow: 'Une gestion claire pour votre boutique', titleA: 'Votre boutique,', titleB: 'plus simple à gérer.', lead: 'Enregistrez les ventes, gardez un œil sur le stock et retrouvez vos reçus, crédits et demandes clients au même endroit.', open: 'Ouvrir ShopFlow', guides: 'Voir les guides', location: 'La création de votre boutique se fait dans l’application, pas sur ce site.', test: 'Accès de test ouvert · sans échéance ni paiement obligatoire', stepsLabel: 'POUR BIEN DÉMARRER', stepsTitle: 'Trois étapes, dans le bon ordre.', stepsLead: 'Ouvrez ShopFlow et avancez à votre rythme. Vous pouvez lire les explications avant d’enregistrer quoi que ce soit.', step1: 'Créez votre boutique', step1Body: 'Suivez les étapes de création dans l’application. La vitrine ne crée pas de boutique.', step2: 'Ajoutez vos articles', step2Body: 'Ajoutez les noms, prix et quantités de vos produits. Votre catalogue commence vide.', step3: 'Enregistrez une vente', step3Body: 'Choisissez les articles dans la caisse et partagez un reçu si vous le souhaitez.', toolsLabel: 'LES OUTILS ESSENTIELS', toolsTitle: 'Chaque chose à sa place.', sales: 'Ventes et reçus', salesBody: 'Retrouvez l’historique et partagez les reçus par WhatsApp.', stock: 'Articles et stock', stockBody: 'Consultez les quantités et repérez les articles à réapprovisionner.', credits: 'Crédits clients', creditsBody: 'Notez les avances et soldes, puis envoyez un rappel utile.', catalog: 'Catalogue à partager', catalogBody: 'Les clients envoient une demande à votre WhatsApp. Ce n’est ni une vente ni un paiement.', guideTitle: 'Comprendre avant d’agir.', guideBody: 'Les guides présentent des gestes simulés et n’enregistrent aucune vente réelle.', showGuides: 'Découvrir les guides', offline: 'Hors connexion', offlineBody: 'Les données déjà enregistrées restent accessibles sur cet appareil. Gardez une sauvegarde exportée avant d’en changer.', preview: 'APERÇU DE L’APPLICATION', previewTitle: 'Commencez ici', previewBody: 'Deux étapes pour prendre vos repères.', previewAdd: 'Ajouter vos articles', previewAddBody: 'Nom, prix et quantité', previewSell: 'Enregistrer une vente', previewSellBody: 'La caisse s’ouvre après l’ajout d’un article', previewNote: 'Les détails restent disponibles quand vous en avez besoin.', previewCaption: 'Aperçu illustratif — aucune transaction réelle.'
    },
    en: {
      eyebrow: 'Clear shop management, every day', titleA: 'Your shop,', titleB: 'easier to manage.', lead: 'Record sales, keep an eye on stock, and find receipts, customer credits, and requests in one place.', open: 'Open ShopFlow', guides: 'View guides', location: 'Create your shop in the app, not on this website.', test: 'Test access · no deadline or payment required', stepsLabel: 'GETTING STARTED', stepsTitle: 'Three steps, in the right order.', stepsLead: 'Open ShopFlow and move at your own pace. Read the guides before recording anything.', step1: 'Create your shop', step1Body: 'Follow the setup steps in the app. This website does not create shops.', step2: 'Add your products', step2Body: 'Enter product names, prices, and quantities. Your catalogue starts empty.', step3: 'Record a sale', step3Body: 'Choose products at checkout and share a receipt if you wish.', toolsLabel: 'ESSENTIAL TOOLS', toolsTitle: 'Everything has its place.', sales: 'Sales and receipts', salesBody: 'Review sales history and share receipts through WhatsApp.', stock: 'Products and stock', stockBody: 'Check quantities and spot products that need restocking.', credits: 'Customer credit', creditsBody: 'Record advances and balances, then send a helpful reminder.', catalog: 'Shareable catalogue', catalogBody: 'Customers send a request to your WhatsApp. It is not a sale or a payment.', guideTitle: 'Understand before you act.', guideBody: 'Guides show simulated steps and do not record real sales.', showGuides: 'Explore guides', offline: 'Offline access', offlineBody: 'Data already saved stays available on this device. Keep an exported backup before switching devices.', preview: 'APP PREVIEW', previewTitle: 'Start here', previewBody: 'Two steps to get familiar.', previewAdd: 'Add your products', previewAddBody: 'Name, price, and quantity', previewSell: 'Record a sale', previewSellBody: 'Checkout opens after adding a product', previewNote: 'Detailed figures are there when you need them.', previewCaption: 'Illustrative preview — no real transaction.'
    },
    ln: {
      eyebrow: 'Boyangeli ya polele mpo na magazini na yo', titleA: 'Magazini na yo,', titleB: 'mpasi mingi te.', lead: 'Komá boteki, landa biloko oyo etikali mpe zwa lisusu ba reçu, nyongo ya bakiliya mpe masengi na esika moko.', open: 'Fungola ShopFlow', guides: 'Tala ndenge ya kosalela', location: 'Sala magazini na yo na kati ya appli, kasi te na site oyo.', test: 'Komeka ezali polele · kofuta ezali te', stepsLabel: 'NDENGE YA KOBANDA', stepsTitle: 'Makambo misato, na molongo malamu.', stepsLead: 'Fungola ShopFlow mpe kende mokemoke. Okoki kotanga malako liboso ya kokoma eloko.', step1: 'Sala magazini na yo', step1Body: 'Landa matambe ya kosala magazini na appli. Site oyo esalaka magazini te.', step2: 'Bakisa biloko na yo', step2Body: 'Komá bankombo, ntalo mpe motango ya biloko. Catalogue ebandaka mpamba.', step3: 'Komá boteki', step3Body: 'Pona biloko na caisse mpe tinda reçu soki olingi.', toolsLabel: 'BISALISALI YA NTINA', toolsTitle: 'Eloko nyonso na esika na yango.', sales: 'Boteki mpe ba reçu', salesBody: 'Tala boteki mpe tinda reçu na WhatsApp.', stock: 'Biloko mpe stock', stockBody: 'Tala motango mpe biloko oyo esengeli kobakisa.', credits: 'Nyongo ya bakiliya', creditsBody: 'Komá avance mpe nyongo, bongo tinda rappel.', catalog: 'Catalogue ya kokabola', catalogBody: 'Bakiliya batindaka motuna na WhatsApp. Ezali boteki te mpe kofuta te.', guideTitle: 'Yeba liboso ya kosala.', guideBody: 'Malako ezali ndakisa kaka; ekomaka boteki ya solo te.', showGuides: 'Tala malako', offline: 'Soki Internet ezali te', offlineBody: 'Makambo oyo ekomami na telefone etikalaka kuna. Bomba kopi liboso ya kobongola telefone.', preview: 'NDakisa YA APPLI', previewTitle: 'Bandela awa', previewBody: 'Matambe mibale mpo na koyeba.', previewAdd: 'Bakisa biloko na yo', previewAddBody: 'Kombo, ntalo mpe motango', previewSell: 'Komá boteki', previewSellBody: 'Caisse ekofungwama soki obakisi eloko', previewNote: 'Mituya ezali wana ntango osengeli na yango.', previewCaption: 'Ndakisa kaka — boteki ya solo ezali te.'
    }
  };
  const homeCopy = homeCopyByLanguage[language as keyof typeof homeCopyByLanguage] ?? homeCopyByLanguage.fr;

  return (
    <div className="sf-studio-site min-h-screen bg-[#F7F9FC] text-slate-900 selection:bg-[#0A4DFF] selection:text-white">
      {/* Top 60fps Scroll Progress Laser Bar */}
      <ScrollProgressBar />

      {/* =====================================================================
          STICKY DYNAMIC HEADER + ALWAYS-ACCESSIBLE HAMBURGER MENU BUTTON
         ===================================================================== */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolledHeader
            ? 'border-b border-slate-200 bg-white/95 text-slate-900 shadow-sm backdrop-blur-xl'
            : 'border-b border-slate-200 bg-white text-slate-900'
        }`}
      >
        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          {/* Official Brand Logo */}
          <button
            type="button"
            onClick={() => navigateToSubPage('home')}
            aria-label="ShopFlow — accueil"
            className="flex shrink-0 items-center gap-3 text-left"
          >
            <img
              src={SHOPFLOW_APP_LOGO}
              alt="Logo officiel de l’application ShopFlow"
              className="h-10 w-10 rounded-xl bg-white object-contain sm:h-11 sm:w-11"
            />
            <span className="sf-display-heading text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
              Shop<span className="text-sky-400">Flow</span>
            </span>
          </button>

          {/* Desktop Quick Page Switcher Pills */}
          <nav className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 lg:flex">
            {navMenuOptions.map((item) => {
              const active = subPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateToSubPage(item.id)}
                  className={`relative rounded-full px-4 py-1.5 text-xs font-bold transition ${
                    active
                      ? 'bg-[#0A4DFF] text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {item.shortLabel}
                </button>
              );
            })}
          </nav>

          {/* Right Action + Animated Hamburger Drawer Trigger (Visible on BOTH Mobile & Desktop!) */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onOpenAuthModal('install')}
              className="hidden rounded-full bg-[#0A4DFF] px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500 sm:inline-flex"
            >
              Ouvrir / installer
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Ouvrir le menu déroulant"
              className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
            >
              <span className="flex flex-col gap-1">
                <span className="h-0.5 w-4 rounded-full bg-slate-700" />
                <span className="h-0.5 w-3 rounded-full bg-blue-600" />
                <span className="h-0.5 w-4 rounded-full bg-slate-700" />
              </span>
              <span>Menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          SLIDING HAMBURGER NAVIGATION DRAWER (SMOOTH SPRING ANIMATION)
         ===================================================================== */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm"
            />

            {/* Right Slide-Over Drawer */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-md flex-col justify-between overflow-y-auto border-l border-white/10 bg-[#060D21] p-6 text-white shadow-2xl"
            >
              <div>
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={SHOPFLOW_APP_LOGO}
                      alt="ShopFlow"
                      className="h-9 w-9 rounded-xl bg-white p-1 object-contain"
                    />
                    <div>
                      <p className="sf-display-heading text-base font-bold">
                        Menu ShopFlow
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Explorez toutes les rubriques
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="rounded-full bg-white/10 p-2 text-slate-300 transition hover:bg-white/20 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Staggered Multi-Page Navigation Links */}
                <div className="mt-5 space-y-2">
                  {navMenuOptions.map((item, idx) => {
                    const Icon = item.icon;
                    const active = subPage === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        type="button"
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.04 * idx }}
                        onClick={() => navigateToSubPage(item.id)}
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition ${
                          active
                            ? 'border-[#0A4DFF] bg-[#0A4DFF]/20 text-white'
                            : 'border-white/8 bg-white/[0.03] text-slate-200 hover:border-white/20 hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              active
                                ? 'bg-[#0A4DFF] text-white'
                                : 'bg-white/10 text-sky-300'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">
                                {item.label}
                              </span>
                              {item.badge && (
                                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                      </motion.button>
                    );
                  })}
                </div>

                {/* Marketing site only: no embedded application or interactive demo. */}
                <div className="mt-6 space-y-2.5 border-t border-white/10 pt-5">
                  <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Découvrir ShopFlow sans ouvrir l’application
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateToSubPage('screenshots')}
                    className="flex w-full items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-xs font-extrabold text-white transition hover:bg-white/15"
                  >
                    <span className="flex items-center gap-2">
                      <Images className="h-4 w-4" />
                      <span>Voir les captures et explications</span>
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      onOpenAuthModal('install');
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-xs font-bold text-white transition hover:bg-white/15"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger / installer l’application
                  </button>
                  <p className="px-1 text-[11px] leading-relaxed text-slate-400">
                    Le site vitrine ne contient pas l’application. La boutique se crée uniquement dans l’application installée.
                  </p>
                </div>
              </div>

              {/* Bottom Drawer Settings: Language + Currency */}
              <div className="mt-6 flex items-center justify-between gap-2 border-t border-white/10 pt-4 text-xs">
                <select
                  aria-label="Langue"
                  value={language}
                  onChange={(e) =>
                    onChangeLanguage(e.target.value as AppLanguage)
                  }
                  className="rounded-xl border border-white/15 bg-slate-900 px-3 py-2 font-bold text-white"
                >
                  {LANGUAGE_OPTIONS.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.nativeLabel}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() =>
                    onChangeCurrency(currency === 'USD' ? 'FC' : 'USD')
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-900 px-3.5 py-2 font-bold text-emerald-300"
                >
                  <Coins className="h-3.5 w-3.5" />
                  <span>Devise : {currency}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* =====================================================================
          ANIMATED MULTI-PAGE BODY SWITCHER
         ===================================================================== */}
      <AnimatePresence mode="wait">
        <motion.div
          key={subPage}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* ===============================================================
              PAGE 1: HOME — DYNAMIC SCROLL-ANIMATED SHOWCASE
             =============================================================== */}
          {subPage === 'home' && (
            <div className="pb-16">
              <section className="relative overflow-hidden bg-white">
                <div className="pointer-events-none absolute -top-24 right-[-8rem] h-96 w-96 rounded-full bg-blue-100/70 blur-3xl" />
                <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
                  <div className="max-w-xl">
                    <p className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3.5 py-2 text-xs font-bold text-blue-800">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {homeCopy.eyebrow}
                    </p>
                    <h1 className="sf-display-heading mt-6 text-4xl leading-[1.08] font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                      {homeCopy.titleA}<br /><span className="text-[#2456D8]">{homeCopy.titleB}</span>
                    </h1>
                    <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">{homeCopy.lead}</p>
                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                      <button type="button" onClick={() => onOpenAuthModal('install')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#2456D8] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-900/10 transition hover:bg-blue-700">
                        <Download className="h-4 w-4" />{homeCopy.open}<ArrowRight className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => navigateToSubPage('screenshots')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                        <Images className="h-4 w-4 text-blue-700" />{homeCopy.guides}
                      </button>
                    </div>
                    <p className="mt-5 text-xs leading-5 text-slate-500">{homeCopy.location}</p>
                    {billingTestMode && <p role="status" className="mt-3 inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">{homeCopy.test}</p>}
                  </div>

                  <div className="mx-auto w-full max-w-[470px] rounded-[26px] border border-slate-200 bg-slate-50 p-3 shadow-[0_28px_70px_-38px_rgba(25,45,83,0.36)] sm:p-4" aria-label={homeCopy.preview}>
                    <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white">
                      <div className="flex min-h-14 items-center justify-between border-b border-slate-100 px-4 sm:px-5">
                        <div className="flex items-center gap-2.5">
                          <img src={SHOPFLOW_APP_LOGO} alt="" className="h-8 w-8 rounded-lg object-contain" />
                          <span className="sf-display-heading text-sm font-extrabold text-slate-900">Shop<span className="text-[#2456D8]">Flow</span></span>
                        </div>
                        <span className="text-[9px] font-extrabold tracking-[0.12em] text-slate-400">{homeCopy.preview}</span>
                      </div>
                      <div className="p-5 sm:p-7">
                        <p className="text-[10px] font-extrabold tracking-[0.14em] text-slate-400">SHOPFLOW</p>
                        <h2 className="sf-display-heading mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{homeCopy.previewTitle}</h2>
                        <p className="mt-1 text-xs text-slate-500">{homeCopy.previewBody}</p>
                        <div className="mt-5 space-y-2.5">
                          <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3.5">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-100 text-sm font-extrabold text-blue-700">1</span>
                            <span className="min-w-0"><strong className="block text-xs text-slate-800">{homeCopy.previewAdd}</strong><small className="mt-1 block text-[11px] text-slate-500">{homeCopy.previewAddBody}</small></span>
                            <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-blue-600" />
                          </div>
                          <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-extrabold text-slate-500">2</span>
                            <span className="min-w-0"><strong className="block text-xs text-slate-800">{homeCopy.previewSell}</strong><small className="mt-1 block text-[11px] leading-4 text-slate-500">{homeCopy.previewSellBody}</small></span>
                          </div>
                        </div>
                        <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 text-[11px] leading-5 text-slate-500">
                          <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{homeCopy.previewNote}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 border-t border-slate-100 px-2 py-3 text-center text-[10px] font-bold text-slate-500"><span className="text-blue-700">Accueil</span><span>Vendre</span><span>Stock</span><span>Plus</span></div>
                    </div>
                    <p className="mt-2.5 text-center text-[10px] text-slate-400">{homeCopy.previewCaption}</p>
                  </div>
                </div>
              </section>

              <section id="sf-start-steps" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-extrabold tracking-[0.14em] text-blue-700">{homeCopy.stepsLabel}</p>
                  <h2 className="sf-display-heading mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">{homeCopy.stepsTitle}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{homeCopy.stepsLead}</p>
                </div>
                <div className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
                  {[[homeCopy.step1, homeCopy.step1Body], [homeCopy.step2, homeCopy.step2Body], [homeCopy.step3, homeCopy.step3Body]].map(([title, body], index) => (
                    <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                      <span className="text-xs font-extrabold tracking-widest text-blue-700">0{index + 1}</span>
                      <h3 className="sf-display-heading mt-4 text-base font-extrabold text-slate-900">{title}</h3>
                      <p className="mt-2 text-xs leading-6 text-slate-600">{body}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="border-y border-slate-200 bg-white py-14 sm:py-20">
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div><p className="text-[11px] font-extrabold tracking-[0.14em] text-blue-700">{homeCopy.toolsLabel}</p><h2 className="sf-display-heading mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">{homeCopy.toolsTitle}</h2></div>
                    <button type="button" onClick={() => navigateToSubPage('screenshots')} className="inline-flex items-center gap-2 self-start text-xs font-extrabold text-blue-700 hover:text-blue-900 sm:self-auto">{homeCopy.guides}<ArrowRight className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[[ReceiptText, homeCopy.sales, homeCopy.salesBody], [Smartphone, homeCopy.stock, homeCopy.stockBody], [Coins, homeCopy.credits, homeCopy.creditsBody], [Images, homeCopy.catalog, homeCopy.catalogBody]].map(([Icon, title, body]) => (
                      <article key={title as string} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" /></div>
                        <h3 className="sf-display-heading mt-4 text-sm font-extrabold text-slate-900">{title as string}</h3>
                        <p className="mt-2 text-xs leading-6 text-slate-600">{body as string}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </section>

              <section className="mx-auto grid max-w-6xl gap-4 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-2">
                <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><WifiOff className="h-5 w-5" /></div>
                  <h2 className="sf-display-heading mt-4 text-lg font-extrabold text-slate-900">{homeCopy.offline}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{homeCopy.offlineBody}</p>
                </article>
                <article className="flex flex-col justify-between rounded-2xl bg-[#14264C] p-6 text-white sm:p-8">
                  <div><p className="text-[11px] font-extrabold tracking-[0.14em] text-blue-200">GUIDES SHOPFLOW</p><h2 className="sf-display-heading mt-3 text-2xl font-extrabold tracking-tight">{homeCopy.guideTitle}</h2><p className="mt-3 max-w-md text-sm leading-6 text-slate-300">{homeCopy.guideBody}</p></div>
                  <button type="button" onClick={() => navigateToSubPage('videos')} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-slate-900 transition hover:bg-blue-50">{homeCopy.showGuides}<ArrowRight className="h-4 w-4" /></button>
                </article>
              </section>
            </div>
          )}

          {/* ===============================================================
              PAGE 2: DEDICATED SCREENSHOTS WALKTHROUGH PAGE
             =============================================================== */}
          {subPage === 'screenshots' && (
            <Suspense fallback={<div className="mx-auto min-h-[50vh] max-w-6xl px-4 py-12 text-sm text-slate-500" role="status">Chargement des captures…</div>}>
              <ScreenshotsGuidePage onSwitchToVideosPage={() => navigateToSubPage('videos')} />
            </Suspense>
          )}

          {/* ===============================================================
              PAGE 3: DEDICATED MODULE VIDEOS PAGE
             =============================================================== */}
          {subPage === 'videos' && (
            <Suspense fallback={<div className="mx-auto min-h-[50vh] max-w-6xl px-4 py-12 text-sm text-slate-500" role="status">Chargement des tutoriels…</div>}>
              <VideosTutorialsPage language={language} />
            </Suspense>
          )}

          {/* ===============================================================
              PAGE 4: DEDICATED PRICING & PAYMENTS PAGE
             =============================================================== */}
          {subPage === 'pricing' && (
            <div className="pb-24">
              <section className="bg-[#050B1C] py-16 text-center text-white sm:py-22">
                <div className="mx-auto max-w-3xl px-4 sm:px-6">
                  <span className="inline-block rounded-full border border-sky-400/30 bg-sky-500/15 px-4 py-1 text-xs font-bold text-sky-300">
                    💎 Formules Simples & Transparentes
                  </span>
                  <h1 className="sf-display-heading mt-5 text-3xl font-extrabold sm:text-5xl">
                    Des tarifs clairs, à activer dans l’application
                  </h1>
                  <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                    {billingTestMode
                      ? 'Installez ShopFlow et créez votre boutique dans l’application. Pendant les tests, l’accès n’expire pas et aucun paiement n’est obligatoire. Les formules mensuelles restent affichées à titre indicatif.'
                      : 'Installez ShopFlow et créez votre boutique dans l’application. L’essai de 7 jours commence à sa création; toute formule payante nécessite une confirmation serveur du prestataire.'}
                  </p>

                  <div className="mt-7 inline-flex rounded-full border border-white/15 bg-white/10 p-1 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => onChangeCurrency('USD')}
                      className={`rounded-full px-5 py-2 transition ${
                        currency === 'USD'
                          ? 'bg-white text-slate-950'
                          : 'text-slate-300'
                      }`}
                    >
                      Dollars ($ USD)
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeCurrency('FC')}
                      className={`rounded-full px-5 py-2 transition ${
                        currency === 'FC'
                          ? 'bg-white text-slate-950'
                          : 'text-slate-300'
                      }`}
                    >
                      Francs (FC)
                    </button>
                  </div>
                  <div className="mt-3 inline-flex rounded-full border border-white/15 bg-white/10 p-1 text-xs font-bold">
                    <button type="button" onClick={() => setAnnualPricing(false)} aria-pressed={!annualPricing} className={`rounded-full px-4 py-2 transition ${!annualPricing ? 'bg-white text-slate-950' : 'text-slate-300'}`}>Mensuel</button>
                    <button type="button" onClick={() => setAnnualPricing(true)} aria-pressed={annualPricing} className={`rounded-full px-4 py-2 transition ${annualPricing ? 'bg-white text-slate-950' : 'text-slate-300'}`}>Annuel · 2 mois offerts</button>
                  </div>
                </div>
              </section>

              <div className="mx-auto -mt-10 max-w-6xl px-4 sm:px-6">
                <StaggerGroup className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {[
                    {
                      id: 'starter' as SubscriptionPlanId,
                      name: 'Starter Boutique',
                      desc: 'Pour démarrer avec les outils essentiels.',
                      usd: 5,
                      highlight: false,
                      perks: [
                        'Gestion des marchandises avec photos',
                        'Vente rapide « +1 Vendu » et panier client',
                        'Calcul automatique du chiffre d’affaires et du revenu net',
                        'Mode hors ligne',
                      ],
                    },
                    {
                      id: 'pro_ai' as SubscriptionPlanId,
                      name: 'Pro IA & Croissance',
                      desc: 'Gestion élargie et assistant IA.',
                      usd: 12,
                      highlight: true,
                      perks: [
                        'Gestion des marchandises, ventes et dépenses',
                        'Assistant IA Coach et caisse vocale, selon disponibilité et limites du service',
                        'Catalogue partageable avec demandes par WhatsApp, sans paiement intégré',
                        'Carnet de crédits clients et outils de relance',
                      ],
                    },
                    {
                      id: 'business' as SubscriptionPlanId,
                      name: 'Business Multi-Boutiques',
                      desc: 'Pour les propriétaires de plusieurs boutiques ou dépôts.',
                      usd: 25,
                      highlight: false,
                      perks: [
                        'Gestion de plusieurs boutiques ou dépôts',
                        'Données et réglages séparés pour chaque boutique',
                      ],
                    },
                  ].map((plan) => (
                    <StaggerItem key={plan.id}>
                      <div
                        className={`flex h-full flex-col justify-between rounded-3xl bg-white p-8 shadow-lg ${
                          plan.highlight
                            ? 'border-2 border-[#0A4DFF] ring-4 ring-blue-600/10'
                            : 'border border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="sf-display-heading text-xl font-bold text-slate-950">
                              {plan.name}
                            </h3>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {plan.desc}
                          </p>
                          <div className="mt-6 flex items-baseline gap-1.5">
                            <span className="sf-display-heading text-4xl font-extrabold text-slate-950 tabular-nums">
                              {fmtPlanPrice(annualPricing ? planPriceUSD(plan.id, true) : plan.usd)}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              / {annualPricing ? 'an' : 'mois'}
                            </span>
                          </div>
                          {annualPricing && (
                            <p className="mt-1 text-xs font-semibold text-emerald-700">
                              Équivaut à {fmtPlanPrice(planPriceUSD(plan.id, true) / 12)} / mois · {ANNUAL_SAVING_MONTHS} mois offerts
                            </p>
                          )}

                          <ul className="mt-6 space-y-3 border-t border-slate-100 pt-6 text-sm text-slate-700">
                            {plan.perks.map((p, i) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0A4DFF]" />
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenAuthModal('install')}
                          className={`mt-8 w-full rounded-full py-3.5 text-sm font-bold text-white transition ${
                            plan.highlight
                              ? 'bg-[#0A4DFF] hover:bg-blue-700'
                              : 'bg-slate-950 hover:bg-slate-800'
                          }`}
                        >
                          {billingTestMode ? 'Installer et commencer les tests' : 'Installer puis choisir dans l’app'}
                        </button>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerGroup>
              </div>
            </div>
          )}

          {/* ===============================================================
              PAGE 5: DEDICATED DOWNLOAD, OFFLINE CLOUD & FAQ PAGE
             =============================================================== */}
          {subPage === 'faq' && (
            <div className="pb-24">
              <section className="bg-[#050B1C] py-16 text-center text-white sm:py-22">
                <div className="mx-auto max-w-3xl px-4 sm:px-6">
                  <span className="inline-block rounded-full border border-emerald-400/30 bg-emerald-500/15 px-4 py-1 text-xs font-bold text-emerald-300">
                    📲 Accès hors connexion & sauvegarde
                  </span>
                  <h1 className="sf-display-heading mt-5 text-3xl leading-tight font-extrabold sm:text-5xl">
                    Installez ShopFlow. Créez votre boutique dans l’application.
                  </h1>
                  <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                    Ce site présente ShopFlow : il ne crée pas de boutique. Après installation, ouvrez l’application et suivez les étapes de création sur votre appareil.
                  </p>
                  <div className="mt-9 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenAuthModal('install')}
                      className="inline-flex items-center gap-2 rounded-full bg-[#0A4DFF] px-6 py-3.5 text-sm font-bold text-white shadow-lg"
                    >
                      <Download className="h-4 w-4" />
                      <span>Consulter les options d’installation</span>
                    </button>
                    <div className="max-w-xl rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-left text-sm leading-relaxed text-slate-300">
                      <span className="font-bold text-white">Votre boutique se crée dans ShopFlow, pas sur ce site.</span>{' '}
                      Installez d’abord l’application, puis suivez l’accueil guidé pour créer votre espace commerçant.
                    </div>
                  </div>
                </div>
              </section>

              {/* 3 Security Guarantees */}
              <div className="mx-auto mt-14 max-w-5xl px-4 sm:px-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {[
                    {
                      icon: WifiOff,
                      title: 'Fonctions locales hors connexion',
                      desc: 'La gestion du stock, les ventes et les reçus enregistrés localement restent accessibles sans Internet. Les réponses IA générales nécessitent une connexion.',
                    },
                    {
                      icon: ShieldCheck,
                      title: 'Sauvegarde locale',
                      desc: 'Les données restent enregistrées sur l’appareil utilisé. Exportez une sauvegarde séparée et conservez-la avant de changer de téléphone.',
                    },
                    {
                      icon: Smartphone,
                      title: 'Pensé pour votre comptoir',
                      desc: 'Retrouvez votre catalogue, vos ventes et vos reçus dans l’application installée sur votre appareil.',
                    },
                  ].map((g, i) => {
                    const Icon = g.icon;
                    return (
                      <RevealOnScroll key={i} delay={i * 0.08}>
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0A4DFF]">
                            <Icon className="h-6 w-6" />
                          </div>
                          <h3 className="mt-4 text-base font-bold text-slate-950">
                            {g.title}
                          </h3>
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                            {g.desc}
                          </p>
                        </div>
                      </RevealOnScroll>
                    );
                  })}
                </div>

                {/* FAQ Accordion */}
                <div className="mt-14 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white px-6 shadow-xs">
                  {faqItems.map((item, idx) => {
                    const open = openFaq === idx;
                    return (
                      <div key={idx} className="py-5">
                        <button
                          type="button"
                          onClick={() => setOpenFaq(open ? null : idx)}
                          className="flex w-full items-center justify-between gap-4 text-left text-sm font-bold text-slate-950 sm:text-base"
                        >
                          <span>{item.q}</span>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                              open ? 'rotate-180 text-[#0A4DFF]' : ''
                            }`}
                          />
                        </button>
                        {open && (
                          <p className="mt-3 text-sm leading-relaxed text-slate-600">
                            {item.a}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* =====================================================================
          SHARED COMPACT PRO FOOTER WITH QUICK PAGE LINKS
         ===================================================================== */}
      <footer className="border-t border-slate-200 bg-[#050B1C] py-12 text-xs text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src={SHOPFLOW_APP_LOGO}
              alt="ShopFlow"
              className="h-9 w-9 rounded-xl bg-white p-1 object-contain"
            />
            <div>
              <p className="sf-display-heading text-sm font-bold text-white">
                ShopFlow Pro
              </p>
              <p className="text-[11px] text-slate-400">
                Kinshasa, RDC
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-5 font-semibold text-slate-300">
            <button
              type="button"
              onClick={() => navigateToSubPage('home')}
              className="hover:text-sky-400"
            >
              Accueil
            </button>
            <button
              type="button"
              onClick={() => navigateToSubPage('screenshots')}
              className="hover:text-sky-400"
            >
              Captures (7)
            </button>
            <button
              type="button"
              onClick={() => navigateToSubPage('videos')}
              className="hover:text-sky-400"
            >
              Vidéos (7)
            </button>
            <button
              type="button"
              onClick={() => navigateToSubPage('pricing')}
              className="hover:text-sky-400"
            >
              Tarifs
            </button>
            <button
              type="button"
              onClick={() => onOpenAuthModal('install')}
              className="text-emerald-400 hover:underline"
            >
              Installer ShopFlow →
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} ShopFlow
          </p>
        </div>
      </footer>
    </div>
  );
};
