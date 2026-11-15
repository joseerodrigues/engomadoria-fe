create or replace function public.update_delivery(p_delivery_id uuid, p_delivered_on date, p_items jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_package_id uuid;
  v_item jsonb;
  v_garment_id text;
  v_quantity integer;
  v_credits integer;
  v_name text;
  v_existing_garment_ids text[];
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

  select d.customer_package_id into v_package_id
  from public.deliveries as d
  where d.id = p_delivery_id and d.customer_id = v_user_id;

  if v_package_id is null then
    raise exception 'Delivery not found';
  end if;

  if not exists (
    select 1 from public.customer_packages as cp
    where cp.id = v_package_id
      and cp.customer_id = v_user_id
      and cp.valid_from <= p_delivered_on
      and (cp.valid_until is null or cp.valid_until >= p_delivered_on)
  ) then
    raise exception 'Delivery date is outside the package period';
  end if;

  select pg_catalog.array_agg(di.garment_type_id)
  into v_existing_garment_ids
  from public.delivery_items as di
  where di.delivery_id = p_delivery_id;

  update public.deliveries set delivered_on = p_delivered_on where id = p_delivery_id;
  delete from public.delivery_items where delivery_id = p_delivery_id;

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
    where gt.id = v_garment_id
      and (gt.is_active or gt.id = any(v_existing_garment_ids));

    if not found then
      raise exception 'Garment type is unavailable';
    end if;

    insert into public.delivery_items (
      delivery_id, garment_type_id, garment_name_snapshot, quantity, credits_per_piece_snapshot
    ) values (
      p_delivery_id, v_garment_id, v_name, v_quantity, v_credits
    );
  end loop;
end;
$$;

create or replace function public.delete_delivery(p_delivery_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  delete from public.deliveries
  where id = p_delivery_id and customer_id = v_user_id;

  if not found then
    raise exception 'Delivery not found';
  end if;
end;
$$;

revoke all on function public.update_delivery(uuid, date, jsonb) from public, anon;
revoke all on function public.delete_delivery(uuid) from public, anon;
grant execute on function public.update_delivery(uuid, date, jsonb) to authenticated;
grant execute on function public.delete_delivery(uuid) to authenticated;
