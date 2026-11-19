-- Temporary ShopFlow test access: no seven-day expiry or mandatory payment.
-- This does not mark accounts as paid. Only verified server-side payment confirmation
-- can set status = 'active' and extend current_period_ends_at.

alter table public.shopflow_billing_accounts
  drop constraint if exists shopflow_billing_accounts_status_check;

alter table public.shopflow_billing_accounts
  add constraint shopflow_billing_accounts_status_check
  check (status in ('testing', 'trialing', 'active', 'past_due', 'canceled', 'expired'));

-- Preserve real, still-current paid accounts. Move non-paid/expired accounts to an
-- explicit testing state so existing users can continue without a client-side flag.
update public.shopflow_billing_accounts
set status = 'testing',
    trial_started_at = null,
    trial_ends_at = null,
    updated_at = now()
where status <> 'active'
   or (status = 'active' and current_period_ends_at is not null and current_period_ends_at <= now());

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

  -- Testing access is separate from paid entitlement: this status never indicates payment.
  insert into public.shopflow_billing_accounts (
    owner_user_id, plan_id, status, trial_started_at, trial_ends_at
  ) values (
    requesting_user,
    coalesce(p_initial_plan, 'starter'),
    'testing',
    null,
    null
  ) on conflict (owner_user_id) do nothing;

  select b.plan_id
    into account_plan
  from public.shopflow_billing_accounts b
  where b.owner_user_id = requesting_user
  for update;

  -- No trial/expiry/payment gate while the temporary test-access migration is active.
  -- Keep the plan's existing shop-count rule; Business is the only multi-shop tier.
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
