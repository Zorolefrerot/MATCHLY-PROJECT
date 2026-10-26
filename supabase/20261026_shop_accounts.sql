-- Multi-shop account foundation for ShopFlow.
-- Additive only: the public catalog table and catalog storage are untouched.
-- Shop rows are created through shopflow_create_shop(), which starts the first
-- seven-day trial and enforces one shop on starter/pro_ai. Business permits
-- multiple shops; no numerical business ceiling has been specified.

create table if not exists public.shopflow_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shopflow_billing_accounts (
  owner_user_id uuid primary key references auth.users(id) on delete cascade,
  plan_id text not null check (plan_id in ('starter', 'pro_ai', 'business')),
  status text not null check (status in ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_ends_at timestamptz,
  payment_provider text,
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'trialing' or (trial_started_at is not null and trial_ends_at is not null))
);

create table if not exists public.shopflow_shops (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  city text not null default '' check (char_length(city) <= 100),
  whatsapp_number text not null check (char_length(whatsapp_number) between 8 and 20),
  currency text not null default 'FC' check (currency in ('FC', 'USD')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists shopflow_shops_owner_idx
  on public.shopflow_shops(owner_user_id) where deleted_at is null;

create table if not exists public.shopflow_shop_members (
  shop_id uuid not null references public.shopflow_shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'seller')),
  created_at timestamptz not null default now(),
  primary key (shop_id, user_id)
);

create index if not exists shopflow_shop_members_user_idx
  on public.shopflow_shop_members(user_id, shop_id);

-- Flexible, tenant-scoped records preserve current local JSON shapes while
-- authentication and the explicit import/sync workflow are built separately.
create table if not exists public.shopflow_records (
  shop_id uuid not null references public.shopflow_shops(id) on delete cascade,
  record_type text not null check (record_type in ('settings', 'product', 'sale', 'credit', 'expense')),
  record_id text not null check (char_length(record_id) between 1 and 120),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (shop_id, record_type, record_id)
);

create index if not exists shopflow_records_updated_idx
  on public.shopflow_records(shop_id, updated_at);

create or replace function public.shopflow_is_shop_member(target_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.shopflow_shop_members m
    where m.shop_id = target_shop_id
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.shopflow_is_shop_owner(target_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.shopflow_shops s
    where s.id = target_shop_id
      and s.owner_user_id = (select auth.uid())
      and s.deleted_at is null
  );
$$;

revoke all on function public.shopflow_is_shop_member(uuid) from public, anon;
revoke all on function public.shopflow_is_shop_owner(uuid) from public, anon;
grant execute on function public.shopflow_is_shop_member(uuid) to authenticated;
grant execute on function public.shopflow_is_shop_owner(uuid) to authenticated;

create or replace function public.shopflow_create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.shopflow_profiles (user_id, display_name)
  values (
    new.id,
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), nullif(btrim(new.raw_user_meta_data ->> 'name'), ''), ''), 120)
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.shopflow_create_profile_for_auth_user() from public, anon, authenticated;

drop trigger if exists shopflow_auth_user_profile on auth.users;
create trigger shopflow_auth_user_profile
after insert on auth.users
for each row execute function public.shopflow_create_profile_for_auth_user();

insert into public.shopflow_profiles (user_id, display_name)
select u.id,
       left(coalesce(nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''), nullif(btrim(u.raw_user_meta_data ->> 'name'), ''), ''), 120)
from auth.users u
on conflict (user_id) do nothing;

