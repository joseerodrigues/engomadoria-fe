create table public.package_plans (
  id text primary key,
  name_pt text not null,
  monthly_credits integer not null check (monthly_credits > 0),
  is_active boolean not null default true
);

create table public.garment_types (
  id text primary key,
  name_pt text not null,
  singular_pt text not null,
  credits_per_piece integer not null check (credits_per_piece > 0),
  icon text not null,
  is_active boolean not null default true
);

create table public.customer_packages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users (id) on delete cascade,
  plan_id text not null references public.package_plans (id),
  valid_from date not null default current_date,
  valid_until date,
  status text not null default 'active' check (status in ('active', 'ended')),
  check (valid_until is null or valid_until >= valid_from)
);

create unique index customer_packages_one_active_idx
  on public.customer_packages (customer_id)
  where status = 'active';

create index customer_packages_customer_idx on public.customer_packages (customer_id, valid_from desc);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users (id) on delete cascade,
  customer_package_id uuid not null references public.customer_packages (id),
  delivered_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index deliveries_customer_date_idx on public.deliveries (customer_id, delivered_on desc);
create index deliveries_package_date_idx on public.deliveries (customer_package_id, delivered_on desc);

create table public.delivery_items (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries (id) on delete cascade,
  garment_type_id text not null references public.garment_types (id),
  garment_name_snapshot text not null,
  quantity integer not null check (quantity > 0),
  credits_per_piece_snapshot integer not null check (credits_per_piece_snapshot > 0),
  unique (delivery_id, garment_type_id)
);

create index delivery_items_delivery_idx on public.delivery_items (delivery_id);
create index delivery_items_garment_idx on public.delivery_items (garment_type_id);

insert into public.package_plans (id, name_pt, monthly_credits)
values ('essential-30', 'Essencial', 30)
on conflict (id) do update set name_pt = excluded.name_pt, monthly_credits = excluded.monthly_credits, is_active = true;

insert into public.garment_types (id, name_pt, singular_pt, credits_per_piece, icon)
values
  ('shirt', 'Camisas', 'Camisa', 1, 'shirt'),
  ('trousers', 'Calças', 'Calça', 1, 'trousers'),
  ('jacket', 'Casacos', 'Casaco', 2, 'jacket'),
  ('dress', 'Vestidos', 'Vestido', 2, 'dress'),
  ('bedding', 'Roupa de cama', 'Peça de cama', 3, 'bedding')
on conflict (id) do update set
  name_pt = excluded.name_pt,
  singular_pt = excluded.singular_pt,
  credits_per_piece = excluded.credits_per_piece,
  icon = excluded.icon,
  is_active = true;

create function public.create_customer_package_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.customer_packages (customer_id, plan_id, valid_from, status)
  values (
    new.id,
    'essential-30',
    date_trunc('month', timezone('Europe/Lisbon', now()))::date,
    'active'
  );
  return new;
end;
$$;

revoke all on function public.create_customer_package_for_new_user() from public, anon, authenticated;

create trigger on_auth_user_created_create_package
  after insert on auth.users
  for each row execute function public.create_customer_package_for_new_user();

create function public.create_delivery(p_delivered_on date, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_package_id uuid;
  v_delivery_id uuid;
  v_item jsonb;
  v_garment_id text;
  v_quantity integer;
  v_credits integer;
  v_name text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_delivered_on is null or p_delivered_on > timezone('Europe/Lisbon', now())::date then
    raise exception 'Delivery date is invalid';
  end if;

  if pg_catalog.jsonb_typeof(p_items) <> 'array'
    or pg_catalog.jsonb_array_length(p_items) < 1
    or pg_catalog.jsonb_array_length(p_items) > 20 then
    raise exception 'Delivery must contain between 1 and 20 garment types';
  end if;

  select cp.id into v_package_id
  from public.customer_packages as cp
  where cp.customer_id = v_user_id
    and cp.status = 'active'
    and cp.valid_from <= p_delivered_on
    and (cp.valid_until is null or cp.valid_until >= p_delivered_on)
  order by cp.valid_from desc
  limit 1;

  if v_package_id is null then
    raise exception 'No active package for delivery date';
  end if;

  insert into public.deliveries (customer_id, customer_package_id, delivered_on)
  values (v_user_id, v_package_id, p_delivered_on)
  returning id into v_delivery_id;

  for v_item in select value from pg_catalog.jsonb_array_elements(p_items) as items(value)
  loop
    v_garment_id := v_item ->> 'garment_type_id';

    if (v_item ->> 'quantity') is null or (v_item ->> 'quantity') !~ '^[1-9][0-9]{0,2}$' then
      raise exception 'Garment quantity must be a positive integer up to 999';
    end if;

    v_quantity := (v_item ->> 'quantity')::integer;

    select gt.name_pt, gt.credits_per_piece
    into v_name, v_credits
    from public.garment_types as gt
    where gt.id = v_garment_id and gt.is_active;

    if not found then
      raise exception 'Garment type is unavailable';
    end if;

    insert into public.delivery_items (
      delivery_id, garment_type_id, garment_name_snapshot, quantity, credits_per_piece_snapshot
    ) values (
      v_delivery_id, v_garment_id, v_name, v_quantity, v_credits
    );
  end loop;

  return v_delivery_id;
end;
$$;

revoke all on function public.create_delivery(date, jsonb) from public, anon;
grant execute on function public.create_delivery(date, jsonb) to authenticated;

alter table public.package_plans enable row level security;
alter table public.garment_types enable row level security;
alter table public.customer_packages enable row level security;
alter table public.deliveries enable row level security;
alter table public.delivery_items enable row level security;

revoke all on public.package_plans, public.garment_types, public.customer_packages, public.deliveries, public.delivery_items from anon, authenticated;
grant select on public.package_plans, public.garment_types, public.customer_packages, public.deliveries, public.delivery_items to authenticated;

create policy "authenticated users can read package plans"
  on public.package_plans for select to authenticated using (true);

create policy "authenticated users can read garment types"
  on public.garment_types for select to authenticated using (true);

create policy "customers can read their own packages"
  on public.customer_packages for select to authenticated
  using ((select auth.uid()) is not null and customer_id = (select auth.uid()));

create policy "customers can read their own deliveries"
  on public.deliveries for select to authenticated
  using ((select auth.uid()) is not null and customer_id = (select auth.uid()));

create policy "customers can read their own delivery items"
  on public.delivery_items for select to authenticated
  using (
    exists (
      select 1 from public.deliveries as d
      where d.id = delivery_items.delivery_id
        and d.customer_id = (select auth.uid())
    )
  );
