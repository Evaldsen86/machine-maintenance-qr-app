# API Phase 6A — Backend Foundation (Express + Prisma + PostgreSQL)

## Scope
This phase introduces a **new isolated backend foundation** under `backend/src/` for production migration work.

What this phase does:
- Adds Prisma runtime and migration scripts (without touching frontend integration)
- Adds authentication and authorization foundation
- Adds tenant/company scoping middleware
- Adds initial v1 routes for companies, users, roles, machines, and QR codes
- Adds Zod payload validation and safer error handling

What this phase does **not** do:
- Does not modify frontend business logic
- Does not remove existing MongoDB routes (`backend/server.js`, `backend/routes/machines.js`)
- Does not remove Supabase/localStorage/IndexedDB/mockData paths yet

---

## New isolated backend entrypoint

- Existing backend remains: `backend/server.js`
- New foundation entrypoint: `backend/src/server.js`

Run new API:

```bash
cd backend
npm run dev:v1
```

---

## Dependency additions (backend)

- `prisma`
- `@prisma/client`
- `bcryptjs`
- `jsonwebtoken`
- `zod`

Scripts added in `backend/package.json`:
- `start:v1`
- `dev:v1`
- `prisma:generate`
- `prisma:migrate:dev`
- `prisma:migrate:deploy`
- `seed:v1`

Prisma schema path:
- `../database/prisma/schema.prisma`

---

## Architecture in this phase

### Core pieces
- `backend/src/lib/prisma.js` — Prisma Client singleton
- `backend/src/middleware/auth.js` — JWT auth + user lookup
- `backend/src/middleware/authorize.js` — admin/role/permission guards
- `backend/src/middleware/tenant.js` — tenant context (`company_id`) enforcement
- `backend/src/middleware/validate.js` — Zod request validation
- `backend/src/middleware/errorHandler.js` — safe error responses

### Security defaults
- Every v1 write route requires authentication
- Admin-only operations are enforced in backend middleware
- Machines and QR lookups are tenant scoped (`company_id`)
- CORS is restricted via `CORS_ORIGIN` env variable

---

## Initial v1 endpoints

Base: `/api/v1`

### Health
- `GET /api/v1/health`

### Auth
- `POST /api/v1/auth/login`

### Companies
- `GET /api/v1/companies/me` (auth)
- `POST /api/v1/companies` (admin)

### Users
- `GET /api/v1/users` (auth, tenant-scoped)
- `POST /api/v1/users` (admin)
- `PATCH /api/v1/users/:id` (admin)

### Roles
- `GET /api/v1/roles` (auth, tenant-scoped)
- `POST /api/v1/roles` (admin)

### Machines
- `GET /api/v1/machines` (auth, tenant-scoped)
- `GET /api/v1/machines/:id` (auth, tenant-scoped)
- `POST /api/v1/machines` (admin, tenant-scoped)
- `PATCH /api/v1/machines/:id` (admin, tenant-scoped)
- `DELETE /api/v1/machines/:id` (admin, soft delete)

### QR codes
- `GET /api/v1/qr-codes` (auth, tenant-scoped)
- `GET /api/v1/qr-codes/:id` (auth, tenant-scoped)
- `POST /api/v1/qr-codes` (admin, tenant-scoped)
- `POST /api/v1/qr-codes/validate` (auth, tenant-scoped)

---

## Environment configuration

New backend env template:
- `backend/.env.example`

Minimum required values:
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`

---

## Migrations and seed

### Generate Prisma client
```bash
cd backend
npm run prisma:generate
```

### Create/apply migration (development)
```bash
cd backend
npm run prisma:migrate:dev -- --name phase6a_init
```

Note: the Prisma schema uses `gen_random_uuid()` for UUID defaults. If your Postgres instance
does not have `pgcrypto` enabled, you may need to enable it before/within the first migration:
`CREATE EXTENSION IF NOT EXISTS pgcrypto;`

### Apply migrations (deployment)
```bash
cd backend
npm run prisma:migrate:deploy
```

### Seed first company and admin
```bash
cd backend
npm run seed:v1
```

Seed reads:
- `SEED_COMPANY_SLUG`
- `SEED_COMPANY_NAME`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_ADMIN_NAME`

---

## Tests (new Phase 6A API integration)

New integration test:
- `backend/tests/phase6a_api.test.js`

These tests require PostgreSQL with Phase 6A migrations applied.

By default, the tests are skipped unless:
- `RUN_PHASE6A_DB_TESTS=true`

---

## Notes before frontend migration

Before wiring frontend to `/api/v1`, complete:
1. Permission matrix finalization (role/permission assignment strategy)
2. Refresh-token/session strategy (current phase includes access token login only)
3. Additional entities (tasks, maintenance, documents, inventory, offers) endpoint rollout
4. API integration tests for tenant isolation and RBAC
5. Incremental frontend data-source migration from localStorage/mockData/Supabase

