#!/usr/bin/env bash

# Restore app DATABASE_URL from MAIN_DATABASE_URL snapshot (overwrites app DB)

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set (destination)" >&2
  exit 1
fi

if [[ -z "${MAIN_DATABASE_URL:-}" ]]; then
  echo "ERROR: MAIN_DATABASE_URL is not set (source)" >&2
  exit 1
fi

echo "Restoring from MAIN to app DB..."
echo "  Source: $MAIN_DATABASE_URL"
echo "  Target: $DATABASE_URL"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"
pg_dump --no-owner --no-privileges --format=plain "$MAIN_DATABASE_URL" | psql "$DATABASE_URL" -v ON_ERROR_STOP=1

echo "✅ Restore completed."


