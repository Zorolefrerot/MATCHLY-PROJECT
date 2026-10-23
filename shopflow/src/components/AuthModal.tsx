import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Lock,
  Share,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  UserCheck,
  X,
} from 'lucide-react';
import { SHOPFLOW_APP_LOGO } from '../data/initialData';
import { CurrencyCode, SubscriptionPlanId } from '../types';

export type AuthModalMode = 'signup' | 'login' | 'install';

export interface SignupPayload {
  shopName: string;
  ownerName: string;
  city: string;
  whatsappNumber: string;
  email: string;
  currency: CurrencyCode;
  ownerPin: string;
  selectedPlan: SubscriptionPlanId;
  startEmptyCatalog: boolean;
}

interface AuthModalProps {
  initialMode: AuthModalMode;
  preselectedPlan?: SubscriptionPlanId;
  defaultCurrency: CurrencyCode;
  onCompleteSignup: (payload: SignupPayload) => void;
  onLoginExisting: (emailOrPhone: string) => void;
  onTriggerNativeInstall?: () => Promise<boolean>;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode,
  preselectedPlan = 'pro_ai',
  defaultCurrency,
  onCompleteSignup,
  onLoginExisting,
  onTriggerNativeInstall,
  onClose,
}) => {
  const [mode, setMode] = useState<AuthModalMode>(initialMode);

  // Signup fields
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [city, setCity] = useState('Kinshasa');
  const [whatsappNumber, setWhatsappNumber] = useState('+243 ');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [ownerPin, setOwnerPin] = useState('1234');
  const [startEmptyCatalog, setStartEmptyCatalog] = useState(false);

  // Login fields
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Install status
  const [installFeedback, setInstallFeedback] = useState<string | null>(null);

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCompleteSignup({
      shopName: shopName.trim() || 'Ma Boutique Pro',
      ownerName: ownerName.trim() || 'Propriétaire',
      city: city.trim() || 'Kinshasa',
      whatsappNumber: whatsappNumber.trim() || '+243 81 000 00 00',
      email: email.trim(),
      currency,
      ownerPin: ownerPin.trim() || '1234',
      selectedPlan: preselectedPlan,
      startEmptyCatalog,
    });
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginExisting(loginId.trim() || 'Boutique Connectée');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="relative my-8 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Top Gradient Header */}
        <div className="flex items-center justify-between bg-[#081844] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <img
              src={SHOPFLOW_APP_LOGO}
              alt="ShopFlow"
              className="h-10 w-10 rounded-xl bg-white p-1 object-contain"
            />
            <div>
              <h3 className="text-sm font-black tracking-tight">
                {mode === 'signup'
                  ? 'Créer votre boutique ShopFlow'
                  : mode === 'login'
                    ? 'Connexion à votre boutique'
                    : 'Installer ShopFlow sur votre téléphone'}
              </h3>
              <p className="text-[11px] text-sky-200">
                {mode === 'install'
                  ? 'Installation sur Android • iPhone • Ordinateur'
                  : '7 jours d’essai gratuit complet • Sans engagement'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 p-1.5 text-white transition hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Signup and login are deliberately not offered from the public install flow. */}
        {initialMode !== 'install' && (
        <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50 p-1.5 text-xs font-extrabold">
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`rounded-xl py-2 transition ${
              mode === 'signup'
                ? 'bg-white text-[#0A4DFF] shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Inscription Gratuite
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-xl py-2 transition ${
              mode === 'login'
                ? 'bg-white text-[#0A4DFF] shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Se Connecter
          </button>
          <button
            type="button"
            onClick={() => setMode('install')}
            className={`rounded-xl py-2 transition ${
              mode === 'install'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📲 Installer l’App
          </button>
        </div>
        )}

        {/* =====================================================
            MODE 1: SIGNUP NEW SHOP
           ===================================================== */}
        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3.5 p-6 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Nom de votre boutique *
                </label>
                <div className="relative">
                  <Store className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="Ex: Maison Gloire Market"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pr-3 pl-9 font-semibold text-slate-900 focus:border-[#0A4DFF] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Votre nom complet *
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Ex: Patrick Kabongo"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold text-slate-900 focus:border-[#0A4DFF] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Numéro WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+243 81 000 00 00"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold text-slate-900 focus:border-[#0A4DFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Ville & Quartier *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Kinshasa - Gombe"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold text-slate-900 focus:border-[#0A4DFF] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Adresse e-mail *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@maboutique.com"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold text-slate-900 focus:border-[#0A4DFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Mot de passe *
                </label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 4 caractères"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold text-slate-900 focus:border-[#0A4DFF] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Devise de votre boutique
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrency('FC')}
                    className={`rounded-xl border py-2 font-extrabold transition ${
                      currency === 'FC'
                        ? 'border-[#0A4DFF] bg-[#0A4DFF] text-white'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Franc (FC)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`rounded-xl border py-2 font-extrabold transition ${
                      currency === 'USD'
                        ? 'border-[#0A4DFF] bg-[#0A4DFF] text-white'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Dollar ($ USD)
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">
                  Code PIN Patron (anti-employé)
                </label>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 shrink-0 text-[#0A4DFF]" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={ownerPin}
                    onChange={(e) =>
                      setOwnerPin(e.target.value.replace(/[^0-9]/g, ''))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-center font-mono text-sm font-black tracking-[0.3em] text-slate-900"
                  />
                </div>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <input
                type="checkbox"
                checked={startEmptyCatalog}
                onChange={(e) => setStartEmptyCatalog(e.target.checked)}
                className="h-4 w-4 rounded accent-[#0A4DFF]"
              />
              <span className="text-[11px] font-semibold text-slate-700">
                Démarrer avec un stock 100 % vide (décochez pour garder 8 produits exemples prêts à tester)
              </span>
            </label>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0A4DFF] py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:opacity-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>Ouvrir ma boutique maintenant (7 jours offerts)</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Aucune carte requise aujourd’hui • Sauvegarde Cloud & Hors-Ligne</span>
            </p>
          </form>
        )}

        {/* =====================================================
            MODE 2: LOGIN EXISTING SHOP
           ===================================================== */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 p-6 text-xs">
            <div>
              <label className="mb-1 block font-bold text-slate-700">
                Email ou numéro WhatsApp *
              </label>
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="+243 81 452 90 12 ou email@boutique.com"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-3 font-semibold text-slate-900 focus:border-[#0A4DFF] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">
                Mot de passe *
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-3 font-semibold text-slate-900 focus:border-[#0A4DFF] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0A4DFF] py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:opacity-95"
            >
              <UserCheck className="h-4 w-4" />
              <span>Accéder à ma boutique</span>
            </button>
          </form>
        )}

        {/* =====================================================
            MODE 3: INSTALL PWA ON ANDROID / IPHONE / DESKTOP
           ===================================================== */}
        {mode === 'install' && (
          <div className="space-y-4 p-6 text-xs">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 leading-relaxed text-emerald-950">
              <p className="font-extrabold">Votre boutique se crée après l’installation, dans l’application ShopFlow.</p>
              <p className="mt-1">Ce site vitrine ne collecte pas vos informations de boutique et ne lance pas sa création.</p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
              <div className="flex items-start gap-3">
                <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-[#0A4DFF]" />
                <div className="space-y-2">
                  <p className="font-extrabold text-slate-900">
                    🤖 Sur Android (Samsung, Tecno, Infinix, Xiaomi, etc.)
                  </p>
                  <p className="leading-relaxed text-slate-600">
                    Cliquez sur le bouton ci-dessous ou ouvrez le menu{' '}
                    <strong>⋮</strong> en haut à droite de Chrome puis choisissez{' '}
                    <strong>« Installer l’application »</strong> : l’icône officielle{' '}
                    <strong>ShopFlow</strong> s’ajoute immédiatement sur votre écran d’accueil !
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await onTriggerNativeInstall?.();
                      setInstallFeedback(
                        ok
                          ? 'Installation lancée sur votre appareil !'
                          : 'Astuce : appuyez sur le menu ⋮ de votre navigateur puis sur « Ajouter à l’écran d’accueil / Installer l’application ».'
                      );
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0A4DFF] px-4 py-2.5 font-extrabold text-white shadow-xs"
                  >
                    <Download className="h-4 w-4" />
                    <span>Installer maintenant sur cet appareil</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <Share className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-900">
                    🍎 Sur iPhone & iPad (Safari)
                  </p>
                  <p className="leading-relaxed text-slate-600">
                    1. Appuyez sur le bouton <strong>Partager</strong> en bas de Safari.
                    <br />
                    2. Touchez <strong>« Sur l’écran d’accueil »</strong> puis{' '}
                    <strong>« Ajouter »</strong> : ShopFlow s’ouvre en plein écran comme une application.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 leading-relaxed text-amber-950">
              <p className="font-extrabold">À propos des versions APK, App Store et Windows (.exe)</p>
              <p className="mt-1">Les fichiers d’installation natifs ne sont pas encore publiés dans cette version. L’installation proposée ici est la version web installable. Les liens officiels seront affichés ici dès que les paquets seront disponibles.</p>
            </div>

            {installFeedback && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{installFeedback}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
