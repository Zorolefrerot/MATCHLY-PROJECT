import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  LoaderCircle,
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
import { getAuthErrorMessage } from '../services/supabaseAuth';
import type { OAuthProvider } from '../lib/supabase';

export type AuthModalMode = 'signup' | 'login' | 'install' | 'reset_password';

export interface SignupPayload {
  shopName: string;
  ownerName: string;
  city: string;
  whatsappNumber: string;
  currency: CurrencyCode;
  ownerPin: string;
  selectedPlan: SubscriptionPlanId;
  startEmptyCatalog: boolean;
}

interface AuthModalProps {
  initialMode: AuthModalMode;
  preselectedPlan?: SubscriptionPlanId;
  defaultCurrency: CurrencyCode;
  authConfigured: boolean;
  oauthProvidersEnabled: Record<OAuthProvider, boolean>;
  requireAuthentication?: boolean;
  isAuthenticated?: boolean;
  onCompleteSignup: (payload: SignupPayload) => Promise<boolean | void>;
  onLoginExisting: (email: string, password: string) => Promise<void>;
  onOAuthSignIn: (provider: OAuthProvider, onboarding?: SignupPayload) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  onUpdatePassword: (password: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  onTriggerNativeInstall?: () => Promise<boolean>;
  onClose: () => void;
}

const SocialProviderIcon: React.FC<{ provider: OAuthProvider }> = ({ provider }) => {
  if (provider === 'google') {
    return (
      <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
        <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.9-.4-4.3H24v8.2h11c-.5 2.7-2.1 5-4.3 6.5l6.9 5.4c4-3.7 6-9.2 6-15.8Z" />
        <path fill="#34A853" d="M24 44c5.6 0 10.3-1.8 13.7-4.9l-6.9-5.4c-1.9 1.3-4.2 2-6.8 2-5.2 0-9.6-3.5-11.2-8.2l-7.1 5.5C9.1 39.9 16 44 24 44Z" />
        <path fill="#FBBC05" d="M12.8 27.5c-.4-1.1-.7-2.3-.7-3.5s.2-2.4.7-3.5l-7.1-5.5C4.6 17.4 4 20.4 4 24s.6 6.6 1.7 9l7.1-5.5Z" />
        <path fill="#EA4335" d="M24 12.8c3.1 0 5.8 1.1 7.9 3.1l5.9-5.9C34.2 6.7 29.6 4 24 4 16 4 9.1 8.1 5.7 15l7.1 5.5c1.6-4.2 6-7.7 11.2-7.7Z" />
      </svg>
    );
  }

  if (provider === 'github') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-[#181717]">
        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.85 10.91.58.11.79-.25.79-.56v-2.17c-3.19.69-3.86-1.35-3.86-1.35-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.52-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.95 10.95 0 0 1 5.73 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14v3.18c0 .31.21.67.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <circle cx="12" cy="12" r="12" fill="#0866FF" />
      <path fill="#FFFFFF" d="M13.55 24v-8.73h2.93l.44-3.41h-3.37V9.68c0-.99.28-1.66 1.69-1.66h1.8V4.97c-.31-.04-1.38-.13-2.63-.13-2.6 0-4.38 1.59-4.38 4.51v2.51H7.09v3.41h2.94V24h3.52Z" />
    </svg>
  );
};

export const AuthModal: React.FC<AuthModalProps> = ({ 
  initialMode,
  preselectedPlan = 'pro_ai',
  defaultCurrency,
  authConfigured,
  oauthProvidersEnabled,
  requireAuthentication = false,
  isAuthenticated = false,
  onCompleteSignup,
  onLoginExisting,
  onOAuthSignIn,
  onResetPassword,
  onUpdatePassword,
  onSignOut,
  onTriggerNativeInstall,
  onClose,
}) => {
  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  useEffect(() => setMode(initialMode), [initialMode]);
  const isAppleMobile = typeof navigator !== 'undefined' && (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );

  // Signup fields
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [city, setCity] = useState('Kinshasa');
  const [whatsappNumber, setWhatsappNumber] = useState('+243 ');
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [ownerPin, setOwnerPin] = useState('1234');
  const [startEmptyCatalog] = useState(true);

  // Login fields
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Auth and install feedback
  const [installFeedback, setInstallFeedback] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signupPayload = (): SignupPayload => ({
    shopName: shopName.trim(),
    ownerName: ownerName.trim(),
    city: city.trim(),
    whatsappNumber: whatsappNumber.trim(),
    currency,
    ownerPin: ownerPin.trim() || '1234',
    selectedPlan: preselectedPlan,
    startEmptyCatalog,
  });

  const runAuthAction = async (action: () => Promise<boolean | void>) => {
    setAuthError(null);
    setAuthNotice(null);
    setIsSubmitting(true);
    try {
      const needsConfirmation = await action();
      if (needsConfirmation) {
        setAuthNotice('Compte créé. Ouvrez le lien de confirmation envoyé par e-mail pour terminer la création de votre boutique.');
      }
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !ownerName.trim() || !whatsappNumber.trim() || !city.trim()) {
      setAuthError('Renseignez le nom de la boutique, votre nom, le numéro WhatsApp et la ville.');
      return;
    }
    if (!isAuthenticated) {
      setAuthError('Pour créer un compte, choisissez Google, GitHub ou Facebook.');
      return;
    }
    void runAuthAction(() => onCompleteSignup(signupPayload()));
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runAuthAction(async () => {
      await onLoginExisting(loginId.trim(), loginPassword);
    });
  };

  const handleSocialSignup = (provider: OAuthProvider) => {
    if (!shopName.trim() || !ownerName.trim() || !whatsappNumber.trim() || !city.trim()) {
      setAuthError('Complétez les informations de la boutique avant de continuer.');
      return;
    }
    void runAuthAction(() => onOAuthSignIn(provider, signupPayload()));
  };

  const socialProviders: { id: OAuthProvider; label: string }[] = [
    { id: 'google', label: 'Google' },
    { id: 'github', label: 'GitHub' },
    { id: 'facebook', label: 'Facebook' },
  ];

  const handlePasswordUpdate = (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      setAuthError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setAuthError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    void runAuthAction(async () => { await onUpdatePassword(newPassword); });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-x-hidden overflow-y-auto bg-slate-950/70 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xs sm:items-center sm:p-4">
      <div className="relative my-0 max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-3xl border border-slate-200 bg-white shadow-2xl sm:my-8 sm:max-h-[calc(100dvh-2rem)]">
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
                  ? isAuthenticated ? 'Configurer une boutique ShopFlow' : requireAuthentication ? 'Connexion à ShopFlow' : 'Créer votre boutique ShopFlow'
                  : mode === 'login'
                    ? 'Connexion à votre boutique'
                    : mode === 'reset_password'
                      ? 'Choisir un nouveau mot de passe'
                      : 'Installer ShopFlow sur votre téléphone'}
              </h3>
              <p className="text-[11px] text-sky-200">
                {mode === 'install'
                  ? 'Installation sur Android • iPhone • Ordinateur'
                  : mode === 'reset_password'
                    ? 'Réinitialisation sécurisée de votre accès'
                    : requireAuthentication && !isAuthenticated
                      ? 'Connectez-vous avant de configurer votre boutique'
                      : '7 jours d’essai à partir de la création de la boutique'}
              </p>
            </div>
          </div>

          {(!requireAuthentication || isAuthenticated) && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="rounded-xl bg-white/10 p-1.5 text-white transition hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Signup and login are deliberately not offered from the public install flow. */}
        {initialMode !== 'install' && mode !== 'install' && mode !== 'reset_password' && (
        <div className={`grid ${isAuthenticated || requireAuthentication ? 'grid-cols-2' : 'grid-cols-3'} border-b border-slate-100 bg-slate-50 p-1.5 text-xs font-extrabold`}>
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
          {!isAuthenticated && (
            <button
              type="button"
              onClick={() => { setMode('login'); setAuthError(null); setAuthNotice(null); }}
              className={`rounded-xl py-2 transition ${
                mode === 'login'
                  ? 'bg-white text-[#0A4DFF] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Se Connecter
            </button>
          )}
          {!requireAuthentication && (
            <button
              type="button"
              onClick={() => setMode('install')}
              className="rounded-xl py-2 text-slate-500 transition hover:text-slate-800"
            >
              📲 Installer l’App
            </button>
          )}
        </div>
        )}

        {mode !== 'install' && (
          <div className="space-y-2 px-6 pt-4 text-xs">
            {!authConfigured && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 font-semibold text-amber-900">
                La connexion sécurisée n’est pas encore configurée dans cet environnement. L’inscription et la connexion sont désactivées pour éviter de créer un compte incomplet.
              </p>
            )}
            {authError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 font-semibold text-red-800">{authError}</p>}
            {authNotice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 font-semibold text-emerald-800">{authNotice}</p>}
          </div>
        )}

        {mode === 'signup' && requireAuthentication && !isAuthenticated && (
          <section className="space-y-4 p-5 text-sm sm:p-6" aria-labelledby="auth-required-title">
            <div className="space-y-2 text-center">
              <h4 id="auth-required-title" className="text-base font-extrabold text-slate-900">Connectez-vous d’abord</h4>
              <p className="text-xs leading-relaxed text-slate-600">Après la connexion, vous pourrez configurer votre boutique. ShopFlow ne reçoit jamais le mot de passe de Google, GitHub ou Facebook.</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {socialProviders.map(({ id, label }) => {
                const enabled = authConfigured && oauthProvidersEnabled[id];
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={!enabled || isSubmitting}
                    onClick={() => void runAuthAction(() => onOAuthSignIn(id))}
                    className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-extrabold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A4DFF] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-sm"
                  >
                    <SocialProviderIcon provider={id} />
                    <span>Continuer avec {label}</span>
                  </button>
                );
              })}
            </div>
            {!oauthProvidersEnabled.google && !oauthProvidersEnabled.github && !oauthProvidersEnabled.facebook && (
              <p className="rounded-xl bg-amber-50 p-3 text-center text-xs font-semibold text-amber-900">Aucun fournisseur n’est activé dans Supabase pour le moment.</p>
            )}
          </section>
        )}

        {/* =====================================================
            MODE 1: CONFIGURE SHOP AFTER AUTHENTICATION
           ===================================================== */}
        {mode === 'signup' && (!requireAuthentication || isAuthenticated) && (
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

            {!isAuthenticated && (
              <p className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-[11px] font-semibold text-blue-900">
                Créez votre compte avec Google, GitHub ou Facebook. ShopFlow ne vous demandera pas le mot de passe de ces services.
              </p>
            )}
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] font-semibold text-emerald-800">
              Votre boutique démarrera avec un catalogue vide. Vous ajouterez vos propres articles après la création.
            </p>

            {isAuthenticated && (
              <button
                type="submit"
                disabled={!authConfigured || isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0A4DFF] py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>Créer ma boutique</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {!isAuthenticated && (
              <>
                <div className="flex items-center gap-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400"><span className="h-px flex-1 bg-slate-200" />ou<span className="h-px flex-1 bg-slate-200" /></div>
                <div className="grid grid-cols-1 gap-2.5">
                  {socialProviders.map(({ id, label }) => {
                    const enabled = authConfigured && oauthProvidersEnabled[id];
                    return (
                      <button
                        key={id}
                        type="button"
                        disabled={!enabled || isSubmitting}
                        onClick={() => handleSocialSignup(id)}
                        aria-label={`Continuer avec ${label}`}
                        title={enabled ? undefined : `${label} sera disponible après configuration du fournisseur OAuth.`}
                        className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-extrabold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A4DFF] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-sm"
                      >
                        <SocialProviderIcon provider={id} />
                        <span>Continuer avec {label}</span>
                      </button>
                    );
                  })}
                </div>
                {(!authConfigured || socialProviders.some(({ id }) => !oauthProvidersEnabled[id])) && (
                  <p className="text-center text-[10px] font-semibold text-slate-500">Les boutons apparaissent dès maintenant; chaque fournisseur doit être configuré dans Supabase avant de pouvoir l’utiliser.</p>
                )}
              </>
            )}

            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>7 jours d’essai à partir de la création de la boutique • aucune donnée locale ne sera effacée</span>
            </p>
            {isAuthenticated && <button type="button" onClick={() => { void onSignOut(); }} className="w-full py-1 text-center font-bold text-slate-500 underline">Se déconnecter</button>}
          </form>
        )}

        {/* =====================================================
            MODE 2: LOGIN EXISTING SHOP
           ===================================================== */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 p-6 text-xs">
            <div>
              <label className="mb-1 block font-bold text-slate-700">
                Adresse e-mail *
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="contact@maboutique.com"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-3 font-semibold text-slate-900 focus:border-[#0A4DFF] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-bold text-slate-700">
                Mot de passe *
              </label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-3 font-semibold text-slate-900 focus:border-[#0A4DFF] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={!authConfigured || isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0A4DFF] py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
              <span>Se connecter</span>
            </button>
            <button type="button" disabled={!authConfigured || isSubmitting} onClick={() => void runAuthAction(async () => { await onResetPassword(loginId.trim()); setAuthNotice('Si cette adresse est enregistrée, un lien de réinitialisation sera envoyé.'); })} className="w-full py-1 text-center font-bold text-[#0A4DFF] underline disabled:opacity-50">
              Mot de passe oublié ?
            </button>
            <div className="flex items-center gap-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400"><span className="h-px flex-1 bg-slate-200" />ou<span className="h-px flex-1 bg-slate-200" /></div>
            <div className="grid grid-cols-1 gap-2.5">
              {socialProviders.map(({ id, label }) => {
                const enabled = authConfigured && oauthProvidersEnabled[id];
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={!enabled || isSubmitting}
                    onClick={() => void runAuthAction(() => onOAuthSignIn(id))}
                    aria-label={`Continuer avec ${label}`}
                    title={enabled ? undefined : `${label} sera disponible après configuration du fournisseur OAuth.`}
                    className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-extrabold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A4DFF] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-sm"
                  >
                    <SocialProviderIcon provider={id} />
                    <span>Continuer avec {label}</span>
                  </button>
                );
              })}
            </div>
            {(!authConfigured || socialProviders.some(({ id }) => !oauthProvidersEnabled[id])) && (
              <p className="text-center text-[10px] font-semibold text-slate-500">Les boutons apparaissent dès maintenant; chaque fournisseur doit être configuré dans Supabase avant de pouvoir l’utiliser.</p>
            )}
          </form>
        )}

        {mode === 'reset_password' && (
          <form onSubmit={handlePasswordUpdate} className="space-y-4 p-6 text-xs">
            <p className="rounded-xl border border-blue-200 bg-blue-50 p-3 font-semibold leading-relaxed text-blue-900">Choisissez un nouveau mot de passe pour votre compte ShopFlow.</p>
            <div>
              <label className="mb-1 block font-bold text-slate-700">Nouveau mot de passe *</label>
              <input type="password" required minLength={8} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3.5 py-3 font-semibold text-slate-900 focus:border-[#0A4DFF] focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block font-bold text-slate-700">Confirmer le mot de passe *</label>
              <input type="password" required minLength={8} autoComplete="new-password" value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3.5 py-3 font-semibold text-slate-900 focus:border-[#0A4DFF] focus:outline-none" />
            </div>
            <button type="submit" disabled={!authConfigured || isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0A4DFF] py-3.5 text-sm font-black text-white disabled:opacity-50">
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Enregistrer le nouveau mot de passe
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { platform: 'Android', packageName: 'APK de test signé (debug)', status: 'Télécharger l’APK', href: '/downloads/ShopFlow-Android.apk' },
                { platform: 'iPhone / iPad', packageName: 'PWA installable depuis Safari', status: 'Disponible · pas sur l’App Store' },
                { platform: 'Ordinateur', packageName: 'Application web installable', status: 'Navigateur compatible' },
              ].map((item) => (
                <div key={item.platform} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="font-extrabold text-slate-900">{item.platform}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{item.packageName}</p>
                  {item.href ? (
                    <a
                      href={item.href}
                      download
                      className="mt-3 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold text-blue-800 underline"
                    >
                      {item.status}
                    </a>
                  ) : (
                    <p className="mt-3 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-extrabold text-amber-800">
                      {item.status}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {!isAppleMobile && (
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
                    <strong>« Installer l’application »</strong> ou{' '}
                    <strong>« Ajouter à l’écran d’accueil »</strong>. L’option dépend du navigateur utilisé.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await onTriggerNativeInstall?.();
                      setInstallFeedback(
                        ok
                          ? 'Installation lancée sur votre appareil.'
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
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <Share className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-900">
                    🍎 Sur iPhone & iPad (Safari)
                  </p>
                  <p className="leading-relaxed text-slate-600">
                    1. Ouvrez cette adresse dans <strong>Safari</strong>, puis touchez <strong>Partager</strong>.
                    <br />
                    2. Choisissez <strong>« Sur l’écran d’accueil »</strong>, puis{' '}
                    <strong>« Ajouter »</strong>. ShopFlow apparaîtra comme une PWA sur l’écran d’accueil; ce n’est pas une IPA/App Store.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 leading-relaxed text-amber-950">
              <p className="font-extrabold">À propos des installations ShopFlow</p>
              <p className="mt-1">Sur iPhone/iPad, ShopFlow s’installe comme une PWA depuis Safari : ce n’est ni une IPA ni une app App Store, et cela ne demande ni Mac ni abonnement Apple Developer. L’APK Android proposé ci-dessus est une version de test signée en debug, pas une version Play Store; téléchargez-le uniquement depuis ce lien officiel.</p>
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
