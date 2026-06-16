# Self-Hosting — Machine Maintenance QR / Maskiina.gl

## Goal
Run Maskiina.gl on your company's internal server room without paid cloud dependencies.

This folder contains the **deployment skeleton**. It prepares the repository structure for production deployment, but **does not change existing frontend/backend business logic**.

## What you need to add later (placeholders)
The `docker-compose.yml` references production build/runtime files that are not part of this skeleton yet:

1. `backend/Dockerfile`
2. Root `Dockerfile` for the React/Vite frontend (builds `src/` and serves static assets)
3. `docker/nginx.conf`
4. (Optional) `docker/certs/` with TLS certs for Nginx

The backend and frontend images will be wired once those files exist.

## Step-by-step (skeleton)

### 1. Prerequisites
- Docker Desktop (or Docker Engine) installed on the server
- Docker Compose v2 available (`docker compose version`)
- Domain name / internal DNS (recommended) for HTTPS

### 2. Configure environment variables
1. Copy `.env.example` → `.env`
2. Replace placeholder secrets (JWT_SECRET, Postgres password, MinIO keys)

### 3. Run containers
From the repository root:

```bash
docker compose up -d
```

### 4. Database initialization (later)
This skeleton does not yet include Prisma/SQL migrations.
When you implement the PostgreSQL schema migrations, run them against the running `postgres` service.

### 5. Nginx + HTTPS (later)
Provision TLS certs and create `docker/nginx.conf`.
Then ensure Nginx:
- terminates TLS
- routes `/api/` → backend
- serves React static content

## Storage
`docker-compose.yml` includes **MinIO** as an optional S3-compatible storage backend.

If you prefer local disk storage, you can set:
- `STORAGE_TYPE=local`
- update the backend to store uploaded files in `UPLOAD_DIR` volume

## Backup and restore
See [`docs/BACKUP_AND_RESTORE.md`](BACKUP_AND_RESTORE.md).

## Security posture
See [`docs/SECURITY_CHECKLIST.md`](SECURITY_CHECKLIST.md).

