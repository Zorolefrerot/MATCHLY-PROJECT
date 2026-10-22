import React, { useState } from 'react';
import {
  Check,
  Coins,
  Plus,
  Receipt,
  RefreshCw,
  Store,
  Trash2,
  WifiOff,
} from 'lucide-react';
import { CurrencyCode, ExpenseEntry, ShopSettings } from '../types';
import { formatMoney, fromDisplayAmount } from '../utils/currency';

interface ExpensesSettingsViewProps {
  settings: ShopSettings;
  expenses: ExpenseEntry[];
  onAddExpense: (expense: ExpenseEntry) => void;
  onDeleteExpense: (id: string) => void;
  onUpdateSettings: (next: ShopSettings) => void;
  onResetDemo: () => void;
}

export const ExpensesSettingsView: React.FC<ExpensesSettingsViewProps> = ({
  settings,
  expenses,
  onAddExpense,
  onDeleteExpense,
  onUpdateSettings,
  onResetDemo,
}) => {
  const [label, setLabel] = useState('');
  const [category, setCategory] =
    useState<ExpenseEntry['category']>('Transport');
  const [amountInput, setAmountInput] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  const fmt = (val: number) => formatMoney(val, settings.currency, settings.usdRateFC);

  const totalExpensesFC = expenses.reduce((sum, e) => sum + e.amountFC, 0);

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

  const setCurrencyChoice = (currency: CurrencyCode) => {
    onUpdateSettings({ ...settings, currency });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1800);
  };

  return (
    <div className="grid grid-cols-1 gap-6 pb-8 @lg:grid-cols-12">
      {/* Left Column: Daily Shop Expenses */}
      <div className="space-y-5 @lg:col-span-7">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Dépenses de la journée
                </h2>
                <p className="text-xs text-slate-500">
                  Déduites automatiquement pour afficher votre vrai revenu net
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-400">
                Total charges
              </span>
              <p className="text-lg font-extrabold text-amber-700 tabular-nums">
                {fmt(totalExpensesFC)}
              </p>
            </div>
          </div>

          {/* Add Expense Quick Form */}
          <form
            onSubmit={handleCreateExpense}
            className="mt-5 grid grid-cols-1 gap-3 rounded-2xl bg-slate-50 p-4 @sm:grid-cols-12"
          >
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Course moto, sachets, groupe..."
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-hidden @sm:col-span-5"
            />
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as ExpenseEntry['category'])
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-hidden @sm:col-span-3"
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
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 tabular-nums focus:border-emerald-500 focus:outline-hidden @sm:col-span-2"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 @sm:col-span-2"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter</span>
            </button>
          </form>

          {/* Expenses List */}
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
                    title="Supprimer cette dépense"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Boutique Settings & Single Currency Picker */}
      <div className="space-y-5 @lg:col-span-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-extrabold text-slate-900">
                Paramètres de la Boutique
              </h2>
            </div>
            {savedNotice && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                <Check className="h-3.5 w-3.5" />
                Enregistré
              </span>
            )}
          </div>

          <div className="mt-5 space-y-4 text-xs">
            {/* Single Currency Choice */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-emerald-700" />
                <label className="font-extrabold text-slate-900">
                  Devise d’affichage de la boutique (au choix)
                </label>
              </div>
              <p className="mt-1 text-[11px] text-slate-600">
                Une seule monnaie est affichée partout à l’écran pour rester simple et lisible.
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setCurrencyChoice('FC')}
                  className={`rounded-xl border p-3 text-left transition ${
                    settings.currency === 'FC'
                      ? 'border-emerald-600 bg-white shadow-2xs ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white/70 text-slate-600'
                  }`}
                >
                  <div className="font-extrabold text-slate-900">
                    Franc Congolais (FC)
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    Ex: 68 000 FC
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrencyChoice('USD')}
                  className={`rounded-xl border p-3 text-left transition ${
                    settings.currency === 'USD'
                      ? 'border-emerald-600 bg-white shadow-2xs ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white/70 text-slate-600'
                  }`}
                >
                  <div className="font-extrabold text-slate-900">
                    Dollar Américain ($)
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    Ex: 23,86 $
                  </div>
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 pt-1">
                <span className="text-[11px] font-medium text-slate-600">
                  Taux interne de référence (1 $ en FC) :
                </span>
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
                  className="w-28 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-right text-xs font-bold tabular-nums focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Shop Info */}
            <div>
              <label className="mb-1 block font-bold text-slate-700">
                Nom du commerce / boutique
              </label>
              <input
                type="text"
                value={settings.shopName}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, shopName: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
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
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-medium text-slate-900 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">
                Numéro WhatsApp du commerçant
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
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-medium text-slate-900 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Offline Mode Badge */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center gap-2.5">
                <WifiOff className="h-4 w-4 text-emerald-600" />
                <div>
                  <p className="font-bold text-slate-900">
                    Sauvegarde Hors-Ligne active
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Fonctionne même sans connexion data / internet
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.offlineSyncEnabled}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    offlineSyncEnabled: e.target.checked,
                  })
                }
                className="h-4 w-4 accent-emerald-600"
              />
            </div>

            {/* Reset Demo Data */}
            <button
              type="button"
              onClick={onResetDemo}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Réinitialiser les données de la maquette</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
