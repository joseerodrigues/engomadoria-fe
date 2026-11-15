insert into public.package_plans (id, name_pt, monthly_credits, duration_months, is_active)
values
  ('essential-30', 'Essencial', 30, 1, true),
  ('comfort-60', 'Conforto', 60, 1, true),
  ('family-90', 'Família', 90, 1, true)
on conflict (id) do update set
  name_pt = excluded.name_pt,
  monthly_credits = excluded.monthly_credits,
  duration_months = excluded.duration_months,
  is_active = excluded.is_active;

create or replace function public.switch_customer_plan(p_plan_id text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := timezone('Europe/Lisbon', now())::date;
  v_package_id uuid;
  v_current_plan_id text;
  v_new_package_id uuid;
  v_plan_name text;
  v_monthly_credits integer;
  v_duration_months integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_plan_id is null or length(p_plan_id) < 1 or length(p_plan_id) > 64 then
    raise exception 'Package plan is invalid';
  end if;

  select pp.name_pt, pp.monthly_credits, pp.duration_months
  into v_plan_name, v_monthly_credits, v_duration_months
  from public.package_plans as pp
  where pp.id = p_plan_id and pp.is_active;

  if not found then
    raise exception 'Package plan is unavailable';
  end if;

  update public.customer_packages
  set status = 'ended'
  where customer_id = v_user_id and status = 'active' and valid_until < v_today;

  select cp.id, cp.plan_id
  into v_package_id, v_current_plan_id
  from public.customer_packages as cp
  where cp.customer_id = v_user_id
    and cp.status = 'active'
    and cp.valid_from <= v_today
    and (cp.valid_until is null or cp.valid_until >= v_today)
  order by cp.valid_from desc
  limit 1
  for update;

  if v_package_id is not null and v_current_plan_id = p_plan_id then
    return v_package_id;
  end if;

  if v_package_id is not null then
    update public.customer_packages
    set status = 'ended', valid_until = v_today
    where id = v_package_id and customer_id = v_user_id;
  end if;

  insert into public.customer_packages (
    customer_id, plan_id, plan_name_snapshot, monthly_credits_snapshot, duration_months_snapshot,
    valid_from, valid_until, status
  ) values (
    v_user_id, p_plan_id, v_plan_name, v_monthly_credits, v_duration_months,
    v_today, (v_today + pg_catalog.make_interval(months => v_duration_months))::date, 'active'
  )
  returning id into v_new_package_id;

  return v_new_package_id;
end;
$$;

revoke all on function public.switch_customer_plan(text) from public, anon;
grant execute on function public.switch_customer_plan(text) to authenticated;
