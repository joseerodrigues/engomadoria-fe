create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default clock_timestamp(),
  actor_id uuid,
  subject_customer_id uuid,
  table_schema text not null,
  table_name text not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  record_id text,
  old_data jsonb,
  new_data jsonb
);

create index if not exists audit_logs_occurred_at_idx on public.audit_logs (occurred_at desc);
create index if not exists audit_logs_subject_time_idx on public.audit_logs (subject_customer_id, occurred_at desc);
create index if not exists audit_logs_entity_time_idx on public.audit_logs (table_schema, table_name, record_id, occurred_at desc);

alter table public.audit_logs enable row level security;
revoke all on public.audit_logs from public, anon, authenticated;
grant select on public.audit_logs to service_role;

create or replace function public.capture_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_subject_customer_id uuid;
  v_record jsonb;
  v_old_data jsonb;
  v_new_data jsonb;
  v_record_id text;
begin
  if tg_op = 'INSERT' then
    v_new_data := pg_catalog.to_jsonb(new);
    v_record := v_new_data;
  elsif tg_op = 'UPDATE' then
    v_old_data := pg_catalog.to_jsonb(old);
    v_new_data := pg_catalog.to_jsonb(new);
    v_record := v_new_data;
  else
    v_old_data := pg_catalog.to_jsonb(old);
    v_record := v_old_data;
  end if;

  if tg_table_schema = 'auth' and tg_table_name = 'users' then
    if v_old_data is not null then
      v_old_data := pg_catalog.jsonb_build_object(
        'id', v_old_data -> 'id',
        'created_at', v_old_data -> 'created_at',
        'updated_at', v_old_data -> 'updated_at',
        'email_confirmed_at', v_old_data -> 'email_confirmed_at',
        'phone_confirmed_at', v_old_data -> 'phone_confirmed_at'
      );
    end if;
    if v_new_data is not null then
      v_new_data := pg_catalog.jsonb_build_object(
        'id', v_new_data -> 'id',
        'created_at', v_new_data -> 'created_at',
        'updated_at', v_new_data -> 'updated_at',
        'email_confirmed_at', v_new_data -> 'email_confirmed_at',
        'phone_confirmed_at', v_new_data -> 'phone_confirmed_at'
      );
    end if;
    v_subject_customer_id := nullif(v_record ->> 'id', '')::uuid;
  else
    v_subject_customer_id := nullif(v_record ->> 'customer_id', '')::uuid;
  end if;

  v_record_id := coalesce(v_record ->> 'id', v_record ->> 'delivery_id');

  insert into public.audit_logs (
    actor_id,
    subject_customer_id,
    table_schema,
    table_name,
    operation,
    record_id,
    old_data,
    new_data
  ) values (
    v_actor_id,
    v_subject_customer_id,
    tg_table_schema,
    tg_table_name,
    tg_op,
    v_record_id,
    v_old_data,
    v_new_data
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.capture_audit_log() from public, anon, authenticated;

drop trigger if exists capture_audit_log on public.package_plans;
create trigger capture_audit_log after insert or update or delete on public.package_plans
  for each row execute function public.capture_audit_log();

drop trigger if exists capture_audit_log on public.garment_types;
create trigger capture_audit_log after insert or update or delete on public.garment_types
  for each row execute function public.capture_audit_log();

drop trigger if exists capture_audit_log on public.customer_packages;
create trigger capture_audit_log after insert or update or delete on public.customer_packages
  for each row execute function public.capture_audit_log();

drop trigger if exists capture_audit_log on public.deliveries;
create trigger capture_audit_log after insert or update or delete on public.deliveries
  for each row execute function public.capture_audit_log();

drop trigger if exists capture_audit_log on public.delivery_items;
create trigger capture_audit_log after insert or update or delete on public.delivery_items
  for each row execute function public.capture_audit_log();

drop trigger if exists capture_audit_log on auth.users;
create trigger capture_audit_log after insert or update or delete on auth.users
  for each row execute function public.capture_audit_log();
