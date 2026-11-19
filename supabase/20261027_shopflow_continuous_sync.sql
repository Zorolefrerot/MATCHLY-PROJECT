-- Atomic, owner-scoped snapshot sync for authenticated ShopFlow accounts.
-- This preserves the local device snapshot; it only changes cloud records.

create or replace function public.shopflow_sync_shop_records(
  p_shop_id uuid,
  p_records jsonb
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  synced_count integer;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'authentication_required';
  end if;
  if not public.shopflow_is_shop_owner(p_shop_id) then
    raise exception using errcode = '42501', message = 'shop_owner_required';
  end if;
  if p_records is null or jsonb_typeof(p_records) <> 'array' then
    raise exception using errcode = '22023', message = 'invalid_sync_payload';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_records) as item(record_type text, record_id text, payload jsonb)
    where item.record_type is null
       or item.record_type not in ('settings', 'product', 'sale', 'credit', 'expense')
       or item.record_id is null
       or char_length(item.record_id) not between 1 and 120
       or item.payload is null
       or jsonb_typeof(item.payload) <> 'object'
  ) then
    raise exception using errcode = '22023', message = 'invalid_sync_record';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_records) as item(record_type text, record_id text, payload jsonb)
    group by item.record_type, item.record_id
    having count(*) > 1
  ) then
    raise exception using errcode = '22023', message = 'duplicate_sync_record';
  end if;
  if not exists (
    select 1
    from jsonb_to_recordset(p_records) as item(record_type text, record_id text, payload jsonb)
    where item.record_type = 'settings' and item.record_id = 'current'
  ) then
    raise exception using errcode = '22023', message = 'sync_settings_required';
  end if;

  -- Soft-delete records removed on the device. Historical rows and local
  -- device backups remain intact and the tombstones can be audited/restored.
  update public.shopflow_records as current_record
  set deleted_at = now(), updated_at = now()
  where current_record.shop_id = p_shop_id
    and current_record.deleted_at is null
    and not exists (
      select 1
      from jsonb_to_recordset(p_records) as incoming(record_type text, record_id text, payload jsonb)
      where incoming.record_type = current_record.record_type
        and incoming.record_id = current_record.record_id
    );

  insert into public.shopflow_records as current_record (shop_id, record_type, record_id, payload)
  select p_shop_id, incoming.record_type, incoming.record_id, incoming.payload
  from jsonb_to_recordset(p_records) as incoming(record_type text, record_id text, payload jsonb)
  on conflict (shop_id, record_type, record_id) do update
    set payload = excluded.payload,
        updated_at = now(),
        deleted_at = null
    where current_record.payload is distinct from excluded.payload
       or current_record.deleted_at is not null;

  get diagnostics synced_count = row_count;
  return synced_count;
end;
$$;

revoke all on function public.shopflow_sync_shop_records(uuid, jsonb) from public, anon;
grant execute on function public.shopflow_sync_shop_records(uuid, jsonb) to authenticated;
