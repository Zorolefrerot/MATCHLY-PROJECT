import React from 'react';
import { Check } from 'lucide-react';
import { ShopSettings } from '../types';

interface SubscriptionViewProps {
  settings: ShopSettings;
}

const PLANS = [
  {
    name: 'Starter',
    price: '5 USD',
    features: ['Gestion des articles et du stock', 'Ventes et suivi du chiffre d’affaires', 'Utilisation hors ligne'],
  },
  {
    name: 'Pro',
    price: '12 USD',
    features: ['Gestion des articles, ventes et dépenses', 'Assistant IA selon disponibilité', 'Catalogue et demandes clients sur WhatsApp', 'Crédits clients et relances WhatsApp'],
  },
  {
    name: 'Business',
    price: '25 USD',
    features: ['Gestion de plusieurs boutiques', 'Données et réglages séparés par boutique'],
  },
] as const;

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({ settings }) => (
  <section className="space-y-5">
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Formules ShopFlow</h1>
      <p className="mt-1 text-sm text-slate-600">Prix mensuels affichés en USD.</p>
    </div>
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-950">
      <strong>Accès test activé.</strong> Votre boutique reste accessible sans échéance ni paiement. Aucune formule payante ne peut être activée depuis cet écran pendant le test.
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      {PLANS.map((plan) => (
        <article key={plan.name} className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-extrabold text-slate-900">{plan.name}</h2>
          <p className="mt-2 text-2xl font-black text-[#0A4DFF]">{plan.price}<span className="ml-1 text-xs font-semibold text-slate-500">/ mois</span></p>
          <ul className="mt-4 space-y-2.5">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
    <p className="text-xs text-slate-500">Boutique active : {settings.shopName}. Les formules sont présentées à titre informatif pendant cette phase de test.</p>
  </section>
);
