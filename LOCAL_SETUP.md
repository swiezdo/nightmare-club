# Local setup (short)

- **Fork:** `origin` → `https://github.com/swiezdo/nightmare-club`, `upstream` → `machr/nightmare-club`.
- **Node:** **20+** required (this machine was bumped to 20.x for Vite 8). After changing Node: `rm -rf node_modules && pnpm install`.
- **Supabase:** In your project on [supabase.com](https://supabase.com), run **`supabase/_bundle_for_sql_editor.sql`** in the SQL Editor (build it with `./scripts/build-supabase-bundle.sh`) **or** run `schema.sql` and then each file in `supabase/migrations/` in order. Then set real `PUBLIC_SUPABASE_*` and `SUPABASE_SERVICE_ROLE_KEY` in **`.env`**.
- **Bot tokens:** `.env` includes generated `BOT_API_TOKEN_*`; after Supabase changes restart `pnpm dev`.
- **Check:** With a real DB, `curl` from [`BOT_AUTH_SETUP.md`](./BOT_AUTH_SETUP.md) should return `"ok":true`. With Supabase placeholders, PUT may return **404** for an unknown `map_slug` — that is expected.
