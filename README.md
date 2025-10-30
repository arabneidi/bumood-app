// VERCEL DEPLOYMENT TEST - COMMIT 108ea72 - Tue Oct 28 23:13:41 EDT 2025
// Force new deployment - Wed Oct 29 00:26:43 EDT 2025

### Database backup/clone (Vercel Postgres)

Set these in your shell (or `.env.local` when running scripts):

```
export DATABASE_URL="postgres://...current-app-db..."
export MAIN_DATABASE_URL="postgres://...reserve-main-db..."
```

Commands:

- Create a timestamped dump of the current DB locally:
```
bash scripts_backup_now.sh
```

- Clone current DB into MAIN database (overwrites MAIN):
```
bash scripts_clone_to_main.sh
```

- Restore app DB from MAIN database:
```
bash scripts_restore_from_main.sh
```

Requires `pg_dump` and `psql`.
