import React from 'react';
import { ArrowLeft, ArrowRight, Check, Package, ReceiptText, Sparkles, X } from 'lucide-react';
import { SHOPFLOW_APP_LOGO } from '../data/initialData';

interface FirstRunOnboardingProps {
  step: number;
  onStepChange: (step: number) => void;
  onFinish: (configureShop: boolean) => void;
}

const STEPS = [
  {
    icon: Package,
    title: 'Votre boutique, vos données',
    description:
      'Commencez avec un espace vide. Ajoutez vos propres articles et quantités dans Stock : aucune vente ni aucun produit fictif n’est préchargé.',
    hint: 'Stock → Ajouter un article',
  },
  {
    icon: ReceiptText,
    title: 'Encaissez et gardez une trace',
    description:
      'Dans Caisse, choisissez vos articles, indiquez le paiement et validez. ShopFlow met à jour le stock et conserve l’historique sur cet appareil.',
    hint: 'Caisse → Nouvelle vente',
  },
  {
    icon: Sparkles,
    title: 'Analysez avec ShopFlow AI',
    description:
      'Posez vos questions dans une conversation enregistrée localement. Les actions simples sur le stock et les ventes restent disponibles hors ligne ; les réponses générales peuvent dépendre d’un service IA en ligne.',
    hint: 'Assistant IA → Une conversation persistante',
  },
];

export const FirstRunOnboarding: React.FC<FirstRunOnboardingProps> = ({
  step,
  onStepChange,
  onFinish,
}) => {
  const current = STEPS[step];
  const StepIcon = current.icon;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="first-run-title">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={() => onFinish(false)}
          aria-label="Fermer le tutoriel"
          className="absolute top-4 right-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 p-3 ring-1 ring-blue-100">
            <img src={SHOPFLOW_APP_LOGO} alt="Logo ShopFlow" className="h-full w-full object-contain" />
          </div>
          <p className="mt-4 text-[11px] font-extrabold tracking-[0.18em] text-[#0A4DFF] uppercase">
            Bienvenue dans ShopFlow
          </p>
          <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <StepIcon className="h-6 w-6" />
          </div>
          <h2 id="first-run-title" className="mt-4 text-xl font-black tracking-tight text-slate-900">
            {current.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{current.description}</p>
          <p className="mt-4 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">{current.hint}</p>
        </div>

        <div className="mt-7 flex items-center justify-center gap-2" aria-label={`Étape ${step + 1} sur ${STEPS.length}`}>
          {STEPS.map((item, index) => (
            <span key={item.title} className={`h-1.5 rounded-full transition-all ${index === step ? 'w-7 bg-[#0A4DFF]' : 'w-1.5 bg-slate-200'}`} />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => (step > 0 ? onStepChange(step - 1) : onFinish(false))}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            {step > 0 ? 'Précédent' : 'Passer'}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => onStepChange(step + 1)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0A4DFF] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700"
            >
              Suivant <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onFinish(false)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Check className="h-4 w-4" /> Commencer
              </button>
              <button
                type="button"
                onClick={() => onFinish(true)}
                className="rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700"
              >
                Configurer ma boutique
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
