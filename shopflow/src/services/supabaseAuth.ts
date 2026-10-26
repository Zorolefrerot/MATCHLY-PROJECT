import type { User } from '@supabase/supabase-js';
import type { CurrencyCode, SubscriptionPlanId } from '../types';
import {
  authRedirectUrl,
  isOAuthProviderEnabled,
  requireSupabase,
  type OAuthProvider,
} from '../lib/supabase';

export interface ShopOnboardingInput {
  shopName: string;
  ownerName: string;
  city: string;
  whatsappNumber: string;
  currency: CurrencyCode;
  selectedPlan: SubscriptionPlanId;
}

export interface ShopSummary {
  id: string;
  owner_user_id: string;
  name: string;
  city: string;
  whatsapp_number: string;
  currency: CurrencyCode;
  created_at: string;
  updated_at: string;
}

export interface BillingAccountSummary {
  owner_user_id: string;
  plan_id: SubscriptionPlanId;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
  trial_started_at: string | null;
  trial_ends_at: string | null;
  current_period_ends_at: string | null;
}

const PENDING_EMAIL_PIN_KEY = 'shopflow_pending_owner_pin_v1';

export function savePendingOwnerPin(email: string, ownerPin: string) {
  try {
    localStorage.setItem(PENDING_EMAIL_PIN_KEY, JSON.stringify({ email: email.trim().toLowerCase(), ownerPin }));
  } catch { /* local-only convenience; never block account creation */ }
}

export function getPendingOwnerPin(email: string): string | null {
  try {
    const value = JSON.parse(localStorage.getItem(PENDING_EMAIL_PIN_KEY) || 'null') as { email?: string; ownerPin?: string } | null;
    return value?.email === email.trim().toLowerCase() && /^\d{4,6}$/.test(value.ownerPin || '') ? value!.ownerPin! : null;
  } catch { return null; }
}

export function clearPendingOwnerPin(email?: string) {
  try {
    if (email && getPendingOwnerPin(email) === null) return;
    localStorage.removeItem(PENDING_EMAIL_PIN_KEY);
  } catch { /* optional */ }
}

export async function signInWithEmail(email: string, password: string) {
  return requireSupabase().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
}

const PENDING_OAUTH_SHOP_KEY = 'shopflow_pending_oauth_shop_v1';
const LEGACY_PENDING_GOOGLE_SHOP_KEY = 'shopflow_pending_google_shop_v1';

export async function signInWithOAuth(
  provider: OAuthProvider,
  onboarding?: ShopOnboardingInput,
  ownerPin?: string,
) {
  if (!isOAuthProviderEnabled(provider)) throw new Error(`${provider.toUpperCase()}_OAUTH_NOT_CONFIGURED`);
  if (!authRedirectUrl) throw new Error('AUTH_REDIRECT_NOT_CONFIGURED');
  if (onboarding) {
    try {
      localStorage.setItem(PENDING_OAUTH_SHOP_KEY, JSON.stringify({ onboarding, ownerPin }));
    } catch {
      throw new Error('SHOP_SETUP_STORAGE_UNAVAILABLE');
    }
  }
  return requireSupabase().auth.signInWithOAuth({
    provider,
    options: { redirectTo: authRedirectUrl },
  });
}

interface PendingOAuthShopSetup {
  onboarding: ShopOnboardingInput;
  ownerPin?: string;
}

function readPendingOAuthSetup(): PendingOAuthShopSetup | null {
  try {
    const raw = localStorage.getItem(PENDING_OAUTH_SHOP_KEY) || localStorage.getItem(LEGACY_PENDING_GOOGLE_SHOP_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as { onboarding?: Partial<ShopOnboardingInput>; ownerPin?: string } | Partial<ShopOnboardingInput>;
    const onboarding = ('onboarding' in stored ? stored.onboarding : stored) as Partial<ShopOnboardingInput> | undefined;
    if (
      !onboarding ||
      typeof onboarding.shopName !== 'string' ||
      typeof onboarding.ownerName !== 'string' ||
      typeof onboarding.city !== 'string' ||
      typeof onboarding.whatsappNumber !== 'string' ||
      !['FC', 'USD'].includes(onboarding.currency || '') ||
      !['starter', 'pro_ai', 'business'].includes(onboarding.selectedPlan || '')
    ) return null;
    const ownerPin = 'ownerPin' in stored && typeof stored.ownerPin === 'string' && /^\d{4,6}$/.test(stored.ownerPin)
      ? stored.ownerPin
      : undefined;
    return { onboarding: onboarding as ShopOnboardingInput, ownerPin };
  } catch {
    return null;
  }
}

export function getPendingOAuthShopSetup(): ShopOnboardingInput | null {
  return readPendingOAuthSetup()?.onboarding || null;
}

export function getPendingOAuthShopOwnerPin(): string | null {
  return readPendingOAuthSetup()?.ownerPin || null;
}

export function clearPendingOAuthShopSetup() {
  try {
    localStorage.removeItem(PENDING_OAUTH_SHOP_KEY);
    localStorage.removeItem(LEGACY_PENDING_GOOGLE_SHOP_KEY);
  } catch { /* optional */ }
}

export async function sendPasswordReset(email: string) {
  if (!authRedirectUrl) throw new Error('AUTH_REDIRECT_NOT_CONFIGURED');
  return requireSupabase().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: authRedirectUrl,
  });
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await requireSupabase().auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data.user;
}

