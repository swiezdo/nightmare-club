# Nightmare Club

A SvelteKit app for tracking and publishing weekly Nightmare Survival spawn rotations.

It currently uses Supabase for Postgres, auth, and browser/server clients, but the core data model is ordinary Postgres and can be moved to another host if you replace the Supabase-specific pieces.

## What This Project Does

- Publishes the current weekly rotation data for Yotei-style maps.
- Supports a protected admin workflow for entering and editing rotations.
- Exposes authenticated bot ingest endpoints for machine-written updates.
- Stores Tsushima survival metadata and weekly layouts separately from the Yotei rotation tables.

Weekly rotation anchors differ by game:

- **Ghost of Yōtei:** Tuesday 1:00 AM in `Australia/Melbourne` (in-game reset aligned with Melbourne). The stored `week_start` is that Tuesday’s calendar date (`YYYY-MM-DD`).
- **Ghost of Tsushima:** weekly in-game refresh boundary on **Friday** (anchored in code to the same moment as the game’s Friday reset; the countdown on the site is **your browser’s local time**). The stored `week_start` is that week’s **Friday** date (`YYYY-MM-DD`).

## Stack

- SvelteKit
- TypeScript
- Tailwind CSS
- Supabase client libraries
- Postgres
- Vercel adapter

## Project Layout

```text
src/
  lib/
    components/        UI components
    server/            server-only helpers for bot ingest and admin writes
    supabase.ts        browser client configuration
    types.ts           shared app types
  routes/
    +page.svelte       public rotation display
    (admin)/admin/     protected admin UI
    api/rotation/      authenticated bot read (GET yotei, tsushima)
    api/rotations/     authenticated bot ingest (PUT yotei, tsushima)
supabase/
  schema.sql           base schema and initial seed data
  seed.sql             example current-week Yotei rotations
  migrations/          incremental SQL changes, including Tsushima tables
```

## Environment Variables

Copy [`.env.example`](/Users/machr/projects/personal/nightmare-club/.env.example) to `.env` and fill in values.

