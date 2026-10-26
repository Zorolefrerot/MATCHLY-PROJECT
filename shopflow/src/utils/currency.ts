import { CurrencyCode } from '../types';

/**
 * Formats an internal FC amount strictly in the merchant's single selected currency (FC or USD).
 * Never mixes currencies on screen to keep reading effortless.
 */
export function formatMoney(
  amountFC: number,
  currency: CurrencyCode,
  usdRateFC: number
): string {
  if (currency === 'USD') {
    const usd = amountFC / (usdRateFC || 2850);
    return `${usd.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} $`;
  }

  const rounded = Math.round(amountFC);
  return `${rounded.toLocaleString('fr-FR')} FC`;
}

/**
 * Converts an amount from FC into raw numeric input value in the active currency (for form inputs).
 */
export function toDisplayAmount(
  amountFC: number,
  currency: CurrencyCode,
  usdRateFC: number
): number {
  if (currency === 'USD') {
    return Number((amountFC / (usdRateFC || 2850)).toFixed(2));
  }
  return Math.round(amountFC);
}

/**
 * Converts a user-entered numeric value in the active currency back into internal FC.
 */
export function fromDisplayAmount(
  inputAmount: number,
  currency: CurrencyCode,
  usdRateFC: number
): number {
  if (!Number.isFinite(inputAmount) || inputAmount < 0) return 0;
  if (currency === 'USD') {
    return Math.round(inputAmount * (usdRateFC || 2850));
  }
  return Math.round(inputAmount);
}
