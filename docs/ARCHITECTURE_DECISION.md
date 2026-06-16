# Architecture Decision — Self-Hosted Maskiina.gl

**Date:** June 2026  
**Status:** Approved for planning (Phase 2)  
**Scope:** Target production architecture and migration strategy  
**Related:** `docs/AUDIT_REPORT.md`

This document records the architecture decision for deploying Maskiina.gl on the company's own server. **No application logic has been changed** as part of this decision record. Existing MongoDB, Supabase, localStorage, mockData, and IndexedDB code remain in place until each area is migrated in later phases.

---

## 1. Decision Summary

Maskiina.gl will move to a **self-hosted, single-stack architecture**:

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite (existing codebase) |
| Backend | Node.js + Express (extend existing `backend/`) |
| Database | PostgreSQL 15+ |
| ORM / migrations | Prisma (recommended) or node-pg + SQL migrations |
| Authentication | Server-side JWT or secure session cookies (httpOnly) |
| Authorization | Role-based access control enforced in Express middleware |
| Multi-company | `company_id` (tenant_id) on all business tables |
| File storage | Local filesystem or self-hosted MinIO (S3-compatible) |
| Reverse proxy | Nginx |
| TLS | Let's Encrypt or company PKI |
| Orchestration | Docker Compose |
| Backups | Automated PostgreSQL dumps + file storage sync |
| Logging | Structured backend logs (stdout) + error log aggregation |

**Single source of truth for production data:** PostgreSQL accessed only through the Express API. The React app must not write business data directly to Supabase, MongoDB, localStorage, or IndexedDB.

---

## 2. Target Deployment Architecture

```
                    Internet / company network
                              │
                              ▼
                    ┌─────────────────┐
                    │  Nginx (TLS)    │
                    │  :443 / :80     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     /static (React)   /api → Express   /files (optional)
     frontend build     backend :3000     signed URLs
              │              │
              │              ├──────────► PostgreSQL :5432
              │              │
              │              └──────────► MinIO or /data/uploads
              │
              └── SPA fallback to index.html

     Docker Compose services:
       nginx, frontend (build artifact), backend, postgres, minio (optional)
```

### Request flow (authenticated)

1. Browser loads React SPA from Nginx (`/`).
2. User logs in via `POST /api/auth/login` → backend validates credentials against PostgreSQL → returns JWT (or sets httpOnly session cookie).
3. Frontend attaches token to `Authorization: Bearer …` on API calls.
4. Express middleware validates token, resolves `user_id` and `company_id`, attaches to `req`.
5. All queries include `WHERE company_id = $tenant` (or Prisma equivalent).
6. File uploads go to `POST /api/documents` → stored on disk/MinIO → metadata in PostgreSQL.

### Request flow (QR public access)

1. QR code encodes machine UUID + signed token or short public slug.
2. `GET /api/public/machines/:slug` returns **limited** fields (no internal notes, no private documents) without full login.
3. Optional: require PIN or customer role for extended public view.

---

## 3. Recommended Repository Layout (future)

The current repo keeps frontend at root (`src/`) and backend in `backend/`. For production clarity, the target layout is:

```
machine-history-qr/
├── frontend/          # Vite React app (migrate from root src/ over time)
├── backend/           # Express API (extend existing)
├── database/          # Prisma schema, SQL migrations, seeds
├── docker/            # Dockerfiles, nginx.conf, compose overrides
├── docs/              # Audit, architecture, deployment, security checklists
├── docker-compose.yml
└── .env.example
```

**Transition approach:** Do not move folders until Phase 3 infrastructure work begins. Until then, document responsibilities:

| Path today | Future responsibility |
|------------|----------------------|
| `src/` | Frontend application |
| `backend/` | HTTP API and business logic |
| `supabase/schema.sql` | Reference only — superseded by `database/` migrations |
| `public/` | Static assets and service worker |

---

## 4. Technology Decisions

### 4.1 Frontend — keep React + TypeScript + Vite

**Decision:** Retain the existing frontend stack.

**Rationale:**
- Large investment in components and UX already exists
- Vite builds static assets ideal for Nginx serving
- TypeScript types in `src/types/` become API contract reference during migration

**Changes later (not now):**
- Add API client layer (`src/lib/apiClient.ts`) pointing to Express
- Remove direct Supabase imports from pages incrementally
- Gate mockData behind `VITE_DEMO_MODE=true` for local demos only

