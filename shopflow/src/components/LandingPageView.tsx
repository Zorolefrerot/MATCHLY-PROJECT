import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Bot,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  Coins,
  CreditCard,
  Download,
  Globe,
  Lock,
  Menu,
  Play,
  ReceiptText,
  ScanBarcode,
  Smartphone,
  Sparkles,
  Star,
  TrendingUp,
  WifiOff,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  INITIAL_PRODUCTS,
  LANDING_HERO_PHOTO,
  SHOPFLOW_APP_LOGO,
} from '../data/initialData';
import { LANGUAGE_OPTIONS } from '../i18n/translations';
import {
  AppLanguage,
  CurrencyCode,
  SubscriptionPlanId,
} from '../types';
import { AuthModalMode } from './AuthModal';

interface LandingPageViewProps {
  language: AppLanguage;
  currency: CurrencyCode;
  usdRateFC: number;
  onChangeLanguage: (lang: AppLanguage) => void;
  onChangeCurrency: (curr: CurrencyCode) => void;
  onOpenAuthModal: (
    mode: AuthModalMode,
    preselectedPlan?: SubscriptionPlanId
  ) => void;
  onEnterInteractiveDemo: (initialTab?: 'dashboard' | 'pos' | 'ai' | 'subscription') => void;
  onPreviewRealWhatsAppReceipt: () => void;
}

