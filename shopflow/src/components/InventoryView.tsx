import React, { useState } from 'react';
import {
  Calculator,
  Edit3,
  ImagePlus,
  LayoutGrid,
  List,
  PackagePlus,
  Plus,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { PRESET_PRODUCT_PHOTOS } from '../data/initialData';
import { Product, SaleRecord, ShopSettings } from '../types';
import {
  formatMoney,
  fromDisplayAmount,
  toDisplayAmount,
} from '../utils/currency';
import { parseSaleDate } from '../utils/saleDate';

interface InventoryViewProps {
  settings: ShopSettings;
  products: Product[];
  sales: SaleRecord[];
  onSaveProduct: (product: Product, isNew: boolean) => void;
  onRestockProduct: (product: Product) => void;
  onQuickSellProduct: (product: Product) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  settings,
  products,
  sales,
  onSaveProduct,
  onRestockProduct,
  onQuickSellProduct,
}) => {
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
    };

    onSaveProduct(saved, !editingProduct);
    setIsModalOpen(false);
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

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter une marchandise</span>
        </button>
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

                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-3">
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Merchandise Modal with Live Automatic Profit Calculation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-[2px]">
          <div className="my-8 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
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
    </div>
  );
};
