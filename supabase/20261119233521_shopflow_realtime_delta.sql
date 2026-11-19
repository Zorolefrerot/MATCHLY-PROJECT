-- Row-level cloud sync prevents stale devices from replacing unrelated records.
-- Soft deletes are explicit so other signed-in devices can reconcile removals.

create or replace function public.shopflow_apply_shop_changes(
  p_shop_id uuid,
  p_upserts jsonb,
  p_deletes jsonb
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  affected_count integer := 0;
  changed_count integer := 0;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'authentication_required';
  end if;
  if not public.shopflow_is_shop_owner(p_shop_id) then
    raise exception using errcode = '42501', message = 'shop_owner_required';
  end if;
  if p_upserts is null or jsonb_typeof(p_upserts) <> 'array'
     or p_deletes is null or jsonb_typeof(p_deletes) <> 'array' then
    raise exception using errcode = '22023', message = 'invalid_shop_changes';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_upserts) as item(record_type text, record_id text, payload jsonb)
    where item.record_type is null
       or item.record_type not in ('settings', 'product', 'sale', 'credit', 'expense')
       or item.record_id is null
       or char_length(item.record_id) not between 1 and 120
       or item.payload is null
       or jsonb_typeof(item.payload) <> 'object'
  ) then
    raise exception using errcode = '22023', message = 'invalid_shop_upsert';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_deletes) as item(record_type text, record_id text)
    where item.record_type is null
       or item.record_type not in ('product', 'sale', 'credit', 'expense')
       or item.record_id is null
       or char_length(item.record_id) not between 1 and 120
  ) then
    raise exception using errcode = '22023', message = 'invalid_shop_delete';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_upserts) as item(record_type text, record_id text, payload jsonb)
    group by item.record_type, item.record_id
    having count(*) > 1
  ) or exists (
    select 1
    from jsonb_to_recordset(p_deletes) as item(record_type text, record_id text)
    group by item.record_type, item.record_id
    having count(*) > 1
  ) then
    raise exception using errcode = '22023', message = 'duplicate_shop_change';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_upserts) as incoming(record_type text, record_id text, payload jsonb)
    join jsonb_to_recordset(p_deletes) as removed(record_type text, record_id text)
      using (record_type, record_id)
  ) then
    raise exception using errcode = '22023', message = 'conflicting_shop_change';
  end if;

  -- Record tombstones instead of physically deleting merchant history.
  update public.shopflow_records as current_record
  set deleted_at = now(), updated_at = now()
  where current_record.shop_id = p_shop_id
    and current_record.deleted_at is null
    and exists (
      select 1
      from jsonb_to_recordset(p_deletes) as removed(record_type text, record_id text)
      where removed.record_type = current_record.record_type
        and removed.record_id = current_record.record_id
    );
  get diagnostics changed_count = row_count;
  affected_count := affected_count + changed_count;

  insert into public.shopflow_records as current_record (shop_id, record_type, record_id, payload)
  select p_shop_id, incoming.record_type, incoming.record_id, incoming.payload
  from jsonb_to_recordset(p_upserts) as incoming(record_type text, record_id text, payload jsonb)
  on conflict (shop_id, record_type, record_id) do update
    set payload = excluded.payload,
        updated_at = now(),
        deleted_at = null
    where current_record.payload is distinct from excluded.payload
       or current_record.deleted_at is not null;
  get diagnostics changed_count = row_count;
  affected_count := affected_count + changed_count;

  return affected_count;
end;
$function$;

revoke all on function public.shopflow_apply_shop_changes(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.shopflow_apply_shop_changes(uuid, jsonb, jsonb) to authenticated;

-- Supabase Realtime only emits row changes for tables included in its publication.
do $publication$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'shopflow_records'
  ) then
    execute 'alter publication supabase_realtime add table public.shopflow_records';
  end if;
end;
$publication$;