create or replace function public.shopflow_create_shop(
  p_name text,
  p_city text,
  p_whatsapp_number text,
  p_currency text default 'FC',
  p_initial_plan text default 'starter',
  p_owner_name text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  requesting_user uuid := auth.uid();
  normalized_phone text := regexp_replace(coalesce(p_whatsapp_number, ''), '[^0-9]', '', 'g');
  account_plan text;
  account_status text;
  trial_end timestamptz;
  shop_limit integer;
  shop_count integer;
  new_shop_id uuid;
begin
  if requesting_user is null then
    raise exception using errcode = '28000', message = 'authentication_required';
  end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'invalid_shop_name';
  end if;
  if char_length(normalized_phone) not between 8 and 20 then
    raise exception using errcode = '22023', message = 'invalid_whatsapp_number';
  end if;
  if coalesce(p_currency, 'FC') not in ('FC', 'USD') then
    raise exception using errcode = '22023', message = 'invalid_currency';
  end if;
  if coalesce(p_initial_plan, 'starter') not in ('starter', 'pro_ai', 'business') then
    raise exception using errcode = '22023', message = 'invalid_plan';
  end if;

  insert into public.shopflow_billing_accounts (
    owner_user_id, plan_id, status, trial_started_at, trial_ends_at
  ) values (
    requesting_user,
    coalesce(p_initial_plan, 'starter'),
    'trialing',
    now(),
    now() + interval '7 days'
  ) on conflict (owner_user_id) do nothing;

  select b.plan_id, b.status, b.trial_ends_at
    into account_plan, account_status, trial_end
  from public.shopflow_billing_accounts b
  where b.owner_user_id = requesting_user
  for update;

  if account_status not in ('trialing', 'active')
     or (account_status = 'trialing' and trial_end <= now()) then
    raise exception using errcode = 'P0001', message = 'subscription_inactive';
  end if;

  -- Business is the only multi-shop tier. Its numerical ceiling has not been
  -- set by the product owner, so do not invent one here.
  shop_limit := case when account_plan = 'business' then null else 1 end;
  select count(*)::integer into shop_count
  from public.shopflow_shops s
  where s.owner_user_id = requesting_user and s.deleted_at is null;
  if shop_limit is not null and shop_count >= shop_limit then
    raise exception using errcode = 'P0001', message = 'shop_limit_reached';
  end if;

  insert into public.shopflow_shops (owner_user_id, name, city, whatsapp_number, currency)
  values (requesting_user, btrim(p_name), left(coalesce(btrim(p_city), ''), 100), normalized_phone, coalesce(p_currency, 'FC'))
  returning id into new_shop_id;

  insert into public.shopflow_shop_members (shop_id, user_id, role)
  values (new_shop_id, requesting_user, 'owner');

  if coalesce(btrim(p_owner_name), '') <> '' then
    insert into public.shopflow_profiles (user_id, display_name)
    values (requesting_user, left(btrim(p_owner_name), 120))
    on conflict (user_id) do update
      set display_name = excluded.display_name,
          updated_at = now();
  end if;

  return new_shop_id;
end;
$$;

revoke all on function public.shopflow_create_shop(text, text, text, text, text, text) from public, anon;
grant execute on function public.shopflow_create_shop(text, text, text, text, text, text) to authenticated;

alter table public.shopflow_profiles enable row level security;
alter table public.shopflow_billing_accounts enable row level security;
alter table public.shopflow_shops enable row level security;
alter table public.shopflow_shop_members enable row level security;
alter table public.shopflow_records enable row level security;

revoke all on table public.shopflow_profiles from anon, authenticated;
revoke all on table public.shopflow_billing_accounts from anon, authenticated;
revoke all on table public.shopflow_shops from anon, authenticated;
revoke all on table public.shopflow_shop_members from anon, authenticated;
revoke all on table public.shopflow_records from anon, authenticated;

grant select, update on table public.shopflow_profiles to authenticated;
grant select on table public.shopflow_billing_accounts to authenticated;
grant select, update on table public.shopflow_shops to authenticated;
grant select on table public.shopflow_shop_members to authenticated;
grant select, insert, update, delete on table public.shopflow_records to authenticated;

drop policy if exists shopflow_profiles_select_self on public.shopflow_profiles;
create policy shopflow_profiles_select_self on public.shopflow_profiles
for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists shopflow_profiles_update_self on public.shopflow_profiles;
create policy shopflow_profiles_update_self on public.shopflow_profiles
for update to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists shopflow_billing_select_owner on public.shopflow_billing_accounts;
create policy shopflow_billing_select_owner on public.shopflow_billing_accounts
for select to authenticated using (owner_user_id = (select auth.uid()));

drop policy if exists shopflow_shops_select_member on public.shopflow_shops;
create policy shopflow_shops_select_member on public.shopflow_shops
for select to authenticated using (public.shopflow_is_shop_member(id));
drop policy if exists shopflow_shops_update_owner on public.shopflow_shops;
create policy shopflow_shops_update_owner on public.shopflow_shops
for update to authenticated using (public.shopflow_is_shop_owner(id))
with check (public.shopflow_is_shop_owner(id) and owner_user_id = (select auth.uid()));

drop policy if exists shopflow_members_select_self_or_owner on public.shopflow_shop_members;
create policy shopflow_members_select_self_or_owner on public.shopflow_shop_members
for select to authenticated using (
  user_id = (select auth.uid()) or public.shopflow_is_shop_owner(shop_id)
);

drop policy if exists shopflow_records_select_member on public.shopflow_records;
create policy shopflow_records_select_member on public.shopflow_records
for select to authenticated using (public.shopflow_is_shop_member(shop_id));
drop policy if exists shopflow_records_insert_member on public.shopflow_records;
create policy shopflow_records_insert_member on public.shopflow_records
for insert to authenticated with check (public.shopflow_is_shop_member(shop_id));
drop policy if exists shopflow_records_update_member on public.shopflow_records;
create policy shopflow_records_update_member on public.shopflow_records
for update to authenticated using (public.shopflow_is_shop_member(shop_id))
with check (public.shopflow_is_shop_member(shop_id));
drop policy if exists shopflow_records_delete_member on public.shopflow_records;
create policy shopflow_records_delete_member on public.shopflow_records
for delete to authenticated using (public.shopflow_is_shop_member(shop_id));
