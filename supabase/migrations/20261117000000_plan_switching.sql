insert into public.package_plans (id, name_pt, monthly_credits, is_active)
values
  ('essential-30', 'Essencial', 30, true),
  ('comfort-60', 'Conforto', 60, true),
  ('family-90', 'Família', 90, true)
on conflict (id) do update set
  name_pt = excluded.name_pt,
  monthly_credits = excluded.monthly_credits,
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
  v_period_start date := date_trunc('month', timezone('Europe/Lisbon', now()))::date;
  v_package_id uuid;
  v_current_plan_id text;
  v_new_package_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_plan_id is null or length(p_plan_id) < 1 or length(p_plan_id) > 64 then
    raise exception 'Package plan is invalid';
  end if;

  if not exists (select 1 from public.package_plans where id = p_plan_id and is_active) then
    raise exception 'Package plan is unavailable';
  end if;

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
  else
    v_period_start := date_trunc('month', timezone('Europe/Lisbon', now()))::date;
  end if;

  insert into public.customer_packages (customer_id, plan_id, valid_from, status)
  values (v_user_id, p_plan_id, case when v_package_id is null then v_period_start else v_today end, 'active')
  returning id into v_new_package_id;

  return v_new_package_id;
end;
$$;

revoke all on function public.switch_customer_plan(text) from public, anon;
grant execute on function public.switch_customer_plan(text) to authenticated;
