# Handover

## Current state

- Latest important commit: `211c1e8` (`Harden rotation updates against week drift`)
- Working tree is almost clean
- One uncommitted change remains in `src/lib/components/WaveCards.svelte`
  - This keeps spawn location names like `Rice Paddies` constrained to wrap onto two lines with:
    - `max-w-[10ch]`
    - `leading-[1.05]`

## What was fixed

- Rotation disappearance was traced to `week_start` mismatches, not frontend rendering
- The app now treats the rotation week as:
  - Tuesday `1:00 AM`
  - timezone `Australia/Melbourne`
  - stored as that Tuesday's date in `rotations.week_start`
- The admin update path was hardened so editing an existing rotation preserves its original `week_start`
- The API route now orders by `created_at desc` before `.limit(1)` for deterministic reads

## Relevant files

- `src/lib/dates.ts`
  - Source of truth for current rotation week calculation
- `src/routes/(admin)/admin/+page.server.ts`
  - Save action now resolves `week_start` server-side
  - If `existing_rotation_id` is present, it preserves that rotation's stored week
- `src/routes/(admin)/admin/+page.svelte`
  - Sends `existing_rotation_id` instead of trusting a hidden `week_start`
- `src/lib/types.ts`
  - `UpsertRotationPayload` now supports optional `rotation_id`
- `supabase/migrations/20260330000000_harden_rotation_updates.sql`
  - Updated RPC logic for safe in-place rotation updates

## Database context

- The migration above was applied to the dev Supabase instance
- Previous confusion came from an incorrect assumption that `week_start` should be Saturday-based
- The correct key for Monday, March 30, 2026 Melbourne time was `2026-03-24`, not `2026-03-28`
- Map name/slug mismatches were also corrected in Supabase during debugging:
  - `river-village` => `The Spider (River Village)`
  - `hidden-temple` => `The Snake (Hidden Temple)`

## Frontend context

- There was an experiment to replace the hard-coded wave “diamond” SVG with a dynamic HTML/CSS component
- That work was rolled back at the user's request
- The wave header is back to the original inline SVG in `src/lib/components/WaveCards.svelte`
- Only the spawn-name wrapping tweak remains uncommitted

## Suggested next steps

1. Decide whether to keep the spawn-name wrapping change in `WaveCards.svelte`
2. If yes, commit it separately from the rotation/admin fixes
3. If revisiting the diamond design later, start from the existing SVG and prototype in a separate component branch
4. If rotation issues recur, first inspect `rotations.week_start` in Supabase before changing frontend code

## Useful checks

```bash
git status --short
pnpm build
```

```sql
select r.week_start, m.name as map_name, r.created_at, r.id
from rotations r
join maps m on m.id = r.map_id
order by r.week_start desc, m.name, r.created_at desc;
```
