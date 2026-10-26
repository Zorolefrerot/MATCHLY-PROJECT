/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOPFLOW_API_BASE_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_AUTH_REDIRECT_URL?: string;
  readonly VITE_SHOPFLOW_GOOGLE_OAUTH_ENABLED?: string;
  readonly VITE_SHOPFLOW_GITHUB_OAUTH_ENABLED?: string;
  readonly VITE_SHOPFLOW_FACEBOOK_OAUTH_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
