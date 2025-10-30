#!/usr/bin/env bash

# Clone current DATABASE_URL into MAIN_DATABASE_URL using pg_dump | psql
# Requirements: pg_dump and psql installed, both URLs valid Postgres URLs

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set" >&2
  exit 1
fi

if [[ -z "${MAIN_DATABASE_URL:-}" ]]; then
  echo "ERROR: MAIN_DATABASE_URL is not set (destination)" >&2
  exit 1
fi

echo "Cloning database..."
echo "  From: $DATABASE_URL"
echo "  To:   $MAIN_DATABASE_URL"

# Create target schema fresh (drop all objects)
echo "Dropping target public schema (if exists) ..."
psql "$MAIN_DATABASE_URL" -v ON_ERROR_STOP=1 -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"

echo "Dumping source and restoring to target ..."
pg_dump --no-owner --no-privileges --format=plain "$DATABASE_URL" | psql "$MAIN_DATABASE_URL" -v ON_ERROR_STOP=1

echo "✅ Clone completed."


