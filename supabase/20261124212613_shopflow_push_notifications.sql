-- Web Push subscriptions and a private, per-user notification inbox.
-- The browser may manage only its own subscriptions; trusted Edge Functions send events.

create table if not exists public.shopflow_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid not null references public.shopflow_shops(id) on delete cascade,
  endpoint text not null check (char_length(endpoint) between 1 and 2048),
  subscription jsonb not null check (jsonb_typeof(subscription) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, shop_id, endpoint)
);

create index if not exists shopflow_push_subscriptions_shop_idx
  on public.shopflow_push_subscriptions(shop_id, user_id);

alter table public.shopflow_push_subscriptions enable row level security;
revoke all on public.shopflow_push_subscriptions from public, anon;
grant select, insert, delete on public.shopflow_push_subscriptions to authenticated;

drop policy if exists shopflow_push_subscriptions_select_self on public.shopflow_push_subscriptions;
create policy shopflow_push_subscriptions_select_self on public.shopflow_push_subscriptions
for select to authenticated
using (user_id = (select auth.uid()) and public.shopflow_is_shop_member(shop_id));

drop policy if exists shopflow_push_subscriptions_insert_self on public.shopflow_push_subscriptions;
create policy shopflow_push_subscriptions_insert_self on public.shopflow_push_subscriptions
for insert to authenticated
with check (user_id = (select auth.uid()) and public.shopflow_is_shop_member(shop_id));

drop policy if exists shopflow_push_subscriptions_delete_self on public.shopflow_push_subscriptions;
create policy shopflow_push_subscriptions_delete_self on public.shopflow_push_subscriptions
for delete to authenticated
using (user_id = (select auth.uid()) and public.shopflow_is_shop_member(shop_id));

create table if not exists public.shopflow_push_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid not null references public.shopflow_shops(id) on delete cascade,
  event_key text not null check (char_length(event_key) between 1 and 180),
  notification_type text not null check (notification_type in ('new_sale', 'low_stock', 'test', 'shopflow_message')),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 500),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (user_id, shop_id, event_key)
);

create index if not exists shopflow_push_notifications_user_idx
  on public.shopflow_push_notifications(user_id, created_at desc);

alter table public.shopflow_push_notifications enable row level security;
revoke all on public.shopflow_push_notifications from public, anon;
grant select on public.shopflow_push_notifications to authenticated;
grant update (read_at) on public.shopflow_push_notifications to authenticated;

drop policy if exists shopflow_push_notifications_select_self on public.shopflow_push_notifications;
create policy shopflow_push_notifications_select_self on public.shopflow_push_notifications
for select to authenticated
using (user_id = (select auth.uid()) and public.shopflow_is_shop_member(shop_id));

drop policy if exists shopflow_push_notifications_update_self on public.shopflow_push_notifications;
create policy shopflow_push_notifications_update_self on public.shopflow_push_notifications
for update to authenticated
using (user_id = (select auth.uid()) and public.shopflow_is_shop_member(shop_id))
with check (user_id = (select auth.uid()) and public.shopflow_is_shop_member(shop_id));
