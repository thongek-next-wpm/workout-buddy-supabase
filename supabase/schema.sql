-- ============================================================================
-- Workout Buddy - Supabase PostgreSQL Schema & Row Level Security (RLS)
-- ============================================================================
-- Run this script in your Supabase Dashboard -> SQL Editor -> New Query.

create extension if not exists "pgcrypto";

-- 1. Workouts table (linked to Supabase Auth users)
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  load numeric(10, 2) not null default 0 check (load >= 0),
  reps integer not null check (reps > 0),
  sets integer not null default 1 check (sets > 0),
  category text not null default 'Strength' check (
    category in ('Strength', 'Hypertrophy', 'Cardio', 'Bodyweight', 'Mobility')
  ),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Index for fast per-user chronological queries
create index if not exists workouts_user_id_created_at_idx
  on public.workouts (user_id, created_at desc);

-- 3. Automatically maintain updated_at timestamp
create or replace function public.handle_workouts_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_workouts_updated_at on public.workouts;
create trigger set_workouts_updated_at
  before update on public.workouts
  for each row
  execute function public.handle_workouts_updated_at();

-- 4. Enable Row Level Security (RLS) & Table Privileges
alter table public.workouts enable row level security;

revoke all on table public.workouts from anon;
grant select, insert, update, delete on table public.workouts to authenticated;

drop policy if exists "Users can view their own workouts" on public.workouts;
create policy "Users can view their own workouts"
  on public.workouts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own workouts" on public.workouts;
create policy "Users can insert their own workouts"
  on public.workouts
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own workouts" on public.workouts;
create policy "Users can update their own workouts"
  on public.workouts
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own workouts" on public.workouts;
create policy "Users can delete their own workouts"
  on public.workouts
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