Required for normal app startup:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT`

Required for server-side bot ingest:

- `SUPABASE_SERVICE_ROLE_KEY`
- `BOT_API_TOKEN_YOTEI`
- `BOT_API_TOKEN_TSUSHIMA`

Notes:

- `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT` is the public client key used by the browser and server-rendered auth client.
- `SUPABASE_SERVICE_ROLE_KEY` is only used on server routes that write on behalf of bots.
- The bot tokens should be long random secrets and should never be exposed to the browser.

## Local Setup With Supabase

1. Create a Supabase project.
2. In the SQL editor, run [`supabase/schema.sql`](/Users/machr/projects/personal/nightmare-club/supabase/schema.sql).
3. Apply all files in [`supabase/migrations/`](/Users/machr/projects/personal/nightmare-club/supabase/migrations) in timestamp order.
4. Optionally run [`supabase/seed.sql`](/Users/machr/projects/personal/nightmare-club/supabase/seed.sql) to insert example current-week Yotei data.
5. Create at least one user in Supabase Auth who can sign into the admin UI.
6. Copy `.env.example` to `.env` and fill in the environment variables.
7. Install dependencies with `pnpm install`.
8. Start the app with `pnpm dev`.

For production deployments, set the same environment variables in your host.

## Database Notes

There are two main data areas:

- Yotei rotations:
  `maps`, `challenges`, `rotations`, `rounds`, `waves`, `spawns`, `rotation_challenges`
- Tsushima rotations:
  `tsushima_maps`, `tsushima_rotations`

Important implementation details:

- Yotei writes rely on the `upsert_rotation` RPC added by the migrations.
- Tsushima writes rely on the `upsert_tsushima_rotation` function added in [`supabase/migrations/20260407000000_add_tsushima_rotations.sql`](/Users/machr/projects/personal/nightmare-club/supabase/migrations/20260407000000_add_tsushima_rotations.sql).
- The public site reads from row-level-security-enabled tables.
- The admin UI and bot endpoints currently assume Supabase Auth and Supabase client behavior.

## Using Another Postgres Provider

Moving away from Supabase is reasonable, but it is not just a connection-string swap.

Portable parts:

- Table design
- Most SQL
- Seed data
- Weekly rotation logic
- JSON payload structure for the bot APIs

Supabase-specific parts you would need to replace:

- Auth and session handling used by the admin UI
- Row Level Security policies written for `anon` and `authenticated` roles
- Browser/server client setup in SvelteKit
- RPC calls made through the Supabase client
- Environment variable names and deployment wiring

If you want to move to plain Postgres or another hosted provider, the minimum path is:

1. Run the schema and migrations against your Postgres database, adjusting any Supabase-specific SQL or auth assumptions.
2. Replace Supabase auth with your own auth/session layer.
3. Replace the Supabase client calls in the app with your own database access layer or API.
4. Keep the existing table contract so the UI and ingest payloads do not need a full redesign.

## Admin Workflow

- Sign in through `/login`.
- Open `/admin`.
- Enter or edit the current week's rotation data.
- The public home page reads the latest stored rotations and renders them as tables.

The admin workflow is designed around trusted contributors rather than a large multi-role system.

## Bot API

### Read (current site week)

Authenticated JSON for tools and bots (no public unauthenticated rotation feed):

- **`GET /api/rotation/yotei`** — `Authorization: Bearer` with **`BOT_API_TOKEN_YOTEI`** (same secret as `PUT /api/rotations/yotei`). Response: `{ "maps": [ { "name", "slug", "credit_text", "rounds": [ { "round", "challenge"?, "waves": [ { "wave", "spawns": [ { "order", "location", "spawn_point", "attunements"? } ] } ] } ] } ] } }` — only maps that have a rotation row for the current Yōtei week (`getCurrentWeekStart`). `Cache-Control: private, no-store`.
- **`GET /api/rotation/tsushima`** — `Authorization: Bearer` with **`BOT_API_TOKEN_TSUSHIMA`**. Response: `{ "maps": [ { "week_code", "waves" } ] }` for the current Tsushima week anchor.

### Write (ingest)

Two authenticated write endpoints are available:

- `PUT /api/rotations/yotei`
- `PUT /api/rotations/tsushima`

Authentication:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

The JSON body must include **`map_slug`**. **`week_start` is not sent**; the server picks the current rotation week using the same rules as the public site (`getCurrentWeekStart` for Yōtei, `getTsushimaWeekStart` for Tsushima). Successful responses echo the stored `week_start` so clients can log which week was written.

### Yotei Payload

```json
{
  "map_slug": "river-village",
  "credit_text": "Thanks to Player 1 and Player 2",
  "challenges": [
    { "round": 1, "slug": "lose-location" }
  ],
  "rounds": [
    {
      "round": 1,
      "waves": [
        {
          "wave": 1,
          "spawns": [
            {
              "order": 1,
              "location": "Beach",
              "spawn_point": "A",
              "attunements": []
            }
          ]
        }
      ]
    }
  ]
}
```

Rules:

- exactly 4 rounds
- rounds 1 to 3 have 3 waves and 3 spawns per wave
- round 4 has 3 waves and 4 spawns per wave
- `location` must match the selected map
- `spawn_point` is optional and capped at 15 characters
- `attunements` are only allowed for `hidden-temple`
- `slug` must match an existing value in `challenges.name`

### Tsushima Payload

Tsushima keeps map metadata, weekly modifiers, and objectives in the database. The bot only sends the weekly code and wave layout.

```json
{
  "map_slug": "the-defence-of-aoi-village",
  "credit_text": "Submitted by NightmareBot",
  "week_code": "1.3",
  "waves": [
    {
      "wave": 1,
      "spawns": [
        { "order": 1, "zone": "Stable", "spawn": "Beach" },
        { "order": 2, "zone": "Villa", "spawn": "Villa" },
        { "order": 3, "zone": "Farm", "spawn": "Left" }
      ]
    }
  ]
}
```

Rules:

- exactly 15 waves
- exactly 3 spawns per wave
- `week_code` must exist for the selected Tsushima map
- each `zone` and `spawn` must match the selected map's seeded metadata

### Success Response

```json
{
  "ok": true,
  "game": "tsushima",
  "rotation_id": "uuid",
  "week_start": "2026-04-10",
  "map_slug": "the-defence-of-aoi-village",
  "updated": true
}
```

Validation failures return `400` with structured field-level error details.

## Deployment Notes

- The repo is configured for the Vercel adapter.
- Supabase free-tier pausing can affect dormant projects.
- The bot endpoints are public HTTP routes, so protect them with strong bearer tokens and server-only env vars.

## Current Gaps

- There is currently no dedicated lint or typecheck script in `package.json`; the main automated verification is `pnpm build`.
- Setup is easiest with Supabase because auth, RLS, and the client code already assume it.
