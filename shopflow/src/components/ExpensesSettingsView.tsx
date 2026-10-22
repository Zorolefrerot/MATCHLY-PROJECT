import React, { useState } from 'react';
import {
  Bot,
  Check,
  Coins,
  Download,
  Eye,
  Globe2,
  ImagePlus,
  Lock,
  Plus,
  Receipt,
  RefreshCw,
  Sparkles,
  Store,
  Trash2,
  Upload,
} from 'lucide-react';
import { LANGUAGE_OPTIONS } from '../i18n/translations';
import {
  AppLanguage,
  CurrencyCode,
  ExpenseEntry,
  ShopSettings,
} from '../types';
import { formatMoney, fromDisplayAmount } from '../utils/currency';

interface ExpensesSettingsViewProps {
  settings: ShopSettings;
  expenses: ExpenseEntry[];
  onAddExpense: (expense: ExpenseEntry) => void;
  onDeleteExpense: (id: string) => void;
  onUpdateSettings: (next: ShopSettings) => void;
  onPreviewSampleReceipt: () => void;
  onResetDemo: () => void;
}

/**
 * Resizes uploaded shop logo cleanly via HTML5 Canvas so even 10MB camera photos save smoothly in localStorage
 */
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
  onPreviewSampleReceipt,
  onResetDemo,
}) => {
  const [section, setSection] = useState<
    'branding' | 'lang_currency' | 'expenses' | 'ai_security'
  >('branding');

  const [label, setLabel] = useState('');
  const [category, setCategory] =
    useState<ExpenseEntry['category']>('Transport');
  const [amountInput, setAmountInput] = useState('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const fmt = (val: number) =>
    formatMoney(val, settings.currency, settings.usdRateFC);

  const totalExpensesFC = expenses.reduce((sum, e) => sum + e.amountFC, 0);

  const notifySaved = (msg = 'Paramètres enregistrés !') => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 2200);
  };

  const handleShopLogoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await resizeLogoImage(file);
      onUpdateSettings({ ...settings, shopLogo: compressedDataUrl });
      notifySaved('Logo de la boutique mis à jour !');
    } catch {
      notifySaved('Impossible de lire cette image.');
    }
  };

  const handleLoadOtakuPreset = () => {
    onUpdateSettings({
      ...settings,
      shopName: 'MB_OTAKU STORE',
      ownerName: 'KABASELE Merdi',
      city: 'Kinshasa - Mont-Ngafula',
      whatsappNumber: '+243 97 123 4567',
      shopSpecialties: 'ANIME • MANGA • ACCESSOIRES • GOODIES',
      shopTagline: 'Votre passion, notre priorité !',
      instagramHandle: '@mb_otaku_store',
      businessActivity: "Importation & Vente d'articles Otaku",
      defaultDeliveryFeeFC: 2000,
      deliveryDelayText: '2 à 5 jours',
      returnPolicyText:
        'Aucun retour accepté sauf produit défectueux. Merci de bien conserver ce reçu.',
      receiptFooterSubtitle: 'Plus qu’une boutique, une communauté !',
      receiptQuote:
        '« Les vrais otakus ne collectionnent pas seulement des objets, ils collectionnent des émotions. »',
    });
    notifySaved(' Modèle MB_OTAKU STORE appliqué ! Cliquez sur « Voir mon Reçu ».');
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountFC = fromDisplayAmount(
      parseFloat(amountInput) || 0,
      settings.currency,
      settings.usdRateFC
    );
    if (!label.trim() || amountFC <= 0) return;

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    onAddExpense({
      id: `exp-${Date.now()}`,
      label: label.trim(),
      category,
      amountFC,
      timestamp: `${hh}:${mm}`,
    });

    setLabel('');
    setAmountInput('');
  };

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopflow-config-${settings.shopName.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notifySaved('Sauvegarde téléchargée !');
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
            { id: 'branding', label: '🏪 Boutique, Logo & Reçu', icon: Store },
            {
              id: 'lang_currency',
              label: '🌍 Langues (5) & Devise',
              icon: Globe2,
            },
            {
              id: 'expenses',
              label: `🧾 Dépenses (${expenses.length})`,
              icon: Receipt,
            },
            { id: 'ai_security', label: '🤖 IA & Sécurité', icon: Bot },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setSection(
                  tab.id as
                    | 'branding'
                    | 'lang_currency'
                    | 'expenses'
                    | 'ai_security'
                )
              }
              className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
                section === tab.id
                  ? 'bg-[#081844] text-white shadow-xs'
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
          <button
            type="button"
            onClick={onPreviewSampleReceipt}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-xs transition hover:bg-emerald-700"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Aperçu de mon Reçu WhatsApp</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          TAB 1: BOUTIQUE, LOGO PROPRIÉTAIRE & PERSONNALISATION REÇU
         ========================================================= */}
      {section === 'branding' && (
        <div className="grid grid-cols-1 gap-6 @lg:grid-cols-12">
          {/* Logo Uploader Card */}
          <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 @lg:col-span-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImagePlus className="h-5 w-5 text-[#0A4DFF]" />
                <h2 className="text-base font-extrabold text-slate-900">
                  Logo de votre Boutique
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Importez l’image/logo de votre commerce : il s’affichera dans l’application, votre boutique en ligne et **en haut à gauche de tous vos reçus WhatsApp**.
            </p>

            <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
              {settings.shopLogo ? (
                <img
                  src={settings.shopLogo}
                  alt={settings.shopName}
                  className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-md ring-2 ring-slate-900"
                />
              ) : (
                <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-[#081844] via-[#0A4DFF] to-[#00B4FF] text-white shadow-md">
                  <span className="text-2xl font-black">{shopInitials}</span>
                  <span className="text-[10px] font-bold tracking-widest uppercase">
                    LOGO
                  </span>
                </div>
              )}

              <p className="mt-3 text-sm font-extrabold text-slate-900">
                {settings.shopName}
              </p>
              <p className="text-[11px] font-semibold text-slate-500">
                {settings.shopTagline}
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0A4DFF] px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-[#0839C8]">
                  <Upload className="h-4 w-4" />
                  <span>Importer le logo (Galerie / PC)</span>
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
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    Retirer
                  </button>
                )}
              </div>
            </div>

            {/* 1-Click Preset for MB_OTAKU STORE */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-xs">
              <div className="flex items-center gap-1.5 font-extrabold text-[#081844]">
                <Sparkles className="h-4 w-4 text-[#0A4DFF]" />
                <span>Test rapide : Exemple « MB_OTAKU STORE »</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-600">
                Remplit automatiquement toutes les informations du modèle *MB_OTAKU STORE* (Mont-Ngafula, slogan, citation Otaku) en 1 clic :
              </p>
              <button
                type="button"
                onClick={handleLoadOtakuPreset}
                className="mt-3 w-full rounded-xl bg-[#081844] py-2.5 text-xs font-extrabold text-white transition hover:bg-slate-800"
              >
                Appliquer le profil exemple « MB_OTAKU STORE »
              </button>
            </div>
          </div>

          {/* Shop Identity & Receipt Customization Fields */}
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-xs @lg:col-span-7">
            <h2 className="text-base font-extrabold text-slate-900">
              Informations commerciales & Modèle de Reçu WhatsApp
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
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-bold text-slate-900 focus:border-[#0A4DFF] focus:outline-hidden"
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
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold text-slate-900 focus:border-[#0A4DFF] focus:outline-hidden"
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
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-medium text-slate-900 focus:border-[#0A4DFF] focus:outline-hidden"
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
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold text-slate-900 focus:border-[#0A4DFF] focus:outline-hidden"
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
                  placeholder="@ma_boutique"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-medium text-slate-900 focus:border-[#0A4DFF] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Type d’activité (en haut à droite du reçu)
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
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-medium text-slate-900 focus:border-[#0A4DFF] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">
                Catégories / Spécialités sous le titre (séparées par •)
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
                placeholder="ANIME • MANGA • ACCESSOIRES • GOODIES"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-bold uppercase text-slate-900 focus:border-[#0A4DFF] focus:outline-hidden"
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
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 italic font-semibold text-slate-900 focus:border-[#0A4DFF] focus:outline-hidden"
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
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-bold tabular-nums text-slate-900 focus:border-[#0A4DFF] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">
                Conditions affichées sur le reçu
              </label>
              <input
                type="text"
                value={settings.returnPolicyText}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    returnPolicyText: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-800 focus:border-[#0A4DFF] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">
                Citation personnalisée en bas à droite du reçu
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
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 italic text-slate-800 focus:border-[#0A4DFF] focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: LANGUES (FR, EN, LINGALA, SWAHILI, CHINOIS) & DEVISE
         ========================================================= */}
      {section === 'lang_currency' && (
        <div className="grid grid-cols-1 gap-6 @lg:grid-cols-2">
          {/* 5 Languages Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2.5">
              <Globe2 className="h-5 w-5 text-[#0A4DFF]" />
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Langue de l’application & de l’IA
                </h2>
                <p className="text-xs text-slate-500">
                  Traduit l’interface et configure la langue par défaut de ShopFlow IA
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
                      notifySaved(`Langue changée : ${lang.nativeLabel}`);
                    }}
                    className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-[#0A4DFF] bg-blue-50/70 ring-1 ring-[#0A4DFF]'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
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
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0A4DFF] text-white">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Currency & Daily Exchange Rate Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-xs">
            <div className="flex items-center gap-2.5">
              <Coins className="h-5 w-5 text-emerald-600" />
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Devise & Taux du Dollar en RDC
                </h2>
                <p className="text-xs text-slate-500">
                  Choisissez la devise unique affichée dans tous vos écrans et reçus
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
                      ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-black text-slate-900">
                    {curr === 'FC'
                      ? 'Franc Congolais (CDF / FC)'
                      : 'Dollar Américain (USD $)'}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {curr === 'FC' ? 'Ex: 68 000 FC' : 'Ex: 23,86 $'}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <label className="block font-extrabold text-slate-800">
                Taux de change du jour (1 USD en Francs Congolais)
              </label>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Permet de convertir instantanément toute votre boutique entre FC et USD sans erreur.
              </p>
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
          TAB 3: DÉPENSES DE LA JOURNÉE
         ========================================================= */}
      {section === 'expenses' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Dépenses de la journée
              </h2>
              <p className="text-xs text-slate-500">
                Déduites automatiquement pour calculer votre vrai revenu net
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Total du jour</span>
              <p className="text-xl font-black text-amber-700 tabular-nums">
                {fmt(totalExpensesFC)}
              </p>
            </div>
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
              className="flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 @sm:col-span-2"
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
                    {exp.timestamp} · {exp.category}
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

      {/* =========================================================
          TAB 4: CONFIGURATION IA AVANCÉE, SÉCURITÉ PIN & SAUVEGARDE
         ========================================================= */}
      {section === 'ai_security' && (
        <div className="grid grid-cols-1 gap-6 @lg:grid-cols-2">
          {/* AI Configuration */}
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-xs">
            <div className="flex items-center gap-2.5">
              <Bot className="h-5 w-5 text-[#0A4DFF]" />
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Moteur ShopFlow Intelligence (IA Temps Réel)
                </h2>
                <p className="text-xs text-slate-500">
                  Connecté par défaut sans clé requise · Clé API dédiée optionnelle ci-dessous
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-50/80 p-3.5 text-emerald-900">
              <strong>✓ Statut :</strong> IA Cloud active et connectée aux chiffres réels de votre boutique.
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">
                Clé API dédiée optionnelle (OpenAI / OpenRouter / Groq)
              </label>
              <input
                type="password"
                value={settings.customAiApiKey}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    customAiApiKey: e.target.value,
                  })
                }
                placeholder="Laisser vide pour utiliser le moteur Cloud ShopFlow intégré"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Endpoint compatible OpenAI
                </label>
                <input
                  type="text"
                  value={settings.customAiEndpoint}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      customAiEndpoint: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Modèle IA
                </label>
                <input
                  type="text"
                  value={settings.customAiModel}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      customAiModel: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Security, Backup & Reset */}
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="h-5 w-5 text-slate-800" />
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Sécurité Propriétaire & Sauvegarde
                </h2>
                <p className="text-xs text-slate-500">
                  Protégez vos paramètres sensibles et exportez vos données
                </p>
              </div>
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">
                Code PIN Propriétaire (4 chiffres)
              </label>
              <input
                type="password"
                maxLength={6}
                value={settings.ownerPin}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, ownerPin: e.target.value })
                }
                className="w-40 rounded-xl border border-slate-200 px-3.5 py-2 font-mono text-sm font-bold tracking-widest"
              />
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-3 font-bold text-slate-800 transition hover:bg-slate-100"
              >
                <Download className="h-4 w-4 text-[#0A4DFF]" />
                <span>Télécharger une sauvegarde de ma configuration</span>
              </button>

              <button
                type="button"
                onClick={onResetDemo}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/50 py-3 font-bold text-red-700 transition hover:bg-red-100/60"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Réinitialiser les données de démonstration</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
