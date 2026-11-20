import type { CreditEntry, ExpenseEntry, Product, SaleRecord } from '../types';

export function grossMarginPercent(sellingPriceFC: number, purchasePriceFC: number): number {
  if (!Number.isFinite(sellingPriceFC) || !Number.isFinite(purchasePriceFC) || sellingPriceFC <= 0) return 0;
  return Math.round(((sellingPriceFC - purchasePriceFC) / sellingPriceFC) * 100);
}

export interface ShopFinancialSummary {
  cashCollectedFC: number;
  expensesFC: number;
  collectionPurchasesFC: number;
  availableCashFC: number;
  stockCapitalFC: number;
  currentProfitFC: number;
  totalCapitalFC: number;
}

/** Estimate balances from records in ShopFlow; opening capital and unrecorded purchases are not included. */
export function summarizeShopFinances(
  products: Product[],
  sales: SaleRecord[],
  credits: CreditEntry[],
  expenses: ExpenseEntry[],
): ShopFinancialSummary {
  const nonNegative = (value: number | undefined): number =>
    Number.isFinite(value) ? Math.max(0, value as number) : 0;
  const finite = (value: number): number => Number.isFinite(value) ? value : 0;

  let paidSalesFC = 0;
  const deliveryFeesByTransaction = new Map<string, number>();
  for (const sale of sales) {
    if (sale.paymentMethod === 'credit') continue;
    paidSalesFC += nonNegative(sale.totalRevenueFC);
    // Cart sales have one shared transaction ID. Count its delivery charge once,
    // even though the receipt charge is copied to each line for legacy receipts.
    const transactionKey = sale.transactionId || `legacy-sale:${sale.id}`;
    deliveryFeesByTransaction.set(
      transactionKey,
      Math.max(deliveryFeesByTransaction.get(transactionKey) || 0, nonNegative(sale.deliveryFeeFC)),
    );
  }
  const deliveryFeesFC = [...deliveryFeesByTransaction.values()].reduce((sum, fee) => sum + fee, 0);
  const cashCollectedFC = paidSalesFC + deliveryFeesFC + credits.reduce(
    (sum, credit) => sum + nonNegative(credit.paidAmountFC),
    0,
  );
  const expensesFC = expenses.reduce((sum, expense) => sum + nonNegative(expense.amountFC), 0);
  const countedCollections = new Set<string>();
  const collectionPurchasesFC = products.reduce((sum, product) => {
    if (!product.collectionId || countedCollections.has(product.collectionId)) return sum;
    countedCollections.add(product.collectionId);
    return sum + nonNegative(product.collectionPurchaseTotalFC);
  }, 0);
  const availableCashFC = cashCollectedFC - expensesFC - collectionPurchasesFC;
  const stockCapitalFC = products.reduce(
    (sum, product) => sum + nonNegative(product.purchasePriceFC) * nonNegative(product.stock),
    0,
  );
  const currentProfitFC = sales.reduce((sum, sale) => sum + finite(sale.netProfitFC), 0) - expensesFC;
  return {
    cashCollectedFC,
    expensesFC,
    collectionPurchasesFC,
    availableCashFC,
    stockCapitalFC,
    currentProfitFC,
    totalCapitalFC: availableCashFC + stockCapitalFC,
  };
}
