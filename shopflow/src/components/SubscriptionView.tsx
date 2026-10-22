import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  CreditCard,
  Crown,
  Lock,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import { ShopSettings, SubscriptionPlanId } from '../types';

interface SubscriptionViewProps {
  settings: ShopSettings;
  onActivatePlan: (planId: SubscriptionPlanId, methodLabel: string) => void;
}

interface PlanOption {
  id: SubscriptionPlanId;
  name: string;
  badge?: string;
  monthlyUSD: number;
  subtitle: string;
  features: string[];
}

const PLANS: PlanOption[] = [
  {
    id: 'starter',
    name: 'Starter Boutique',
    monthlyUSD: 5,
    subtitle: 'Idéal pour démarrer proprement sans cahier papier.',
    features: [
      'Jusqu’à 50 marchandises avec photos',
      'Vente rapide « +1 Vendu » & Panier client',
      'Calcul automatique du CA & Revenu Net',
      'Mode Hors-Ligne (sans connexion internet)',
      'Résumé journalier WhatsApp',
    ],
  },
  {
    id: 'pro_ai',
    name: 'Pro IA & Croissance',
    badge: 'LE PLUS CHOISI EN RDC',
    monthlyUSD: 12,
    subtitle: 'Toute la puissance de l’IA et de la vente en ligne.',
    features: [
      'Marchandises & ventes illimitées',
      'Assistant IA Coach & Caisse Vocale illimité',
      'Scanner Code-Barres Caméra ultra-rapide',
      'Mini-Boutique en ligne « Commander sur WhatsApp »',
      'Carnet Crédits Clients (« Bons ») & Relances auto',
      'Support prioritaire WhatsApp 7j/7',
    ],
  },
  {
    id: 'business',
    name: 'Business Multi-Boutiques',
    monthlyUSD: 25,
    subtitle: 'Pour les propriétaires ayant plusieurs dépôts ou gérants.',
    features: [
      'Jusqu’à 5 boutiques / dépôts synchronisés',
      'Comptes Vendeurs / Gérants séparés anti-coulage',
      'Conseiller IA d’approvisionnement multi-stocks',
      'Export comptable PDF / Excel mensuel',
      'Accompagnement dédié à Kinshasa & Lubumbashi',
    ],
  },
];

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({
  settings,
  onActivatePlan,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    'monthly'
  );
  const [checkoutPlan, setCheckoutPlan] = useState<PlanOption | null>(null);
  const [payTab, setPayTab] = useState<'card' | 'mobile_money'>('card');

  // Card Payment Inputs (Card Number, Cardholder Name, Expiry MM/YY, CVV)
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Mobile Money Inputs
  const [momoOperator, setMomoOperator] = useState<
    'M-Pesa' | 'Orange Money' | 'Airtel Money' | 'Afrimoney'
  >('M-Pesa');
  const [momoPhone, setMomoPhone] = useState(settings.whatsappNumber);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const formatCardNumberInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiryInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const detectCardNetwork = (num: string) => {
    if (num.startsWith('5')) return 'MASTERCARD';
    if (num.startsWith('4')) return 'VISA';
    return 'CARTE BANCAIRE';
  };

  const getPriceDisplay = (monthlyUSD: number) => {
    const finalUSD =
      billingCycle === 'annual' ? Math.round(monthlyUSD * 0.8 * 10) / 10 : monthlyUSD;
    if (settings.currency === 'FC') {
      const fc = Math.round(finalUSD * settings.usdRateFC);
      return `${fc.toLocaleString('fr-FR')} FC`;
    }
    return `${finalUSD} $`;
  };

  const getTotalCheckoutDisplay = (plan: PlanOption) => {
    const months = billingCycle === 'annual' ? 12 : 1;
    const perMonthUSD =
      billingCycle === 'annual'
        ? Math.round(plan.monthlyUSD * 0.8 * 10) / 10
        : plan.monthlyUSD;
    const totalUSD = perMonthUSD * months;

    if (settings.currency === 'FC') {
      return `${Math.round(totalUSD * settings.usdRateFC).toLocaleString('fr-FR')} FC`;
    }
    return `${totalUSD.toFixed(2)} $`;
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutPlan) return;

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      const label =
        payTab === 'card'
          ? `Carte ${detectCardNetwork(cardNumber)} •••• ${
              cardNumber.replace(/\s/g, '').slice(-4) || '4242'
            }`
          : `${momoOperator} (${momoPhone})`;
      onActivatePlan(checkoutPlan.id, label);
    }, 1100);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 @lg:flex-row @lg:items-center @lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
            <Crown className="h-3.5 w-3.5" />
            <span>
              {settings.planPaid
                ? `Abonnement Actif : ${
                    PLANS.find((p) => p.id === settings.activePlan)?.name
                  }`
                : 'Essai Gratuit 14 Jours · Choisissez votre formule'}
            </span>
          </div>
          <h1 className="mt-2 text-xl font-extrabold text-slate-900 @md:text-2xl">
            Abonnements ShopFlow RDC
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 @md:text-sm">
            Payez simplement par <strong>Carte Bancaire (Visa / Mastercard)</strong> ou{' '}
            <strong>Mobile Money</strong>. Sans engagement.
          </p>
        </div>

        {/* Monthly vs Annual Toggle */}
        <div className="inline-flex items-center self-start rounded-2xl bg-slate-100 p-1.5">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${
              billingCycle === 'monthly'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500'
            }`}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
              billingCycle === 'annual'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-500'
            }`}
          >
            <span>Annuel</span>
            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-800">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* 3 Pricing Cards */}
      <div className="grid grid-cols-1 gap-6 @lg:grid-cols-3">
        {PLANS.map((plan) => {
          const isPopular = plan.id === 'pro_ai';
          const isCurrentPaid =
            settings.planPaid && settings.activePlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-3xl border p-6 transition ${
                isPopular
                  ? 'border-emerald-500 bg-white shadow-lg ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-extrabold text-white shadow-xs">
                  <Sparkles className="h-3 w-3" />
                  {plan.badge}
                </span>
              )}

              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  {plan.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">{plan.subtitle}</p>

                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    {getPriceDisplay(plan.monthlyUSD)}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    / mois
                  </span>
                </div>

                <ul className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-xs text-slate-700">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="font-medium">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCheckoutPlan(plan);
                  setPaymentSuccess(false);
                }}
                className={`mt-7 w-full rounded-2xl py-3 text-xs font-extrabold transition ${
                  isCurrentPaid
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                    : isPopular
                      ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {isCurrentPaid
                  ? '✓ Formule actuellement active'
                  : `S’abonner à ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Interactive Payment Modal (Bank Card + Mobile Money) */}
      {checkoutPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="my-8 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal Top Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div>
                <span className="text-[11px] font-bold uppercase text-emerald-700">
                  Paiement sécurisé SSL 256-bit
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {checkoutPlan.name} — {getTotalCheckoutDisplay(checkoutPlan)}
                </h3>
              </div>
              <button
                onClick={() => setCheckoutPlan(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {paymentSuccess ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <h4 className="mt-4 text-lg font-extrabold text-slate-900">
                  Paiement approuvé & Abonnement activé !
                </h4>
                <p className="mt-1.5 text-xs text-slate-500">
                  Merci <strong>{cardHolder || settings.ownerName}</strong> ! Toutes les fonctionnalités{' '}
                  <strong>{checkoutPlan.name}</strong> sont désormais débloquées pour{' '}
                  <strong>{settings.shopName}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setCheckoutPlan(null)}
                  className="mt-6 w-full rounded-2xl bg-emerald-600 py-3 text-xs font-extrabold text-white hover:bg-emerald-700"
                >
                  Retourner à ma boutique ShopFlow
                </button>
              </div>
            ) : (
              <div className="p-6">
                {/* Payment Method Switch: Bank Card vs Mobile Money */}
                <div className="grid grid-cols-2 gap-2.5 rounded-2xl bg-slate-100 p-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setPayTab('card')}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 font-extrabold transition ${
                      payTab === 'card'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                    <span>Carte Bancaire</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayTab('mobile_money')}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 font-extrabold transition ${
                      payTab === 'mobile_money'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    <Smartphone className="h-4 w-4 text-emerald-600" />
                    <span>Mobile Money RDC</span>
                  </button>
                </div>

                {payTab === 'card' ? (
                  <form onSubmit={handleSubmitPayment} className="mt-5 space-y-4">
                    {/* Interactive Live Bank Card Preview */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-5 text-white shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold tracking-widest text-emerald-300 uppercase">
                          ShopFlow Pay · RDC International
                        </span>
                        <span className="rounded-md bg-white/15 px-2.5 py-0.5 text-xs font-extrabold tracking-wider">
                          {detectCardNetwork(cardNumber)}
                        </span>
                      </div>

                      <div className="mt-6 font-mono text-lg font-bold tracking-[0.18em] text-white @sm:text-xl">
                        {cardNumber || '4532 •••• •••• ••••'}
                      </div>

                      <div className="mt-5 flex items-end justify-between text-xs">
                        <div>
                          <span className="block text-[9px] uppercase text-slate-400">
                            Titulaire de la carte
                          </span>
                          <span className="font-bold tracking-wider uppercase">
                            {cardHolder || 'NOM DU TITULAIRE'}
                          </span>
                        </div>
                        <div className="flex gap-5">
                          <div>
                            <span className="block text-[9px] uppercase text-slate-400">
                              Expire
                            </span>
                            <span className="font-mono font-bold">
                              {cardExpiry || 'MM/AA'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase text-slate-400">
                              CVV
                            </span>
                            <span className="font-mono font-bold">
                              {cardCvv ? '•'.repeat(cardCvv.length) : '•••'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Test Fill Button for smooth demo */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setCardNumber('4532 8941 0023 7814');
                          setCardHolder('GRACE KABONGO');
                          setCardExpiry('08/29');
                          setCardCvv('394');
                        }}
                        className="text-[11px] font-bold text-emerald-700 hover:underline"
                      >
                        Remplir avec une carte Visa de test en 1 clic
                      </button>
                    </div>

                    {/* Card Fields: Numéro, Nom, Date MM/AA, CVV */}
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="mb-1 block font-bold text-slate-700">
                          Numéro de carte bancaire *
                        </label>
                        <div className="relative">
                          <CreditCard className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            inputMode="numeric"
                            required
                            placeholder="4532 1234 5678 9012"
                            value={cardNumber}
                            onChange={(e) =>
                              setCardNumber(formatCardNumberInput(e.target.value))
                            }
                            className="w-full rounded-xl border border-slate-200 py-2.5 pr-4 pl-10 font-mono text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block font-bold text-slate-700">
                          Nom complet sur la carte *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: MERDI MADIMBA"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold uppercase text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block font-bold text-slate-700">
                            Date d’expiration (MM/AA) *
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            required
                            placeholder="MM/AA"
                            value={cardExpiry}
                            onChange={(e) =>
                              setCardExpiry(formatExpiryInput(e.target.value))
                            }
                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block font-bold text-slate-700">
                            Code sécurité CVV *
                          </label>
                          <div className="relative">
                            <input
                              type="password"
                              inputMode="numeric"
                              maxLength={4}
                              required
                              placeholder="123"
                              value={cardCvv}
                              onChange={(e) =>
                                setCardCvv(
                                  e.target.value.replace(/\D/g, '').slice(0, 4)
                                )
                              }
                              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                            />
                            <Lock className="pointer-events-none absolute top-1/2 right-3.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-emerald-700 disabled:bg-emerald-400"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>
                        {isProcessing
                          ? 'Vérification bancaire en cours...'
                          : `Payer ${getTotalCheckoutDisplay(checkoutPlan)} par Carte`}
                      </span>
                    </button>
                  </form>
                ) : (
                  /* Mobile Money Checkout Form */
                  <form onSubmit={handleSubmitPayment} className="mt-5 space-y-4 text-xs">
                    <div>
                      <label className="mb-2 block font-bold text-slate-700">
                        Choisissez votre opérateur Mobile Money en RDC
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {(
                          [
                            'M-Pesa',
                            'Orange Money',
                            'Airtel Money',
                            'Afrimoney',
                          ] as const
                        ).map((op) => (
                          <button
                            key={op}
                            type="button"
                            onClick={() => setMomoOperator(op)}
                            className={`rounded-xl border p-3 text-left font-extrabold transition ${
                              momoOperator === op
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {op}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block font-bold text-slate-700">
                        Numéro de téléphone Mobile Money *
                      </label>
                      <input
                        type="tel"
                        required
                        value={momoPhone}
                        onChange={(e) => setMomoPhone(e.target.value)}
                        placeholder="+243 81 000 00 00"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>
                        {isProcessing
                          ? 'Attente validation PIN sur le téléphone...'
                          : `Confirmer ${getTotalCheckoutDisplay(checkoutPlan)} via ${momoOperator}`}
                      </span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
