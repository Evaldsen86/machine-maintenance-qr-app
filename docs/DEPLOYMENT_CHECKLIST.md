# Deployment Checklist — Self-Hosted

## Scope
Checklist for preparing a production-like internal deployment using:
- Nginx reverse proxy
- HTTPS
- Express backend
- PostgreSQL database
- Optional MinIO file storage
- Docker Compose

## Pre-deploy (infrastructure)
- [ ] Create `backend/Dockerfile` (production build)
- [ ] Create root frontend `Dockerfile` (build Vite output and serve static files)
- [ ] Create `docker/nginx.conf` for:
  - [ ] TLS termination
  - [ ] `/api/` proxy to backend
  - [ ] SPA routing for React (`try_files ... /index.html`)
- [ ] Provide TLS certs:
  - [ ] Place them under `docker/certs/` (or update compose volume mounts)

## Configure secrets (never commit real secrets)
- [ ] Copy `.env.example` → `.env`
- [ ] Replace:
  - [ ] `POSTGRES_PASSWORD`
  - [ ] `JWT_SECRET`
  - [ ] `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`
  - [ ] any other required backend secrets
- [ ] Ensure `.env` is in `.gitignore`

## Database and migrations
- [ ] Create and apply PostgreSQL migrations (Prisma or SQL)
- [ ] Verify required tables and indexes exist
- [ ] Run a seed script to create:
  - [ ] initial company (tenant)
  - [ ] admin user for pilot

## Storage initialization
- [ ] Ensure MinIO bucket exists (if `STORAGE_TYPE=minio`)
- [ ] Ensure backend storage path is writable (`UPLOAD_DIR` volume)
- [ ] Validate upload + download flow with one test document

## App smoke tests (after containers start)
- [ ] Health endpoints (or implement `/health` and `/ready` later)
- [ ] Login as admin
- [ ] Create a machine
- [ ] Generate QR code
- [ ] Scan QR code and view machine in public mode
- [ ] Add maintenance record
- [ ] Create task + change status
- [ ] Upload and view a document
- [ ] Verify audit log records for mutations (when implemented)

## Security checks
- [ ] CORS restricted to your internal domain(s) only
- [ ] HTTPS enabled (no mixed content)
- [ ] Nginx rate limiting enabled on auth endpoints (later hardening)
- [ ] Backend error responses do not leak stack traces in production

## Operations readiness
- [ ] Backup job configured (see `docs/BACKUP_AND_RESTORE.md`)
- [ ] Restore tested in staging at least once
- [ ] Basic log retention policy in place
- [ ] Monitoring/alerting configured (disk full, container restarts, backup failures)

