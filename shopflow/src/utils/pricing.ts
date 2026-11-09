import type { CurrencyCode, SubscriptionPlanId } from '../types';

/** Fixed public tariff conversion requested for the ShopFlow plans. */
export const PLAN_FC_PER_USD = 2400;
export const ANNUAL_BILLING_MONTHS = 10; // Deux mois offerts sur une année.
export const ANNUAL_SAVING_MONTHS = 2;

export const PLAN_MONTHLY_USD: Record<SubscriptionPlanId, number> = {
  starter: 5,
  pro_ai: 12,
  business: 25,
};

export function planPriceUSD(plan: SubscriptionPlanId, annual = false): number {
  return PLAN_MONTHLY_USD[plan] * (annual ? ANNUAL_BILLING_MONTHS : 1);
}

export function formatPlanPrice(amountUSD: number, currency: CurrencyCode): string {
  if (currency === 'USD') {
    return `${amountUSD.toLocaleString('en-US', {
      minimumFractionDigits: Number.isInteger(amountUSD) ? 0 : 2,
      maximumFractionDigits: 2,
    })} $`;
  }
  return `${Math.round(amountUSD * PLAN_FC_PER_USD).toLocaleString('fr-FR')} FC`;
}
