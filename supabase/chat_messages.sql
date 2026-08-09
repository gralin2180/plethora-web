-- Chat history (optional cloud sync for signed-in users)
-- Run in Supabase SQL Editor after core schema

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_user_created_idx
  on public.chat_messages (user_id, created_at desc);

alter table public.chat_messages enable row level security;

drop policy if exists "Users read own chat" on public.chat_messages;
create policy "Users read own chat"
  on public.chat_messages for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own chat" on public.chat_messages;
create policy "Users insert own chat"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own chat" on public.chat_messages;
create policy "Users delete own chat"
  on public.chat_messages for delete
  using (auth.uid() = user_id);

-- Optional retention: keep last 500 messages per user (run via cron later)
-- delete from chat_messages where id in (
--   select id from (
--     select id, row_number() over (partition by user_id order by created_at desc) rn
--     from chat_messages
--   ) t where rn > 500
-- );
