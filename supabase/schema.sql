-- Spawn Rotation Tracker Schema
-- Run this in the Supabase SQL Editor to set up your database.

-- ============================================================
-- Tables
-- ============================================================

create table if not exists maps (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  locations text[] not null default '{}'
);

create table if not exists modifiers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists rotations (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references maps(id) on delete cascade,
  week_start date not null,
  created_at timestamptz not null default now(),
  unique (map_id, week_start)
);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  rotation_id uuid not null references rotations(id) on delete cascade,
  round_number int not null check (round_number between 1 and 4),
  modifier_id uuid references modifiers(id) on delete set null,
  unique (rotation_id, round_number)
);

create table if not exists waves (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  wave_number int not null check (wave_number between 1 and 4),
  unique (round_id, wave_number)
);

create table if not exists spawns (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references waves(id) on delete cascade,
  spawn_index int not null,
  location text not null,
  element text not null,
  unique (round_id, spawn_index)
);

-- ============================================================
-- Seed data
-- ============================================================

insert into maps (name, slug, locations) values
  ('Hidden Temple', 'hidden-temple', '{"Pagoda","Cemetery","Courtyard"}'),
  ('Frozen Valley', 'frozen-valley', '{"Waterfall","Hillside","Armory"}'),
  ('Broken Castle', 'broken-castle', '{"Foundry","Burned Garden","Keep"}')
on conflict (slug) do nothing;

insert into modifiers (name) values
  ('Fire'),
  ('Ice'),
  ('Shadow'),
  ('Light'),
  ('Wind'),
  ('Thunder'),
  ('Poison'),
  ('Void')
on conflict (name) do nothing;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table maps enable row level security;
alter table modifiers enable row level security;
alter table rotations enable row level security;
alter table rounds enable row level security;
alter table waves enable row level security;
alter table spawns enable row level security;

-- Public read access on all tables
create policy "Public read access" on maps for select to anon, authenticated using (true);
create policy "Public read access" on modifiers for select to anon, authenticated using (true);
create policy "Public read access" on rotations for select to anon, authenticated using (true);
create policy "Public read access" on rounds for select to anon, authenticated using (true);
create policy "Public read access" on waves for select to anon, authenticated using (true);
create policy "Public read access" on spawns for select to anon, authenticated using (true);

-- Authenticated write access on mutable tables
create policy "Authenticated insert" on rotations for insert to authenticated with check (true);
create policy "Authenticated update" on rotations for update to authenticated using (true) with check (true);
create policy "Authenticated delete" on rotations for delete to authenticated using (true);

create policy "Authenticated insert" on rounds for insert to authenticated with check (true);
create policy "Authenticated update" on rounds for update to authenticated using (true) with check (true);
create policy "Authenticated delete" on rounds for delete to authenticated using (true);

create policy "Authenticated insert" on waves for insert to authenticated with check (true);
create policy "Authenticated update" on waves for update to authenticated using (true) with check (true);
create policy "Authenticated delete" on waves for delete to authenticated using (true);

create policy "Authenticated insert" on spawns for insert to authenticated with check (true);
create policy "Authenticated update" on spawns for update to authenticated using (true) with check (true);
create policy "Authenticated delete" on spawns for delete to authenticated using (true);
