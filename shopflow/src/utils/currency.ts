import { CurrencyCode } from '../types';

/**
 * Formats an internal FC amount strictly in the merchant's single selected currency (FC or USD).
 * Never mixes currencies on screen to keep reading effortless.
 */
const safeUsdRate = (usdRateFC: number): number =>
  Number.isFinite(usdRateFC) && usdRateFC > 0
    ? Math.min(usdRateFC, 1_000_000)
    : 2400;

export function formatMoney(
  amountFC: number,
  currency: CurrencyCode,
  usdRateFC: number
): string {
  const safeAmount = Number.isFinite(amountFC) ? amountFC : 0;
  const exchangeRate = safeUsdRate(usdRateFC);
  if (currency === 'USD') {
    const usd = safeAmount / exchangeRate;
    return `${usd.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} $`;
  }

  const rounded = Math.round(safeAmount);
  return `${rounded.toLocaleString('fr-FR')} FC`;
}

/**
 * Converts an amount from FC into raw numeric input value in the active currency (for form inputs).
 */
export function formatSignedMoney(
  amountFC: number,
  currency: CurrencyCode,
  usdRateFC: number,
): string {
  const safeAmount = Number.isFinite(amountFC) ? amountFC : 0;
  return `${safeAmount > 0 ? '+' : ''}${formatMoney(safeAmount, currency, usdRateFC)}`;
}

export function toDisplayAmount(
  amountFC: number,
  currency: CurrencyCode,
  usdRateFC: number
): number {
  const safeAmount = Number.isFinite(amountFC) ? amountFC : 0;
  if (currency === 'USD') {
    return Number((safeAmount / safeUsdRate(usdRateFC)).toFixed(2));
  }
  return Math.round(safeAmount);
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
    return Math.round(inputAmount * safeUsdRate(usdRateFC));
  }
  return Math.round(inputAmount);
}
