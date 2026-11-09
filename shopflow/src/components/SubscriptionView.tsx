import React, { useState } from 'react';
import { Check } from 'lucide-react';
import type { ShopSettings, SubscriptionPlanId } from '../types';
import {
  ANNUAL_SAVING_MONTHS,
  formatPlanPrice,
  PLAN_MONTHLY_USD,
  planPriceUSD,
} from '../utils/pricing';

interface SubscriptionViewProps {
  settings: ShopSettings;
}

const PLANS: { id: SubscriptionPlanId; name: string; features: string[] }[] = [
  {
    id: 'starter',
    name: 'Starter',
    features: ['Gestion des articles et du stock', 'Ventes et suivi du chiffre d’affaires', 'Utilisation hors ligne'],
  },
  {
    id: 'pro_ai',
    name: 'Pro',
    features: ['Gestion des articles, ventes et dépenses', 'Assistant IA selon disponibilité', 'Catalogue et demandes clients sur WhatsApp', 'Crédits clients et relances WhatsApp'],
  },
  {
    id: 'business',
    name: 'Business',
    features: ['Gestion de plusieurs boutiques', 'Données et réglages séparés par boutique'],
  },
];

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({ settings }) => {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Formules ShopFlow</h1>
        <p className="mt-1 text-sm text-slate-600">Prix indicatifs en {settings.currency === 'USD' ? 'USD' : 'FC'} · 1 USD = 2 400 FC.</p>
      </div>
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-950">
        <strong>Accès test activé.</strong> Votre boutique reste accessible sans échéance ni paiement. Aucune formule payante ni aucun paiement réel ne sont activés depuis cet écran.
      </div>
      <div className="flex flex-wrap items-center gap-2" aria-label="Période de tarification">
        <button type="button" onClick={() => setAnnual(false)} aria-pressed={!annual} className={`rounded-xl border px-4 py-2 text-xs font-extrabold ${!annual ? 'border-[#0A4DFF] bg-blue-50 text-[#0A4DFF]' : 'border-slate-200 bg-white text-slate-600'}`}>Mensuel</button>
        <button type="button" onClick={() => setAnnual(true)} aria-pressed={annual} className={`rounded-xl border px-4 py-2 text-xs font-extrabold ${annual ? 'border-[#0A4DFF] bg-blue-50 text-[#0A4DFF]' : 'border-slate-200 bg-white text-slate-600'}`}>
          Annuel · {ANNUAL_SAVING_MONTHS} mois offerts
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const monthlyUSD = PLAN_MONTHLY_USD[plan.id];
          const shownUSD = planPriceUSD(plan.id, annual);
          return (
            <article key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-extrabold text-slate-900">{plan.name}</h2>
              <p className="mt-2 text-2xl font-black text-[#0A4DFF]">
                {formatPlanPrice(shownUSD, settings.currency)}
                <span className="ml-1 text-xs font-semibold text-slate-500">/ {annual ? 'an' : 'mois'}</span>
              </p>
              {annual && <p className="mt-1 text-xs font-semibold text-emerald-700">Équivaut à {formatPlanPrice((monthlyUSD * 10) / 12, settings.currency)} / mois · 2 mois offerts</p>}
              <ul className="mt-4 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">Boutique active : {settings.shopName}. Les montants annuels correspondent à 10 mois payés sur 12 et restent informatifs pendant la phase de test.</p>
    </section>
  );
};
