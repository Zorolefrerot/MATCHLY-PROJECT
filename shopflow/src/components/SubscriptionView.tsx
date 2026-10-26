import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Crown,
  Sparkles,
  X,
} from 'lucide-react';
import { ShopSettings, SubscriptionPlanId } from '../types';

interface SubscriptionViewProps {
  settings: ShopSettings;
  onActivatePlan: (planId: SubscriptionPlanId, methodLabel: string) => void;
}

interface PlanOption {
  id: SubscriptionPlanId;
  name: string;
  badge?: string;
  monthlyUSD: number;
  subtitle: string;
  features: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const TRIAL_DAYS = 7;

const PLANS: PlanOption[] = [
  {
    id: 'starter',
    name: 'Starter Boutique',
    monthlyUSD: 5,
    subtitle: 'Pour démarrer avec les outils essentiels.',
    features: [
      'Jusqu’à 50 marchandises avec photos',
      'Vente rapide « +1 Vendu » et panier client',
      'Calcul automatique du chiffre d’affaires et revenu net',
      'Mode hors ligne',
      'Résumé journalier partageable sur WhatsApp',
    ],
  },
  {
    id: 'pro_ai',
    name: 'Pro IA & Croissance',
    badge: 'LE PLUS CHOISI',
    monthlyUSD: 12,
    subtitle: 'Pour élargir la gestion et utiliser l’assistant IA.',
    features: [
      'Marchandises et ventes sans plafond annoncé',
      'Assistant IA Coach et caisse vocale (usage soumis à disponibilité)',
      'Scanner de code-barres avec la caméra',
      'Mini-boutique en ligne avec commandes WhatsApp',
      'Carnet de crédits clients et outils de relance',
      'Support prioritaire WhatsApp, 7 j/7',
    ],
  },
  {
    id: 'business',
    name: 'Business Multi-Boutiques',
    monthlyUSD: 25,
    subtitle: 'Pour les propriétaires de plusieurs boutiques ou dépôts.',
    features: [
      'Gestion de plusieurs boutiques ou dépôts',
      'Comptes vendeurs et gérants séparés',
      'Assistant IA pour le suivi des stocks multi-boutiques',
      'Export comptable PDF et Excel',
      'Accompagnement dédié à Kinshasa et Lubumbashi',
    ],
  },
];

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({
  settings,
  onActivatePlan,
}) => {
  const [checkoutPlan, setCheckoutPlan] = useState<PlanOption | null>(null);
  const [activationDone, setActivationDone] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const startTime = Date.parse(settings.trialStartedAt || '');
  const hasTrial = Number.isFinite(startTime);
  const trialEndsAt = hasTrial ? startTime + TRIAL_DAYS * DAY_MS : 0;
  const trialExpired = hasTrial && Date.now() >= trialEndsAt && !settings.planPaid;
  const remainingDays = hasTrial
    ? Math.max(0, Math.ceil((trialEndsAt - Date.now()) / DAY_MS))
    : TRIAL_DAYS;

  const getPriceDisplay = (monthlyUSD: number) => {
    if (settings.currency === 'FC') {
      const fc = Math.round(monthlyUSD * settings.usdRateFC);
      return `${fc.toLocaleString('fr-FR')} FC`;
    }
    return `${monthlyUSD} $`;
  };

  const confirmSimulatedActivation = () => {
    if (!checkoutPlan || isActivating) return;
    setIsActivating(true);
    window.setTimeout(() => {
      onActivatePlan(checkoutPlan.id, 'Simulation locale (aucun paiement)');
      setIsActivating(false);
      setActivationDone(true);
    }, 450);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
          <Crown className="h-3.5 w-3.5" />
          <span>
            {settings.planPaid
              ? `Formule sélectionnée : ${PLANS.find((plan) => plan.id === settings.activePlan)?.name}`
              : trialExpired
                ? 'Essai terminé · une formule est requise pour continuer'
                : hasTrial
                  ? `Essai gratuit · ${remainingDays} jour${remainingDays === 1 ? '' : 's'} restant${remainingDays === 1 ? '' : 's'}`
                  : 'Essai gratuit de 7 jours'}
          </span>
        </div>
        <h1 className="mt-3 text-xl font-extrabold text-slate-900 @md:text-2xl">
          Formules ShopFlow
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-slate-600 @md:text-sm">
          L’essai de 7 jours commence à la création de la boutique. Les prix ci-dessous sont mensuels; les tarifs annuels ne sont pas proposés ici.
        </p>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950">
          <strong>Mode test :</strong> aucun fournisseur de paiement n’est connecté. Ne saisissez pas de carte bancaire, de code PIN ni de secret Mobile Money. L’activation ci-dessous est une simulation locale, pas un paiement ni une validation d’abonnement réelle. Le verrou local peut être contourné si les données de l’appareil sont effacées.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 @lg:grid-cols-3">
        {PLANS.map((plan) => {
          const isPopular = plan.id === 'pro_ai';
          const isCurrentPaid = settings.planPaid && settings.activePlan === plan.id;
          return (
            <article
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-3xl border p-6 ${
                isPopular
                  ? 'border-emerald-500 bg-white shadow-lg ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-extrabold text-white shadow-xs">
                  <Sparkles className="h-3 w-3" /> {plan.badge}
                </span>
              )}
              <div>
                <h2 className="text-base font-extrabold text-slate-900">{plan.name}</h2>
                <p className="mt-1 text-xs text-slate-500">{plan.subtitle}</p>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{getPriceDisplay(plan.monthlyUSD)}</span>
                  <span className="text-xs font-semibold text-slate-400">/ mois</span>
                </div>
                <ul className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-xs text-slate-700">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                disabled={isCurrentPaid}
                onClick={() => {
                  setCheckoutPlan(plan);
                  setActivationDone(false);
                }}
                className={`mt-7 w-full rounded-2xl py-3 text-xs font-extrabold transition disabled:cursor-default ${
                  isCurrentPaid
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                    : isPopular
                      ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {isCurrentPaid ? '✓ Formule sélectionnée' : `Choisir ${plan.name} (simulation)`}
              </button>
            </article>
          );
        })}
      </div>

      {checkoutPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-xs">
          <section className="my-8 w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="activation-title">
            <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div>
                <span className="text-[11px] font-bold uppercase text-amber-700">Activation de démonstration</span>
                <h3 id="activation-title" className="mt-1 text-base font-extrabold text-slate-900">{checkoutPlan.name} · {getPriceDisplay(checkoutPlan.monthlyUSD)} / mois</h3>
              </div>
              <button type="button" aria-label="Fermer" onClick={() => setCheckoutPlan(null)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            {activationDone ? (
              <div className="p-7 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-9 w-9" /></div>
                <h4 className="mt-4 text-lg font-extrabold text-slate-900">Formule sélectionnée en mode test</h4>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">L’application a enregistré ce choix sur cet appareil. Aucun paiement n’a été effectué et aucun abonnement réel n’a été vérifié.</p>
                <button type="button" onClick={() => setCheckoutPlan(null)} className="mt-6 w-full rounded-2xl bg-emerald-600 py-3 text-xs font-extrabold text-white hover:bg-emerald-700">Retourner à ShopFlow</button>
              </div>
            ) : (
              <div className="space-y-4 p-6">
                <p className="text-sm font-bold text-slate-800">Vous allez sélectionner {checkoutPlan.name}.</p>
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950">Ceci ne prélève pas {getPriceDisplay(checkoutPlan.monthlyUSD)}. Le fournisseur, le moyen de paiement et la validation sécurisée ne sont pas encore configurés.</p>
                <button type="button" disabled={isActivating} onClick={confirmSimulatedActivation} className="w-full rounded-2xl bg-slate-900 py-3.5 text-xs font-extrabold text-white transition hover:bg-slate-800 disabled:opacity-60">
                  {isActivating ? 'Enregistrement du choix…' : 'Simuler le choix de cette formule'}
                </button>
                <button type="button" onClick={() => setCheckoutPlan(null)} className="w-full rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-600">Annuler</button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