### 4.2 Backend — extend Express (not rewrite)

**Decision:** Extend `backend/` rather than adopt a new framework.

**Rationale:**
- Machine routes, validation middleware, and tests already exist
- Team familiarity with Node.js/Express
- Easier incremental migration from MongoDB patterns to PostgreSQL

**Changes later:**
- Replace Mongoose with Prisma
- Add `auth`, `users`, `companies`, `documents`, `tasks`, etc. route modules
- Add global auth + tenant middleware
- Remove duplicate routes and align field names to snake_case in API JSON (or consistent camelCase with transform layer — pick one and document)

### 4.3 Database — PostgreSQL

**Decision:** PostgreSQL is the **only** production database.

**Rationale:**
- Aligns with company self-hosting goal (no paid Supabase subscription)
- Strong relational model for CMMS entities and tenant isolation
- JSONB columns for flexible fields (specifications, oil_info, QR options)
- Mature backup tooling (`pg_dump`, WAL archiving)

**Core tables (minimum):**

| Entity | Notes |
|--------|-------|
| `companies` | Tenant root |
| `users` | `company_id`, email, password_hash, role |
| `roles` / `permissions` | Optional normalized RBAC; can start with enum on users |
| `machines` | `company_id`, all machine fields |
| `machine_documents` | `company_id`, `machine_id`, storage path, permissions |
| `qr_codes` | `company_id`, `machine_id`, payload, options |
| `tasks` | `company_id`, `machine_id`, assignees via junction table |
| `task_assignees` | `task_id`, `user_id` |
| `maintenance_history` | Service/maintenance records |
| `service_records` | Per-equipment service history |
| `lubrication_records` | Lubrication events |
| `oil_information` | Per machine or equipment |
| `inventory_parts` | Stock, SKU, location |
| `offers` | Linked to machines/customers |
| `audit_logs` | `company_id`, actor, action, entity, timestamp |

Every business table **must** include `company_id UUID NOT NULL REFERENCES companies(id)`.

### 4.4 ORM — Prisma (recommended)

**Decision:** Use Prisma for schema, migrations, and type-safe queries.

**Alternatives:** Drizzle ORM, Knex, or raw `pg` with `node-pg-migrate`.

**Rationale for Prisma:**
- Declarative schema close to TypeScript types
- Migration workflow fits Docker init containers
- Good developer experience for multi-table relations (tasks, assignees, documents)

### 4.5 Authentication

**Decision:** Server-issued **JWT** (short-lived access + refresh token) **or** **httpOnly session cookies**. Pick one during Phase 2 implementation; cookies are slightly better for XSS resistance if SPA and API share origin behind Nginx.

**Requirements:**
- bcrypt or argon2 password hashing
- No passwords in source code or docs
- Logout invalidates refresh token / session server-side
- All mutations require valid auth context

**Deprecate:** `useAuth.tsx` mock login, `localStorage.user` as authority.

### 4.6 File storage

**Decision:** Local filesystem for internal pilot; **MinIO** when multi-instance or S3-compatible tooling is preferred.

| Option | When to use |
|--------|-------------|
| `/data/uploads` volume mounted in Docker | Simple internal pilot, single server |
| MinIO container | S3 API, easier backup replication, future scaling |

Files are **never** stored only in browser blob URLs for production records. Metadata and access permissions live in PostgreSQL; bytes live on disk/MinIO.

**Retain IndexedDB** only for optional offline 3D model cache — not authoritative.

### 4.7 Reverse proxy and HTTPS

**Decision:** Nginx terminates TLS and routes traffic.

```nginx
# Conceptual routing
location /       { root /usr/share/nginx/html; try_files $uri /index.html; }
location /api/   { proxy_pass http://backend:3000; }
location /health { proxy_pass http://backend:3000/health; }
```

