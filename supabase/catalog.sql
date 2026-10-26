-- ShopFlow live public catalog table.
-- Run once in the Supabase SQL Editor before setting the server environment variables.
create table if not exists public.shopflow_catalogs (
  catalog_id uuid primary key,
  owner_token_hash text not null check (length(owner_token_hash) = 64),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Catalog rows are read/written only by ShopFlow's server using a Supabase secret key.
-- No anon/authenticated policy is created; never put the service-role key in the browser.
alter table public.shopflow_catalogs enable row level security;
revoke all on table public.shopflow_catalogs from anon, authenticated;
grant all on table public.shopflow_catalogs to service_role;

-- Public read access is enabled for this dedicated image bucket. Only the server's
-- secret key can upload or replace objects; no anon/authenticated write policy is added.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shopflow-catalog-images',
  'shopflow-catalog-images',
  true,
  1500000,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
