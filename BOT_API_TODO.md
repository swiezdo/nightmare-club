# Bot API TODO

This checklist covers the Discord bot integration for both games:

- `tsushima`
- `yotei`

The bot should send HTTPS requests to server-owned endpoints. The server validates the request, authenticates it with a bearer token, and persists the rotation through server-side database access.

## Phases

### Now

- [ ] Apply the Tsushima migration in the target Supabase project.
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` in the server environment.
- [ ] Generate and set `BOT_API_TOKEN_TSUSHIMA`.
- [ ] Generate and set `BOT_API_TOKEN_YOTEI`.
- [ ] Finalize endpoint paths and confirm the bot will use them.
- [ ] Publish one concrete payload example per game for the bot author.
- [ ] Test one valid `tsushima` submission end to end.
- [ ] Test one valid `yotei` submission end to end.
- [ ] Test missing or invalid bearer token handling.
- [ ] Test malformed JSON and schema validation failures.
- [ ] Confirm the bot logs API failures in a readable way.

### Next

- [ ] Add request logging for game, map, week, and result status.
- [ ] Add rate limiting per bearer token.
- [ ] Confirm upsert behavior is safe for bot retries.
- [ ] Test duplicate retry of the same payload.
- [ ] Document token rotation procedure.
- [ ] Add `curl` examples for both games.
- [ ] Confirm production and preview/dev environment separation.
- [ ] Confirm whether the bot can submit edits after initial weekly submission.

### Later

- [ ] Add alerting or monitoring for repeated failed submissions.
- [ ] Decide whether to split tokens by environment as well as by game.
- [ ] Decide whether to split tokens further by bot instance or maintainer.
- [ ] Add operational runbooks for reset-day failures.
- [ ] Review whether payload/version negotiation is needed if the bot evolves.

## Contract

- [ ] Finalize endpoint paths.
- [ ] Confirm method choice per endpoint.
  `PUT` is preferred because retries should be safe.
- [ ] Finalize request headers.
  Required: `Authorization: Bearer <token>` and `Content-Type: application/json`.
- [ ] Finalize success response format.
- [ ] Finalize error response format with machine-readable `code` and `details`.
- [ ] Publish one concrete example payload per game for the bot author.

## Authentication

- [ ] Generate a unique bearer token for `tsushima`.
- [ ] Generate a unique bearer token for `yotei`.
- [ ] Store both tokens in server environment variables only.
- [ ] Confirm tokens are never logged in plaintext.
- [ ] Define a token rotation process in case a token leaks.
- [ ] Decide whether production and preview/dev should use separate tokens.

## Validation

- [ ] Enforce `application/json`.
- [ ] Enforce payload size limits.
- [ ] Reject malformed JSON with a clear `400` response.
- [ ] Reject unknown fields so the contract stays strict.
- [ ] Validate `week_start` as `YYYY-MM-DD`.
- [ ] Validate `week_start` against the expected reset day rules.
- [ ] Validate `map_slug` against the server's canonical metadata.

## Tsushima

- [ ] Confirm the server-side Tsushima metadata matches the current bot data.
  Source reference: `rotation_tsushima_en.json`
  <https://github.com/swiezdo/NightmareBot/blob/main/json/rotation_tsushima_en.json>
- [ ] Keep canonical Tsushima map metadata on the server, not in the bot payload.
- [ ] Validate the selected `week_code` for the specific map.
- [ ] Validate exactly 15 waves.
- [ ] Validate exactly 3 spawns per wave.
- [ ] Validate each submitted `zone` against the allowed map zones.
- [ ] Validate each submitted `spawn` against the allowed sub-spawns for the chosen zone.
- [ ] Confirm weekly modifiers and bonus objectives are derived from server metadata, not trusted from the bot.
- [ ] Confirm Tsushima zone ordering matches the canonical table:
  - The Defense of Aoi Village: `Villa`, `Stable`, `Farm`
  - The Shadows of War: `Stable`, `Barracks`, `Dojo`
  - The Shores of Vengeance: `Cliff`, `Boat`, `Beach`
  - Blood in the Snow: `Mine`, `Outpost`, `Camp`
  - Twilight and Ashes: `Obelisk`, `Ledge`, `Lighthouse`
  - Blood and Steel: `Camp`, `Island`, `Cliff`

## Yotei

- [ ] Confirm the external Yotei payload shape with the bot author.
- [ ] Validate round count and per-round structure.
- [ ] Validate spawn counts per wave.
- [ ] Validate location names against the selected map.
- [ ] Validate attunements only where the map supports them.
- [ ] Validate optional `spawn_point` length and normalization rules.
- [ ] Validate challenge slugs/names against canonical challenge metadata.

## Persistence

- [ ] Keep the bot talking to the app server, not directly to Supabase.
- [ ] Use server-side credentials only for database writes.
- [ ] Confirm upsert behavior is idempotent for retries.
- [ ] Confirm duplicate submissions for the same map/week safely overwrite or no-op as intended.
- [ ] Apply the Tsushima migration in the target Supabase project.
- [ ] Verify the Tsushima seed metadata is present after migration.

## Operations

- [ ] Add request logging for game, map, week, and result status.
- [ ] Avoid logging secrets or full payloads unless needed for debugging.
- [ ] Add rate limiting per bearer token.
- [ ] Decide on alerting or monitoring for repeated failed submissions.
- [ ] Decide who owns bot support if submissions start failing at reset time.

## Testing

- [ ] Test one valid `tsushima` submission end to end.
- [ ] Test one valid `yotei` submission end to end.
- [ ] Test missing bearer token.
- [ ] Test invalid bearer token.
- [ ] Test malformed JSON.
- [ ] Test invalid `week_start`.
- [ ] Test unknown `map_slug`.
- [ ] Test invalid zone/spawn combinations.
- [ ] Test duplicate retry of the same payload.
- [ ] Test payloads that exceed limits.

## Bot Coordination

- [ ] Confirm whether the Discord bot sends immediately at reset or manually on demand.
- [ ] Confirm retry behavior in the bot if the API returns `429` or `500`.
- [ ] Confirm how the bot logs API failures for the maintainer.
- [ ] Confirm whether the bot needs separate tokens for staging vs production.
- [ ] Confirm whether the bot will ever submit edits to an existing week after initial submission.

## Documentation

- [ ] Add a short integration guide for the bot author.
- [ ] Include example `curl` requests for both games.
- [ ] Document all required env vars.
- [ ] Document expected status codes.
- [ ] Document the validation error body format.
