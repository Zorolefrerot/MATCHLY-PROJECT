import React, { useState } from 'react';
import {
  Bot,
  Check,
  Coins,
  Download,
  Globe2,
  ImagePlus,
  LayoutGrid,
  Lock,
  Moon,
  Palette,
  Plus,
  Receipt,
  RefreshCw,
  Sparkles,
  Store,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { THEME_PRESETS } from '../data/initialData';
import { LANGUAGE_OPTIONS } from '../i18n/translations';
import {
  AppLanguage,
  CatalogDefaultFormat,
  ColorMode,
  CornerRadiusStyle,
  CurrencyCode,
  ExpenseEntry,
  FontStyleChoice,
  LayoutDensity,
  ShopSettings,
} from '../types';
import { formatMoney, fromDisplayAmount } from '../utils/currency';
import { formatSaleTime } from '../utils/saleDate';

interface ExpensesSettingsViewProps {
  settings: ShopSettings;
  expenses: ExpenseEntry[];
  onAddExpense: (expense: ExpenseEntry) => void;
  onDeleteExpense: (id: string) => void;
  onUpdateSettings: (next: ShopSettings) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onResetDemo: () => void;
  onActivateVendorLock?: () => void;
}

function resizeLogoImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 280;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const ExpensesSettingsView: React.FC<ExpensesSettingsViewProps> = ({
  settings,
  expenses,
  onAddExpense,
  onDeleteExpense,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onResetDemo,
  onActivateVendorLock,
}) => {
  const [section, setSection] = useState<
    'theme' | 'branding' | 'lang_currency' | 'ai_voice' | 'expenses'
  >('theme');

  const [label, setLabel] = useState('');
  const [category, setCategory] =
    useState<ExpenseEntry['category']>('Transport');
  const [amountInput, setAmountInput] = useState('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const fmt = (val: number) =>
    formatMoney(val, settings.currency, settings.usdRateFC);

  const totalExpensesFC = expenses.reduce((sum, e) => sum + e.amountFC, 0);

  const notifySaved = (msg = 'Modifications appliquées !') => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 2200);
  };

  const updateTheme = (patch: Partial<ShopSettings['theme']>) => {
    onUpdateSettings({
      ...settings,
      theme: {
        ...settings.theme,
        presetId: patch.presetId ?? 'custom',
        ...patch,
      },
    });
    notifySaved('Thème mis à jour en direct !');
  };

  const handleShopLogoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await resizeLogoImage(file);
      onUpdateSettings({ ...settings, shopLogo: compressedDataUrl });
      notifySaved('Logo de la boutique enregistré !');
    } catch {
      notifySaved('Impossible de lire cette image.');
    }
  };



  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountFC = fromDisplayAmount(
      parseFloat(amountInput) || 0,
      settings.currency,
      settings.usdRateFC
    );
    if (!label.trim() || amountFC <= 0) return;

    onAddExpense({
      id: `exp-${Date.now()}`,
      label: label.trim(),
      category,
      amountFC,
      timestamp: new Date().toISOString(),
    });

    setLabel('');
    setAmountInput('');
  };



  const shopInitials = settings.shopName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6 pb-10">
      {/* Top Sub-Navigation Pills */}
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 @lg:flex-row @lg:items-center @lg:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1 @lg:pb-0">
          {[
            { id: 'theme', label: '🎨 Thème, Couleurs & Format', icon: Palette },
            { id: 'branding', label: '🏪 Boutique, Logo & Reçu', icon: Store },
            {
              id: 'lang_currency',
              label: '🌍 Langues (5) & Devise',
              icon: Globe2,
            },
            { id: 'ai_voice', label: 'IA & Sécurité', icon: Bot },
            {
              id: 'expenses',
              label: `🧾 Dépenses (${expenses.length})`,
              icon: Receipt,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setSection(
                  tab.id as
                    | 'theme'
                    | 'branding'
                    | 'lang_currency'
                    | 'ai_voice'
                    | 'expenses'
                )
              }
              className={`shrink-0 rounded-xl px-3.5 py-2.5 text-xs font-extrabold transition ${
                section === tab.id
                  ? 'bg-[#0A4DFF] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {savedNotice && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <Check className="h-3.5 w-3.5" />
              {savedNotice}
            </span>
          )}
        </div>
      </div>

      {/* =========================================================
          TAB 1: CUSTOM BOUTIQUE THEME, COLORS & FORMAT STUDIO
         ========================================================= */}
      {section === 'theme' && (
        <div className="grid grid-cols-1 gap-6 @lg:grid-cols-12">
          {/* Left: Preset Themes + Custom Color Pickers */}
          <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 @lg:col-span-7">
            <div className="flex items-center gap-2.5">
              <Palette className="h-5 w-5 text-[#0A4DFF]" />
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Thèmes & Couleurs Personnalisées de la Boutique
                </h2>
                <p className="text-xs text-slate-500">
                  Choisissez une ambiance prête à l’emploi ou créez exactement vos propres couleurs.
                </p>
              </div>
            </div>

            {/* 5 One-Click Presets */}
            <div className="grid grid-cols-1 gap-2.5 @sm:grid-cols-2">
              {THEME_PRESETS.map((preset) => {
                const isSelected = settings.theme.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => updateTheme(preset.config)}
                    className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${
                      isSelected
                        ? 'border-[#0A4DFF] bg-blue-50/40 ring-2 ring-[#0A4DFF]/30'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-1.5">
                        <span
                          style={{ backgroundColor: preset.config.primaryColor }}
                          className="h-6 w-6 rounded-full ring-2 ring-white"
                        />
                        <span
                          style={{ backgroundColor: preset.config.accentColor }}
                          className="h-6 w-6 rounded-full ring-2 ring-white"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">
                          {preset.name}
                        </p>
                        <p className="text-[10.5px] text-slate-500">
                          {preset.subtitle}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-[#0A4DFF]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Color Pickers (Primary, Dark Header, Accent Gain) */}
            <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 text-xs @sm:grid-cols-3">
              <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                <div>
                  <span className="block font-extrabold text-slate-900">
                    Couleur Principale
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {settings.theme.primaryColor}
                  </span>
                </div>
                <input
                  type="color"
                  value={settings.theme.primaryColor}
                  onChange={(e) =>
                    updateTheme({ primaryColor: e.target.value })
                  }
                  className="h-9 w-9 cursor-pointer rounded-lg border-0 bg-transparent"
                />
              </label>

              <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                <div>
                  <span className="block font-extrabold text-slate-900">
                    Couleur Secondaire
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {settings.theme.accentColor}
                  </span>
                </div>
                <input
                  type="color"
                  value={settings.theme.accentColor}
                  onChange={(e) => updateTheme({ accentColor: e.target.value })}
                  className="h-9 w-9 cursor-pointer rounded-lg border-0 bg-transparent"
                />
              </label>

              <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                <div>
                  <span className="block font-extrabold text-slate-900">
                    En-tête & Reçu
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {settings.theme.primaryDarkColor}
                  </span>
                </div>
                <input
                  type="color"
                  value={settings.theme.primaryDarkColor}
                  onChange={(e) =>
                    updateTheme({ primaryDarkColor: e.target.value })
                  }
                  className="h-9 w-9 cursor-pointer rounded-lg border-0 bg-transparent"
                />
              </label>
            </div>
          </div>

          {/* Right: Mode (Clair / Sombre / Papier) + Format, Coins, Police & Densité */}
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-xs @lg:col-span-5">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-[#0A4DFF]" />
              <h2 className="text-base font-extrabold text-slate-900">
                Format & Style d’Affichage
              </h2>
            </div>

            {/* Light / Dark / Warm Mode */}
            <div>
              <label className="mb-1.5 block font-bold text-slate-700">
                Luminosité de l’application
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'light', label: 'Clair Jour', icon: Sun },
                    { id: 'dark', label: 'Sombre Nuit', icon: Moon },
                    { id: 'warm', label: 'Papier Doux', icon: Sparkles },
                  ] as { id: ColorMode; label: string; icon: typeof Sun }[]
                ).map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => updateTheme({ colorMode: m.id })}
                      className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 font-bold transition ${
                        settings.theme.colorMode === m.id
                          ? 'border-[#0A4DFF] bg-[#0A4DFF] text-white'
                          : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Corner Radius Style */}
            <div>
              <label className="mb-1.5 block font-bold text-slate-700">
                Forme des cartes & boutons
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'sharp', label: 'Carré Pro' },
                    { id: 'modern', label: 'Moderne' },
                    { id: 'round', label: 'Arrondi Doux' },
                  ] as { id: CornerRadiusStyle; label: string }[]
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => updateTheme({ cornerStyle: c.id })}
                    className={`rounded-xl border py-2 font-bold transition ${
                      settings.theme.cornerStyle === c.id
                        ? 'border-[#0A4DFF] bg-[#0A4DFF] text-white'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Default Product Display Format */}
            <div>
              <label className="mb-1.5 block font-bold text-slate-700">
                Format par défaut du stock & catalogue
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'grid', label: 'Grille Grandes Photos' },
                    { id: 'table', label: 'Tableau Caisse Pro' },
                  ] as { id: CatalogDefaultFormat; label: string }[]
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => updateTheme({ defaultCatalogFormat: f.id })}
                    className={`rounded-xl border py-2 font-bold transition ${
                      settings.theme.defaultCatalogFormat === f.id
                        ? 'border-[#0A4DFF] bg-[#0A4DFF] text-white'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Typography & Density */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Style de police
                </label>
                <select
                  value={settings.theme.fontStyle}
                  onChange={(e) =>
                    updateTheme({
                      fontStyle: e.target.value as FontStyleChoice,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-bold text-slate-800"
                >
                  <option value="modern">Moderne Sans</option>
                  <option value="editorial">Classique Élégant</option>
                  <option value="mono">Technique Caisse</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Espacement écran
                </label>
                <select
                  value={settings.theme.density}
                  onChange={(e) =>
                    updateTheme({ density: e.target.value as LayoutDensity })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-bold text-slate-800"
                >
                  <option value="comfortable">Confortable & Aéré</option>
                  <option value="compact">Compact Haute Densité</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: BOUTIQUE, LOGO PROPRIÉTAIRE & REÇU WHATSAPP
         ========================================================= */}
      {section === 'branding' && (
        <div className="grid grid-cols-1 gap-6 @lg:grid-cols-12">
          <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 @lg:col-span-5">
            <div className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-[#0A4DFF]" />
              <h2 className="text-base font-extrabold text-slate-900">
                Logo de votre Boutique
              </h2>
            </div>

            <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
              {settings.shopLogo ? (
                <img
                  src={settings.shopLogo}
                  alt={settings.shopName}
                  className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-md ring-2 ring-slate-900"
                />
              ) : (
                <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 border-white bg-[#0A4DFF] text-white shadow-md">
                  <span className="text-2xl font-black">{shopInitials}</span>
                  <span className="text-[10px] font-bold tracking-widest uppercase">
                    LOGO
                  </span>
                </div>
              )}

              <p className="mt-3 text-sm font-extrabold text-slate-900">
                {settings.shopName}
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0A4DFF] px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition hover:opacity-90">
                  <Upload className="h-4 w-4" />
                  <span>Importer une image Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleShopLogoUpload}
                    className="hidden"
                  />
                </label>

                {settings.shopLogo && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ ...settings, shopLogo: '' })
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-red-600"
                  >
                    Retirer
                  </button>
                )}
              </div>
            </div>

          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-xs @lg:col-span-7">
            <h2 className="text-base font-extrabold text-slate-900">
              Informations commerciales & Personnalisation du Reçu
            </h2>

            <div className="grid grid-cols-1 gap-3.5 @sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Nom de la boutique
                </label>
                <input
                  type="text"
                  value={settings.shopName}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, shopName: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Nom du propriétaire / vendeur
                </label>
                <input
                  type="text"
                  value={settings.ownerName}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, ownerName: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Ville / Commune (RDC)
                </label>
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, city: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Numéro WhatsApp Business
                </label>
                <input
                  type="tel"
                  value={settings.whatsappNumber}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      whatsappNumber: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Compte Instagram / TikTok
                </label>
                <input
                  type="text"
                  value={settings.instagramHandle}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      instagramHandle: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Activité affichée sur le reçu
                </label>
                <input
                  type="text"
                  value={settings.businessActivity}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      businessActivity: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-medium text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">
                Spécialités sous le titre (séparées par •)
              </label>
              <input
                type="text"
                value={settings.shopSpecialties}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    shopSpecialties: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-bold uppercase text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 gap-3.5 @sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Slogan souligné du reçu
                </label>
                <input
                  type="text"
                  value={settings.shopTagline}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      shopTagline: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 italic font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Frais de livraison par défaut (FC)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.defaultDeliveryFeeFC}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      defaultDeliveryFeeFC: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-bold tabular-nums text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">
                Citation en bas à droite du reçu
              </label>
              <input
                type="text"
                value={settings.receiptQuote}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    receiptQuote: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 italic text-slate-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: TRADUCTION INTÉGRALE 5 LANGUES + DEVISE
         ========================================================= */}
      {section === 'lang_currency' && (
        <div className="grid grid-cols-1 gap-6 @lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2.5">
              <Globe2 className="h-5 w-5 text-[#0A4DFF]" />
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Traduction Intégrale de toute l’Application (IA Active)
                </h2>
                <p className="text-xs text-slate-500">
                  Traduit immédiatement tous les menus, boutons, produits, tableaux, reçus et l’IA.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2.5 @sm:grid-cols-2">
              {LANGUAGE_OPTIONS.map((lang) => {
                const isSelected = settings.language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      onUpdateSettings({
                        ...settings,
                        language: lang.code as AppLanguage,
                      });
                      notifySaved(`Application traduite : ${lang.nativeLabel}`);
                    }}
                    className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-[#0A4DFF] bg-blue-50/40 ring-2 ring-[#0A4DFF]/30'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">
                          {lang.nativeLabel}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {lang.label}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-[#0A4DFF]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-xs">
            <div className="flex items-center gap-2.5">
              <Coins className="h-5 w-5 text-emerald-600" />
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Devise Unique & Taux du Jour
                </h2>
                <p className="text-xs text-slate-500">
                  Bascule toute la boutique entre Franc Congolais (FC) et Dollar (USD $)
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {(['FC', 'USD'] as CurrencyCode[]).map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => {
                    onUpdateSettings({ ...settings, currency: curr });
                    notifySaved(`Devise active : ${curr}`);
                  }}
                  className={`rounded-2xl border p-4 text-left transition ${
                    settings.currency === curr
                      ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-600/30'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-black text-slate-900">
                    {curr === 'FC'
                      ? 'Franc Congolais (CDF / FC)'
                      : 'Dollar Américain (USD $)'}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <label className="block font-extrabold text-slate-800">
                Taux de change du jour (1 USD en FC)
              </label>
              <div className="mt-3 flex items-center gap-3">
                <span className="font-bold text-slate-600">1 $ =</span>
                <input
                  type="number"
                  min="500"
                  value={settings.usdRateFC}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      usdRateFC: Math.max(100, Number(e.target.value) || 2850),
                    })
                  }
                  className="w-36 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-black text-slate-900 tabular-nums"
                />
                <span className="font-bold text-slate-600">FC</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 4: AI STATUS & SECURITY
         ========================================================= */}
      {section === 'ai_voice' && (
        <div className="grid grid-cols-1 gap-6 @lg:grid-cols-2">
          {/* Clear Patron / Vendor Security Lock & Backups (No confusing API keys!) */}
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="h-5 w-5 text-[#0A4DFF]" />
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Cadenas Patron & Mode Vendeur (Employé)
                </h2>
                <p className="text-xs text-slate-500">
                  Protégez vos bénéfices secrets quand un employé tient la caisse
                </p>
              </div>
            </div>

            {/* Reassuring Automatic AI Banner */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-emerald-950">
              <p className="font-extrabold">
                ShopFlow AI : service en ligne gratuit avec secours local
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-emerald-800">
                Les calculs et actions liés aux données de la boutique restent disponibles sur cet appareil. Les réponses générales peuvent utiliser un fournisseur externe gratuit ; sa disponibilité et sa qualité ne sont pas garanties. Aucun abonnement ChatGPT payant n’est requis par ShopFlow, mais une connexion peut être nécessaire pour les réponses en ligne.
              </p>
            </div>

            {/* Crystal-Clear Explanation + Working Boss PIN */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div>
                <p className="font-extrabold text-slate-900">
                  🔑 À quoi sert votre Code PIN Patron (4 chiffres) ?
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  Quand vous laissez un <strong>vendeur ou caissier</strong> travailler sur le téléphone, activez le <strong>Mode Vendeur</strong> : il pourra encaisser les ventes et imprimer les reçus WhatsApp, <strong>mais vos bénéfices nets, vos prix d’achat fournisseurs et vos paramètres seront verrouillés</strong> tant que votre code à 4 chiffres n’est pas saisi.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-700">
                    Votre Code Secret Patron (modifiable)
                  </label>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-[#0A4DFF]" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={settings.ownerPin}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          ownerPin: e.target.value.replace(/[^0-9]/g, '').slice(0, 6),
                        })
                      }
                      placeholder="1234"
                      className="w-32 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-center font-mono text-sm font-black tracking-[0.3em] text-slate-900"
                    />
                  </div>
                </div>

                {onActivateVendorLock && (
                  <button
                    type="button"
                    onClick={onActivateVendorLock}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0A4DFF] px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition hover:opacity-90"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Activer Mode Vendeur</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                onClick={onExportBackup}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-3 font-bold text-slate-800"
              >
                <Download className="h-4 w-4 text-[#0A4DFF]" />
                <span>Exporter la sauvegarde de ma boutique</span>
              </button>

              <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 py-3 font-bold text-blue-900 hover:bg-blue-100">
                <Upload className="h-4 w-4" />
                <span>Importer une sauvegarde</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (file) onImportBackup(file);
                    event.currentTarget.value = '';
                  }}
                />
              </label>

              <button
                type="button"
                onClick={onResetDemo}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/50 py-3 font-bold text-red-700"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Effacer les données locales de la boutique</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 5: DÉPENSES DE LA JOURNÉE
         ========================================================= */}
      {section === 'expenses' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Dépenses de la journée
              </h2>
              <p className="text-xs text-slate-500">
                Déduites automatiquement de votre bénéfice brut
              </p>
            </div>
            <p className="text-xl font-black text-amber-700 tabular-nums">
              {fmt(totalExpensesFC)}
            </p>
          </div>

          <form
            onSubmit={handleCreateExpense}
            className="mt-5 grid grid-cols-1 gap-3 rounded-2xl bg-slate-50 p-4 @sm:grid-cols-12"
          >
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Course moto livraison, sachets, groupe..."
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 @sm:col-span-5"
            />
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as ExpenseEntry['category'])
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 @sm:col-span-3"
            >
              <option value="Transport">Transport</option>
              <option value="Emballage">Emballage</option>
              <option value="Énergie / Courant">Courant / Groupe</option>
              <option value="Autre">Autre</option>
            </select>
            <input
              type="number"
              step="any"
              min="1"
              required
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder={`Montant (${settings.currency})`}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 tabular-nums @sm:col-span-2"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white @sm:col-span-2"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter</span>
            </button>
          </form>

          <div className="mt-4 divide-y divide-slate-100">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between gap-3 py-3 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">{exp.label}</p>
                  <p className="text-[11px] text-slate-400">
                    {formatSaleTime(exp.timestamp)} · {exp.category}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-amber-800 tabular-nums">
                    − {fmt(exp.amountFC)}
                  </span>
                  <button
                    onClick={() => onDeleteExpense(exp.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
