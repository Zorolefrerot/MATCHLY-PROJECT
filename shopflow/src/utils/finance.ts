import type { CreditEntry, ExpenseEntry, Product, SaleRecord } from '../types';

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
  const cashCollectedFC = sales.reduce((sum, sale) => {
    if (sale.paymentMethod === 'credit') return sum;
    return sum + sale.totalRevenueFC + (sale.deliveryFeeFC || 0);
  }, 0) + credits.reduce((sum, credit) => sum + Math.max(0, credit.paidAmountFC), 0);
  const expensesFC = expenses.reduce((sum, expense) => sum + expense.amountFC, 0);
  const countedCollections = new Set<string>();
  const collectionPurchasesFC = products.reduce((sum, product) => {
    if (!product.collectionId || countedCollections.has(product.collectionId)) return sum;
    countedCollections.add(product.collectionId);
    return sum + Math.max(0, product.collectionPurchaseTotalFC || 0);
  }, 0);
  const availableCashFC = cashCollectedFC - expensesFC - collectionPurchasesFC;
  const stockCapitalFC = products.reduce((sum, product) => sum + product.purchasePriceFC * product.stock, 0);
  const currentProfitFC = sales.reduce((sum, sale) => sum + sale.netProfitFC, 0) - expensesFC;
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
