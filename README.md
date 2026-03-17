# Spawn Rotation Tracker

A small static website for tracking weekly enemy spawn rotations across 4 maps. Built with Astro, Supabase, and Tailwind CSS. Deployed on Vercel.

---

## Overview

Every Saturday, spawn rotations reset. Contributors log in to the admin page and enter the new rotations. The public display page reads from Supabase and renders clean tables per map.

**Maps:** Spider, Oni, Snake, Dragon

**Structure per map:**
- 4 Stages (each with an optional modifier)
- 3 Rounds per stage (12 rounds total)
- Stage 1–3: 3 spawns per round
- Stage 4: 4 spawns per round
- Each spawn has a `location` (Pagoda / Cemetery / Courtyard) and `element` (Sun / Moon / Storm)

---

## Tech Stack

| Layer    | Tool                        |
|----------|-----------------------------|
| Framework | Astro (static output)      |
| Styling  | Tailwind CSS                |
| Database | Supabase (Postgres)         |
| Auth     | Supabase Auth               |
| Hosting  | Vercel (CDN, free tier)     |

---

## Supabase Schema

Run the following SQL in the Supabase SQL editor.

```sql
-- Maps (static seed data)
create table maps (
  id serial primary key,
  name text not null unique
);

insert into maps (name) values ('Spider'), ('Oni'), ('Snake'), ('Dragon');

-- Known modifiers (seed with known values, nullable on stages)
create table modifiers (
  id serial primary key,
  name text not null unique
);

-- Rotations (one per map per week)
create table rotations (
  id serial primary key,
  map_id integer references maps(id),
  week_start date not null,
  created_at timestamp default now(),
  unique(map_id, week_start)
);

-- Stages (4 per rotation)
create table stages (
  id serial primary key,
  rotation_id integer references rotations(id) on delete cascade,
  stage_number integer not null check (stage_number between 1 and 4),
  modifier text null
);

-- Rounds (3 per stage)
create table rounds (
  id serial primary key,
  stage_id integer references stages(id) on delete cascade,
  round_number integer not null check (round_number between 1 and 3)
);

-- Spawns (3 per round for stages 1-3, 4 per round for stage 4)
create table spawns (
  id serial primary key,
  round_id integer references rounds(id) on delete cascade,
  spawn_order integer not null check (spawn_order between 1 and 4),
  location text not null check (location in ('Pagoda', 'Cemetery', 'Courtyard')),
  element text not null check (element in ('Sun', 'Moon', 'Storm'))
);
```

---

## Project Structure

```
/
├── src/
│   ├── pages/
│   │   ├── index.astro         # Public display — current week's rotations
│   │   └── admin/
│   │       ├── index.astro     # Login page
│   │       └── edit.astro      # Edit this week's rotations (protected)
│   ├── components/
│   │   ├── MapTable.astro      # Renders rotation table for a single map
│   │   └── SpawnForm.astro     # Admin form for entering spawns
│   └── lib/
│       └── supabase.ts         # Supabase client setup
├── public/
└── .env                        # SUPABASE_URL, SUPABASE_ANON_KEY
```

---

## TODO

### 1. Supabase Setup
- [ ] Create Supabase project
- [ ] Run schema SQL above in Supabase SQL editor
- [ ] Seed `maps` table (Spider, Oni, Snake, Dragon)
- [ ] Seed `modifiers` table with known modifier names
- [ ] Enable Supabase Auth (email/password is fine)
- [ ] Create admin user(s) via Supabase Auth dashboard
- [ ] Set Row Level Security (RLS):
  - `rotations`, `stages`, `rounds`, `spawns` — public read, authenticated write

### 2. Astro Project Setup
- [ ] `npm create astro@latest` 
- [ ] Install Tailwind: `npx astro add tailwind`
- [ ] Install Supabase client: `npm install @supabase/supabase-js`
- [ ] Add `.env` with `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`
- [ ] Create `src/lib/supabase.ts` client

### 3. Display Page (`/`)
- [ ] Query current week's rotations (latest `week_start` per map)
- [ ] Render a `MapTable` component per map
- [ ] Group rows by stage, show modifier if present
- [ ] Handle stage 4 having 4 spawn columns vs 3

### 4. Admin Page (`/admin`)
- [ ] Login form using Supabase Auth
- [ ] Redirect to `/admin/edit` on successful login
- [ ] Protect `/admin/edit` — redirect to login if no session

### 5. Admin Edit Page (`/admin/edit`)
- [ ] Map selector (Spider / Oni / Snake / Dragon)
- [ ] Auto-populate `week_start` to the most recent Saturday
- [ ] For each stage (1–4):
  - [ ] Optional modifier dropdown (sourced from `modifiers` table) with freetext fallback
  - [ ] For each round (1–3):
    - [ ] Spawn rows — location dropdown + element dropdown, in order
    - [ ] Stage 4 gets 4 spawn rows per round
- [ ] Save writes full rotation to Supabase (upsert on `map_id` + `week_start`)
- [ ] Success/error feedback

### 6. Deploy
- [ ] Push to GitHub
- [ ] Connect repo to Vercel
- [ ] Add env vars to Vercel dashboard
- [ ] Confirm build output is static (`output: 'static'` in `astro.config.mjs`)

---

## Notes

- Supabase free tier pauses after 1 week of inactivity — read traffic from the public page prevents this
- All heavy display traffic is served from Vercel's CDN, Supabase only handles writes and the initial data fetch
- `week_start` should always be a Saturday — consider validating this in the admin form
