import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  MessageCircle,
  Plus,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { CreditEntry, ShopSettings } from '../types';
import { formatMoney, fromDisplayAmount } from '../utils/currency';

interface CreditsViewProps {
  settings: ShopSettings;
  credits: CreditEntry[];
  onRecordCreditPayment: (creditId: string, amountFC: number) => void;
  onAddCreditEntry: (entry: CreditEntry) => void;
  onSendCreditReminder: (message: string, customerName: string) => void;
}

export const CreditsView: React.FC<CreditsViewProps> = ({
  settings,
  credits,
  onRecordCreditPayment,
  onAddCreditEntry,
  onSendCreditReminder,
}) => {
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentInput, setPaymentInput] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  const [newCustomer, setNewCustomer] = useState('');
  const [newPhone, setNewPhone] = useState('+243 ');
  const [newItems, setNewItems] = useState('');
  const [newAmountInput, setNewAmountInput] = useState('');
  const [newDue, setNewDue] = useState('Fin de semaine');

  const fmt = (val: number) => formatMoney(val, settings.currency, settings.usdRateFC);

  const totalRemainingFC = credits.reduce(
    (sum, c) => sum + Math.max(0, c.totalAmountFC - c.paidAmountFC),
    0
  );
  const totalAlreadyPaidFC = credits.reduce((sum, c) => sum + c.paidAmountFC, 0);

  const handleConfirmPayment = (credit: CreditEntry) => {
    const valFC = fromDisplayAmount(
      parseFloat(paymentInput) || 0,
      settings.currency,
      settings.usdRateFC
    );
    if (valFC <= 0) return;
    onRecordCreditPayment(credit.id, valFC);
    setPayingId(null);
    setPaymentInput('');
  };

  const handleCreateCredit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalFC = fromDisplayAmount(
      parseFloat(newAmountInput) || 0,
      settings.currency,
      settings.usdRateFC
    );
    if (!newCustomer.trim() || totalFC <= 0) return;

    onAddCreditEntry({
      id: `cred-${Date.now()}`,
      customerName: newCustomer.trim(),
      phone: newPhone.trim() || '+243 81 000 00 00',
      itemsSummary: newItems.trim() || 'Marchandises diverses',
      totalAmountFC: totalFC,
      paidAmountFC: 0,
      createdAt: "Aujourd'hui",
      dueDate: newDue.trim() || 'Prochainement',
    });

    setNewCustomer('');
    setNewItems('');
    setNewAmountInput('');
    setShowNewModal(false);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 @md:flex-row @md:items-center @md:justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 @md:text-xl">
            Carnet « Bon / Crédit Clients »
          </h1>
          <p className="text-xs text-slate-500">
            Ne perdez plus aucun franc laissé à crédit : suivez chaque avance et envoyez un rappel poli sur WhatsApp.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
        >
          <UserPlus className="h-4 w-4" />
          <span>Noter un nouveau crédit</span>
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 gap-4 @sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <span className="text-xs font-semibold text-amber-900">
            Total restant dehors à récupérer
          </span>
          <div className="mt-1.5 text-2xl font-extrabold text-amber-800 tabular-nums">
            {fmt(totalRemainingFC)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-500">
            Avances déjà encaissées
          </span>
          <div className="mt-1.5 text-2xl font-extrabold text-emerald-700 tabular-nums">
            {fmt(totalAlreadyPaidFC)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-500">
            Clients dans le carnet
          </span>
          <div className="mt-1.5 flex items-center gap-2 text-2xl font-extrabold text-slate-900 tabular-nums">
            <Users className="h-5 w-5 text-emerald-600" />
            <span>{credits.length}</span>
          </div>
        </div>
      </div>

      {/* Credit Cards List */}
      <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2">
        {credits.map((credit) => {
          const remainingFC = Math.max(
            0,
            credit.totalAmountFC - credit.paidAmountFC
          );
          const isSettled = remainingFC === 0;
          const pctPaid = Math.min(
            100,
            Math.round((credit.paidAmountFC / Math.max(1, credit.totalAmountFC)) * 100)
          );

          const whatsappMsg =
            `Bonjour *${credit.customerName}* 👋,\n\n` +
            `Petit rappel amical de la boutique *${settings.shopName}* concernant votre bon (${credit.itemsSummary}).\n` +
            `• Montant total : ${fmt(credit.totalAmountFC)}\n` +
            `• Déjà avancé : ${fmt(credit.paidAmountFC)}\n` +
            `• *Reste à régler : ${fmt(remainingFC)}* (prévu : ${credit.dueDate})\n\n` +
            `Vous pouvez passer à la boutique ou régler via Mobile Money au ${settings.whatsappNumber}. Merci beaucoup ! 🙏`;

          return (
            <div
              key={credit.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {credit.customerName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {credit.phone} · Pris {credit.createdAt}
                    </p>
                  </div>
                  {isSettled ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Soldé
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                      <Clock className="h-3.5 w-3.5" />
                      Échéance : {credit.dueDate}
                    </span>
                  )}
                </div>

                <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  <strong>Articles :</strong> {credit.itemsSummary}
                </p>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">
                      Avancé : <strong className="text-emerald-700">{fmt(credit.paidAmountFC)}</strong>
                    </span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      Reste : {fmt(remainingFC)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      style={{ width: `${pctPaid}%` }}
                      className="h-full bg-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Payment input or Action buttons */}
              {!isSettled && (
                <div className="mt-4 border-t border-slate-100 pt-3.5">
                  {payingId === credit.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={paymentInput}
                        onChange={(e) => setPaymentInput(e.target.value)}
                        placeholder={`Montant reçu (${settings.currency})`}
                        className="flex-1 rounded-xl border border-emerald-400 px-3 py-2 text-xs font-bold text-slate-900 tabular-nums focus:outline-hidden"
                      />
                      <button
                        onClick={() => handleConfirmPayment(credit)}
                        className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        Valider
                      </button>
                      <button
                        onClick={() => setPayingId(null)}
                        className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs text-slate-500"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => {
                          setPayingId(credit.id);
                          setPaymentInput('');
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Encaisser avance</span>
                      </button>

                      <button
                        onClick={() =>
                          onSendCreditReminder(whatsappMsg, credit.customerName)
                        }
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Rappel WhatsApp</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add New Credit Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900">
                Nouveau Bon / Crédit Client
              </h2>
              <button
                onClick={() => setShowNewModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCredit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Nom du client *
                </label>
                <input
                  type="text"
                  required
                  value={newCustomer}
                  onChange={(e) => setNewCustomer(e.target.value)}
                  placeholder="Ex: Maman Clarisse"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Téléphone WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">
                    Date promise
                  </label>
                  <input
                    type="text"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    placeholder="Ex: Samedi prochain"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Marchandises prises
                </label>
                <input
                  type="text"
                  value={newItems}
                  onChange={(e) => setNewItems(e.target.value)}
                  placeholder="Ex. 1x Collier, 1x Bracelet"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Montant dû ({settings.currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={newAmountInput}
                  onChange={(e) => setNewAmountInput(e.target.value)}
                  placeholder={settings.currency === 'FC' ? '87000' : '30.5'}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-extrabold tabular-nums focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700"
                >
                  Enregistrer le bon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
