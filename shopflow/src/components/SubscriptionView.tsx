import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import type { ShopSettings } from '../types';
import { formatPlanPrice, PLAN_MONTHLY_USD, planPriceUSD } from '../utils/pricing';
import { PLAN_PRESENTATIONS } from '../utils/planCatalog';

interface SubscriptionViewProps {
  settings: ShopSettings;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({ settings }) => {
  const { t } = useTranslation();
  const [annual, setAnnual] = useState(false);

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Formules ShopFlow</h1>
        <p className="mt-1 text-sm text-slate-600">{t('plans.priceNote')}</p>
      </div>
      <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-950">
        {t('plans.testNote')}
      </div>
      <div className="flex flex-wrap items-center gap-2" aria-label={t('plans.billing.monthly')}>
        <button type="button" onClick={() => setAnnual(false)} aria-pressed={!annual} className={`rounded-xl border px-4 py-2 text-xs font-extrabold ${!annual ? 'border-[#0A4DFF] bg-blue-50 text-[#0A4DFF]' : 'border-slate-200 bg-white text-slate-600'}`}>
          {t('plans.billing.monthly')}
        </button>
        <button type="button" onClick={() => setAnnual(true)} aria-pressed={annual} className={`rounded-xl border px-4 py-2 text-xs font-extrabold ${annual ? 'border-[#0A4DFF] bg-blue-50 text-[#0A4DFF]' : 'border-slate-200 bg-white text-slate-600'}`}>
          {t('plans.billing.annual')}
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_PRESENTATIONS.map((plan) => (
          <article key={plan.id} className={`rounded-2xl border bg-white p-5 ${plan.id === 'pro_ai' ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'}`}>
            <h2 className="text-lg font-extrabold text-slate-900">{t(plan.nameKey)}</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{t(plan.descriptionKey)}</p>
            <p className="mt-3 text-2xl font-black text-[#0A4DFF]">
              {formatPlanPrice(planPriceUSD(plan.id, annual), settings.currency)}
              <span className="ml-1 text-xs font-semibold text-slate-500">/ {t(annual ? 'plans.billing.year' : 'plans.billing.month')}</span>
            </p>
            {annual && <p className="mt-1 text-xs font-semibold text-emerald-700">{t('plans.billing.equivalent')} {formatPlanPrice((PLAN_MONTHLY_USD[plan.id] * 10) / 12, settings.currency)} / {t('plans.billing.month')}</p>}
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">{t('plans.included')}</p>
              <ul className="space-y-2.5">
                {plan.featureKeys.map((key) => (
                  <li key={key} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/70 p-3">
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-amber-900">{t('plans.planned')}</p>
              <ul className="space-y-2 text-xs leading-relaxed text-amber-950">
                {plan.plannedFeatureKeys.map((key) => <li key={key}>• {t(key)}</li>)}
              </ul>
            </div>
          </article>
        ))}
      </div>
      {annual && <p className="text-xs text-slate-500">{t('plans.annualNote')}</p>}
      <p className="text-xs text-slate-500">Boutique active : {settings.shopName}. Les offres et tarifs restent indicatifs pendant les tests.</p>
    </section>
  );
};
