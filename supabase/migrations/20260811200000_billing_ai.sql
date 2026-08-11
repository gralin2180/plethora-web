-- Billing + AI entitlement columns (run in Supabase SQL Editor once)
-- Safe to re-run.

alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text not null default 'inactive',
  add column if not exists premium_used_period int not null default 0,
  add column if not exists premium_period_start timestamptz,
  add column if not exists self_limit_premium_month int,
  add column if not exists trial_pack text,
  add column if not exists trial_pack_ends_at timestamptz,
  add column if not exists trial_pack_premium_used int not null default 0,
  add column if not exists trial_pack_premium_cap int not null default 0;

create index if not exists profiles_stripe_customer_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists profiles_stripe_sub_idx
  on public.profiles (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- Prevent clients from self-upgrading plan / billing fields
create or replace function public.protect_profile_billing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and coalesce(auth.role(), '') <> 'service_role' then
    new.subscription_plan := old.subscription_plan;
    new.stripe_customer_id := old.stripe_customer_id;
    new.stripe_subscription_id := old.stripe_subscription_id;
    new.subscription_status := old.subscription_status;
    new.premium_used_period := old.premium_used_period;
    new.premium_period_start := old.premium_period_start;
    new.trial_pack := old.trial_pack;
    new.trial_pack_ends_at := old.trial_pack_ends_at;
    new.trial_pack_premium_used := old.trial_pack_premium_used;
    new.trial_pack_premium_cap := old.trial_pack_premium_cap;
    -- self_limit_premium_month is user-editable
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_billing on public.profiles;
create trigger protect_profile_billing
  before update on public.profiles
  for each row execute function public.protect_profile_billing();

-- Idempotent webhook events
create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
-- no public policies — service role only

-- Allow authenticated users to increment their premium counters (not set plan)
create or replace function public.increment_premium_usage()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  used int;
  p_start timestamptz;
  trial_ends timestamptz;
  trial_used int;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select premium_used_period, premium_period_start, trial_pack_ends_at, trial_pack_premium_used
    into used, p_start, trial_ends, trial_used
  from public.profiles
  where id = uid
  for update;

  if not found then
    return 0;
  end if;

  if p_start is null
     or date_trunc('month', p_start at time zone 'utc')
        <> date_trunc('month', now() at time zone 'utc') then
    used := 1;
    p_start := now();
  else
    used := coalesce(used, 0) + 1;
  end if;

  if trial_ends is not null and trial_ends > now() then
    trial_used := coalesce(trial_used, 0) + 1;
  end if;

  update public.profiles
  set premium_used_period = used,
      premium_period_start = p_start,
      trial_pack_premium_used = coalesce(trial_used, trial_pack_premium_used)
  where id = uid;

  return used;
end;
$$;

grant execute on function public.increment_premium_usage() to authenticated;
