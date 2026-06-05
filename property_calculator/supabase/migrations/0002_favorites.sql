-- Property calculator: per-user bookmarked listings ("Favoriten").
--
-- Run this once in your Supabase project:
--   Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
-- (or apply via the Supabase CLI: `supabase db push`).
--
-- Design: one row per favorited listing per user. The listing snapshot (title,
-- key figures and computed KPIs at bookmark time) is stored as a JSON blob so
-- the Favoriten panel can render it without recomputing. Access is locked down
-- with Row Level Security so a user can only ever read/write their own rows.

create table if not exists public.favorites (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  listing_id text        not null,
  data       jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- Enable Row Level Security (denies everything until a policy allows it).
alter table public.favorites enable row level security;

-- A user may read only their own favorites.
drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own"
  on public.favorites
  for select
  using (auth.uid() = user_id);

-- A user may create only their own favorites.
drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
  on public.favorites
  for insert
  with check (auth.uid() = user_id);

-- A user may update only their own favorites.
drop policy if exists "favorites_update_own" on public.favorites;
create policy "favorites_update_own"
  on public.favorites
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- A user may delete only their own favorites.
drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
  on public.favorites
  for delete
  using (auth.uid() = user_id);
