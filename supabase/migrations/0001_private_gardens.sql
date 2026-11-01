-- A single private document per signed-in owner; no public links or sharing.
create table if not exists public.gardens (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  garden_data jsonb not null default
    '{"schemaVersion":1,"areas":[],"plants":[],"tasks":[]}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint garden_data_is_object check (jsonb_typeof(garden_data) = 'object')
);

alter table public.gardens enable row level security;

revoke all on public.gardens from anon;
grant select, insert, update, delete on public.gardens to authenticated;

create policy "Owners can read their own garden"
  on public.gardens for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Owners can create their own garden"
  on public.gardens for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Owners can update their own garden"
  on public.gardens for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Owners can delete their own garden"
  on public.gardens for delete
  to authenticated
  using ((select auth.uid()) = owner_id);
