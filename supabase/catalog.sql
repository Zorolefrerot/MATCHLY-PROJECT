-- ShopFlow live public catalog table.
-- Run once in the Supabase SQL Editor before setting the server environment variables.
create table if not exists public.shopflow_catalogs (
  catalog_id uuid primary key,
  owner_token_hash text not null check (length(owner_token_hash) = 64),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Catalog rows are read/written only by ShopFlow's server using the service-role key.
-- No anon/authenticated policy is created; never put the service-role key in the browser.
alter table public.shopflow_catalogs enable row level security;
revoke all on table public.shopflow_catalogs from anon, authenticated;
grant all on table public.shopflow_catalogs to service_role;
