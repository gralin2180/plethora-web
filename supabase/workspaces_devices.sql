-- Workspaces + device limits (run in Supabase SQL Editor after setup.sql)
-- Project: same as setup.sql

-- Device sessions (2–3 free, more on paid — enforced in app + optional RPC)
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
