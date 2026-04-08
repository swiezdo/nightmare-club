#!/usr/bin/env bash
# Builds a single SQL file for Supabase SQL Editor (schema, then migrations in filename order).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/supabase/_bundle_for_sql_editor.sql}"
{
  echo "-- === schema.sql ==="
  cat "$ROOT/supabase/schema.sql"
  for f in $(ls "$ROOT/supabase/migrations"/*.sql 2>/dev/null | sort); do
    echo ""
    echo "-- === $(basename "$f") ==="
    cat "$f"
  done
} > "$OUT"
echo "Written: $OUT"
echo "Open the file and run it in Supabase → SQL Editor (or in chunks if size limits apply)."
