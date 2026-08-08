-- ToolHaven initial schema
-- Project: vyomqsasyothlzqkdqdw (see also setup.sql for full functions + RLS)

create table public.profiles (
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

create table public.usage_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_id text,
  tool_id text not null,
  usage_date date not null default current_date,
  run_count int not null default 0,
  constraint usage_daily_identity check (user_id is not null or anonymous_id is not null)
);

create unique index usage_daily_user_tool_date
  on public.usage_daily (user_id, tool_id, usage_date)
  where user_id is not null;

create unique index usage_daily_anon_tool_date
  on public.usage_daily (anonymous_id, tool_id, usage_date)
  where anonymous_id is not null;

create table public.tool_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  tool_id text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.saved_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  raw_input text,
  refined_prompt text not null,
  created_at timestamptz not null default now()
);
