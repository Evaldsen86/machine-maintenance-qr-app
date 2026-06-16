# Backup and Restore — Self-Hosted Maskiina.gl

## Goal
Provide a repeatable backup strategy for:
1. PostgreSQL data
2. File storage (documents/images)

This doc is intended to be used once the app is migrated to PostgreSQL + server-side file storage.

## Current skeleton state
- `docker-compose.yml` includes a `postgres` volume (`postgres_data`)
- optional MinIO is included (`minio_data`)
- **No backup scripts are added yet** (skeleton only)

## Recommended backup plan (production target)

### 1. PostgreSQL backups (nightly)
Use `pg_dump` (logical backups) or enable WAL-based backups for point-in-time recovery.

Simplest nightly logical backup:

```bash
docker exec -t maskiina-postgres pg_dump \
  -U "$POSTGRES_USER" \
  "$POSTGRES_DB" \
  > backups/postgres_$(date +%F).sql
```

Retention:
- keep 30 days of backups (adjust per policy)
- verify integrity regularly (test restore to a staging DB)

### 2. File storage backups
If using local disk storage:
- rsync `UPLOAD_DIR` to an offsite location

If using MinIO:
- use MinIO tooling / S3 lifecycle + periodic backups
- or take snapshots of the `minio_data` volume (works for some setups; verify)

### 3. Consistent restore
For consistent restores:
1. restore PostgreSQL dump
2. restore corresponding file storage snapshot/backups
3. ensure application config points to the restored DB and file storage

## Restore procedure (staging example)
1. Stop the backend container
2. Restore PostgreSQL dump
3. Restore files
4. Start backend and run smoke tests:
   - login
   - list machines
   - view machine documents
   - add maintenance record

## What to document next (when Phase 3 is implemented)
- Exact backup location and retention policy
- A tested restore runbook
- Monitoring/alerting for backup failures