export async function getCurrentUser() {
  const { data, error } = await requireSupabase().auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function listMyShops(): Promise<ShopSummary[]> {
  const { data, error } = await requireSupabase()
    .from('shopflow_shops')
    .select('id, owner_user_id, name, city, whatsapp_number, currency, created_at, updated_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as ShopSummary[];
}

export async function getMyBillingAccount(): Promise<BillingAccountSummary | null> {
  const { data, error } = await requireSupabase()
    .from('shopflow_billing_accounts')
    .select('owner_user_id, plan_id, status, trial_started_at, trial_ends_at, current_period_ends_at')
    .maybeSingle();
  if (error) throw error;
  return data as BillingAccountSummary | null;
}

export async function createOwnedShop(onboarding: ShopOnboardingInput): Promise<string> {
  const { data, error } = await requireSupabase().rpc('shopflow_create_shop', {
    p_name: onboarding.shopName,
    p_city: onboarding.city,
    p_whatsapp_number: onboarding.whatsappNumber,
    p_currency: onboarding.currency,
    p_initial_plan: onboarding.selectedPlan,
    p_owner_name: onboarding.ownerName,
  });
  if (error) throw error;
  if (typeof data !== 'string') throw new Error('SHOP_CREATION_FAILED');
  return data;
}

export function getShopOnboardingFromUser(user: User): ShopOnboardingInput | null {
  const value = user.user_metadata?.shopflow_onboarding as Partial<ShopOnboardingInput> | undefined;
  if (!value || typeof value !== 'object') return null;
  if (
    typeof value.shopName !== 'string' ||
    typeof value.ownerName !== 'string' ||
    typeof value.city !== 'string' ||
    typeof value.whatsappNumber !== 'string' ||
    !['FC', 'USD'].includes(value.currency || '') ||
    !['starter', 'pro_ai', 'business'].includes(value.selectedPlan || '')
  ) return null;
  return {
    shopName: value.shopName,
    ownerName: value.ownerName,
    city: value.city,
    whatsappNumber: value.whatsappNumber,
    currency: value.currency!,
    selectedPlan: value.selectedPlan!,
  };
}

export function getAuthErrorMessage(error: unknown): string {
  const code = error instanceof Error ? error.message : '';
  if (code === 'AUTH_NOT_CONFIGURED') return 'La connexion sécurisée n’est pas encore configurée pour cette application.';
  if (code === 'SOCIAL_SIGNUP_REQUIRED') return 'Pour créer un compte, continuez avec Google, GitHub ou Facebook.';
  if (code === 'AUTH_REDIRECT_NOT_CONFIGURED') return 'L’adresse de retour après connexion n’est pas encore configurée. L’authentification sociale est temporairement indisponible.';
  if (/^(GOOGLE|GITHUB|FACEBOOK)_OAUTH_NOT_CONFIGURED$/.test(code)) return 'Ce bouton sera activé lorsque le fournisseur de connexion correspondant sera configuré.';
  if (code === 'SHOP_SETUP_STORAGE_UNAVAILABLE') return 'Impossible de conserver les détails de la boutique pour le retour de connexion sur cet appareil.';
  if (code === 'EMAIL_REQUIRED') return 'Saisissez votre adresse e-mail pour recevoir le lien de réinitialisation.';
  if (code === 'shop_owner_required') return 'Seul le propriétaire peut importer les données dans cette boutique.';
  if (code === 'import_target_not_empty') return 'Cette boutique contient déjà des données. L’import a été annulé pour éviter tout écrasement.';
  if (code === 'invalid_import_payload' || code === 'INVALID_LOCAL_BACKUP') return 'La sauvegarde ne contient pas une structure de données ShopFlow valide.';
  if (code === 'IMPORT_VERIFY_FAILED') return 'L’import a été transmis mais la vérification complète n’a pas abouti. La sauvegarde source est conservée; vérifiez la boutique avant de réessayer.';
  if (code === 'PHOTO_TOO_LARGE') return 'Une photo dépasse la limite autorisée de 10 Mo.';
  if (code === 'PHOTO_FORMAT_NOT_SUPPORTED') return 'Une photo doit être au format JPEG, PNG ou WebP.';
  if (code === 'PHOTO_READ_FAILED') return 'Une photo de la sauvegarde est illisible.';
  if (code === 'SECURE_CRYPTO_UNAVAILABLE') return 'Le navigateur ne prend pas en charge le téléversement sécurisé des photos.';
  if (code === 'shop_limit_reached') return 'Ce forfait ne permet pas de créer une autre boutique.';
  if (code === 'subscription_inactive') return 'L’abonnement de ce compte est inactif. Consultez la page Forfait.';
  if (code === 'invalid_shop_name') return 'Veuillez saisir un nom de boutique valide.';
  if (code === 'invalid_whatsapp_number') return 'Veuillez saisir un numéro WhatsApp valide.';
  if (code === 'invalid_currency' || code === 'invalid_plan') return 'Les informations du forfait ou de la devise ne sont pas valides.';
  if (/already registered/i.test(code)) return 'Cette adresse e-mail possède déjà un compte. Connectez-vous ou réinitialisez votre mot de passe.';
  if (/invalid login credentials/i.test(code)) return 'Adresse e-mail ou mot de passe incorrect.';
  if (/email not confirmed/i.test(code)) return 'Confirmez votre adresse e-mail à partir du message reçu avant de vous connecter.';
  return 'Une erreur est survenue. Vérifiez votre connexion et réessayez.';
}
