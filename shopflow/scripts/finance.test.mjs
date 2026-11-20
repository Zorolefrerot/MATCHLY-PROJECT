import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function loadTypeScriptModule(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

const [{ formatMoney, formatSignedMoney, fromDisplayAmount, toDisplayAmount }, { grossMarginPercent, summarizeShopFinances }, { PLAN_FC_PER_USD, PLAN_MONTHLY_USD, formatPlanPrice, planPriceUSD }] = await Promise.all([
  loadTypeScriptModule('../src/utils/currency.ts'),
  loadTypeScriptModule('../src/utils/finance.ts'),
  loadTypeScriptModule('../src/utils/pricing.ts'),
]);

const product = (patch = {}) => ({
  id: 'p1',
  name: 'Article',
  category: 'Autre',
  unit: 'Pièce',
  image: '',
  stock: 2,
  minStockAlert: 1,
  purchasePriceFC: 500,
  sellingPriceFC: 1000,
  ...patch,
});

const sale = (patch = {}) => ({
  id: 's1',
  productId: 'p1',
  productName: 'Article',
  productImage: '',
  quantity: 1,
  unitPurchasePriceFC: 500,
  unitSellingPriceFC: 1000,
  totalRevenueFC: 1000,
  totalCostFC: 500,
  netProfitFC: 500,
  paymentMethod: 'cash',
  timestamp: '2026-10-22T10:00:00.000Z',
  ...patch,
});

test('plan prices and annual totals match the published tariffs', () => {
  assert.deepEqual(PLAN_MONTHLY_USD, { starter: 5, pro_ai: 12, business: 25 });
  assert.equal(planPriceUSD('starter', true), 50);
  assert.equal(planPriceUSD('pro_ai', true), 120);
  assert.equal(planPriceUSD('business', true), 250);
  assert.equal(PLAN_FC_PER_USD, 2400);
  assert.equal(formatPlanPrice(planPriceUSD('starter', true), 'FC'), '120\u202f000 FC');
  assert.equal(formatPlanPrice(planPriceUSD('pro_ai', true), 'FC'), '288\u202f000 FC');
  assert.equal(formatPlanPrice(planPriceUSD('business', true), 'FC'), '600\u202f000 FC');
  assert.equal(formatPlanPrice(planPriceUSD('starter', true) / 12, 'USD'), '4.17 $');
});

test('currency input conversion rounds to whole FC and displays USD to cents', () => {
  assert.equal(fromDisplayAmount(5, 'USD', 2400), 12000);
  assert.equal(fromDisplayAmount(5.25, 'USD', 2400), 12600);
  assert.equal(fromDisplayAmount(-1, 'USD', 2400), 0);
  assert.equal(toDisplayAmount(12000, 'USD', 2400), 5);
  assert.equal(formatMoney(12000, 'USD', 2400), '5,00 $');
  assert.equal(formatMoney(12000, 'FC', 2400), '12\u202f000 FC');
  assert.equal(fromDisplayAmount(1, 'USD', -10), 2400);
  assert.equal(formatMoney(12000, 'USD', Number.NaN), '5,00 $');
  assert.equal(toDisplayAmount(Number.NaN, 'FC', 2400), 0);
  assert.equal(formatSignedMoney(500, 'FC', 2400), '+500 FC');
  assert.equal(formatSignedMoney(-500, 'FC', 2400), '-500 FC');
});

test('gross margin uses selling price as denominator, and handles loss/zero price', () => {
  assert.equal(grossMarginPercent(1500, 1000), 33);
  assert.equal(grossMarginPercent(800, 1000), -25);
  assert.equal(grossMarginPercent(0, 1000), 0);
});

test('cart delivery is counted once, credit receipts are cash only when collected, and bundle cost once', () => {
  const sales = [
    sale({ id: 'a1', transactionId: 'order-a', totalRevenueFC: 10000, netProfitFC: 3000, deliveryFeeFC: 4000 }),
    sale({ id: 'a2', transactionId: 'order-a', productId: 'p2', totalRevenueFC: 20000, netProfitFC: 6000, deliveryFeeFC: 4000 }),
    sale({ id: 'b1', transactionId: 'order-b', totalRevenueFC: 5000, netProfitFC: 1000, deliveryFeeFC: 1000 }),
    sale({ id: 'c1', transactionId: 'order-c', paymentMethod: 'credit', totalRevenueFC: 7000, netProfitFC: 2000, deliveryFeeFC: 2000 }),
  ];
  const summary = summarizeShopFinances(
    [
      product({ id: 'p1', collectionId: 'bundle-a', collectionPurchaseTotalFC: 4000 }),
      product({ id: 'p2', collectionId: 'bundle-a', collectionPurchaseTotalFC: 4000, purchasePriceFC: 1000, stock: 3 }),
    ],
    sales,
    [{ id: 'credit-a', customerName: 'Client', phone: '', itemsSummary: '', totalAmountFC: 9000, paidAmountFC: 3000, createdAt: '', dueDate: '' }],
    [{ id: 'expense-a', label: 'Transport', category: 'Transport', amountFC: 1000, timestamp: '' }],
  );

  assert.equal(summary.cashCollectedFC, 43000); // 35,000 goods + 5,000 delivery + 3,000 credit paid
  assert.equal(summary.expensesFC, 1000);
  assert.equal(summary.collectionPurchasesFC, 4000);
  assert.equal(summary.availableCashFC, 38000);
  assert.equal(summary.stockCapitalFC, 4000);
  assert.equal(summary.currentProfitFC, 11000);
  assert.equal(summary.totalCapitalFC, 42000);
});

test('legacy sale rows and malformed numbers do not poison summaries', () => {
  const summary = summarizeShopFinances(
    [product({ stock: Number.NaN, purchasePriceFC: Number.NaN })],
    [sale({ id: 'legacy-a', totalRevenueFC: 1000, deliveryFeeFC: 100 }), sale({ id: 'legacy-b', totalRevenueFC: Number.NaN, deliveryFeeFC: 200, netProfitFC: Number.NaN })],
    [{ id: 'credit-a', customerName: 'Client', phone: '', itemsSummary: '', totalAmountFC: 0, paidAmountFC: Number.NaN, createdAt: '', dueDate: '' }],
    [{ id: 'expense-a', label: 'Bad', category: 'Autre', amountFC: Number.NaN, timestamp: '' }],
  );
  assert.deepEqual(summary, {
    cashCollectedFC: 1300,
    expensesFC: 0,
    collectionPurchasesFC: 0,
    availableCashFC: 1300,
    stockCapitalFC: 0,
    currentProfitFC: 500,
    totalCapitalFC: 1300,
  });
});
