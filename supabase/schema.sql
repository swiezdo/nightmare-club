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

create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default ''
);

create table if not exists rotations (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references maps(id) on delete cascade,
  week_start date not null,
  created_at timestamptz not null default now(),
  challenge_id uuid references challenges(id) on delete set null,
  unique (map_id, week_start)
);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  rotation_id uuid not null references rotations(id) on delete cascade,
  round_number int not null check (round_number between 1 and 4),
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
  spawn_order int not null,
  location text not null,
  element text[] not null default '{}',
  unique (round_id, spawn_order)
);

-- ============================================================
-- Seed data
-- ============================================================

insert into maps (name, slug, locations) values
  ('The Spider (Hidden Temple)', 'hidden-temple', '{"Pagoda","Cemetery","Courtyard"}'),
  ('The Kitsune (Frozen Valley)', 'frozen-valley', '{"Waterfall","Hillside","Armory"}'),
  ('The Oni (Broken Castle)', 'broken-castle', '{"Foundry","Burned Garden","Keep"}'),
  ('The Snake (River Village)', 'river-village', '{"Beach","Rice Paddies","Village"}')
on conflict (slug) do nothing;

insert into challenges (name, description) values
  ('lose-location', 'Lose a location at the start of the stage')
on conflict (name) do nothing;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table maps enable row level security;
alter table challenges enable row level security;
alter table rotations enable row level security;
alter table rounds enable row level security;
alter table waves enable row level security;
alter table spawns enable row level security;

-- Public read access on all tables
create policy "Public read access" on maps for select to anon, authenticated using (true);
create policy "Public read access" on challenges for select to anon, authenticated using (true);
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
