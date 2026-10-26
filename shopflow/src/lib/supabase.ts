import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export type OAuthProvider = 'google' | 'github' | 'facebook';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
const oauthProviderFlags: Record<OAuthProvider, boolean> = {
  google: import.meta.env.VITE_SHOPFLOW_GOOGLE_OAUTH_ENABLED === 'true',
  github: import.meta.env.VITE_SHOPFLOW_GITHUB_OAUTH_ENABLED === 'true',
  facebook: import.meta.env.VITE_SHOPFLOW_FACEBOOK_OAUTH_ENABLED === 'true',
};
export const isOAuthProviderEnabled = (provider: OAuthProvider) => oauthProviderFlags[provider];
export const authRedirectUrl = import.meta.env.VITE_SUPABASE_AUTH_REDIRECT_URL?.trim() || undefined;

/**
 * This client only accepts a Supabase publishable/anon key. Never put a secret or
 * service-role key in a VITE_ variable: Vite embeds these values in public assets.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('AUTH_NOT_CONFIGURED');
  }
  return supabase;
}
