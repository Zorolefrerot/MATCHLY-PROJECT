-- Private per-shop assets and an atomic, non-overwriting import path.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shopflow-private-assets',
  'shopflow-private-assets',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.shopflow_storage_member_can_access(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  shop_folder text := split_part(coalesce(object_name, ''), '/', 1);
begin
  if shop_folder !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.shopflow_is_shop_member(shop_folder::uuid);
end;
$$;

revoke all on function public.shopflow_storage_member_can_access(text) from public, anon;
grant execute on function public.shopflow_storage_member_can_access(text) to authenticated;

drop policy if exists shopflow_private_assets_select_member on storage.objects;
create policy shopflow_private_assets_select_member on storage.objects
for select to authenticated
using (bucket_id = 'shopflow-private-assets' and public.shopflow_storage_member_can_access(name));

drop policy if exists shopflow_private_assets_insert_member on storage.objects;
create policy shopflow_private_assets_insert_member on storage.objects
for insert to authenticated
with check (bucket_id = 'shopflow-private-assets' and public.shopflow_storage_member_can_access(name));

drop policy if exists shopflow_private_assets_update_member on storage.objects;
create policy shopflow_private_assets_update_member on storage.objects
for update to authenticated
using (bucket_id = 'shopflow-private-assets' and public.shopflow_storage_member_can_access(name))
with check (bucket_id = 'shopflow-private-assets' and public.shopflow_storage_member_can_access(name));

drop policy if exists shopflow_private_assets_delete_member on storage.objects;
create policy shopflow_private_assets_delete_member on storage.objects
for delete to authenticated
using (bucket_id = 'shopflow-private-assets' and public.shopflow_storage_member_can_access(name));

create or replace function public.shopflow_import_shop_records(
  p_shop_id uuid,
  p_records jsonb
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inserted_count integer;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'authentication_required';
  end if;
  if not public.shopflow_is_shop_owner(p_shop_id) then
    raise exception using errcode = '42501', message = 'shop_owner_required';
  end if;
  if p_records is null or jsonb_typeof(p_records) <> 'array' then
    raise exception using errcode = '22023', message = 'invalid_import_payload';
  end if;
  if exists (select 1 from public.shopflow_records r where r.shop_id = p_shop_id) then
    raise exception using errcode = 'P0001', message = 'import_target_not_empty';
  end if;

  insert into public.shopflow_records (shop_id, record_type, record_id, payload)
  select p_shop_id,
         item ->> 'record_type',
         item ->> 'record_id',
         item -> 'payload'
  from jsonb_array_elements(p_records) item;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function public.shopflow_import_shop_records(uuid, jsonb) from public, anon;
grant execute on function public.shopflow_import_shop_records(uuid, jsonb) to authenticated;