const FAQ_ITEMS = [
  {
    q: 'Est-ce que ShopFlow fonctionne si la connexion Internet coupe dans ma boutique ?',
    a: 'Oui, à 100 % ! Vous encaissez vos ventes, gérez votre stock et générez vos reçus toute la journée même sans Internet. Dès que la 4G ou le Wi-Fi revient, toutes vos données se sauvegardent automatiquement sur le Cloud sécurisé.',
  },
  {
    q: 'Que se passe-t-il si je perds, casse ou change mon téléphone ?',
    a: 'Vous ne perdez absolument rien ! Connectez-vous simplement avec votre email ou numéro et mot de passe sur un nouveau téléphone ou un ordinateur : tout votre stock, vos ventes, vos crédits clients et votre logo réapparaissent en 3 secondes.',
  },
  {
    q: 'Puis-je laisser mon vendeur / caissier utiliser l’application sans qu’il voie mon bénéfice ?',
    a: 'Oui ! Activez en 1 clic le « Mode Vendeur » protégé par votre Code PIN Patron à 4 chiffres : votre employé peut vendre et envoyer les reçus WhatsApp, mais ne peut ni voir votre Bénéfice Net réel, ni vos prix d’achat fournisseurs, ni modifier vos réglages.',
  },
  {
    q: 'Ai-je besoin de connaissances techniques ou d’une clé spéciale pour utiliser ShopFlow AI ?',
    a: 'Aucune ! ShopFlow AI est directement intégré et prêt dès la création de votre boutique. Posez vos questions à l’écrit ou au micro en Français, Anglais, Lingala, Swahili ou Chinois et écoutez les réponses avec une voix naturelle.',
  },
  {
    q: 'Comment mes clients reçoivent-ils leur reçu d’achat ?',
    a: 'Après chaque vente, ShopFlow génère en 1 seconde un superbe reçu professionnel avec le logo de votre boutique, le détail des articles, le total et la mention PAYÉ, partageable en image HD ou PDF directement sur WhatsApp.',
  },
  {
    q: 'Comment payer mon abonnement après mes 7 jours d’essai gratuit ?',
    a: 'Vous payez facilement en 30 secondes par Mobile Money (M-Pesa, Orange Money, Airtel Money, Afrimoney) ou par Carte Bancaire internationale (Visa / Mastercard). Votre abonnement s’active automatiquement et immédiatement.',
  },
  {
    q: 'Quelles devises et quels types de commerces sont supportés ?',
    a: 'Vous choisissez librement votre devise d’affichage (Franc FC ou Dollar USD) à tout moment. ShopFlow s’adapte à tous les commerces : alimentation, superette, prêt-à-porter, parfumerie, cosmétique, téléphonie, pharmacie, quincaillerie ou dépôt.',
  },
  {
    q: 'Comment installer ShopFlow sur Android, iPhone et Ordinateur ?',
    a: 'ShopFlow s’utilise sur téléphone Android, iPhone, tablette et PC en même temps ! Vous pouvez l’installer directement sur votre écran d’accueil en 2 secondes ou via Google Play Store & App Store.',
  },
];

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  language,
  currency,
  usdRateFC,
  onChangeLanguage,
  onChangeCurrency,
  onOpenAuthModal,
  onEnterInteractiveDemo,
  onPreviewRealWhatsAppReceipt,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroShowcaseTab, setHeroShowcaseTab] = useState<
    'profit' | 'receipt' | 'ai' | 'lock'
  >('profit');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    'monthly'
  );
  const [dailySalesSlider, setDailySalesSlider] = useState(30);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const formatPriceUSD = (usd: number) => {
    if (currency === 'USD') {
      return `${usd.toFixed(2).replace('.', ',')} $`;
    }
    const fc = Math.round((usd * usdRateFC) / 500) * 500;
    return `${fc.toLocaleString('fr-FR')} FC`;
  };

  // Interactive ROI calculator values
  const monthlyRecoveredUSD = Math.round(dailySalesSlider * 2.35);
  const hoursSavedPerMonth = Math.max(8, Math.round(dailySalesSlider * 0.85));

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-[#0A4DFF] selection:text-white">
      {/* =====================================================================
          TOP ANNOUNCEMENT PROMO BAR
         ===================================================================== */}
      <div className="bg-[#081844] px-4 py-2 text-center text-[11px] font-bold text-sky-100 sm:text-xs">
        <span>
          🎉 Offre de lancement :{' '}
          <strong className="text-white">7 jours d’essai gratuit complet</strong>{' '}
          + 20 % de réduction sur l’abonnement annuel —{' '}
        </span>
        <button
          type="button"
          onClick={() => onOpenAuthModal('signup', 'pro_ai')}
          className="ml-1 inline-flex items-center gap-1 underline decoration-sky-400 underline-offset-4 hover:text-white"
        >
          <span>Démarrer gratuitement</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* =====================================================================
          STICKY COMMERCIAL NAVBAR
         ===================================================================== */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Official Brand Logo */}
          <a href="#top" className="flex items-center gap-2.5">
            <img
              src={SHOPFLOW_APP_LOGO}
              alt="ShopFlow Logo"
              className="h-10 w-10 rounded-xl object-contain shadow-2xs ring-1 ring-slate-200/90 sm:h-11 sm:w-11"
            />
            <div>
              <span className="text-lg font-black tracking-tight text-slate-950 sm:text-xl">
                Shop<span className="text-[#0A4DFF]">Flow</span>
              </span>
              <span className="ml-1.5 hidden rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-[#0A4DFF] sm:inline-block">
                PRO
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-6 text-xs font-extrabold text-slate-600 lg:flex">
            <a href="#avantages" className="transition hover:text-[#0A4DFF]">
              Pourquoi ShopFlow
            </a>
            <a href="#fonctionnalites" className="transition hover:text-[#0A4DFF]">
              Fonctionnalités
            </a>
            <a href="#simulateur" className="transition hover:text-[#0A4DFF]">
              Calculateur de Gains
            </a>
            <a href="#tarifs" className="transition hover:text-[#0A4DFF]">
              Tarifs
            </a>
            <a href="#faq" className="transition hover:text-[#0A4DFF]">
              Questions (FAQ)
            </a>
          </nav>

          {/* Right Controls: Language + Currency + Demo + Login + Free Trial */}
          <div className="hidden items-center gap-2 sm:flex">
            <select
              aria-label="Langue du site"
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value as AppLanguage)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-800"
            >
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.code.toUpperCase()}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => onChangeCurrency(currency === 'USD' ? 'FC' : 'USD')}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-extrabold text-slate-800 hover:bg-slate-100"
              title="Changer la devise d’affichage"
            >
              <Coins className="h-3.5 w-3.5 text-emerald-600" />
              <span>{currency}</span>
            </button>

            <button
              type="button"
              onClick={() => onEnterInteractiveDemo('dashboard')}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-800 transition hover:border-[#0A4DFF] hover:text-[#0A4DFF]"
            >
              Démo Live
            </button>

            <button
              type="button"
              onClick={() => onOpenAuthModal('login')}
              className="px-2.5 py-2 text-xs font-extrabold text-slate-700 transition hover:text-[#0A4DFF]"
            >
              Connexion
            </button>

            <button
              type="button"
              onClick={() => onOpenAuthModal('signup', 'pro_ai')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A4DFF] px-4 py-2.5 text-xs font-black text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
            >
              <span>Essai Gratuit</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Mobile Actions + Burger */}
          <div className="flex items-center gap-1.5 sm:hidden">
            <select
              aria-label="Langue"
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value as AppLanguage)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-1 text-[11px] font-extrabold text-slate-800"
            >
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => onOpenAuthModal('signup', 'pro_ai')}
              className="rounded-xl bg-[#0A4DFF] px-3 py-2 text-[11px] font-black text-white shadow-xs"
            >
              Essai Gratuit
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="rounded-xl border border-slate-200 p-2 text-slate-700"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="space-y-3 border-t border-slate-100 bg-white px-4 py-4 text-xs font-bold sm:hidden">
            <div className="flex flex-col space-y-2.5 text-slate-700">
              <a
                href="#avantages"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1"
              >
                Pourquoi ShopFlow
              </a>
              <a
                href="#fonctionnalites"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1"
              >
                Toutes les Fonctionnalités
              </a>
              <a
                href="#simulateur"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1"
              >
                Calculateur de Rentabilité
              </a>
              <a
                href="#tarifs"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1"
              >
                Tarifs & Abonnements
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1"
              >
                Questions Fréquentes (FAQ)
              </a>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onEnterInteractiveDemo('dashboard');
                }}
                className="rounded-xl border border-slate-300 py-2.5 text-center font-extrabold text-slate-900"
              >
                🎮 Ouvrir la Démo
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuthModal('login');
                }}
                className="rounded-xl bg-slate-900 py-2.5 text-center font-extrabold text-white"
              >
                Se Connecter
              </button>
            </div>
          </div>
        )}
      </header>

      {/* =====================================================================
          HERO SECTION — ABOVE THE FOLD CONVERSION ENGINE
         ===================================================================== */}
      <section
        id="top"
        className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-blue-50/35 to-white pt-10 pb-16 sm:pt-14 sm:pb-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Copy Column */}
            <div className="space-y-6 lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-extrabold text-[#0A4DFF]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>L’application tout-en-un pensée pour les vrais commerçants</span>
              </div>

              <h1 className="text-3xl leading-[1.12] font-black tracking-tight text-slate-950 sm:text-5xl">
                Encaissez en 1 clic, maîtrisez votre stock et voyez enfin votre{' '}
                <span className="text-[#0A4DFF]">vrai bénéfice net</span> chaque
                soir.
              </h1>

              <p className="max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Dites adieu aux cahiers perdus, aux ruptures surprises et aux
                erreurs de caisse. Avec <strong>ShopFlow</strong>, envoyez de
                superbes reçus professionnels sur <strong>WhatsApp</strong>,
                protégez vos chiffres avec le <strong>Mode Vendeur</strong> et
                pilotez votre boutique avec <strong>ShopFlow AI</strong> — même
                quand Internet coupe.
              </p>

              {/* Primary CTA Buttons */}
              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('signup', 'pro_ai')}
                  className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#0A4DFF] px-6 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/25 transition hover:scale-[1.01] hover:bg-blue-700"
                >
                  <span>Créer ma boutique gratuitement</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onEnterInteractiveDemo('dashboard')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-300 bg-white px-5 py-4 text-sm font-extrabold text-slate-900 transition hover:border-[#0A4DFF] hover:text-[#0A4DFF]"
                >
                  <Play className="h-4 w-4 fill-current text-[#0A4DFF]" />
                  <span>Tester l’Application en Direct</span>
                </button>
              </div>

              {/* Quick Secondary Actions: Install App + See Real Receipt */}
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('install')}
                  className="inline-flex items-center gap-1.5 text-slate-800 underline decoration-slate-300 underline-offset-4 hover:text-[#0A4DFF]"
                >
                  <Download className="h-4 w-4 text-emerald-600" />
                  <span>Installer l’App sur Android / iPhone</span>
                </button>

                <span>•</span>

                <button
                  type="button"
                  onClick={onPreviewRealWhatsAppReceipt}
                  className="inline-flex items-center gap-1.5 text-emerald-700 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-800"
                >
                  <ReceiptText className="h-4 w-4" />
                  <span>Voir un vrai exemple de Reçu WhatsApp</span>
                </button>
              </div>

              {/* Trust Micro-Guarantees */}
              <div className="grid grid-cols-3 gap-3 border-t border-slate-200/80 pt-5 text-xs">
                <div>
                  <p className="text-lg font-black text-slate-950 sm:text-xl">
                    7 Jours
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Essai 100 % gratuit
                  </p>
                </div>
                <div>
                  <p className="text-lg font-black text-emerald-600 sm:text-xl">
                    Hors-Ligne
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Marche même sans 4G
                  </p>
                </div>
                <div>
                  <p className="text-lg font-black text-[#0A4DFF] sm:text-xl">
                    5 Langues
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    FR • EN • LN • SW • ZH
                  </p>
                </div>
              </div>
            </div>

            {/* Right Interactive Product Showcase Column */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10 sm:p-5">
                {/* Merchant Lifestyle Photo Banner */}
                <div className="relative h-56 overflow-hidden rounded-2xl sm:h-64">
                  <img
                    src={LANDING_HERO_PHOTO}
                    alt="Commerçante utilisant ShopFlow dans sa boutique"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#081844]/85 via-[#081844]/20 to-transparent" />
                  <div className="absolute right-4 bottom-3.5 left-4 flex flex-wrap items-end justify-between gap-2 text-white">
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-black uppercase">
                        <Check className="h-3 w-3" /> En direct en boutique
                      </span>
                      <p className="mt-1 text-sm font-black sm:text-base">
                        Chaque vente met à jour votre stock & votre bénéfice instantanément
                      </p>
                    </div>
                  </div>
                </div>

                {/* Live Interactive Feature Switcher Inside Card */}
                <div className="mt-4">
                  <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100 p-1.5 text-[11px] font-extrabold sm:grid-cols-4">
                    {[
                      { id: 'profit', label: '📊 Gain Net' },
                      { id: 'receipt', label: '🧾 Reçu WhatsApp' },
                      { id: 'ai', label: '🤖 ShopFlow AI' },
                      { id: 'lock', label: '🔒 Mode Vendeur' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setHeroShowcaseTab(
                            t.id as 'profit' | 'receipt' | 'ai' | 'lock'
                          )
                        }
                        className={`rounded-xl py-2 transition ${
                          heroShowcaseTab === t.id
                            ? 'bg-white text-[#0A4DFF] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Interactive Preview Panel Body */}
                  <div className="mt-3 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 text-xs">
                    {heroShowcaseTab === 'profit' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-500">
                            Bilan automatique de votre journée
                          </span>
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
                            Zéro calcul manuel
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2.5">
                          <div className="rounded-xl bg-white p-3 shadow-2xs ring-1 ring-slate-200/70">
                            <p className="text-[10px] font-bold text-slate-400">
                              Chiffre d’Affaires
                            </p>
                            <p className="mt-1 text-sm font-black text-slate-900 tabular-nums">
                              485 000 FC
                            </p>
                          </div>
                          <div className="rounded-xl bg-white p-3 shadow-2xs ring-1 ring-slate-200/70">
                            <p className="text-[10px] font-bold text-slate-400">
                              Achat + Dépenses
                            </p>
                            <p className="mt-1 text-sm font-black text-amber-700 tabular-nums">
                              − 421 500 FC
                            </p>
                          </div>
                          <div className="rounded-xl bg-emerald-600 p-3 text-white shadow-xs">
                            <p className="text-[10px] font-bold text-emerald-100">
                              Vrai Bénéfice Net
                            </p>
                            <p className="mt-1 text-sm font-black tabular-nums">
                              + 63 500 FC
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {heroShowcaseTab === 'receipt' && (
                      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-900">
                            Reçu Graphique Professionnel sur WhatsApp
                          </p>
                          <p className="text-[11px] leading-relaxed text-slate-600">
                            Logo rond de votre boutique, photos miniatures des
                            articles, sous-total, livraison, cachet{' '}
                            <strong className="text-emerald-700">✓ PAYÉ</strong>{' '}
                            et export <strong>PNG HD / PDF</strong> en 1 clic.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={onPreviewRealWhatsAppReceipt}
                          className="shrink-0 rounded-xl bg-[#081844] px-4 py-2.5 font-extrabold text-white transition hover:bg-[#0A4DFF]"
                        >
                          Ouvrir le Reçu Réel →
                        </button>
                      </div>
                    )}

                    {heroShowcaseTab === 'ai' && (
                      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-900">
                            Votre Directeur Financier & Marketing IA 24h/24
                          </p>
                          <p className="text-[11px] leading-relaxed text-slate-600">
                            Posez vos questions par écrit ou par voix :{' '}
                            <em>
                              « Quel article me rapporte le plus ? », « Écris une
                              pub WhatsApp promo »
                            </em>{' '}
                            — avec formules claires et 6 voix naturelles.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onEnterInteractiveDemo('ai')}
                          className="shrink-0 rounded-xl bg-[#0A4DFF] px-4 py-2.5 font-extrabold text-white"
                        >
                          Essayer ShopFlow AI →
                        </button>
                      </div>
                    )}

                    {heroShowcaseTab === 'lock' && (
                      <div className="space-y-1.5">
                        <p className="font-extrabold text-slate-900">
                          🔒 Mode Vendeur protégé par Code PIN Patron
                        </p>
                        <p className="text-[11px] leading-relaxed text-slate-600">
                          Laissez votre caissier vendre en toute sérénité : il
                          encaisse les clients et imprime les reçus, mais{' '}
                          <strong>
                            vos bénéfices nets et vos prix d’achat fournisseurs
                            restent 100 % verrouillés
                          </strong>{' '}
                          sans votre code secret à 4 chiffres !
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          BEFORE VS AFTER SHOPFLOW — PERSUASION COMPARISON SECTION
         ===================================================================== */}
      <section id="avantages" className="border-y border-slate-100 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-black tracking-widest text-[#0A4DFF] uppercase">
              La différence dès le premier jour
            </span>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Arrêtez de vendre à l’aveugle. Prenez le contrôle total de votre commerce.
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* WITHOUT SHOPFLOW */}
            <div className="rounded-3xl border border-red-200/80 bg-red-50/40 p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-800">
                <XCircle className="h-4 w-4" />
                <span>Sans ShopFlow (Cahier papier & calculatrice)</span>
              </div>

              <ul className="mt-6 space-y-4 text-xs sm:text-sm">
                {[
                  'Confusion permanente entre l’argent en caisse (Chiffre d’Affaires) et le vrai bénéfice réel.',
                  'Pertes invisibles dans le stock, oublis d’articles vendus et ruptures surprises devant les clients.',
                  'Dettes clients (« bons ») éparpillées sur des bouts de papier jamais remboursés.',
                  'Impossible de confier la boutique à un employé sans craindre les erreurs de prix.',
                  'Petits reçus papier brouillons qui ne valorisent pas l’image sérieuse de votre boutique.',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-700">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* WITH SHOPFLOW PRO */}
            <div className="rounded-3xl border-2 border-[#0A4DFF] bg-gradient-to-br from-blue-50/60 via-white to-emerald-50/40 p-6 shadow-xl shadow-blue-900/5 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0A4DFF] px-3.5 py-1 text-xs font-black text-white">
                <CheckCircle2 className="h-4 w-4" />
                <span>Avec ShopFlow Pro (Tout automatisé en 1 seconde)</span>
              </div>

              <ul className="mt-6 space-y-4 text-xs font-medium sm:text-sm">
                {[
                  'Calcul instantané au centime près : Ventes − Prix d’achat − Dépenses = Votre Vrai Gain Net.',
                  'Stock déduit automatiquement à chaque vente + alerte immédiate avant la rupture.',
                  'Cahier de Crédits intelligent avec relance WhatsApp polie envoyée au client en 1 clic.',
                  'Mode Vendeur sécurisé par Code PIN Patron : vos employés vendent sans voir vos secrets.',
                  'Reçus WhatsApp HD dignes d’une grande enseigne internationale avec votre propre logo.',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-900">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          8-PILLAR FEATURE SHOWCASE BENTO GRID
         ===================================================================== */}
      <section id="fonctionnalites" className="bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-black tracking-widest text-[#0A4DFF] uppercase">
              8 Outils Puissants en 1 Seule Application
            </span>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Tout ce dont votre boutique a besoin pour grandir vite
            </h2>
            <p className="mt-3 text-xs text-slate-600 sm:text-sm">
              Simple à prendre en main en 2 minutes, même sans aucune compétence
              informatique.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: BarChart3,
                color: 'bg-blue-600',
                title: 'Vrai Bénéfice Net Live',
                desc: 'Suivez en temps réel votre chiffre d’affaires, le coût d’achat des marchandises vendues, vos charges du jour et votre bénéfice net réel.',
              },
              {
                icon: ReceiptText,
                color: 'bg-emerald-600',
                title: 'Reçus WhatsApp Pro HD',
                desc: 'Générez en 1 clic de superbes reçus graphiques personnalisés (PNG & PDF) avec votre logo, votre slogan et vos coordonnées.',
              },
              {
                icon: Bot,
                color: 'bg-indigo-600',
                title: 'ShopFlow AI & Voix Naturelle',
                desc: 'Posez vos questions financières ou marketing et écoutez les réponses claires avec 6 voix au choix, sans aucun jargon technique.',
              },
              {
                icon: ScanBarcode,
                color: 'bg-sky-600',
                title: 'Scanner Photo & Code-Barres',
                desc: 'Scannez n’importe quel code-barres, QR code ou photographiez simplement un produit sans code-barres pour l’identifier et l’encaisser.',
              },
              {
                icon: Lock,
                color: 'bg-amber-600',
                title: 'Cadenas Patron / Mode Vendeur',
                desc: 'Protégez vos bénéfices nets et vos prix fournisseurs par un code secret à 4 chiffres lorsque votre caissier tient le comptoir.',
              },
              {
                icon: Globe,
                color: 'bg-purple-600',
                title: 'Boutique en Ligne WhatsApp',
                desc: 'Partagez le lien de votre catalogue digital sur WhatsApp, Facebook et TikTok : vos clients commandent en 2 clics depuis leur téléphone.',
              },
              {
                icon: BookOpenCheck,
                color: 'bg-rose-600',
                title: 'Cahier de Crédits (« Bons »)',
                desc: 'Notez chaque vente à crédit, suivez les avances versées et envoyez un rappel WhatsApp propre et respectueux en 1 clic.',
              },
              {
                icon: WifiOff,
                color: 'bg-teal-600',
                title: 'Hors-Ligne + Thème Sur Mesure',
                desc: 'Personnalisez les couleurs et le mode clair/sombre de votre boutique, et vendez sans interruption même sans réseau Internet.',
              },
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs transition hover:-translate-y-1 hover:border-[#0A4DFF] hover:shadow-lg"
                >
                  <div>
                    <div
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${feat.color} text-white shadow-xs`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-sm font-black text-slate-950 sm:text-base">
                      {feat.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual Strip of Real Store Products Inside ShopFlow */}
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-base font-black text-slate-950">
                  Adapté à 100 % des commerces et devises (FC ou $ USD)
                </h3>
                <p className="text-xs text-slate-500">
                  Alimentation • Prêt-à-porter • Cosmétique • Électronique •
                  Pharmacie • Boissons & Dépôts
                </p>
              </div>
              <button
                type="button"
                onClick={() => onEnterInteractiveDemo('pos')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0A4DFF] px-4 py-2.5 text-xs font-extrabold text-white"
              >
                <span>Tester la Caisse Rapide 1 Clic</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {INITIAL_PRODUCTS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onEnterInteractiveDemo('pos')}
                  className="cursor-pointer rounded-2xl border border-slate-100 bg-slate-50 p-2 text-center transition hover:border-[#0A4DFF]"
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="mx-auto h-16 w-full rounded-xl object-cover"
                  />
                  <p className="mt-1.5 truncate text-[10px] font-extrabold text-slate-800">
                    {p.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          INTERACTIVE ROI / PROFIT RECOVERY SIMULATOR
         ===================================================================== */}
      <section id="simulateur" className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[#081844] p-6 text-white shadow-2xl sm:p-10">
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
              <div className="space-y-4 md:col-span-7">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold text-sky-300">
                  <Calculator className="h-3.5 w-3.5" />
                  <span>Simulateur de Rentabilité Boutique</span>
                </span>
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                  Combien ShopFlow vous fait-il économiser chaque mois ?
                </h2>
                <p className="text-xs leading-relaxed text-sky-100/85 sm:text-sm">
                  En éliminant les oublis de crédits clients, les erreurs de
                  monnaie, les écarts de stock et le temps perdu à recompter les
                  cahiers chaque soir :
                </p>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span>Nombre moyen de ventes par jour :</span>
                    <span className="rounded-lg bg-[#0A4DFF] px-3 py-1 text-sm font-black">
                      {dailySalesSlider} ventes / jour
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={150}
                    step={5}
                    value={dailySalesSlider}
                    onChange={(e) =>
                      setDailySalesSlider(parseInt(e.target.value, 10))
                    }
                    className="mt-3 h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-[#0A4DFF]"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-sky-200/70">
                    <span>Petite boutique (5/j)</span>
                    <span>Commerce actif (50/j)</span>
                    <span>Grand point de vente (150/j)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl bg-white p-6 text-slate-900 md:col-span-5">
                <p className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                  Impact estimé pour votre boutique
                </p>
                <div>
                  <p className="text-3xl font-black text-emerald-600 tabular-nums sm:text-4xl">
                    + {formatPriceUSD(monthlyRecoveredUSD)}
                  </p>
                  <p className="text-xs font-bold text-slate-600">
                    de pertes et d’oublis récupérés / mois
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xl font-black text-[#0A4DFF] tabular-nums">
                    {hoursSavedPerMonth} heures gagnées / mois
                  </p>
                  <p className="text-xs text-slate-500">
                    sur vos comptes du soir et vos inventaires
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenAuthModal('signup', 'pro_ai')}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A4DFF] py-3 text-xs font-black text-white shadow-md transition hover:bg-blue-700"
                >
                  <span>Récupérer mes bénéfices dès aujourd’hui</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3 SIMPLE STEPS HOW IT WORKS + MERCHANT TESTIMONIALS
         ===================================================================== */}
      <section className="bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-black tracking-widest text-[#0A4DFF] uppercase">
              Ultra-Rapide
            </span>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Prêt à vendre en moins de 60 secondes
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Créez votre boutique',
                desc: 'Entrez le nom de votre commerce, importez votre logo et choisissez votre devise (FC ou USD). 7 jours offerts immédiatement.',
              },
              {
                step: '02',
                title: 'Ajoutez ou scannez vos articles',
                desc: 'Indiquez vos prix d’achat, vos prix de vente et vos quantités en stock — ou prenez simplement vos produits en photo !',
              },
              {
                step: '03',
                title: 'Encaissez & voyez vos vrais gains',
                desc: 'Un clic par vente, un reçu WhatsApp impeccable pour le client, et votre vrai bénéfice net affiché en direct chaque soir.',
              },
            ].map((s, idx) => (
              <div
                key={idx}
                className="relative rounded-3xl border border-slate-200 bg-white p-6"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-[#0A4DFF]">
                  {s.step}
                </span>
                <h3 className="mt-4 text-base font-black text-slate-950">
                  {s.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Merchant Testimonials */}
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  '« Avant ShopFlow, je voyais beaucoup d’argent passer mais je ne savais jamais mon vrai bénéfice le soir. Maintenant, en 2 secondes je vois exactement ce que j’ai gagné net ! »',
                author: 'Maman Grâce K.',
                role: 'Alimentation & Dépôt — Kinshasa',
              },
              {
                quote:
                  '« Mes clients adorent recevoir leur reçu avec le logo de ma boutique directement sur WhatsApp ! Ça donne une image hyper sérieuse et les clients reviennent commander. »',
                author: 'Merdi B.',
                role: 'Boutique Mode & Accessoires — Lubumbashi',
              },
              {
                quote:
                  '« Le Mode Vendeur avec Code PIN m’a sauvé la vie : mes deux vendeurs encaissent toute la journée sans jamais voir mes prix d’achat fournisseurs. »',
                author: 'Patrick M.',
                role: 'Électronique & Téléphonie — Brazzaville',
              },
            ].map((t, i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs"
              >
                <div>
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-700 italic sm:text-sm">
                    {t.quote}
                  </p>
                </div>
                <div className="mt-5 border-t border-slate-100 pt-3">
                  <p className="text-xs font-black text-slate-950">{t.author}</p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {t.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          TRANSPARENT PRICING SECTION (MONTHLY / ANNUAL + MOBILE MONEY & CARD)
         ===================================================================== */}
      <section id="tarifs" className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-black tracking-widest text-[#0A4DFF] uppercase">
              Tarifs Simples & Rentables dès la 1ère Semaine
            </span>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Choisissez la formule adaptée à votre commerce
            </h2>

            {/* Billing Cycle + Currency Switcher */}
            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 text-xs font-extrabold">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`rounded-xl px-4 py-2 transition ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-500'
                }`}
              >
                Paiement Mensuel
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`rounded-xl px-4 py-2 transition ${
                  billingCycle === 'annual'
                    ? 'bg-[#0A4DFF] text-white shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Annuel (−20 % d’économie)
              </button>
              <button
                type="button"
                onClick={() => onChangeCurrency(currency === 'USD' ? 'FC' : 'USD')}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-emerald-700"
              >
                Afficher en {currency === 'USD' ? 'FC' : '$ USD'}
              </button>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {[
              {
                id: 'starter' as SubscriptionPlanId,
                name: 'Starter Boutique',
                badge: 'Idéal pour démarrer',
                monthlyUSD: 4.99,
                popular: false,
                features: [
                  'Caisse rapide 1 clic & Stock illimité',
                  'Calcul automatique du Vrai Bénéfice Net',
                  'Reçus WhatsApp Pro personnalisés (PNG & PDF)',
                  'Mode Vendeur protégé par Code PIN Patron',
                  'Fonctionnement 100 % Hors-Ligne + Cloud',
                ],
              },
              {
                id: 'pro_ai' as SubscriptionPlanId,
                name: 'ShopFlow Pro + IA',
                badge: '⭐ Le plus choisi par les commerçants',
                monthlyUSD: 9.99,
                popular: true,
                features: [
                  'Tout le pack Starter Boutique inclus',
                  'ShopFlow AI illimité (Bilans, Conseils & 6 Voix)',
                  'Scanner Photo Intelligent (Codes-barres & Objets)',
                  'Boutique en ligne WhatsApp pour vos clients',
                  'Cahier de Crédits clients & Relance WhatsApp 1 clic',
                  'Traduction intégrale en 5 langues',
                ],
              },
              {
                id: 'business_multi' as SubscriptionPlanId,
                name: 'Business Multi-Boutiques',
                badge: 'Dépôts, Superettes & Chaînes',
                monthlyUSD: 19.99,
                popular: false,
                features: [
                  'Tout ShopFlow Pro + IA inclus',
                  'Jusqu’à 5 boutiques / dépôts sur un seul compte',
                  'Accès multi-vendeurs simultanés sur plusieurs téléphones',
                  'Rapports financiers consolidés & export comptable',
                  'Accompagnement & Support VIP WhatsApp Prioritaire',
                ],
              },
            ].map((plan) => {
              const unitUSD =
                billingCycle === 'annual'
                  ? Number((plan.monthlyUSD * 0.8).toFixed(2))
                  : plan.monthlyUSD;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-3xl p-7 ${
                    plan.popular
                      ? 'border-2 border-[#0A4DFF] bg-white shadow-2xl shadow-blue-600/15'
                      : 'border border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[11px] font-extrabold ${
                        plan.popular
                          ? 'bg-[#0A4DFF] text-white'
                          : 'bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      {plan.badge}
                    </span>

                    <h3 className="mt-4 text-xl font-black text-slate-950">
                      {plan.name}
                    </h3>

                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-slate-950 tabular-nums sm:text-4xl">
                        {formatPriceUSD(unitUSD)}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        / mois
                      </span>
                    </div>

                    <ul className="mt-6 space-y-3 text-xs font-medium text-slate-700">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenAuthModal('signup', plan.id)}
                    className={`mt-8 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-black transition ${
                      plan.popular
                        ? 'bg-[#0A4DFF] text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>Essayer 7 jours gratuitement</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Accepted Payment Methods Strip */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-xs font-extrabold text-slate-700">
            <span className="inline-flex items-center gap-1.5 text-slate-900">
              <CreditCard className="h-4 w-4 text-[#0A4DFF]" />
              Paiements acceptés partout :
            </span>
            {[
              '📱 M-Pesa',
              '🟠 Orange Money',
              '🔴 Airtel Money',
              '🟣 Afrimoney',
              '💳 Carte Visa',
              '💳 Mastercard',
            ].map((pm, idx) => (
              <span
                key={idx}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] shadow-2xs"
              >
                {pm}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          FAQ SECTION
         ===================================================================== */}
      <section id="faq" className="bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-black tracking-widest text-[#0A4DFF] uppercase">
              Questions Fréquentes
            </span>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Tout savoir avant de lancer votre boutique
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={idx}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-xs font-extrabold text-slate-900 sm:text-sm"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                        isOpen ? 'rotate-180 text-[#0A4DFF]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-100 px-5 py-4 text-xs leading-relaxed text-slate-600">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          FINAL CTA BANNER + DOWNLOAD ANDROID / IPHONE / WEB
         ===================================================================== */}
      <section className="bg-[#081844] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <img
            src={SHOPFLOW_APP_LOGO}
            alt="ShopFlow"
            className="mx-auto h-16 w-16 rounded-2xl bg-white p-1.5 object-contain shadow-xl"
          />
          <h2 className="mt-6 text-2xl font-black tracking-tight sm:text-4xl">
            Prêt à transformer la gestion de votre boutique dès aujourd’hui ?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-sky-100/85 sm:text-base">
            Créez votre compte gratuit en 30 secondes sur téléphone Android,
            iPhone, tablette ou ordinateur.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => onOpenAuthModal('signup', 'pro_ai')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A4DFF] px-7 py-4 text-sm font-black text-white shadow-xl transition hover:bg-blue-500"
            >
              <Zap className="h-4 w-4" />
              <span>Créer ma Boutique Gratuitement</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenAuthModal('install')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-6 py-4 text-sm font-extrabold text-white transition hover:bg-white/20"
            >
              <Smartphone className="h-4 w-4" />
              <span>Installer l’App (Android & iPhone)</span>
            </button>

            <button
              type="button"
              onClick={() => onEnterInteractiveDemo('dashboard')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-extrabold text-white transition hover:bg-emerald-500"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Voir la Démo Interactive</span>
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          FOOTER OFFICIEL SHOPFLOW
         ===================================================================== */}
      <footer className="border-t border-slate-200 bg-white py-10 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src={SHOPFLOW_APP_LOGO}
              alt="ShopFlow"
              className="h-9 w-9 rounded-xl object-contain ring-1 ring-slate-200"
            />
            <div>
              <p className="font-black text-slate-900">
                Shop<span className="text-[#0A4DFF]">Flow</span> Pro
              </p>
              <p className="text-[11px]">
                Solution moderne de Caisse, Stock, Reçus WhatsApp & IA Commerciale
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-5 font-bold text-slate-600">
            <button
              type="button"
              onClick={() => onEnterInteractiveDemo('dashboard')}
              className="hover:text-[#0A4DFF]"
            >
              Démo en ligne
            </button>
            <button
              type="button"
              onClick={onPreviewRealWhatsAppReceipt}
              className="hover:text-[#0A4DFF]"
            >
              Modèle de Reçu
            </button>
            <button
              type="button"
              onClick={() => onOpenAuthModal('signup', 'pro_ai')}
              className="hover:text-[#0A4DFF]"
            >
              Créer un compte
            </button>
            <button
              type="button"
              onClick={() => onOpenAuthModal('login')}
              className="hover:text-[#0A4DFF]"
            >
              Connexion
            </button>
          </div>

          <p className="text-[11px]">
            © {new Date().getFullYear()} ShopFlow. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};
