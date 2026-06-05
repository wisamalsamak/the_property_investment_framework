-- Property calculator: per-user saved portfolio.
--
-- Run this once in your Supabase project:
--   Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
-- (or apply via the Supabase CLI: `supabase db push`).
--
-- Design: one row per user holding the whole portfolio as a JSON blob. Access
-- is locked down with Row Level Security so a user can only ever read/write
-- their own row, even though the browser talks to Supabase directly with the
-- public anon key.

create table if not exists public.portfolios (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security (denies everything until a policy allows it).
alter table public.portfolios enable row level security;

-- A user may read only their own row.
drop policy if exists "portfolios_select_own" on public.portfolios;
create policy "portfolios_select_own"
  on public.portfolios
  for select
  using (auth.uid() = user_id);

-- A user may create only their own row.
drop policy if exists "portfolios_insert_own" on public.portfolios;
create policy "portfolios_insert_own"
  on public.portfolios
  for insert
  with check (auth.uid() = user_id);

-- A user may update only their own row.
drop policy if exists "portfolios_update_own" on public.portfolios;
create policy "portfolios_update_own"
  on public.portfolios
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- A user may delete only their own row.
drop policy if exists "portfolios_delete_own" on public.portfolios;
create policy "portfolios_delete_own"
  on public.portfolios
  for delete
  using (auth.uid() = user_id);
