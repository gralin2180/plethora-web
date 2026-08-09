-- ToolHaven full setup for project: vyomqsasyothlzqkdqdw
-- Run this in Supabase Dashboard → SQL Editor → New query → Run
-- https://supabase.com/dashboard/project/vyomqsasyothlzqkdqdw/sql/new

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  skill_level text not null default 'beginner'
    check (skill_level in ('beginner', 'intermediate', 'advanced', 'expert')),
  subscription_plan text not null default 'free'
    check (subscription_plan in ('free', 'pro', 'team', 'hardcore')),
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Daily usage
create table if not exists public.usage_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_id text,
  tool_id text not null,
  usage_date date not null default current_date,
  run_count int not null default 0,
  constraint usage_daily_identity check (user_id is not null or anonymous_id is not null)
);

create unique index if not exists usage_daily_user_tool_date
  on public.usage_daily (user_id, tool_id, usage_date)
  where user_id is not null;

create unique index if not exists usage_daily_anon_tool_date
  on public.usage_daily (anonymous_id, tool_id, usage_date)
  where anonymous_id is not null;

-- Event log
create table if not exists public.tool_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  tool_id text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Saved prompts
create table if not exists public.saved_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  raw_input text,
  refined_prompt text not null,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.usage_daily enable row level security;
alter table public.tool_runs enable row level security;
alter table public.saved_prompts enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users read own usage" on public.usage_daily;
create policy "Users read own usage"
  on public.usage_daily for select
  using (auth.uid() = user_id);

drop policy if exists "Users read own runs" on public.tool_runs;
create policy "Users read own runs"
  on public.tool_runs for select
  using (auth.uid() = user_id);

drop policy if exists "Users CRUD own prompts" on public.saved_prompts;
create policy "Users CRUD own prompts"
  on public.saved_prompts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Usage helpers
create or replace function public.get_usage_count(
  p_user_id uuid,
  p_anonymous_id text,
  p_tool_id text
)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select run_count
      from public.usage_daily
      where tool_id = p_tool_id
        and usage_date = current_date
        and (
          (p_user_id is not null and user_id = p_user_id)
          or (p_anonymous_id is not null and anonymous_id = p_anonymous_id)
        )
      limit 1
    ),
    0
  );
$$;

create or replace function public.increment_tool_usage(
  p_user_id uuid,
  p_anonymous_id text,
  p_tool_id text,
  p_metadata jsonb default '{}'::jsonb
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if p_user_id is null and p_anonymous_id is null then
    raise exception 'identity required';
  end if;

  insert into public.tool_runs (user_id, anonymous_id, tool_id, metadata)
  values (p_user_id, p_anonymous_id, p_tool_id, p_metadata);

  if p_user_id is not null then
    insert into public.usage_daily (user_id, tool_id, usage_date, run_count)
    values (p_user_id, p_tool_id, current_date, 1)
    on conflict (user_id, tool_id, usage_date)
    where user_id is not null
    do update set run_count = usage_daily.run_count + 1
    returning run_count into v_count;
  else
    insert into public.usage_daily (anonymous_id, tool_id, usage_date, run_count)
    values (p_anonymous_id, p_tool_id, current_date, 1)
    on conflict (anonymous_id, tool_id, usage_date)
    where anonymous_id is not null
    do update set run_count = usage_daily.run_count + 1
    returning run_count into v_count;
  end if;

  return v_count;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
grant execute on function public.get_usage_count(uuid, text, text) to anon, authenticated;
grant execute on function public.increment_tool_usage(uuid, text, text, jsonb) to anon, authenticated;
-- Workspaces + device limits (run in Supabase SQL Editor after setup.sql)
-- Project: same as setup.sql

-- Device sessions (2â€“3 free, more on paid â€” enforced in app + optional RPC)
create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_key text not null,
  label text,
  user_agent text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, device_key)
);

create index if not exists user_devices_user_idx on public.user_devices (user_id);

-- Cloud workspaces (notes, pinned tools, graph drafts)
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My workspace',
  description text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspaces_user_idx on public.workspaces (user_id);

create table if not exists public.workspace_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'note'
    check (kind in ('note', 'tool_pin', 'prompt', 'graph', 'file_ref')),
  title text,
  body text,
  tool_slug text,
  data jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_items_ws_idx on public.workspace_items (workspace_id);

drop trigger if exists workspaces_updated_at on public.workspaces;
create trigger workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

drop trigger if exists workspace_items_updated_at on public.workspace_items;
create trigger workspace_items_updated_at
  before update on public.workspace_items
  for each row execute function public.set_updated_at();

alter table public.user_devices enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_items enable row level security;

drop policy if exists "Users manage own devices" on public.user_devices;
create policy "Users manage own devices"
  on public.user_devices for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own workspaces" on public.workspaces;
create policy "Users manage own workspaces"
  on public.workspaces for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own workspace items" on public.workspace_items;
create policy "Users manage own workspace items"
  on public.workspace_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto default workspace on profile create (extend handle_new_user would need rewrite;
-- safe insert function for apps to call)
create or replace function public.ensure_default_workspace(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  wid uuid;
begin
  if p_user_id is null or p_user_id <> auth.uid() then
    raise exception 'not allowed';
  end if;
  select id into wid from public.workspaces
    where user_id = p_user_id and is_default = true
    limit 1;
  if wid is not null then
    return wid;
  end if;
  insert into public.workspaces (user_id, name, is_default)
  values (p_user_id, 'My workspace', true)
  returning id into wid;
  return wid;
end;
$$;

grant execute on function public.ensure_default_workspace(uuid) to authenticated;

-- (appended workspaces_devices)