- Force HTTP → HTTPS redirect
- Set security headers (HSTS, X-Content-Type-Options, X-Frame-Options)
- Limit upload body size for document endpoints
- TLS via Certbot (Let's Encrypt) or company certificates

### 4.8 Docker Compose

**Decision:** Docker Compose for on-prem deployment.

**Minimum services:**

| Service | Image / build | Purpose |
|---------|---------------|---------|
| `postgres` | `postgres:16-alpine` | Database |
| `backend` | `Dockerfile` in backend | Express API |
| `frontend` | Multi-stage build → Nginx static | React SPA |
| `nginx` | `nginx:alpine` | TLS + routing |
| `minio` | optional | Object storage |

**Volumes:** `postgres_data`, `uploads_data`, `minio_data`

**Networks:** Internal bridge; only Nginx exposes ports 80/443.

### 4.9 Logging and monitoring

- Express: `morgan` (dev) + structured JSON logs (production)
- Log to stdout for Docker log drivers
- Error handler must not return stack traces in production
- Future: Prometheus metrics, health checks (`/health`, `/ready`)

### 4.10 Backups

- **PostgreSQL:** nightly `pg_dump` to mounted backup volume; retention policy (e.g. 30 days)
- **Files:** `rsync` or `restic` of uploads/MinIO bucket
- Document procedures in `BACKUP_AND_RESTORE.md` (Phase 3 deliverable)

---

## 5. What Happens to MongoDB?

| Question | Decision |
|----------|----------|
| Keep in production? | **No** |
| Remove now? | **No** — keep until PostgreSQL API reaches parity |
| Final state | **Remove** from deployment; archive tests as reference |

**Rationale:** MongoDB backend duplicates machine CRUD already partially covered by Supabase schema and fully covered by frontend localStorage. Maintaining two server databases increases cost without benefit. The Express route structure and validation middleware are reusable; only the persistence layer changes to Prisma/PostgreSQL.

**Migration path:**
1. Implement PostgreSQL machine endpoints in Express
2. Point frontend to new API
3. Mark MongoDB connection as deprecated in `backend/README.md`
4. Remove `mongoose` dependency after parity tests pass

---

## 6. What Happens to Supabase?

| Question | Decision |
|----------|----------|
| Keep for production? | **No** |
| Remove now? | **No** |
| Use during development? | **Optional** — only as a temporary dev database until local PostgreSQL in Docker is standard |
| Final state | **Migrate away** — remove `@supabase/supabase-js` from frontend production build |

**Rationale:**
- Supabase hosted service conflicts with self-hosting goal and may incur subscription cost
- Current RLS policies are open (`USING (true)`)
- Schema covers only 3 tables vs. full CMMS model
- Frontend Supabase usage is partial and conflicts with localStorage primary store

**What to reuse:**
- `supabase/schema.sql` as inspiration for early PostgreSQL tables (machines, tasks, maintenance)
- Offline IndexedDB pattern in `lib/supabase.ts` as reference for optional cache — not for production writes

**Migration path:**
1. Stand up self-hosted PostgreSQL (Docker)
2. Implement Express endpoints replacing `machineService` calls
3. Remove `VITE_SUPABASE_*` requirement from frontend
4. Delete or gate `src/lib/supabase.ts` behind demo flag
5. Update CI to stop Vercel/Supabase deploy workflow; replace with Docker build pipeline

---

## 7. What Happens to localStorage and mockData?

| Store | Production role today | Target role |
|-------|----------------------|-------------|
| `localStorage` | Primary business database | UI preferences, draft forms, optional offline queue only |
| `mockData.ts` | Users, seed machines, static history | Dev/demo mode only (`VITE_DEMO_MODE`) |
| IndexedDB | 3D blobs, inventory, offline cache | Large blob cache and offline read cache only |

**Do not delete yet.** Each feature module migrates to the API in the order below; only remove localStorage writes for a module after the API path is verified.

---

## 8. Single Source of Truth

```
Production data flow (target):

  React UI  ──HTTP──►  Express API  ──SQL──►  PostgreSQL
                            │
                            └──file I/O──► Local disk / MinIO
```

**Rules:**
1. Frontend never writes business entities to localStorage, IndexedDB, or Supabase in production mode.
2. All reads and writes go through Express with `company_id` scoping.
3. Public QR views use dedicated public API endpoints with field filtering.
4. One migration system (Prisma migrate) owns schema changes.

---

## 9. Migration Order (later phases)

Work in vertical slices. **Do not change app logic until each slice is ready.**

### Priority 1 — Foundation (blocks everything)

| Step | Work | Retire when done |
|------|------|------------------|
| 1.1 | Docker Compose: postgres, backend, nginx | — |
| 1.2 | Prisma schema: companies, users, roles | — |
| 1.3 | Auth API: login, logout, refresh, me | mock login in `useAuth.tsx` |
| 1.4 | Auth middleware + CORS from env | open CORS |
| 1.5 | `.env.example`, self-hosting docs | — |

### Priority 2 — Internal pilot core

| Step | Work | Retire when done |
|------|------|------------------|
| 2.1 | Machines CRUD API with `company_id` | `useMachines` localStorage writes |
| 2.2 | Frontend: dashboard loads machines from API | `dashboard_machines` key |
| 2.3 | Machine detail from API | mockData history helpers (phase 2.5) |
| 2.4 | QR generate + validate API | direct Supabase QR calls |
| 2.5 | Tasks API + assignees | task data in machine localStorage blob |
| 2.6 | Maintenance + service + lubrication APIs | mockData `getServiceHistory*` |
| 2.7 | Document upload API + storage | blob-only documents |
| 2.8 | User management API | `mockUsers`, `localStorage.users` |

### Priority 3 — Extended operations

| Step | Work | Retire when done |
|------|------|------------------|
| 3.1 | Inventory / parts API | `useInventory` localStorage primary mode |
| 3.2 | Offers + archive API | `OfferPanel` / `Archive` localStorage |
| 3.3 | Invoices API | `useInvoices` localStorage |
| 3.4 | Time entries API | `time_entries_*` localStorage |
| 3.5 | E-learning content API | `elearning_*` localStorage |
| 3.6 | Audit log writes on mutations | — |

### Priority 4 — Deprecation and cleanup

| Step | Work |
|------|------|
| 4.1 | Remove Supabase client from production bundle |
| 4.2 | Remove MongoDB/Mongoose from backend |
| 4.3 | Gate or remove `mockData.ts` from production builds |
| 4.4 | Remove hardcoded credentials and `TEST_CREDENTIALS.md` secrets |
| 4.5 | Replace GitHub Actions Vercel workflow with Docker image build |

### Priority 5 — Commercial (document first, implement later)

| Step | Work |
|------|------|
| 5.1 | Company onboarding API (create tenant + admin) |
| 5.2 | Per-tenant user and storage limits |
| 5.3 | License/subscription metadata (no payment gateway required initially) |
| 5.4 | Per-tenant backup and customer data export |
| 5.5 | Billing integration (Stripe or manual invoicing) — optional |

---

## 10. Internal Pilot Readiness

### Target criteria (must all pass)

- [ ] Admin and technician accounts in PostgreSQL with hashed passwords
- [ ] Login via API; no hardcoded credentials
- [ ] Machines shared across all company users from PostgreSQL
- [ ] Create, edit, delete machine (delete admin-only on backend)
- [ ] QR generation and scan resolving to server data
- [ ] Maintenance record persisted on server
- [ ] Task create, assign, status update on server
- [ ] Document upload and download via server storage
- [ ] Search/filter machines via API or client-side on API data
- [ ] Usable on mobile browsers (existing UI + API)
- [ ] HTTPS via Nginx
- [ ] Nightly PostgreSQL backup tested restore

### Current gap

All items above are **unchecked**. The UI exists; the server-backed data path does not.

**Estimated time to internal pilot:** Phases 1–2 in migration order (~6–10 weeks for a small team, assuming part-time; ~3–5 weeks full-time).

---

## 11. Commercial Multi-Company Readiness

### Required capabilities (not implemented)

| Area | Requirement |
|------|-------------|
| Tenancy | `companies` table; every row scoped by `company_id` |
| Onboarding | Super-admin creates company + first company admin |
| Isolation | Integration tests proving cross-tenant read/write fails |
| Company admin | Manage users within own company only |
| Limits | Configurable max users and storage per company |
| License | Feature flags or license key per deployment/customer |
| Backup | Per-tenant export (SQL slice or JSON export job) |
| Compliance | Audit log, data export on request, retention policy |
| Billing | Subscription tiers — document only until product-market fit |

### Current gap

**No multi-tenant model exists.** Commercial readiness follows internal pilot by approximately 4–8 additional weeks for tenant isolation hardening, onboarding UI, and operational tooling.

---

## 12. Security Blockers (must clear before pilot)

| # | Blocker | Resolution |
|---|---------|------------|
| 1 | Hardcoded admin password in `useAuth.tsx` | Server auth + remove from source |
| 2 | Credentials in `TEST_CREDENTIALS.md` | Replace with seed script + example only |
| 3 | Mock auth accepts any password | Verify password hash server-side |
| 4 | RBAC only in React | Express permission middleware per route |
| 5 | Backend API fully public | JWT/session middleware |
| 6 | Supabase RLS open | Remove Supabase from prod path |
| 7 | CORS open | `CORS_ORIGIN` env whitelist |
| 8 | No HTTPS | Nginx TLS |
| 9 | Session in localStorage editable | httpOnly cookie or short-lived JWT + secure storage pattern |
| 10 | No audit trail for deletes | `audit_logs` table |
| 11 | Documents as public blobs | Authenticated download with permission check |
| 12 | No rate limiting | `express-rate-limit` on `/api/auth/*` |

---

## 13. Estimated Migration Phases (timeline)

| Phase | Name | Deliverables | Duration estimate |
|-------|------|--------------|-------------------|
| **1** | Documentation | Audit report, architecture decision (this doc) | ✅ Complete |
| **2** | Infrastructure skeleton | `docker-compose.yml`, Dockerfiles, `.env.example`, nginx config, docs folder | 1–2 weeks |
| **3** | Database + auth | Prisma schema (companies, users), login API, middleware | 2–3 weeks |
| **4** | Machines + QR | Machine CRUD, frontend wired to API, QR endpoints | 2 weeks |
| **5** | Tasks + maintenance | Tasks, service records, maintenance APIs + UI wiring | 2–3 weeks |
| **6** | Documents | File upload, permissions, MinIO or local storage | 2 weeks |
| **7** | Users + RBAC hardening | User admin API, backend permission matrix | 1–2 weeks |
| **8** | **Internal pilot** | Checklist sign-off, backup/restore tested | 1 week |
| **9** | Extended modules | Inventory, offers, invoices, time, e-learning | 4–6 weeks |
| **10** | Deprecation | Remove Supabase, MongoDB, mockData from prod | 1–2 weeks |
| **11** | Commercial prep | Multi-tenant onboarding, limits, export | 4+ weeks |

**Total to internal pilot:** Phases 2–8 (~11–16 weeks part-time).  
**Total to commercial-ready SaaS:** through Phase 11 (~20–30 weeks part-time).

---

## 14. Environment Variables (target `.env.example` preview)

Not created yet — documented here for planning. **Never commit real secrets.**

```env
# ── PostgreSQL ──
POSTGRES_USER=maskiina
POSTGRES_PASSWORD=change-me
POSTGRES_DB=maskiina
DATABASE_URL=postgresql://maskiina:change-me@postgres:5432/maskiina

# ── Backend ──
NODE_ENV=production
PORT=3000
JWT_SECRET=change-me-long-random-string
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
CORS_ORIGIN=https://maskiina.example.com

# ── File storage ──
STORAGE_TYPE=local
UPLOAD_DIR=/data/uploads
# Or MinIO:
# STORAGE_TYPE=minio
# MINIO_ENDPOINT=minio
# MINIO_PORT=9000
# MINIO_ACCESS_KEY=change-me
# MINIO_SECRET_KEY=change-me
# MINIO_BUCKET=maskiina-files

# ── Frontend build args ──
VITE_API_URL=https://maskiina.example.com/api
VITE_DEMO_MODE=false

# ── Legacy (keep during migration, remove later) ──
# VITE_SUPABASE_URL=
# VITE_SUPABASE_ANON_KEY=
# MONGODB_URI=
```

---

## 15. Decision Log

| Date | Decision | Alternatives considered |
|------|----------|-------------------------|
| 2026-06 | PostgreSQL as sole production DB | Keep Supabase hosted; keep MongoDB |
| 2026-06 | Extend Express backend | NestJS rewrite; Supabase-only |
| 2026-06 | Self-hosted files (local/MinIO) | Supabase Storage; cloud S3 |
| 2026-06 | Docker Compose on-prem | Kubernetes (deferred — unnecessary for initial pilot) |
| 2026-06 | Prisma for ORM | Raw SQL, Drizzle |
| 2026-06 | Do not delete legacy stores yet | Big-bang rewrite (rejected — too risky) |

---

## 16. Next Steps (Phase 3+ — not started)

When approved to proceed beyond documentation:

1. Create `docker-compose.yml` and `docker/` configs without altering app behavior
2. Add `database/prisma/schema.prisma` with companies + users + machines
3. Implement auth routes in `backend/` alongside existing machine routes
4. Add `README_SELF_HOSTING.md`, `BACKUP_AND_RESTORE.md`, `DEPLOYMENT_CHECKLIST.md`, `SECURITY_CHECKLIST.md`

Until then, the existing application continues to run as today with localStorage, mockData, optional Supabase, and optional MongoDB backend.

---

*End of architecture decision record.*
