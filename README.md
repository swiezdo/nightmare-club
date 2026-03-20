# Spawn Rotation Tracker

A web app for tracking weekly enemy spawn rotations across maps. Built with SvelteKit, Supabase, Tailwind CSS, and shadcn-svelte. Deployed on Vercel.

---

## Overview

Every Saturday, spawn rotations reset. Contributors log in to the admin page and enter the new rotations. The public display page reads from Supabase and renders clean tables per map.

**Maps:**

- **The Spider (Hidden Temple)** — Pagoda, Cemetery, Courtyard
- **The Kitsune (Frozen Valley)** — Waterfall, Hillside, Armory
- **The Oni (Broken Castle)** — Foundry, Burned Garden, Keep
- **The Snake (River Village)** — Beach, Rice Paddies, Village

**Structure per map:**

- 4 Stages
- 3 Waves per stage (12 waves total)
- Stage 1–3: 3 spawns per wave
- Stage 4: 4 spawns per wave
- Each spawn has a location (map-specific) and 1–2 attunements (Sun / Moon / Storm)
- Optional weekly challenge per rotation (e.g. "Lose a location")

---

## Tech Stack

| Layer     | Tool                         |
| --------- | ---------------------------- |
| Framework | SvelteKit                    |
| UI        | shadcn-svelte + Tailwind CSS |
| Database  | Supabase (Postgres)          |
| Auth      | Supabase Auth                |
| Hosting   | Vercel                       |

---

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/              # shadcn-svelte components
│   │   └── MapTable.svelte  # Rotation table for a single map
│   ├── types.ts             # TypeScript types
│   └── supabase.ts          # Supabase client setup
├── routes/
│   ├── +page.svelte         # Public display — current week's rotations
│   └── (admin)/admin/
│       ├── +page.svelte     # Admin edit page (protected)
│       └── +page.server.ts  # Server load + form actions
supabase/
├── schema.sql               # Database schema + seed data
├── seed.sql                 # Example rotation seed data
└── migrations/              # Supabase CLI migrations
```

---

## Setup

1. Create a Supabase project
2. Run `supabase/schema.sql` in the Supabase SQL editor (or use `supabase db push` with the CLI)
3. Optionally run `supabase/seed.sql` for example data
4. Create admin user(s) via Supabase Auth dashboard
5. Set environment variables:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT`
6. `pnpm install && pnpm dev`

---

## Migrations

Migration files live in `supabase/migrations/`. To apply:

```bash
supabase db push
```

Or paste the SQL directly in the Supabase SQL Editor.

---

## Notes

- Supabase free tier pauses after 1 week of inactivity — read traffic from the public page prevents this
- `week_start` should always be a Saturday
