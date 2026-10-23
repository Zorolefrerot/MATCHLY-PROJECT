import React, { useEffect, useState } from 'react';
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
import {
  LANDING_HERO_PHOTO,
  SHOPFLOW_APP_LOGO,
} from '../data/initialData';
import { LANGUAGE_OPTIONS } from '../i18n/translations';
import {
  AppLanguage,
  CurrencyCode,
  NavTab,
  SubscriptionPlanId,
} from '../types';
import { AuthModalMode } from './AuthModal';
import {
  AnimatedCounter,
  ParallaxPhoneStage,
  RevealOnScroll,
  ScrollProgressBar,
  StaggerGroup,
  StaggerItem,
} from './showcase/MotionPrimitives';
import {
  PhoneScreenCapture,
  ScreenshotsGuidePage,
} from './showcase/ScreenshotsGuidePage';
import { VideosTutorialsPage } from './showcase/VideosTutorialsPage';

export type ShowcaseSubPage =
  | 'home'
  | 'screenshots'
  | 'videos'
  | 'pricing'
  | 'faq';

interface LandingPageViewProps {
  isInstalledApp: boolean;
  language: AppLanguage;
  currency: CurrencyCode;
  usdRateFC: number;
  onChangeLanguage: (lang: AppLanguage) => void;
  onChangeCurrency: (curr: CurrencyCode) => void;
  onOpenAuthModal: (
    mode: AuthModalMode,
    preselectedPlan?: SubscriptionPlanId
  ) => void;
  onEnterInteractiveDemo: (initialTab?: NavTab) => void;
  onPreviewRealWhatsAppReceipt: () => void;
}

const MARQUEE_ITEMS = [
  'M-Pesa Vodacom',
  'Orange Money',
  'Airtel Money',
  'Afrimoney',
  'Visa & Mastercard',
  'Mode Hors-Ligne 100%',
  'Reçus WhatsApp HD',
  'Cadenas Patron PIN',
  'ShopFlow AI Vocal',
  'Kinshasa • Lubumbashi • Goma • International',
];

