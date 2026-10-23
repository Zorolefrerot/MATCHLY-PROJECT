import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Download,
  Lock,
  Menu,
  Play,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Sparkles,
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
  onEnterInteractiveDemo: (
    initialTab?: 'dashboard' | 'pos' | 'ai' | 'subscription'
  ) => void;
  onPreviewRealWhatsAppReceipt: () => void;
}

const SIMPLE_FAQS = [
  {
    q: 'Est-ce que ShopFlow fonctionne sans connexion Internet ?',
    a: 'Oui. Vous vendez et gérez votre stock normalement hors-ligne toute la journée. Dès que la connexion revient, tout est sauvegardé automatiquement dans le Cloud.',
  },
  {
    q: 'Que se passe-t-il si je perds ou change mon téléphone ?',
    a: 'Rien n’est perdu. Connectez-vous simplement à votre compte sur un nouveau téléphone ou un ordinateur pour retrouver tout votre stock, vos ventes et vos clients.',
  },
  {
    q: 'Mon vendeur peut-il encaisser sans voir mes bénéfices ?',
    a: 'Oui. Le Mode Vendeur verrouille vos bénéfices nets, vos prix d’achat fournisseurs et vos réglages derrière votre code PIN personnel à 4 chiffres.',
  },
  {
    q: 'Comment payer l’abonnement en RDC ou à l’étranger ?',
    a: 'Directement depuis l’application par Mobile Money (M-Pesa, Orange Money, Airtel Money, Afrimoney) ou par carte bancaire Visa et Mastercard.',
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
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const fmtPlanPrice = (usd: number) => {
    if (currency === 'USD') return `${usd} $`;
    const fc = Math.round((usd * usdRateFC) / 500) * 500;
    return `${fc.toLocaleString('fr-FR')} FC`;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased selection:bg-[#0A4DFF] selection:text-white">
      {/* =====================================================================
          1. CLEAN PRO NAVBAR (Pure, Minimal, Zero Clutter)
         ===================================================================== */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Brand */}
          <a href="#top" className="flex items-center gap-2.5">
            <img
              src={SHOPFLOW_APP_LOGO}
              alt="ShopFlow"
              className="h-9 w-9 rounded-xl object-contain ring-1 ring-slate-200/80 sm:h-10 sm:w-10"
            />
            <span className="text-lg font-black tracking-tight text-slate-950 sm:text-xl">
              Shop<span className="text-[#0A4DFF]">Flow</span>
            </span>
          </a>

          {/* Clean Center Links */}
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#solutions" className="transition hover:text-slate-950">
              Fonctionnalités
            </a>
            <a href="#etapes" className="transition hover:text-slate-950">
              Comment ça marche
            </a>
            <a href="#tarifs" className="transition hover:text-slate-950">
              Tarifs
            </a>
            <a href="#faq" className="transition hover:text-slate-950">
              FAQ
            </a>
          </nav>

          {/* Clean Right Actions */}
          <div className="hidden items-center gap-4 md:flex">
            <button
              type="button"
              onClick={() => onOpenAuthModal('login')}
              className="text-sm font-semibold text-slate-700 transition hover:text-[#0A4DFF]"
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => onOpenAuthModal('signup', 'pro_ai')}
              className="rounded-full bg-[#0A4DFF] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-blue-700"
            >
              Essai gratuit
            </button>
          </div>

          {/* Mobile Right */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => onOpenAuthModal('signup', 'pro_ai')}
              className="rounded-full bg-[#0A4DFF] px-4 py-2 text-xs font-bold text-white"
            >
              Essai gratuit
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="rounded-xl p-2 text-slate-700 hover:bg-slate-100"
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

        {/* Clean Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-100 bg-white px-5 py-5 md:hidden">
            <div className="flex flex-col space-y-3.5 text-sm font-semibold text-slate-700">
              <a href="#solutions" onClick={() => setMobileMenuOpen(false)}>
                Fonctionnalités
              </a>
              <a href="#etapes" onClick={() => setMobileMenuOpen(false)}>
                Comment ça marche
              </a>
              <a href="#tarifs" onClick={() => setMobileMenuOpen(false)}>
                Tarifs
              </a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)}>
                Questions fréquentes
              </a>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onEnterInteractiveDemo('dashboard');
                }}
                className="rounded-xl border border-slate-200 py-2.5 text-slate-800"
              >
                Voir la démo
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuthModal('login');
                }}
                className="rounded-xl bg-slate-900 py-2.5 text-white"
              >
                Connexion
              </button>
            </div>
          </div>
        )}
      </header>

      {/* =====================================================================
          2. CLEAN, SPACIOUS PRO HERO SECTION
         ===================================================================== */}
      <section id="top" className="py-14 sm:py-22">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Copy */}
            <div className="space-y-6 lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-[#0A4DFF]">
                <span className="h-2 w-2 rounded-full bg-[#0A4DFF]" />
                <span>Application de gestion commerciale N°1</span>
              </div>

              <h1 className="text-4xl leading-[1.1] font-black tracking-tight text-slate-950 sm:text-5xl lg:text-[54px]">
                Toute votre boutique dans votre téléphone.
              </h1>

              <p className="max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">
                Enregistrez vos ventes en un clic, suivez votre stock en direct,
                envoyez des reçus propres sur WhatsApp et connaissez votre{' '}
                <strong className="font-bold text-slate-900">
                  vrai bénéfice net
                </strong>{' '}
                chaque soir.
              </p>

              {/* Two Clean Buttons Only */}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('signup', 'pro_ai')}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0A4DFF] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  <span>Commencer gratuitement (7 jours)</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onEnterInteractiveDemo('dashboard')}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-4 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <Play className="h-3.5 w-3.5 fill-current text-[#0A4DFF]" />
                  <span>Tester la démo</span>
                </button>
              </div>

              <p className="text-xs font-medium text-slate-500">
                Fonctionne sur Android, iPhone et Ordinateur • Avec ou sans
                connexion Internet
              </p>
            </div>

            {/* Right Clean Visual Card + Floating Live Profit Pill */}
            <div className="relative lg:col-span-6">
              <div className="overflow-hidden rounded-3xl bg-slate-100 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5">
                <img
                  src={LANDING_HERO_PHOTO}
                  alt="Commerçante utilisant ShopFlow en boutique"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>

              {/* Clean Floating Summary Card (Maxicash / Wave / Djamo Style) */}
              <div className="mt-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xl sm:absolute sm:-bottom-6 sm:left-6 sm:mt-0 sm:w-80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Bénéfice net aujourd’hui
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    +18,4 %
                  </span>
                </div>
                <p className="mt-1 text-2xl font-black tracking-tight text-slate-950 tabular-nums">
                  + 63 500 FC
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Stock à jour • 14 reçus WhatsApp envoyés
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. CLEAN PAYMENT ECOSYSTEM BAR (Subtle & Trusted in DRC)
         ===================================================================== */}
      <section className="border-y border-slate-100 bg-slate-50/70 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <p className="text-xs font-semibold text-slate-500">
            Paiements simples partout en RDC & à l’international :
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-extrabold tracking-tight text-slate-700 sm:text-sm">
            <span>M-Pesa</span>
            <span className="text-slate-300">•</span>
            <span>Orange Money</span>
            <span className="text-slate-300">•</span>
            <span>Airtel Money</span>
            <span className="text-slate-300">•</span>
            <span>Afrimoney</span>
            <span className="text-slate-300">•</span>
            <span>Visa & Mastercard</span>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. THREE CLEAR PILLARS ONLY (Clean, Breathable, Easy to Read)
         ===================================================================== */}
      <section id="solutions" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Conçu pour aller droit à l’essentiel.
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Simple à utiliser dès la première minute, pour tout type de
              boutique, alimentation, pharmacie, mode ou dépôt.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Pillar 1 */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-8 transition hover:border-slate-300 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0A4DFF]">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-950">
                Ventes, Stock & Vrai Bénéfice
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Encaissez en un clic ou scannez vos produits en photo. ShopFlow
                déduit automatiquement le stock, vos prix d’achat et vos
                dépenses pour afficher votre vrai gain net.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-8 transition hover:border-slate-300 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ReceiptText className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-950">
                Reçus WhatsApp & Cahier de Crédits
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Envoyez en 1 seconde un reçu professionnel portant votre logo
                sur WhatsApp, et suivez facilement les crédits clients sans plus
                jamais oublier une dette.
              </p>
              <button
                type="button"
                onClick={onPreviewRealWhatsAppReceipt}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#0A4DFF] hover:underline"
              >
                <span>Voir un exemple de reçu</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-8 transition hover:border-slate-300 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-950">
                Protection Anti-Coulage & Assistant IA
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Confiez sereinement le téléphone à votre vendeur grâce au code
                PIN Patron, et posez vos questions à ShopFlow AI par écrit ou
                par la voix.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. HOW IT WORKS IN 3 SIMPLE STEPS
         ===================================================================== */}
      <section id="etapes" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Démarrez en 2 minutes
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                num: '1',
                title: 'Créez votre boutique',
                text: 'Indiquez le nom de votre commerce, ajoutez votre logo et choisissez votre devise (FC ou USD).',
              },
              {
                num: '2',
                title: 'Enregistrez vos produits',
                text: 'Ajoutez vos articles avec leurs quantités, prix d’achat et prix de vente.',
              },
              {
                num: '3',
                title: 'Vendez en toute simplicité',
                text: 'Encaissez vos clients, partagez les reçus WhatsApp et suivez vos gains en direct.',
              },
            ].map((step) => (
              <div key={step.num} className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A4DFF] text-sm font-black text-white">
                  {step.num}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. CLEAN, DIRECT PRICING (Exact RDC Pro Standard: 5$ / 12$ / 25$)
         ===================================================================== */}
      <section id="tarifs" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Des tarifs clairs, sans engagement.
              </h2>
              <p className="mt-2 text-base text-slate-600">
                7 jours d’essai gratuit sur toutes les formules.
              </p>
            </div>

            {/* Clean Single Currency Switch */}
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => onChangeCurrency('USD')}
                className={`rounded-full px-4 py-1.5 transition ${
                  currency === 'USD'
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-600'
                }`}
              >
                Dollars ($ USD)
              </button>
              <button
                type="button"
                onClick={() => onChangeCurrency('FC')}
                className={`rounded-full px-4 py-1.5 transition ${
                  currency === 'FC'
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-600'
                }`}
              >
                Francs (FC)
              </button>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {[
              {
                id: 'starter' as SubscriptionPlanId,
                name: 'Starter',
                desc: 'Pour une petite boutique qui démarre.',
                usd: 5,
                highlight: false,
                perks: [
                  'Caisse rapide & suivi du stock',
                  'Calcul automatique du bénéfice net',
                  'Reçus clients sur WhatsApp',
                  'Fonctionnement hors-ligne',
                ],
              },
              {
                id: 'pro_ai' as SubscriptionPlanId,
                name: 'ShopFlow Pro',
                desc: 'Le choix N°1 des commerçants ambitieux.',
                usd: 12,
                highlight: true,
                perks: [
                  'Articles et ventes illimités',
                  'Assistant ShopFlow AI & Voix inclus',
                  'Scanner photo & boutique en ligne WhatsApp',
                  'Mode Vendeur (PIN) & Cahier de crédits',
                ],
              },
              {
                id: 'business' as SubscriptionPlanId,
                name: 'Business',
                desc: 'Pour plusieurs boutiques, dépôts et gérants.',
                usd: 25,
                highlight: false,
                perks: [
                  'Jusqu’à 5 boutiques sur un même compte',
                  'Plusieurs téléphones synchronisés en direct',
                  'Suivi complet par vendeur / gérant',
                  'Assistance prioritaire WhatsApp 7j/7',
                ],
              },
            ].map((plan) => (
              <div
                key={plan.id}
                className={`flex flex-col justify-between rounded-3xl p-8 ${
                  plan.highlight
                    ? 'border-2 border-[#0A4DFF] bg-white shadow-xl shadow-blue-600/10'
                    : 'border border-slate-200 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-950">
                      {plan.name}
                    </h3>
                    {plan.highlight && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-[#0A4DFF]">
                        <Sparkles className="h-3 w-3" /> Populaire
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{plan.desc}</p>

                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span className="text-4xl font-black tracking-tight text-slate-950 tabular-nums">
                      {fmtPlanPrice(plan.usd)}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      / mois
                    </span>
                  </div>

                  <ul className="mt-7 space-y-3 border-t border-slate-100 pt-6 text-sm text-slate-700">
                    {plan.perks.map((perk, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0A4DFF]" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenAuthModal('signup', plan.id)}
                  className={`mt-8 w-full rounded-full py-3.5 text-sm font-bold transition ${
                    plan.highlight
                      ? 'bg-[#0A4DFF] text-white hover:bg-blue-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  Essayer gratuitement
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          7. SHORT, CLEAR FAQ (4 Essential Questions)
         ===================================================================== */}
      <section id="faq" className="border-t border-slate-100 bg-slate-50/70 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-black tracking-tight text-slate-950">
            Questions fréquentes
          </h2>

          <div className="mt-10 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white px-6">
            {SIMPLE_FAQS.map((item, idx) => {
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
      </section>

      {/* =====================================================================
          8. CLEAN DARK NAVY CALL-TO-ACTION + MINIMAL FOOTER
         ===================================================================== */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-3xl bg-[#081844] px-6 py-14 text-center text-white sm:px-12">
            <h2 className="mx-auto max-w-2xl text-2xl font-black tracking-tight sm:text-4xl">
              Passez dès aujourd’hui à une gestion propre et moderne.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-sky-100/80 sm:text-base">
              Créez votre boutique en moins d’une minute. 7 jours d’essai
              gratuit, sans carte bancaire requise.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => onOpenAuthModal('signup', 'pro_ai')}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0A4DFF] px-7 py-4 text-sm font-bold text-white transition hover:bg-blue-500"
              >
                <span>Créer mon compte gratuit</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => onOpenAuthModal('install')}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-4 text-sm font-bold text-white transition hover:bg-white/20"
              >
                <Download className="h-4 w-4" />
                <span>Installer sur Android / iPhone</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Minimal Footer with Language Switch tucked discreetly at bottom */}
      <footer className="border-t border-slate-100 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-xs text-slate-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <img
              src={SHOPFLOW_APP_LOGO}
              alt="ShopFlow"
              className="h-8 w-8 rounded-lg object-contain ring-1 ring-slate-200"
            />
            <span className="font-bold text-slate-900">
              ShopFlow • Kinshasa, RDC & International
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => onEnterInteractiveDemo('dashboard')}
              className="hover:text-[#0A4DFF]"
            >
              Démo
            </button>
            <button
              type="button"
              onClick={() => onOpenAuthModal('login')}
              className="hover:text-[#0A4DFF]"
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => onOpenAuthModal('install')}
              className="inline-flex items-center gap-1 hover:text-[#0A4DFF]"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Application Mobile</span>
            </button>
            <select
              aria-label="Langue"
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value as AppLanguage)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700"
            >
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.nativeLabel}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>© {new Date().getFullYear()} ShopFlow</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
