#!/usr/bin/env bash

# Create a timestamped SQL dump of DATABASE_URL to ./backups/

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set" >&2
  exit 1
fi

BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"
STAMP=$(date +"%Y%m%d-%H%M%S")
OUT="$BACKUP_DIR/db-backup-$STAMP.sql"

echo "Creating dump: $OUT"
pg_dump --no-owner --no-privileges "$DATABASE_URL" > "$OUT"
echo "✅ Backup written to $OUT"


