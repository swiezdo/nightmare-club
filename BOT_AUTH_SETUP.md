# Bot Auth Setup

This app expects Discord bot writes to use bearer-token authentication.

The bot sends:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Two separate tokens are supported:

- `BOT_API_TOKEN_TSUSHIMA`
- `BOT_API_TOKEN_YOTEI`

Use one token per game so a leak only affects that game.

## 1. Generate Tokens

Generate a long random token for each game.

Example:

```bash
openssl rand -base64 32
```

Run that twice and store the results somewhere secure.

## 2. Set Server Environment Variables

Required env vars for bot auth and bot writes:

```env
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT=...
SUPABASE_SERVICE_ROLE_KEY=...
BOT_API_TOKEN_TSUSHIMA=...
BOT_API_TOKEN_YOTEI=...
```

Notes:

- `SUPABASE_SERVICE_ROLE_KEY` must remain server-only.
- The bot tokens must remain server-only.
- Do not expose these values to browser code.

## 3. Configure Vercel

In Vercel, set these environment variables on the project:

- `SUPABASE_SERVICE_ROLE_KEY`
- `BOT_API_TOKEN_TSUSHIMA`
- `BOT_API_TOKEN_YOTEI`

Set them at least for:

- Production
- Preview, if you want to test the bot against preview deployments

After updating env vars, redeploy the project.

## 4. Local Testing

Create a local `.env` or `.env.local` with the same values, then run:

```bash
pnpm dev
```

## 5. Smoke Test With curl

Tsushima example (`week_start` is chosen on the server; body must include `map_slug`):

```bash
curl -i \
  -X PUT 'http://localhost:5173/api/rotations/tsushima' \
  -H 'Authorization: Bearer YOUR_TSUSHIMA_TOKEN' \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "map_slug": "the-defence-of-aoi-village",
    "credit_text": "Submitted by NightmareBot",
    "week_code": "1.3",
    "waves": [
      { "wave": 1, "spawns": [
        { "order": 1, "zone": "Villa", "spawn": "Villa" },
        { "order": 2, "zone": "Stable", "spawn": "Beach" },
        { "order": 3, "zone": "Farm", "spawn": "Left" }
      ]},
      { "wave": 2, "spawns": [
        { "order": 1, "zone": "Villa", "spawn": "Villa" },
        { "order": 2, "zone": "Stable", "spawn": "Beach" },
        { "order": 3, "zone": "Farm", "spawn": "Left" }
      ]},
      { "wave": 3, "spawns": [
        { "order": 1, "zone": "Villa", "spawn": "Villa" },
        { "order": 2, "zone": "Stable", "spawn": "Beach" },
        { "order": 3, "zone": "Farm", "spawn": "Left" }
      ]},
      { "wave": 4, "spawns": [
        { "order": 1, "zone": "Villa", "spawn": "Villa" },
        { "order": 2, "zone": "Stable", "spawn": "Beach" },
        { "order": 3, "zone": "Farm", "spawn": "Left" }
      ]},
      { "wave": 5, "spawns": [
        { "order": 1, "zone": "Villa", "spawn": "Villa" },
        { "order": 2, "zone": "Stable", "spawn": "Beach" },
        { "order": 3, "zone": "Farm", "spawn": "Left" }
      ]},
      { "wave": 6, "spawns": [
        { "order": 1, "zone": "Villa", "spawn": "Villa" },
        { "order": 2, "zone": "Stable", "spawn": "Beach" },
        { "order": 3, "zone": "Farm", "spawn": "Left" }
      ]},
      { "wave": 7, "spawns": [
        { "order": 1, "zone": "Villa", "spawn": "Villa" },
        { "order": 2, "zone": "Stable", "spawn": "Beach" },
        { "order": 3, "zone": "Farm", "spawn": "Left" }
      ]},
      { "wave": 8, "spawns": [
        { "order": 1, "zone": "Villa", "spawn": "Villa" },
        { "order": 2, "zone": "Stable", "spawn": "Beach" },
        { "order": 3, "zone": "Farm", "spawn": "Left" }
      ]},
      { "wave": 9, "spawns": [
        { "order": 1, "zone": "Villa", "spawn": "Villa" },
        { "order": 2, "zone": "Stable", "spawn": "Beach" },
        { "order": 3, "zone": "Farm", "spawn": "Left" }
      ]},
      { "wave": 10, "spawns": [
        { "order": 1, "zone": "Villa", "spawn": "Villa" },
        { "order": 2, "zone": "Stable", "spawn": "Beach" },
        { "order": 3, "zone": "Farm", "spawn": "Left" }
      ]},
      { "wave": 11, "spawns": [
        { "order": 1, "zone": "Villa", "spawn": "Villa" },
        { "order": 2, "zone": "Stable", "spawn": "Beach" },
        { "order": 3, "zone": "Farm", "spawn": "Left" }
      ]},
      { "wave": 12, "spawns": [
        { "order": 1, "zone": "Villa", "spawn": "Villa" },
        { "order": 2, "zone": "Stable", "spawn": "Beach" },
        { "order": 3, "zone": "Farm", "spawn": "Left" }
      ]},
      { "wave": 13, "spawns": [
        { "order": 1, "zone": "Villa", "spawn": "Villa" },
        { "order": 2, "zone": "Stable", "spawn": "Beach" },
        { "order": 3, "zone": "Farm", "spawn": "Left" }
      ]},
      { "wave": 14, "spawns": [
        { "order": 1, "zone": "Villa", "spawn": "Villa" },
        { "order": 2, "zone": "Stable", "spawn": "Beach" },
        { "order": 3, "zone": "Farm", "spawn": "Left" }
      ]},
      { "wave": 15, "spawns": [
        { "order": 1, "zone": "Villa", "spawn": "Villa" },
        { "order": 2, "zone": "Stable", "spawn": "Beach" },
        { "order": 3, "zone": "Farm", "spawn": "Left" }
      ]}
    ]
  }'
```

