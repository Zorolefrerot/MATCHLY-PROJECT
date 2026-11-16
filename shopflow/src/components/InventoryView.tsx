import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calculator,
  Edit3,
  ImagePlus,
  Info,
  Layers,
  LayoutGrid,
  List,
  PackagePlus,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { PRESET_PRODUCT_PHOTOS } from '../data/initialData';
import { ExpenseEntry, Product, SaleRecord, ShopSettings } from '../types';
import {
  formatMoney,
  fromDisplayAmount,
  toDisplayAmount,
} from '../utils/currency';
import { formatSaleTime, parseSaleDate } from '../utils/saleDate';
import { compressProductImage } from '../utils/publicCatalog';

interface CollectionDraftLine {
  key: string;
  name: string;
  category: Product['category'];
  unit: string;
  quantity: string;
  sellingPrice: string;
  image: string;
}

const newCollectionLine = (): CollectionDraftLine => ({
  key: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: '',
  category: 'Autre',
  unit: 'Pièce',
  quantity: '1',
  sellingPrice: '',
  image: '',
});

interface InventoryViewProps {
  settings: ShopSettings;
  products: Product[];
  sales: SaleRecord[];
  expenses: ExpenseEntry[];
  onSaveProduct: (product: Product, isNew: boolean) => void;
  onCreateCollection: (products: Product[]) => void;
  onDeleteProduct: (product: Product) => void;
  onRestockProduct: (product: Product) => void;
  onQuickSellProduct: (product: Product) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  settings,
  products,
  sales,
  expenses,
  onSaveProduct,
  onCreateCollection,
  onDeleteProduct,
  onRestockProduct,
  onQuickSellProduct,
}) => {
  const { t: i18nText } = useTranslation();
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(
    settings.theme?.defaultCatalogFormat === 'grid' ? 'cards' : 'table'
  );

  React.useEffect(() => {
    if (settings.theme?.defaultCatalogFormat) {
      setViewMode(
        settings.theme.defaultCatalogFormat === 'grid' ? 'cards' : 'table'
      );
    }
  }, [settings.theme?.defaultCatalogFormat]);
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [collectionNameInput, setCollectionNameInput] = useState('');
  const [collectionPurchaseInput, setCollectionPurchaseInput] = useState('');
  const [collectionCommonPriceInput, setCollectionCommonPriceInput] = useState('');
  const [useCommonSellingPrice, setUseCommonSellingPrice] = useState(true);
  const [collectionLines, setCollectionLines] = useState<CollectionDraftLine[]>([newCollectionLine()]);
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);

  // Modal Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Product['category']>('Bijoux');
  const [unit, setUnit] = useState('Pièce');
  const [image, setImage] = useState('');
  const [stockInput, setStockInput] = useState('0');
  const [minStockInput, setMinStockInput] = useState('5');
  const [purchaseInput, setPurchaseInput] = useState('');
  const [sellingInput, setSellingInput] = useState('');

  const fmt = (val: number) => formatMoney(val, settings.currency, settings.usdRateFC);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('Bijoux');
    setUnit('Pièce');
    setImage('');
    setStockInput('0');
    setMinStockInput('5');
    setPurchaseInput('');
    setSellingInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category);
    setUnit(product.unit);
    setImage(product.image);
    setStockInput(String(product.stock));
    setMinStockInput(String(product.minStockAlert));
    setPurchaseInput(
      String(toDisplayAmount(product.purchasePriceFC, settings.currency, settings.usdRateFC))
    );
    setSellingInput(
      String(toDisplayAmount(product.sellingPriceFC, settings.currency, settings.usdRateFC))
    );
    setIsModalOpen(true);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCollectionImageUpload = async (
    lineKey: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      window.alert(i18nText('collection.imageInvalid'));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      window.alert(i18nText('collection.imageTooLarge'));
      return;
    }

    try {
      const source = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string'
          ? resolve(reader.result)
          : reject(new Error('IMAGE_READ_FAILED'));
        reader.onerror = () => reject(new Error('IMAGE_READ_FAILED'));
        reader.readAsDataURL(file);
      });
      updateCollectionLine(lineKey, { image: await compressProductImage(source, 250_000, 7) });
    } catch {
      window.alert(i18nText('collection.imageFailed'));
    }
  };

  // Live automatic calculation in modal
  const parsedPurchaseFC = fromDisplayAmount(
    parseFloat(purchaseInput) || 0,
    settings.currency,
    settings.usdRateFC
  );
  const parsedSellingFC = fromDisplayAmount(
    parseFloat(sellingInput) || 0,
    settings.currency,
    settings.usdRateFC
  );
  const parsedQty = Math.max(0, parseInt(stockInput, 10) || 0);
  const liveUnitProfitFC = parsedSellingFC - parsedPurchaseFC;
  const liveMarginPct =
    parsedPurchaseFC > 0
      ? Math.round((liveUnitProfitFC / parsedPurchaseFC) * 100)
      : 0;
  const liveTotalPotentialProfitFC = liveUnitProfitFC * parsedQty;

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const saved: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: name.trim(),
      category,
      unit: unit.trim() || 'Pièce',
      image,
      stock: parsedQty,
      minStockAlert: Math.max(1, parseInt(minStockInput, 10) || 5),
      purchasePriceFC: parsedPurchaseFC,
      sellingPriceFC: parsedSellingFC,
      collectionId: editingProduct?.collectionId,
      collectionName: editingProduct?.collectionName,
      collectionPurchaseTotalFC: editingProduct?.collectionPurchaseTotalFC,
    };

    onSaveProduct(saved, !editingProduct);
    setIsModalOpen(false);
  };

  const collectionQuantity = collectionLines.reduce((sum, line) => sum + Math.max(0, parseInt(line.quantity, 10) || 0), 0);
  const collectionCostFC = fromDisplayAmount(parseFloat(collectionPurchaseInput) || 0, settings.currency, settings.usdRateFC);
  const collectionCommonSaleFC = fromDisplayAmount(parseFloat(collectionCommonPriceInput) || 0, settings.currency, settings.usdRateFC);
  const collectionProjectedSalesFC = collectionLines.reduce((sum, line) => {
    const price = useCommonSellingPrice
      ? collectionCommonSaleFC
      : fromDisplayAmount(parseFloat(line.sellingPrice) || 0, settings.currency, settings.usdRateFC);
    return sum + price * Math.max(0, parseInt(line.quantity, 10) || 0);
  }, 0);

  const openCollectionModal = () => {
    setCollectionNameInput('');
    setCollectionPurchaseInput('');
    setCollectionCommonPriceInput('');
    setUseCommonSellingPrice(true);
    setCollectionLines([newCollectionLine()]);
    setIsCollectionModalOpen(true);
  };

  const updateCollectionLine = (key: string, patch: Partial<CollectionDraftLine>) => {
    setCollectionLines((current) => current.map((line) => line.key === key ? { ...line, ...patch } : line));
  };

  const handleCreateCollection = (event: React.FormEvent) => {
    event.preventDefault();
    const totalCostFC = fromDisplayAmount(parseFloat(collectionPurchaseInput) || 0, settings.currency, settings.usdRateFC);
    const validLines = collectionLines.map((line) => ({
      ...line,
      name: line.name.trim(),
      quantity: Math.max(0, parseInt(line.quantity, 10) || 0),
      sellingPriceFC: useCommonSellingPrice
        ? collectionCommonSaleFC
        : fromDisplayAmount(parseFloat(line.sellingPrice) || 0, settings.currency, settings.usdRateFC),
    }));
    const totalQty = validLines.reduce((sum, line) => sum + line.quantity, 0);
    if (!collectionNameInput.trim() || totalCostFC <= 0 || !validLines.length ||
      validLines.some((line) => !line.name || line.quantity <= 0 || line.sellingPriceFC <= 0)) return;

    const collectionId = `collection-${Date.now()}`;
    const averageUnitCostFC = totalCostFC / totalQty;
    const createdProducts: Product[] = validLines.map((line, index) => ({
      id: `prod-${collectionId}-${index + 1}`,
      name: line.name,
      category: line.category,
      unit: line.unit.trim() || 'Pièce',
      image: line.image,
      stock: line.quantity,
      minStockAlert: Math.max(1, Math.min(5, line.quantity)),
      purchasePriceFC: averageUnitCostFC,
      sellingPriceFC: line.sellingPriceFC,
      collectionId,
      collectionName: collectionNameInput.trim(),
      collectionPurchaseTotalFC: totalCostFC,
    }));
    onCreateCollection(createdProducts);
    setIsCollectionModalOpen(false);
  };

  const getProductLifetimeStats = (productId: string) => {
    const productSales = sales.filter((sale) => sale.productId === productId)
      .sort((a, b) => (parseSaleDate(b.timestamp)?.getTime() || 0) - (parseSaleDate(a.timestamp)?.getTime() || 0));
    const productExpenses = expenses.filter((expense) => expense.productId === productId);
    return {
      sales: productSales,
      expenses: productExpenses,
      unitsSold: productSales.reduce((sum, sale) => sum + sale.quantity, 0),
      revenueFC: productSales.reduce((sum, sale) => sum + sale.totalRevenueFC + (sale.deliveryFeeFC || 0), 0),
      profitFC: productSales.reduce((sum, sale) => sum + sale.netProfitFC, 0),
      expensesFC: productExpenses.reduce((sum, expense) => sum + expense.amountFC, 0),
    };
  };

  const handleDeleteProduct = (product: Product) => {
    const confirmed = window.confirm(
      `Supprimer « ${product.name} » du stock et du catalogue ? Les ventes déjà enregistrées resteront dans l’historique.`
    );
    if (confirmed) onDeleteProduct(product);
  };

  const totalInventoryCostFC = products.reduce(
    (sum, p) => sum + p.purchasePriceFC * p.stock,
    0
  );
  const totalInventorySaleValueFC = products.reduce(
    (sum, p) => sum + p.sellingPriceFC * p.stock,
    0
  );
  const totalPotentialProfitFC = totalInventorySaleValueFC - totalInventoryCostFC;

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Compute daily stats per product
  const getProductDailyStats = (productId: string) => {
    const today = new Date();
    const matching = sales.filter((sale) => {
      const date = parseSaleDate(sale.timestamp);
      return Boolean(
        sale.productId === productId && date &&
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      );
    });
    return {
      qtySold: matching.reduce((s, r) => s + r.quantity, 0),
      caFC: matching.reduce((s, r) => s + r.totalRevenueFC, 0),
      profitFC: matching.reduce((s, r) => s + r.netProfitFC, 0),
    };
  };

  const selectedProductStats = detailsProduct ? getProductLifetimeStats(detailsProduct.id) : null;

  return (
    <div className="space-y-6 pb-8">
      {/* Header + Add Product CTA */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 @md:text-xl">
            Mes Marchandises & Stock ({products.length})
          </h1>
          <p className="text-xs text-slate-500">
            Insérez vos produits, photos, quantités, prix d’achat et prix de vente : ShopFlow calcule tout seul.
          </p>
        </div>

        <div className="flex flex-col gap-2 @sm:flex-row">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter une marchandise</span>
          </button>
          <button
            type="button"
            onClick={openCollectionModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-800 transition hover:bg-blue-100"
          >
            <Layers className="h-4 w-4" />
            <span>{i18nText('collection.create')}</span>
          </button>
        </div>
      </div>

      {/* Stock Valuation Summary Strip */}
      <div className="grid grid-cols-1 gap-4 @sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-500">
            Valeur d’achat du stock en rayon
          </span>
          <div className="mt-1.5 text-xl font-extrabold text-slate-900 tabular-nums">
            {fmt(totalInventoryCostFC)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-500">
            CA attendu sur tout le stock
          </span>
          <div className="mt-1.5 text-xl font-extrabold text-slate-900 tabular-nums">
            {fmt(totalInventorySaleValueFC)}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <span className="text-xs font-semibold text-emerald-800">
            Revenu futur caché dans le stock
          </span>
          <div className="mt-1.5 text-xl font-extrabold text-emerald-700 tabular-nums">
            +{fmt(totalPotentialProfitFC)}
          </div>
        </div>
      </div>

      {/* Filter Bar & View Switcher */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 @md:flex-row @md:items-center @md:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer vos marchandises..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-10 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              viewMode === 'table'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>Tableau complet</span>
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              viewMode === 'cards'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Cartes photos</span>
          </button>
        </div>
      </div>

      {/* Complete Table View (Shows all merchant metrics side by side) */}
      {viewMode === 'table' ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase text-slate-500">
                  <th className="px-4 py-3.5">Marchandise</th>
                  <th className="px-3 py-3.5 text-center">Quantité</th>
                  <th className="px-3 py-3.5 text-right">Prix d’Achat</th>
                  <th className="px-3 py-3.5 text-right">Prix de Vente</th>
                  <th className="px-3 py-3.5 text-right">Gain / Unité</th>
                  <th className="px-3 py-3.5 text-center">Ventes Jour</th>
                  <th className="px-3 py-3.5 text-right">CA du Jour</th>
                  <th className="px-3 py-3.5 text-right">Revenu Jour</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((prod) => {
                  const unitGain = prod.sellingPriceFC - prod.purchasePriceFC;
                  const stats = getProductDailyStats(prod.id);
                  const isLow = prod.stock <= prod.minStockAlert;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {prod.image ? (
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                              <ImagePlus className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{prod.name}</p>
                            <p className="text-[11px] text-slate-400">
                              {prod.category} · Par {prod.unit}
                              {prod.collectionName && <span className="block text-blue-600">{i18nText('product.collection', { name: prod.collectionName })}</span>}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${
                            prod.stock === 0
                              ? 'bg-red-100 text-red-700'
                              : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {prod.stock} {prod.unit}s
                        </span>
                      </td>

                      <td className="px-3 py-3 text-right font-medium text-slate-600 tabular-nums">
                        {fmt(prod.purchasePriceFC)}
                      </td>

                      <td className="px-3 py-3 text-right font-bold text-slate-900 tabular-nums">
                        {fmt(prod.sellingPriceFC)}
                      </td>

                      <td className="px-3 py-3 text-right font-bold text-emerald-700 tabular-nums">
                        +{fmt(unitGain)}
                      </td>

                      <td className="px-3 py-3 text-center font-bold text-slate-800 tabular-nums">
                        {stats.qtySold}
                      </td>

                      <td className="px-3 py-3 text-right font-semibold text-slate-900 tabular-nums">
                        {fmt(stats.caFC)}
                      </td>

                      <td className="px-3 py-3 text-right font-extrabold text-emerald-700 tabular-nums">
                        +{fmt(stats.profitFC)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailsProduct(prod)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                            title={i18nText('product.details')}
                          >
                            <Info className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onQuickSellProduct(prod)}
                            disabled={prod.stock <= 0}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
                            title="Enregistrer +1 vente"
                          >
                            +1 Vente
                          </button>
                          <button
                            onClick={() => onRestockProduct(prod)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                            title="Ajouter du stock"
                          >
                            + Stock
                          </button>
                          <button
                            onClick={() => openEditModal(prod)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            title="Modifier produit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod)}
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                            title="Supprimer du stock"
                            aria-label={`Supprimer ${prod.name} du stock`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Visual Cards View */
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @xl:grid-cols-4">
          {filtered.map((prod) => {
            const unitGain = prod.sellingPriceFC - prod.purchasePriceFC;
            const stats = getProductDailyStats(prod.id);
            const isLow = prod.stock <= prod.minStockAlert;

            return (
              <div
                key={prod.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div>
                  <div className="relative h-40 bg-slate-100">
                    {prod.image ? (
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-300">
                        <ImagePlus className="h-10 w-10" />
                      </div>
                    )}
                    <span
                      className={`absolute top-2.5 left-2.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        isLow
                          ? 'bg-amber-500 text-white'
                          : 'bg-white/95 text-slate-900'
                      }`}
                    >
                      Qté : {prod.stock} {prod.unit}s
                    </span>
                    <button
                      onClick={() => openEditModal(prod)}
                      className="absolute top-2.5 right-2.5 rounded-full bg-white/90 p-2 text-slate-700 shadow-2xs hover:bg-white"
                      aria-label="Modifier"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2.5 p-4 text-xs">
                    <h3 className="text-sm font-bold text-slate-900">{prod.name}</h3>
                    {prod.collectionName && <p className="text-[10px] font-semibold text-blue-600">{i18nText('product.collection', { name: prod.collectionName })}</p>}
                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5">
                      <div>
                        <span className="text-[10px] text-slate-400">Prix d’achat</span>
                        <p className="font-bold text-slate-700 tabular-nums">
                          {fmt(prod.purchasePriceFC)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Prix de vente</span>
                        <p className="font-bold text-slate-900 tabular-nums">
                          {fmt(prod.sellingPriceFC)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        Ventes jour : <strong>{stats.qtySold}</strong>
                      </span>
                      <span className="font-bold text-emerald-700 tabular-nums">
                        Gain/u : +{fmt(unitGain)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 border-t border-slate-100 p-3">
                  <button
                    type="button"
                    onClick={() => setDetailsProduct(prod)}
                    className="flex items-center justify-center rounded-xl border border-blue-200 py-2 text-blue-700 hover:bg-blue-50"
                    aria-label={`Voir les détails de ${prod.name}`}
                    title={i18nText('product.details')}
                  >
                    <Info className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onRestockProduct(prod)}
                    className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <PackagePlus className="h-3.5 w-3.5" />
                    <span>+ Stock</span>
                  </button>
                  <button
                    onClick={() => onQuickSellProduct(prod)}
                    disabled={prod.stock <= 0}
                    className="rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:bg-slate-300"
                  >
                    +1 Vendu
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(prod)}
                    className="flex items-center justify-center rounded-xl border border-red-200 py-2 text-red-600 hover:bg-red-50"
                    title="Supprimer du stock"
                    aria-label={`Supprimer ${prod.name} du stock`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isCollectionModalOpen && (
        <div className="sf-mobile-modal fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 px-3 backdrop-blur-[2px]">
          <div className="sf-mobile-modal-panel my-2 w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">{i18nText('collection.title')}</h2>
                <p className="mt-0.5 text-xs text-slate-500">{i18nText('collection.description')}</p>
              </div>
              <button type="button" onClick={() => setIsCollectionModalOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Fermer">×</button>
            </div>
            <form onSubmit={handleCreateCollection} className="space-y-5 p-5">
              <div className="grid gap-3 @md:grid-cols-2">
                <label className="text-xs font-bold text-slate-700">
                  {i18nText('collection.name')} *
                  <input required value={collectionNameInput} onChange={(event) => setCollectionNameInput(event.target.value)} placeholder={i18nText('collection.namePlaceholder')} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium" />
                </label>
                <label className="text-xs font-bold text-slate-700">
                  {i18nText('collection.purchaseTotal')} ({settings.currency}) *
                  <input required type="number" min="1" step="any" value={collectionPurchaseInput} onChange={(event) => setCollectionPurchaseInput(event.target.value)} placeholder={i18nText('collection.purchasePlaceholder')} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-bold tabular-nums" />
                </label>
              </div>

              <fieldset className="rounded-xl border border-slate-200 p-3">
                <legend className="px-1 text-xs font-extrabold text-slate-700">{i18nText('collection.salePricing')}</legend>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <input type="checkbox" checked={useCommonSellingPrice} onChange={(event) => setUseCommonSellingPrice(event.target.checked)} className="h-4 w-4 accent-emerald-600" />
                  {i18nText('collection.samePrice')}
                </label>
                {useCommonSellingPrice && (
                  <input required type="number" min="1" step="any" value={collectionCommonPriceInput} onChange={(event) => setCollectionCommonPriceInput(event.target.value)} placeholder={`${i18nText('collection.commonPricePlaceholder')} (${settings.currency})`} className="mt-3 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-bold tabular-nums @md:max-w-sm" />
                )}
              </fieldset>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{i18nText('collection.itemsTitle', { count: collectionLines.length })}</h3>
                    <p className="text-[11px] text-slate-500">{i18nText('collection.itemHint')}</p>
                  </div>
                  <button type="button" onClick={() => setCollectionLines((current) => [...current, newCollectionLine()])} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                    <Plus className="h-3.5 w-3.5" /> {i18nText('collection.addItem')}
                  </button>
                </div>
                {collectionLines.map((line, index) => {
                  const isPresetImage = PRESET_PRODUCT_PHOTOS.some((photo) => photo.url === line.image);
                  return (
                    <div key={line.key} className="grid min-w-0 grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 @md:grid-cols-12">
                      <input required value={line.name} onChange={(event) => updateCollectionLine(line.key, { name: event.target.value })} placeholder={i18nText('collection.itemName', { index: index + 1 })} aria-label={i18nText('collection.itemName', { index: index + 1 })} className="col-span-2 min-w-0 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs @md:col-span-3" />
                      <select value={line.category} onChange={(event) => updateCollectionLine(line.key, { category: event.target.value as Product['category'] })} aria-label={i18nText('collection.category')} className="col-span-2 min-w-0 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs @md:col-span-2">
                        <option value="Bijoux">Bijoux</option><option value="Accessoires">Accessoires</option><option value="Vêtements">Vêtements</option><option value="Chaussures">Chaussures</option><option value="E-books">E-books</option><option value="Alimentation">Alimentation</option><option value="Boissons">Boissons</option><option value="Hygiène">Hygiène</option><option value="Mode & Accessoires">Mode & Accessoires</option><option value="Huiles & Lait">Huiles & Lait</option><option value="Parfum">{i18nText('product.category.perfume')}</option><option value="Santé">{i18nText('product.category.health')}</option><option value="Cosmétiques">{i18nText('product.category.cosmetics')}</option><option value="Électronique">{i18nText('product.category.electronics')}</option><option value="Autre">{i18nText('product.category.other')}</option>
                      </select>
                      <input required type="number" min="1" step="1" value={line.quantity} onChange={(event) => updateCollectionLine(line.key, { quantity: event.target.value })} placeholder={i18nText('collection.quantity')} aria-label={i18nText('collection.quantity')} className="min-w-0 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs tabular-nums @md:col-span-1" />
                      <input value={line.unit} onChange={(event) => updateCollectionLine(line.key, { unit: event.target.value })} placeholder={i18nText('collection.unit')} aria-label={i18nText('collection.unit')} className="min-w-0 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs @md:col-span-1" />
                      {!useCommonSellingPrice && <input required type="number" min="1" step="any" value={line.sellingPrice} onChange={(event) => updateCollectionLine(line.key, { sellingPrice: event.target.value })} placeholder={`${i18nText('collection.individualPrice')} (${settings.currency})`} aria-label={i18nText('collection.individualPrice')} className="col-span-2 min-w-0 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs tabular-nums @md:col-span-2" />}
                      <div className="col-span-2 flex min-w-0 flex-wrap items-center gap-2 @md:col-span-12">
                        {line.image ? (
                          <img src={line.image} alt={i18nText('collection.imagePreviewAlt', { index: index + 1 })} className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover" />
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-slate-400"><ImagePlus className="h-5 w-5" /></span>
                        )}
                        <label className="inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-50">
                          <Upload className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{line.image ? i18nText('collection.changeImage') : i18nText('collection.uploadImage')}</span>
                          <input type="file" accept="image/*" onChange={(event) => { void handleCollectionImageUpload(line.key, event); }} className="sr-only" />
                        </label>
                        <select value={isPresetImage ? line.image : line.image ? '__uploaded__' : ''} onChange={(event) => { if (event.target.value !== '__uploaded__') updateCollectionLine(line.key, { image: event.target.value }); }} aria-label={i18nText('collection.photoOptional')} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
                          <option value="">{i18nText('collection.noPhoto')}</option>
                          {line.image && !isPresetImage && <option value="__uploaded__">{i18nText('collection.uploadedPhoto')}</option>}
                          {PRESET_PRODUCT_PHOTOS.map((photo) => <option key={photo.url} value={photo.url}>{photo.label}</option>)}
                        </select>
                        {line.image && <button type="button" onClick={() => updateCollectionLine(line.key, { image: '' })} aria-label={i18nText('collection.removeImage')} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>}
                      </div>
                      <button type="button" disabled={collectionLines.length === 1} onClick={() => setCollectionLines((current) => current.filter((candidate) => candidate.key !== line.key))} aria-label={`${i18nText('collection.remove')} ${index + 1}`} className="col-span-2 min-w-0 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-40 @md:col-span-1">{i18nText('collection.remove')}</button>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 text-xs @md:grid-cols-3">
                <p>{i18nText('collection.totalQuantity', { count: collectionQuantity })}</p>
                <p>{i18nText('collection.averageCost', { amount: fmt(collectionQuantity ? collectionCostFC / collectionQuantity : 0) })}</p>
                <p>{i18nText('collection.margin', { amount: fmt(collectionProjectedSalesFC - collectionCostFC) })}</p>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">{i18nText('collection.costNote')}</p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsCollectionModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">{i18nText('collection.cancel')}</button>
                <button type="submit" disabled={!collectionQuantity} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white disabled:opacity-50">{i18nText('collection.createCount', { count: collectionLines.length })}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Merchandise Modal with Live Automatic Profit Calculation */}
      {isModalOpen && (
        <div className="sf-mobile-modal fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 px-3 backdrop-blur-[2px] sm:px-4">
          <div className="sf-mobile-modal-panel my-2 w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <ImagePlus className="h-5 w-5 text-emerald-600" />
                <h2 className="text-base font-extrabold text-slate-900">
                  {editingProduct
                    ? 'Modifier la marchandise'
                    : 'Ajouter une nouvelle marchandise'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="space-y-4 p-6 text-xs">
              {/* Image Picker & Upload */}
              <div>
                <label className="mb-2 block font-bold text-slate-700">
                  Photo de la marchandise
                </label>
                <div className="flex items-center gap-4">
                  {image ? (
                    <img
                      src={image}
                      alt="Aperçu de l’article"
                      className="h-20 w-20 shrink-0 rounded-2xl border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-[10px] font-semibold text-slate-400">
                      <ImagePlus className="h-5 w-5" />
                      Sans photo
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-bold text-slate-700 transition hover:bg-slate-100">
                      <Upload className="h-4 w-4 text-emerald-600" />
                      <span>Importer une photo téléphone / PC</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {PRESET_PRODUCT_PHOTOS.map((preset) => (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => setImage(preset.url)}
                          className={`shrink-0 rounded-lg border px-2 py-1 text-[11px] font-medium ${
                            image === preset.url
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Name & Category */}
              <div className="grid grid-cols-1 gap-3 @sm:grid-cols-3">
                <div className="@sm:col-span-2">
                  <label className="mb-1 block font-bold text-slate-700">
                    Nom de la marchandise *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex. Collier doré, sac à main, e-book…"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Catégorie
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as Product['category'])
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="Bijoux">Bijoux</option>
                    <option value="Accessoires">Accessoires</option>
                    <option value="Vêtements">Vêtements</option>
                    <option value="Chaussures">Chaussures</option>
                    <option value="E-books">E-books</option>
                    <option value="Alimentation">Alimentation</option>
                    <option value="Boissons">Boissons</option>
                    <option value="Hygiène">Hygiène</option>
                    <option value="Mode & Accessoires">Mode & Accessoires</option>
                    <option value="Huiles & Lait">Huiles & Lait</option>
                    <option value="Parfum">{i18nText('product.category.perfume')}</option>
                    <option value="Santé">{i18nText('product.category.health')}</option>
                    <option value="Cosmétiques">{i18nText('product.category.cosmetics')}</option>
                    <option value="Électronique">{i18nText('product.category.electronics')}</option>
                    <option value="Autre">{i18nText('product.category.other')}</option>
                  </select>
                </div>
              </div>

              {/* Quantity, Unit & Alert */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Quantité stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockInput}
                    onChange={(e) => setStockInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 tabular-nums focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Unité
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Sac, Bidon, Pièce..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Alerte stock bas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minStockInput}
                    onChange={(e) => setMinStockInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 tabular-nums focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Purchase Price & Selling Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Prix d’achat unitaire ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={purchaseInput}
                    onChange={(e) => setPurchaseInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-bold text-slate-900 tabular-nums focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Prix de vente client ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={sellingInput}
                    onChange={(e) => setSellingInput(e.target.value)}
                    className="w-full rounded-xl border border-emerald-300 bg-emerald-50/30 px-3.5 py-2.5 text-sm font-extrabold text-slate-900 tabular-nums focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Automatic Live Calculation Box */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                <div className="flex items-center gap-2 text-emerald-900">
                  <Calculator className="h-4 w-4 text-emerald-600" />
                  <span className="font-bold">
                    Calcul automatique ShopFlow en direct :
                  </span>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white p-2.5">
                    <span className="text-[11px] text-slate-500">
                      Revenu par unité vendue
                    </span>
                    <p
                      className={`mt-0.5 text-sm font-extrabold tabular-nums ${
                        liveUnitProfitFC >= 0 ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {liveUnitProfitFC >= 0 ? '+' : ''}
                      {fmt(liveUnitProfitFC)} ({liveMarginPct}%)
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-2.5">
                    <span className="text-[11px] text-slate-500">
                      Revenu total ({parsedQty} en stock)
                    </span>
                    <p className="mt-0.5 text-sm font-extrabold text-emerald-700 tabular-nums">
                      +{fmt(liveTotalPotentialProfitFC)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-white shadow-xs hover:bg-emerald-700"
                >
                  {editingProduct ? 'Enregistrer les modifications' : 'Ajouter au stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailsProduct && selectedProductStats && (
        <div className="sf-mobile-modal fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/55 px-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="product-details-title">
          <div className="sf-mobile-modal-panel my-2 w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white p-5">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">{detailsProduct.category}{detailsProduct.collectionName ? ` · ${i18nText('product.collection', { name: detailsProduct.collectionName })}` : ''}</p>
                <h2 id="product-details-title" className="mt-1 truncate text-lg font-extrabold text-slate-900">{detailsProduct.name}</h2>
                <p className="text-xs text-slate-500">{i18nText('product.historyTitle')}</p>
              </div>
              <button type="button" onClick={() => setDetailsProduct(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Fermer">×</button>
            </div>
            <div className="space-y-5 p-5">
              <div className="grid grid-cols-2 gap-3 @md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] text-slate-500">{i18nText('product.stock')}</p><p className="mt-1 font-extrabold text-slate-900">{detailsProduct.stock} {detailsProduct.unit}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] text-slate-500">{i18nText('product.capitalStock')}</p><p className="mt-1 font-extrabold text-slate-900 tabular-nums">{fmt(detailsProduct.purchasePriceFC * detailsProduct.stock)}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] text-slate-500">{i18nText('product.unitsSold')}</p><p className="mt-1 font-extrabold text-slate-900">{selectedProductStats.unitsSold}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] text-slate-500">{i18nText('product.salesCount')}</p><p className="mt-1 font-extrabold text-slate-900">{selectedProductStats.sales.length}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] text-slate-500">{i18nText('product.totalRevenue')}</p><p className="mt-1 font-extrabold text-slate-900 tabular-nums">{fmt(selectedProductStats.revenueFC)}</p></div>
                <div className="rounded-xl bg-emerald-50 p-3"><p className="text-[11px] text-emerald-700">{i18nText('product.profitAfterExpenses')}</p><p className="mt-1 font-extrabold text-emerald-800 tabular-nums">{fmt(selectedProductStats.profitFC - selectedProductStats.expensesFC)}</p></div>
              </div>
              <section>
                <h3 className="text-sm font-extrabold text-slate-900">{i18nText('product.history')}</h3>
                {selectedProductStats.sales.length ? (
                  <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[480px] text-left text-xs">
                      <thead className="bg-slate-50 text-[11px] text-slate-500"><tr><th className="px-3 py-2.5">Date</th><th className="px-3 py-2.5 text-right">Qté</th><th className="px-3 py-2.5 text-right">Vente</th><th className="px-3 py-2.5 text-right">Gain</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">{selectedProductStats.sales.slice(0, 20).map((sale) => <tr key={sale.id}><td className="px-3 py-2.5">{formatSaleTime(sale.timestamp)}</td><td className="px-3 py-2.5 text-right">{sale.quantity}</td><td className="px-3 py-2.5 text-right tabular-nums">{fmt(sale.totalRevenueFC + (sale.deliveryFeeFC || 0))}</td><td className="px-3 py-2.5 text-right font-bold text-emerald-700 tabular-nums">{fmt(sale.netProfitFC)}</td></tr>)}</tbody>
                    </table>
                  </div>
                ) : <p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">{i18nText('product.noSales')}</p>}
              </section>
              {selectedProductStats.expenses.length > 0 && (
                <section>
                  <h3 className="text-sm font-extrabold text-slate-900">{i18nText('product.relatedExpenses')}</h3>
                  <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 px-3">{selectedProductStats.expenses.map((expense) => <div key={expense.id} className="flex justify-between gap-3 py-2.5 text-xs"><span>{expense.label} · {formatSaleTime(expense.timestamp)}</span><strong className="shrink-0 text-amber-800 tabular-nums">−{fmt(expense.amountFC)}</strong></div>)}</div>
                </section>
              )}
              <div className="flex justify-end"><button type="button" onClick={() => setDetailsProduct(null)} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">{i18nText('product.close')}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