const FAQ_LIST = [
  {
    q: 'Est-ce que ShopFlow fonctionne quand Internet coupe ?',
    a: 'Oui, à 100 %. Vous vendez, modifiez votre stock et éditez vos reçus toute la journée sans connexion. Dès que le téléphone retrouve la 4G ou le Wi-Fi, tout se sauvegarde automatiquement dans le Cloud.',
  },
  {
    q: 'Que se passe-t-il si je perds, casse ou change mon téléphone ?',
    a: 'Aucune donnée n’est perdue. Connectez-vous simplement à votre compte sur un nouveau téléphone ou un ordinateur : vos articles, ventes, crédits clients et paramètres réapparaissent immédiatement.',
  },
  {
    q: 'Mon vendeur peut-il utiliser la caisse sans voir mon bénéfice net ?',
    a: 'Oui. Activez le Mode Vendeur en 1 clic : votre employé encaisse les clients et envoie les reçus WhatsApp, mais vos bénéfices nets, vos prix d’achat fournisseurs et vos réglages sont protégés par votre code PIN à 4 chiffres.',
  },
  {
    q: 'Comment régler mon abonnement après les 7 jours gratuits ?',
    a: 'Directement dans l’application par Mobile Money (M-Pesa, Orange Money, Airtel Money, Afrimoney) ou par carte bancaire Visa / Mastercard, avec activation instantanée.',
  },
];

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  isInstalledApp,
  language,
  currency,
  usdRateFC,
  onChangeLanguage,
  onChangeCurrency,
  onOpenAuthModal,
  onEnterInteractiveDemo,
  onPreviewRealWhatsAppReceipt,
}) => {
  const [subPage, setSubPage] = useState<ShowcaseSubPage>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [scrolledHeader, setScrolledHeader] = useState(false);

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

  const fmtPlanPrice = (usd: number) => {
    if (currency === 'USD') return `${usd} $`;
    const fc = Math.round((usd * usdRateFC) / 500) * 500;
    return `${fc.toLocaleString('fr-FR')} FC`;
  };

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
      subtitle: 'Les 8 écrans de l’application expliqués pas à pas',
      badge: '8 écrans',
      icon: Images,
    },
    {
      id: 'videos',
      label: 'Vidéos par Partie de l’App',
      shortLabel: 'Vidéos',
      subtitle: 'Démonstrations animées avec voix pour chaque module',
      badge: '7 vidéos',
      icon: Film,
    },
    {
      id: 'pricing',
      label: 'Tarifs & Moyens de Paiement',
      shortLabel: 'Tarifs',
      subtitle: 'Formules 5 $ / 12 $ / 25 $ • Mobile Money & Carte',
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
            ? 'border-b border-white/10 bg-[#050B1C]/92 text-white shadow-xl backdrop-blur-xl'
            : 'border-b border-white/10 bg-[#050B1C] text-white'
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
              className="h-14 w-14 rounded-2xl bg-white p-0.5 object-contain shadow-md sm:h-16 sm:w-16"
            />
            <span className="sf-display-heading text-lg font-bold tracking-tight text-white sm:text-xl">
              Shop<span className="text-sky-400">Flow</span>
            </span>
          </button>

          {/* Desktop Quick Page Switcher Pills */}
          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 lg:flex">
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
                      : 'text-slate-300 hover:text-white'
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
              onClick={() =>
                isInstalledApp
                  ? onEnterInteractiveDemo('dashboard')
                  : onOpenAuthModal('install')
              }
              className="hidden rounded-full bg-[#0A4DFF] px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500 sm:inline-flex"
            >
              {isInstalledApp ? 'Ouvrir l’application' : 'Télécharger l’app'}
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Ouvrir le menu déroulant"
              className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/20"
            >
              <span className="flex flex-col gap-1">
                <span className="h-0.5 w-4 rounded-full bg-white" />
                <span className="h-0.5 w-3 rounded-full bg-sky-400" />
                <span className="h-0.5 w-4 rounded-full bg-white" />
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

                {/* Direct Launch Into Live App / Receipt Preview */}
                <div className="mt-6 space-y-2.5 border-t border-white/10 pt-5">
                  <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Démo de l’application (boutique exemple)
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      onEnterInteractiveDemo('dashboard');
                    }}
                    className="flex w-full items-center justify-between rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-extrabold text-white transition hover:bg-emerald-500"
                  >
                    <span className="flex items-center gap-2">
                      <Play className="h-4 w-4 fill-current" />
                      <span>Explorer la démo (boutique exemple)</span>
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      if (isInstalledApp) onEnterInteractiveDemo('dashboard');
                      else onOpenAuthModal('install');
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-xs font-bold text-white transition hover:bg-white/15"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger / installer l’application
                  </button>
                  <p className="px-1 text-[11px] leading-relaxed text-slate-400">
                    La création de votre boutique se fait dans l’application, après son installation.
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
            <div>
              {/* DARK OBSIDIAN LUXURY HERO WITH 3D SCROLL PARALLAX */}
              <section className="relative overflow-hidden bg-[#050B1C] pt-16 pb-24 text-white sm:pt-24 sm:pb-32">
                {/* Atmospheric Mesh Glows */}
                <div className="pointer-events-none absolute -top-28 -left-20 h-96 w-96 rounded-full bg-[#0A4DFF]/30 blur-3xl" />
                <div className="pointer-events-none absolute right-0 bottom-0 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />

                <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
                  <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12">
                    {/* Animated Left Copy */}
                    <div className="space-y-8 lg:col-span-6">
                      <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-4 py-1.5 text-xs font-bold text-sky-300"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Nouvelle génération de gestion commerciale</span>
                      </motion.div>

                      <motion.h1
                        initial={{ opacity: 0, y: 26 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.65, delay: 0.08 }}
                        className="sf-display-heading text-4xl leading-[1.08] font-extrabold text-white sm:text-5xl lg:text-[56px]"
                      >
                        Pilotez vos ventes.{' '}
                        <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                          Voyez votre vrai bénéfice.
                        </span>
                      </motion.h1>

                      <motion.p
                        initial={{ opacity: 0, y: 22 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.65, delay: 0.16 }}
                        className="max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg"
                      >
                        Ventes éclair en 1 clic, stock en direct, reçus
                        professionnels sur WhatsApp et protection anti-coulage —
                        sur téléphone et ordinateur, même sans connexion.
                      </motion.p>

                      {/* Primary Buttons */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.24 }}
                        className="flex flex-col gap-4 pt-3 sm:flex-row"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            isInstalledApp
                              ? onEnterInteractiveDemo('dashboard')
                              : onOpenAuthModal('install')
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0A4DFF] px-7 py-4 text-sm font-bold text-white shadow-xl shadow-blue-600/35 transition hover:scale-[1.02] hover:bg-blue-500"
                        >
                          {isInstalledApp ? (
                            <Play className="h-4 w-4 fill-current" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          <span>{isInstalledApp ? 'Ouvrir ShopFlow' : 'Télécharger l’application'}</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => navigateToSubPage('videos')}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-4 text-sm font-bold text-white backdrop-blur-xs transition hover:bg-white/20"
                        >
                          <Play className="h-4 w-4 fill-current text-emerald-400" />
                          <span>Voir en vidéo</span>
                        </button>
                      </motion.div>
                      <p className="max-w-lg text-xs leading-6 text-slate-400 sm:text-sm">
                        Le site sert à découvrir ShopFlow. La création de votre boutique se fait uniquement dans l’application, après installation.
                      </p>
                    </div>

                    {/* Right 3D Parallax Phone + Floating Animated Badges */}
                    <div className="relative lg:col-span-6">
                      <ParallaxPhoneStage>
                        <div className="relative mx-auto max-w-md">
                          <PhoneScreenCapture captureId="cap-dashboard" />

                          {/* Floating Animated Badge Left */}
                          <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{
                              repeat: Infinity,
                              duration: 3.6,
                              ease: 'easeInOut',
                            }}
                            onClick={onPreviewRealWhatsAppReceipt}
                            className="mt-4 cursor-pointer rounded-2xl border border-white/15 bg-slate-900/90 p-3.5 text-xs shadow-2xl backdrop-blur-md sm:absolute sm:top-10 sm:-left-10 sm:mt-0 sm:w-56"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                                <ReceiptText className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-bold text-white">
                                  Reçu WhatsApp HD
                                </p>
                                <p className="text-[11px] text-emerald-300">
                                  Cliquer pour voir →
                                </p>
                              </div>
                            </div>
                          </motion.div>

                          {/* Floating Animated Badge Right */}
                          <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{
                              repeat: Infinity,
                              duration: 4.2,
                              ease: 'easeInOut',
                            }}
                            className="hidden rounded-2xl border border-white/15 bg-slate-900/90 p-3.5 text-xs shadow-2xl backdrop-blur-md sm:absolute sm:-right-8 sm:bottom-12 sm:block sm:w-52"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
                                <Lock className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-bold text-white">
                                  Mode Vendeur Actif
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  Bénéfices protégés par PIN
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </ParallaxPhoneStage>
                    </div>
                  </div>
                </div>
              </section>

              {/* SMOOTH INFINITE ECOSYSTEM MARQUEE */}
              <div className="overflow-hidden border-y border-slate-200 bg-white py-4">
                <div className="sf-marquee-track flex items-center gap-8 text-xs font-extrabold tracking-wide text-slate-600 uppercase">
                  {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
                    <span key={idx} className="flex items-center gap-8">
                      <span>{item}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0A4DFF]" />
                    </span>
                  ))}
                </div>
              </div>

              {/* SCROLL-TRIGGERED ANIMATED COUNTERS */}
              <section className="py-16 sm:py-20">
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                  <StaggerGroup className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[
                      {
                        val: 2400,
                        prefix: '+',
                        suffix: '',
                        label: 'Commerces & boutiques équipés',
                      },
                      {
                        val: 100,
                        prefix: '',
                        suffix: ' %',
                        label: 'Fonctionne même sans Internet',
                      },
                      {
                        val: 2,
                        prefix: '< ',
                        suffix: ' s',
                        label: 'Pour encaisser & éditer un reçu',
                      },
                      {
                        val: 5,
                        prefix: '',
                        suffix: ' langues',
                        label: 'Français, Anglais, Lingala, Swahili, Chinois',
                      },
                    ].map((stat, idx) => (
                      <StaggerItem key={idx}>
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 text-center shadow-xs">
                          <p className="sf-display-heading text-3xl font-extrabold text-[#0A4DFF] sm:text-4xl">
                            <AnimatedCounter
                              target={stat.val}
                              prefix={stat.prefix}
                              suffix={stat.suffix}
                            />
                          </p>
                          <p className="mt-2 text-xs font-semibold text-slate-600">
                            {stat.label}
                          </p>
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerGroup>
                </div>
              </section>

              {/* PROGRESSIVE SCROLL STORYTELLING BLOCKS */}
              <section className="space-y-24 py-8 sm:py-14">
                <div className="mx-auto max-w-6xl space-y-24 px-4 sm:px-6">
                  {/* Block A: Lifestyle + Instant Profit */}
                  <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
                    <RevealOnScroll direction="left" className="lg:col-span-6">
                      <div className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-slate-900/10">
                        <img
                          src={LANDING_HERO_PHOTO}
                          alt="Commerçante avec ShopFlow"
                          className="aspect-[4/3] w-full object-cover transition duration-700 hover:scale-105"
                        />
                      </div>
                    </RevealOnScroll>

                    <RevealOnScroll
                      direction="right"
                      delay={0.12}
                      className="space-y-5 lg:col-span-6"
                    >
                      <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1 text-xs font-extrabold text-[#0A4DFF]">
                         Zéro calcul compliqué
                      </span>
                      <h2 className="sf-display-heading text-3xl font-extrabold text-slate-950 sm:text-4xl">
                        Ne confondez plus jamais l’argent en caisse et votre vrai bénéfice.
                      </h2>
                      <p className="text-base leading-relaxed text-slate-600">
                        À chaque vente, ShopFlow soustrait tout seul le prix
                        d’achat fournisseur et vos dépenses de la journée
                        (transport, courant, sachets) pour afficher ce que vous
                        avez réellement gagné.
                      </p>
                      <div className="flex flex-wrap gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => onEnterInteractiveDemo('dashboard')}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-xs font-bold text-white transition hover:bg-[#0A4DFF]"
                        >
                          <span>Tester la démo en direct</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </RevealOnScroll>
                  </div>

                  {/* Block B: Interactive Gateways to the Dedicated Captures & Videos Pages! */}
                  <RevealOnScroll direction="up">
                    <div className="rounded-3xl bg-[#050B1C] p-8 text-white shadow-2xl sm:p-12">
                      <div className="mx-auto max-w-2xl text-center">
                        <span className="text-xs font-extrabold tracking-widest text-sky-400 uppercase">
                          Découvrez tout avant même de vous inscrire
                        </span>
                        <h2 className="sf-display-heading mt-2 text-2xl font-extrabold sm:text-4xl">
                          Explorez ShopFlow en captures ou en vidéos
                        </h2>
                        <p className="mt-3 text-sm text-slate-300">
                          Nous avons préparé deux guides dédiés pour voir chaque
                          écran et chaque fonctionnalité en action.
                        </p>
                      </div>

                      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Gateway Card 1 -> Screenshots Page */}
                        <motion.div
                          whileHover={{ y: -6 }}
                          onClick={() => navigateToSubPage('screenshots')}
                          className="cursor-pointer rounded-3xl border border-white/15 bg-white/[0.06] p-7 transition hover:border-sky-400/60 hover:bg-white/[0.1]"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A4DFF] text-white">
                            <Images className="h-6 w-6" />
                          </div>
                          <h3 className="sf-display-heading mt-5 text-xl font-bold">
                            📸 Guide par Captures d’écran (8 écrans)
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-slate-300">
                            Parcourez toutes les captures annotées ① ② ③ :
                            Tableau de bord, Caisse rapide, Reçu WhatsApp,
                            Stock, Scanner photo, IA et Cadenas vendeur.
                          </p>
                          <span className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-sky-400">
                            <span>Ouvrir la page des captures</span>
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </motion.div>

                        {/* Gateway Card 2 -> Videos Page */}
                        <motion.div
                          whileHover={{ y: -6 }}
                          onClick={() => navigateToSubPage('videos')}
                          className="cursor-pointer rounded-3xl border border-white/15 bg-white/[0.06] p-7 transition hover:border-emerald-400/60 hover:bg-white/[0.1]"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                            <Film className="h-6 w-6" />
                          </div>
                          <h3 className="sf-display-heading mt-5 text-xl font-bold">
                            🎬 Vidéos Explicatives par Partie (7 vidéos)
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-slate-300">
                            Regardez 7 courtes vidéos animées avec sous-titres
                            et voix explicative pour comprendre chaque module en
                            15 secondes.
                          </p>
                          <span className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-emerald-400">
                            <span>Ouvrir la vidéothèque</span>
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </motion.div>
                      </div>
                    </div>
                  </RevealOnScroll>
                </div>
              </section>
            </div>
          )}

          {/* ===============================================================
              PAGE 2: DEDICATED SCREENSHOTS WALKTHROUGH PAGE
             =============================================================== */}
          {subPage === 'screenshots' && (
            <ScreenshotsGuidePage
              onOpenRealScreenInApp={(tab) => onEnterInteractiveDemo(tab)}
              onSwitchToVideosPage={() => navigateToSubPage('videos')}
            />
          )}

          {/* ===============================================================
              PAGE 3: DEDICATED MODULE VIDEOS PAGE
             =============================================================== */}
          {subPage === 'videos' && (
            <VideosTutorialsPage
              language={language}
              onOpenRealScreenInApp={(tab) => onEnterInteractiveDemo(tab)}
            />
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
                    Installez d’abord ShopFlow. Vous créerez votre boutique et choisirez votre formule depuis l’application. Paiement par M-Pesa, Orange Money, Airtel Money, Afrimoney ou carte Visa / Mastercard.
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
                </div>
              </section>

              <div className="mx-auto -mt-10 max-w-6xl px-4 sm:px-6">
                <StaggerGroup className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {[
                    {
                      id: 'starter' as SubscriptionPlanId,
                      name: 'Starter Boutique',
                      desc: 'Idéal pour démarrer sans cahier papier.',
                      usd: 5,
                      highlight: false,
                      perks: [
                        'Caisse rapide 1 clic & suivi du stock',
                        'Calcul automatique du vrai bénéfice net',
                        'Reçus clients propres sur WhatsApp',
                        'Mode Hors-Ligne inclus',
                      ],
                    },
                    {
                      id: 'pro_ai' as SubscriptionPlanId,
                      name: 'ShopFlow Pro + IA',
                      desc: 'Le pack complet le plus choisi.',
                      usd: 12,
                      highlight: true,
                      perks: [
                        'Articles, ventes & reçus HD illimités',
                        'ShopFlow AI illimité + 6 voix naturelles',
                        'Scanner photo & boutique en ligne WhatsApp',
                        'Mode Vendeur (PIN) & Cahier de crédits',
                      ],
                    },
                    {
                      id: 'business' as SubscriptionPlanId,
                      name: 'Business Multi-Boutiques',
                      desc: 'Pour plusieurs points de vente et gérants.',
                      usd: 25,
                      highlight: false,
                      perks: [
                        'Jusqu’à 5 boutiques / dépôts synchronisés',
                        'Plusieurs téléphones connectés en direct',
                        'Suivi complet par vendeur / caissier',
                        'Support VIP prioritaire sur WhatsApp 7j/7',
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
                            {plan.highlight && (
                              <span className="rounded-full bg-[#0A4DFF] px-3 py-1 text-[10px] font-black text-white">
                                POPULAIRE
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {plan.desc}
                          </p>
                          <div className="mt-6 flex items-baseline gap-1.5">
                            <span className="sf-display-heading text-4xl font-extrabold text-slate-950 tabular-nums">
                              {fmtPlanPrice(plan.usd)}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              / mois
                            </span>
                          </div>

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
                          onClick={() =>
                            isInstalledApp
                              ? onEnterInteractiveDemo('subscription')
                              : onOpenAuthModal('install')
                          }
                          className={`mt-8 w-full rounded-full py-3.5 text-sm font-bold text-white transition ${
                            plan.highlight
                              ? 'bg-[#0A4DFF] hover:bg-blue-700'
                              : 'bg-slate-950 hover:bg-slate-800'
                          }`}
                        >
                          Installer puis choisir dans l’app
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
                    📲 Multi-Appareils & Sauvegarde Garantie
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
                      onClick={() =>
                        isInstalledApp
                          ? onEnterInteractiveDemo('dashboard')
                          : onOpenAuthModal('install')
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-[#0A4DFF] px-6 py-3.5 text-sm font-bold text-white shadow-lg"
                    >
                      {isInstalledApp ? <Play className="h-4 w-4 fill-current" /> : <Download className="h-4 w-4" />}
                      <span>{isInstalledApp ? 'Ouvrir l’application ShopFlow' : 'Installer / ajouter l’app à l’écran d’accueil'}</span>
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
                      title: '100 % Hors-Ligne',
                      desc: 'Vendez toute la journée même en cas de coupure réseau totale.',
                    },
                    {
                      icon: ShieldCheck,
                      title: 'Sauvegarde Cloud Auto',
                      desc: 'Téléphone perdu ou changé ? Connectez-vous et retrouvez toute votre boutique.',
                    },
                    {
                      icon: Smartphone,
                      title: 'Android, iPhone & PC',
                      desc: 'Utilisez ShopFlow au comptoir sur téléphone et suivez vos chiffres à la maison.',
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
                  {FAQ_LIST.map((item, idx) => {
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
                Kinshasa, RDC & International
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
              Captures (8)
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
              onClick={() => onEnterInteractiveDemo('dashboard')}
              className="text-emerald-400 hover:underline"
            >
              Ouvrir l’Application →
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