Read current Yōtei week (minimal JSON for bots):

```bash
curl -sS \
  -H 'Authorization: Bearer YOUR_YOTEI_TOKEN' \
  'http://localhost:5173/api/rotation/yotei'
```

Yotei PUT example:

```bash
curl -i \
  -X PUT 'http://localhost:5173/api/rotations/yotei' \
  -H 'Authorization: Bearer YOUR_YOTEI_TOKEN' \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "map_slug": "river-village",
    "credit_text": "Submitted by NightmareBot",
    "challenges": [],
    "rounds": [
      {
        "round": 1,
        "waves": [
          { "wave": 1, "spawns": [
            { "order": 1, "location": "Beach", "spawn_point": "A", "attunements": [] },
            { "order": 2, "location": "Rice Paddies", "spawn_point": "B", "attunements": [] },
            { "order": 3, "location": "Village", "spawn_point": "C", "attunements": [] }
          ]},
          { "wave": 2, "spawns": [
            { "order": 1, "location": "Beach", "spawn_point": "A", "attunements": [] },
            { "order": 2, "location": "Rice Paddies", "spawn_point": "B", "attunements": [] },
            { "order": 3, "location": "Village", "spawn_point": "C", "attunements": [] }
          ]},
          { "wave": 3, "spawns": [
            { "order": 1, "location": "Beach", "spawn_point": "A", "attunements": [] },
            { "order": 2, "location": "Rice Paddies", "spawn_point": "B", "attunements": [] },
            { "order": 3, "location": "Village", "spawn_point": "C", "attunements": [] }
          ]}
        ]
      },
      {
        "round": 2,
        "waves": [
          { "wave": 1, "spawns": [
            { "order": 1, "location": "Beach", "spawn_point": "A", "attunements": [] },
            { "order": 2, "location": "Rice Paddies", "spawn_point": "B", "attunements": [] },
            { "order": 3, "location": "Village", "spawn_point": "C", "attunements": [] }
          ]},
          { "wave": 2, "spawns": [
            { "order": 1, "location": "Beach", "spawn_point": "A", "attunements": [] },
            { "order": 2, "location": "Rice Paddies", "spawn_point": "B", "attunements": [] },
            { "order": 3, "location": "Village", "spawn_point": "C", "attunements": [] }
          ]},
          { "wave": 3, "spawns": [
            { "order": 1, "location": "Beach", "spawn_point": "A", "attunements": [] },
            { "order": 2, "location": "Rice Paddies", "spawn_point": "B", "attunements": [] },
            { "order": 3, "location": "Village", "spawn_point": "C", "attunements": [] }
          ]}
        ]
      },
      {
        "round": 3,
        "waves": [
          { "wave": 1, "spawns": [
            { "order": 1, "location": "Beach", "spawn_point": "A", "attunements": [] },
            { "order": 2, "location": "Rice Paddies", "spawn_point": "B", "attunements": [] },
            { "order": 3, "location": "Village", "spawn_point": "C", "attunements": [] }
          ]},
          { "wave": 2, "spawns": [
            { "order": 1, "location": "Beach", "spawn_point": "A", "attunements": [] },
            { "order": 2, "location": "Rice Paddies", "spawn_point": "B", "attunements": [] },
            { "order": 3, "location": "Village", "spawn_point": "C", "attunements": [] }
          ]},
          { "wave": 3, "spawns": [
            { "order": 1, "location": "Beach", "spawn_point": "A", "attunements": [] },
            { "order": 2, "location": "Rice Paddies", "spawn_point": "B", "attunements": [] },
            { "order": 3, "location": "Village", "spawn_point": "C", "attunements": [] }
          ]}
        ]
      },
      {
        "round": 4,
        "waves": [
          { "wave": 1, "spawns": [
            { "order": 1, "location": "Beach", "spawn_point": "A", "attunements": [] },
            { "order": 2, "location": "Rice Paddies", "spawn_point": "B", "attunements": [] },
            { "order": 3, "location": "Village", "spawn_point": "C", "attunements": [] },
            { "order": 4, "location": "Beach", "spawn_point": "D", "attunements": [] }
          ]},
          { "wave": 2, "spawns": [
            { "order": 1, "location": "Beach", "spawn_point": "A", "attunements": [] },
            { "order": 2, "location": "Rice Paddies", "spawn_point": "B", "attunements": [] },
            { "order": 3, "location": "Village", "spawn_point": "C", "attunements": [] },
            { "order": 4, "location": "Beach", "spawn_point": "D", "attunements": [] }
          ]},
          { "wave": 3, "spawns": [
            { "order": 1, "location": "Beach", "spawn_point": "A", "attunements": [] },
            { "order": 2, "location": "Rice Paddies", "spawn_point": "B", "attunements": [] },
            { "order": 3, "location": "Village", "spawn_point": "C", "attunements": [] },
            { "order": 4, "location": "Beach", "spawn_point": "D", "attunements": [] }
          ]}
        ]
      }
    ]
  }'
```

## 6. Expected Auth Failures

Missing token:

- HTTP `401`
- JSON error body with `code: "unauthorized"`
- `WWW-Authenticate: Bearer ...` response header

Invalid token:

- HTTP `401`
- JSON error body with `code: "unauthorized"`
- `WWW-Authenticate: Bearer ...` response header

## 7. Discord Bot Notes

- The bot should treat `401` as configuration failure, not retry forever.
- The bot should log the HTTP status and JSON error body.
- The bot should never print the full bearer token into Discord chat or public logs.
- If the bot supports multiple environments, use different tokens for staging and production.
