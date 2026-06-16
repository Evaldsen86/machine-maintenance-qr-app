# Machine Maintenance QR / Maskiina.gl — Codebase Audit Report

**Date:** June 2026  
**Scope:** Phase 1 — full repository audit for self-hosted deployment planning  
**Status:** Documentation only — no application logic was changed as part of this audit.

---

## Executive Summary

Maskiina.gl is a **feature-rich React CMMS prototype** with a polished UI covering machines, QR codes, tasks, maintenance, documents, inventory, offers, e-learning, and time tracking. The **backend and data layers are not production-ready**: authentication is client-side mock data, the primary data store is browser `localStorage`, and three separate database approaches (Supabase PostgreSQL schema, MongoDB Express API, and browser storage) coexist without a unified integration path.

The application is suitable as an **internal UI demo** but is **not ready for a shared internal pilot** or **commercial multi-company deployment** until authentication, tenant isolation, and a single server-side database are implemented.

---

## 1. Current Frontend Architecture

### Stack

| Technology | Version / usage |
|------------|-----------------|
| React | 18.x |
| TypeScript | 5.x |
| Vite | 5.x (build tool and dev server) |
| React Router | 6.x (client-side routing) |
| TanStack Query | 5.x (configured; limited server integration) |
| Tailwind CSS + Shadcn/Radix UI | Component library |
| Zod + React Hook Form | Form validation |
| Leaflet | Machine map view |
| html5-qrcode / @zxing/browser | QR scanning |
| qrcode / qrcode.react | QR generation |
| @google/model-viewer | 3D model display |
| jsPDF / JSZip | PDF offers and exports |

### Project layout

```
src/
├── pages/           # 13 route-level pages
├── components/      # 50+ feature and UI components
├── hooks/           # useAuth, useMachines, useInventory, useInvoices, etc.
├── lib/             # supabase.ts, api.ts, inventoryDb.ts, utils
├── utils/           # Domain helpers (offers, tasks, 3D models, time entries)
├── types/           # TypeScript domain models
├── data/            # mockData.ts (prototype seed data)
└── constants.ts     # Shared messages and constants
```

### Pages and routes

| Route | Page | Access control (frontend only) |
|-------|------|-------------------------------|
| `/` | Index (login + QR scanner) | Public |
| `/dashboard` | Dashboard | Authenticated |
| `/machine/:id` | Machine detail | Authenticated or QR public access |
| `/profile` | User profile | Authenticated |
| `/add-machine` | Add machine | Admin |
| `/user-management` | User management | Admin |
| `/inventory` | Parts inventory | lagermand+ roles |
| `/invoices` | Invoices | Authenticated |
| `/arkiv` | Offer archive | Authenticated |
| `/tidsregistrering` | Time registration | Authenticated |
| `/settings` | Settings | Admin |
| `/elearning` | E-learning | Authenticated |
| `/elearning/machine/:id` | E-learning per machine | Authenticated |

Route guards are implemented in `src/App.tsx` via `ProtectedRoute`, `AdminRoute`, and `InventoryRoute`. These check `useAuth()` state only — there is no server-side session validation.

### State management pattern

- **Auth:** React Context (`useAuth.tsx`)
- **Machines:** Custom hook (`useMachines.ts`) backed by `localStorage`
- **Inventory:** Custom hook (`useInventory.ts`) with `localStorage` + optional IndexedDB
- **Invoices:** Custom hook (`useInvoices.ts`) backed by `localStorage`
- **Supabase path:** `MachineDataProvider.tsx` + `machineService` in `lib/supabase.ts` — **implemented but never mounted in the app**

### Key architectural finding

The dashboard (`Dashboard.tsx`) and machine detail (`MachineDetail.tsx`) use **`useMachines()` → localStorage + mockData**. Only a subset of features (`AddMachine`, `MachineQRSection`, `QRCodeManager`) call Supabase directly. `AddMachine` writes to both Supabase and localStorage, but the dashboard reads localStorage only — creating **split-brain data** when Supabase is configured.

---

## 2. Current Backend Architecture

### Stack

| Technology | Usage |
|------------|-------|
| Node.js + Express | HTTP API (`backend/server.js`) |
| Mongoose | MongoDB ODM |
| Morgan | Request logging |
| CORS | Open (`cors()` with no origin restriction) |
| dotenv | Environment configuration |
| Jest + Supertest | Test suite |
| QRCode (npm) | Server-side QR generation |

### API surface

Only **machine routes** exist under `/api/machines`:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/machines` | None | List all machines |
| GET | `/api/machines/:id` | None | Get one machine |
| POST | `/api/machines` | None | Create machine |
| PATCH | `/api/machines/:id` | None | Update machine |
| DELETE | `/api/machines/:id` | None | Delete machine |
| POST | `/api/machines/:id/tasks` | None | Add embedded task |
| POST | `/api/machines/:id/maintenance` | None | Add maintenance record |
| POST | `/api/machines/:id/oil` | None | Update oil info |
| GET | `/api/machines/:id/qr` | None | Generate QR code |
| POST | `/api/machines/validate-qr` | None | Validate QR (defined twice — duplicate route) |

### Middleware

- `validateMachine.js` — basic field presence checks for machine, task, maintenance, oil payloads
- `errorHandler.js` — handles ValidationError and CastError; leaks error message in development only

### Missing backend capabilities

- No authentication or authorization middleware
- No user, company, document, inventory, offer, or audit endpoints
- No file upload handling
- No rate limiting
- No API documentation (OpenAPI/Swagger)
- **Frontend does not call this API** — grep shows no `/api/` or axios usage in `src/`

### Backend model vs frontend model

MongoDB `Machine` schema (`backend/models/Machine.js`) stores:
- `name`, `model`, `serialNumber`, `specifications`, `oilInfo`
- Embedded `tasks[]` and `maintenance[]`
- Timestamps `createdAt`, `updatedAt`

Frontend `Machine` type (`src/types/index.ts`) additionally includes:
- `equipment[]`, `documents[]`, `images[]`, `models3D[]`, `serviceHistory`, `lubricationHistory`, `maintenanceSchedules`, `tasks` (richer task model), `oils[]`, `location`, `coordinates`, `qr_data`, `editPermissions`, `status`, etc.

These models are **not aligned** and cannot be swapped without a migration layer.

---

## 3. Current Database and Storage Usage

### Overview — five parallel data approaches

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
├─────────────┬──────────────┬────────────┬───────────────────┤
│ localStorage│  mockData.ts │ IndexedDB  │ Supabase client   │
│ (primary)   │  (fallback)  │ (offline)  │ (partial)         │
└─────────────┴──────────────┴────────────┴─────────┬─────────┘
                                                    │
                                          Supabase PostgreSQL
                                                    │
┌───────────────────────────────────────────────────┴─────────┐
│ Express + MongoDB backend (not connected to frontend)         │
└───────────────────────────────────────────────────────────────┘
```

### 3.1 localStorage (de facto primary store)

| Key pattern | Feature | Files |
|-------------|---------|-------|
| `dashboard_machines` | Machine list and edits | `useMachines.ts`, `AddMachine.tsx`, `Navbar.tsx`, `MachineDetail.tsx`, `timeEntryUtils.ts` |
| `user` | Auth session | `useAuth.tsx` |
| `users` | User list for task assignment | `Dashboard.tsx`, `TaskCalendar.tsx`, `EmployeeTimeDashboard.tsx`, `Elearning.tsx` |
| `time_entries_{machineId}` | Per-machine time tracking | `TimeTracking.tsx`, `TaskWorkflow.tsx`, `Profile.tsx`, `timeEntryUtils.ts` |
| `offers_*` / offer storage keys | Offers panel | `OfferPanel.tsx`, `MachineOffersCard.tsx`, `Archive.tsx` |
| Invoice storage key | Invoices | `useInvoices.ts` |
| Inventory storage keys | Parts inventory | `useInventory.ts` |
| `elearning_*` | Videos, checklists, progress, approvals | `Elearning.tsx`, `Profile.tsx`, `ChecklistView.tsx` |
| `payroll_entries_{userId}` | Payroll entries | `Profile.tsx` |
| `checklist_{machineId}` | Machine checklists | `ChecklistView.tsx` |
| 3D model metadata keys | Model persistence helpers | `model3DUtils.ts` |

**Risk:** Data is per-browser, not shared across users or devices. Clearing browser data destroys production records.

### 3.2 mockData (`src/data/mockData.ts`)

Exports:
- `mockUsers` — 8 demo users with roles
- `mockMachines` — sample machines with equipment
- `mockEquipment`, helper functions for service history, lubrication, tasks, documents, oils by machine

**Used in 14 files:**

| File | Usage |
|------|-------|
| `src/hooks/useAuth.tsx` | User lookup at login |
| `src/hooks/useMachines.ts` | Fallback when localStorage empty |
| `src/pages/Dashboard.tsx` | Technician list fallback |
| `src/pages/MachineDetail.tsx` | History/document/oil helpers |
| `src/pages/UserManagement.tsx` | Initial user list |
| `src/components/dashboard/TaskOverview.tsx` | User references |
| `src/components/dashboard/TaskWorkflow.tsx` | User references |
| `src/components/dashboard/TaskDialog.tsx` | User references |
| `src/components/dashboard/TaskCalendar.tsx` | User references |
| `src/components/machine/MachineTasksList.tsx` | User references |
| `src/components/service/TasksList.tsx` | User references |
| `src/components/DocumentPermissionsDialog.tsx` | User list |
| `src/components/timetracking/EmployeeTimeDashboard.tsx` | User list |
| `src/utils/timeEntryUtils.ts` | Machine list for time entries |

### 3.3 IndexedDB

| Database / store | Purpose | Files |
|------------------|---------|-------|
| `modelStorage` / `models` | 3D model blob persistence | `main.tsx`, `model3DUtils.ts`, `Machine3DViewer.tsx` |
| `machine-history-qr` | Offline cache for machines, tasks, maintenance | `lib/supabase.ts` |
| Inventory DB (`inventoryDb.ts`) | Parts inventory when IndexedDB available | `useInventory.ts`, `Inventory.tsx` |
| Service worker DB | Blob caching for PWA | `public/sw.js` |

IndexedDB is appropriate for **offline cache and large blobs** but must not remain the authoritative store for business data.

### 3.4 Supabase (PostgreSQL via hosted client)

**Client:** `src/lib/supabase.ts` — throws at module load if `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing.

**Schema** (`supabase/schema.sql`):

| Table | Columns (summary) |
|-------|-------------------|
| `machines` | id (UUID), name, model, serial_number, specifications[], oil_info (JSONB), timestamps |
| `tasks` | id, machine_id (FK), title, description, due_date, assigned_to, status, timestamps |
| `maintenance` | id, machine_id (FK), date, description, technician, notes, timestamps |

**RLS policies:** All tables have `USING (true)` / `WITH CHECK (true)` — effectively **no access control**.

**Active integration points:**

| File | Usage |
|------|-------|
| `src/lib/supabase.ts` | `machineService` CRUD + offline IndexedDB cache |
| `src/lib/api.ts` | `getMachines()` — unused elsewhere |
| `src/pages/AddMachine.tsx` | `createMachine` + localStorage sync |
| `src/components/machine/MachineQRSection.tsx` | `updateMachine`, `getMachineById` |
| `src/components/QRCodeManager.tsx` | `generateQRCode`, `validateQRCode` |
| `src/components/machine/MachineDataProvider.tsx` | Full Supabase context — **not used in app tree** |

**Type mismatches:**
- Supabase schema uses `UUID` for `machines.id`; `lib/supabase.ts` types `id` as `number`
- Frontend uses `serialNumber` (camelCase); Supabase uses `serial_number` (snake_case)
- `AddMachine` sends fields (`status`, `equipment`, `location`, `coordinates`) not present in Supabase schema

### 3.5 MongoDB (Express backend only)

- Connected via `backend/config/database.js` using `MONGODB_URI`
- Single `Machine` model with embedded tasks and maintenance
- Comprehensive Jest test suite exists
- **Not used by the React frontend**

### 3.6 CI / deployment storage

`.github/workflows/deploy.yml`:
- Builds frontend and deploys to **Vercel**
- Daily backup via **Supabase cloud API**

No Docker, Nginx, or self-hosted deployment configuration exists in the repository.

---

## 4. mockData Usage (complete list)

See section 3.2. mockData serves three roles today:

1. **Authentication user directory** — emails matched at login; passwords not verified for mock users
2. **Machine seed data** — loaded when `dashboard_machines` localStorage key is empty
3. **Derived data helpers** — service history, lubrication, tasks, documents, oils keyed by machine ID (static, not persisted)

---

## 5. localStorage Usage (complete list)

See section 3.1. **20 source files** read or write localStorage for business data. Only UI-adjacent usage that may remain long-term:

- Potential future use: draft forms, UI preferences, offline queue (not yet implemented as such)

Everything listed in section 3.1 must be migrated to server-side storage for production.

---

## 6. IndexedDB Usage (complete list)

See section 3.3. Recommended retention after migration:

| Keep | Migrate away |
|------|--------------|
| 3D model blob cache | Inventory parts as primary store |
| Optional offline read cache | Machine/task/maintenance authoritative copy |
| Service worker asset cache | — |

---

## 7. Supabase Usage (complete list)

See section 3.4. Supabase is a **partial, optional integration** — not the runtime source of truth for the main user flows. The app can fail to start if Supabase env vars are missing (due to `validateEnvVariables()` at import time), even when users only interact with localStorage-backed features.

---

## 8. MongoDB / Mongoose Usage

| Location | Purpose |
|----------|---------|
| `backend/config/database.js` | Connection helper |
| `backend/models/Machine.js` | Mongoose schema |
| `backend/controllers/machineController.js` | CRUD + tasks + maintenance + oil + QR |
| `backend/routes/machines.js` | Route definitions |
| `backend/tests/*.js` | Unit and integration tests |

MongoDB is a **complete but isolated** alternative backend. It duplicates functionality planned for PostgreSQL and is not connected to the frontend.

---

## 9. Authentication Security Assessment

| Check | Status | Detail |
|-------|--------|--------|
| Server-side authentication | ❌ Fail | No login API; session is a JSON object in localStorage |
| Password hashing | ❌ Fail | Passwords not stored or verified (mock users accept any password) |
| Hardcoded credentials | ❌ Critical | Admin email/password hardcoded in `useAuth.tsx` |
| Credential documentation | ❌ Critical | `TEST_CREDENTIALS.md` publishes credentials in repo |
| Token / session expiry | ❌ Fail | No expiry; session persists until logout or localStorage clear |
| Supabase Auth | ❌ Unused | Client configured with auth listeners but login does not use it |
| HTTPS enforcement | ❌ N/A | No production deployment config in repo |
| CSRF protection | ❌ N/A | No cookie-based sessions |
| Brute-force protection | ❌ Fail | No rate limiting on login |

**Verdict:** Authentication is **not secure** and must be replaced before any real deployment.

---

## 10. Backend Route Protection

| Check | Status |
|-------|--------|
| Authentication middleware | ❌ None |
| Authorization / RBAC | ❌ None |
| Tenant scoping | ❌ None |
| CORS restriction | ❌ Open to all origins |
| Input validation | ⚠️ Partial (presence checks only) |
| Delete protection | ❌ Unauthenticated DELETE allowed |

**Verdict:** All backend routes are **publicly accessible** if the backend is exposed.

---

## 11. Role-Based Permissions — Frontend vs Backend

### Frontend (`useAuth.tsx`)

Role hierarchy: `guest/viewer/customer` (1) → `driver` (2) → `mechanic` (3) → `technician/blacksmith` (4) → `lagermand/leader` (5) → `admin` (6).

Permission helpers: `canEditMachine`, `canAddServiceRecord`, `canMarkLubrication`, `canAddNotes`, `canUploadDocuments`, `canManageUsers`, `canAddTask`.

Route-level guards in `App.tsx` for admin and inventory pages.

### Backend

**No role checks exist.** Any client can call any endpoint.

### Bypass risk

A user can:
- Modify localStorage `user` object to escalate role
- Call backend API directly without authentication
- Use Supabase anon key with open RLS policies to read/write all data

**Verdict:** RBAC is **frontend-only decoration** today.

---

## 12. Internal Pilot Readiness

### What works today (single-browser demo)

| Capability | Works? | Notes |
|------------|--------|-------|
| Admin login | ⚠️ Demo | Hardcoded + mock users |
| Technician login | ⚠️ Demo | Mock email, any password |
| Create machine | ⚠️ Partial | Supabase + localStorage; dashboard uses localStorage |
| Edit machine | ✅ | localStorage via `useMachines` |
| Delete machine | ✅ | localStorage; permission check frontend only |
| Generate QR code | ⚠️ Partial | Works for Supabase-backed machines; local machines use client-side QR |
| Scan QR code | ✅ | Scanner UI works; resolves to localStorage machines |
| View machine history | ⚠️ Demo | Mix of machine state + mockData helpers |
| Add maintenance record | ✅ | Stored in machine object in localStorage |
| Create and assign task | ✅ | localStorage |
| Update task status | ✅ | localStorage |
| Upload/view documents | ⚠️ Demo | Blob/data URLs; not server-persisted |
| Search/filter machines | ✅ | Client-side filter |
| Mobile usage | ✅ | Responsive UI, mobile viewers, QR scanner |

### What blocks a real internal pilot

1. **No shared database** — each browser has its own data
2. **No real authentication** — credentials in source code
3. **No backup/restore** — browser storage is fragile
4. **No audit trail** — changes are not logged
5. **No multi-user concurrency** — last write in browser wins
6. **Documents and 3D models** — stored as blobs/URLs, not on server

### Internal pilot readiness verdict

| Level | Ready? |
|-------|--------|
| UI/UX demonstration for stakeholders | ✅ Yes |
| Single technician trying flows on one device | ⚠️ With caveats |
| Whole company using shared machine data | ❌ No |
| Production internal pilot | ❌ No |

---

## 13. Commercial Multi-Company Readiness

| Requirement | Present? |
|-------------|----------|
| Company / tenant model | ❌ No |
| `company_id` on business tables | ❌ No |
| Tenant isolation in API | ❌ No |
| Customer onboarding flow | ❌ No |
| Company admin role (per tenant) | ❌ No |
| User limits per company | ❌ No |
| Storage limits per company | ❌ No |
| Subscription / license model | ❌ No |
| Per-customer backup | ❌ No |
| Customer data export | ❌ No |
| Billing integration | ❌ No |

The only company-related string found is a default name in `offerPdf.ts` (`Maskine QR System`).

### Commercial readiness verdict

**Not ready.** The application is a single-tenant prototype with no data isolation, billing, or operational tooling for SaaS.

---

## 14. Critical Bugs, Duplicate Code, and Risky Patterns

### Security

| Issue | Location | Severity |
|-------|----------|----------|
| Hardcoded admin password | `src/hooks/useAuth.tsx` | Critical |
| Credentials in repo docs | `TEST_CREDENTIALS.md` | Critical |
| Open Supabase RLS | `supabase/schema.sql` | Critical |
| Open CORS and no auth | `backend/server.js` | Critical |
| Session stored as editable JSON | `localStorage.user` | High |

### Data integrity

| Issue | Location | Severity |
|-------|----------|----------|
| Split brain: Supabase vs localStorage | `AddMachine.tsx` vs `useMachines.ts` | High |
| MachineDataProvider never mounted | `MachineDataProvider.tsx` | High |
| ID type mismatch (string / number / UUID) | `types/index.ts`, `supabase.ts`, schema | High |
| Field naming inconsistency | `serialNumber` vs `serial_number` | Medium |
| AddMachine sends unknown columns to Supabase | `AddMachine.tsx` | Medium |
| mockData helpers for history not persisted | `MachineDetail.tsx` | Medium |

### Backend bugs

| Issue | Location | Severity |
|-------|----------|----------|
| Duplicate `POST /validate-qr` route | `backend/routes/machines.js` | Medium |
| `machine.remove()` deprecated | `machineController.js` | Medium |
| Controller uses `maintenanceHistory`; schema has `maintenance` | controller vs model | High (if backend used) |
| `lib/api.ts` unused | `src/lib/api.ts` | Low |

### Operational

| Issue | Severity |
|-------|----------|
| No `.env.example` | Medium |
| No Docker / self-host docs | Medium |
| Supabase required at import even for localStorage-only use | Medium |
| `PROJECT_STATUS.md` claims "production-ready" — inaccurate | Low (documentation) |

### Duplicate / dead code

- `MachineDataProvider` — full Supabase integration, unused
- `lib/api.ts` — thin Supabase wrapper, unused
- MongoDB backend — parallel implementation, unused by frontend
- Two machine type definitions: `src/types/index.ts` vs `MachineDataProvider.tsx` vs `lib/supabase.ts`

---

## Security Blockers (consolidated)

Must be resolved before any network-exposed deployment:

1. Replace mock authentication with server-side auth (JWT or sessions + httpOnly cookies)
2. Remove hardcoded credentials from source and documentation
3. Hash passwords with bcrypt/argon2; enforce password policy
4. Add authentication middleware to all write endpoints and tenant-scoped read endpoints
5. Enforce RBAC on the backend, not only in React
6. Restrict CORS to known origins via environment variables
7. Close Supabase open RLS policies (or remove Supabase from production path)
8. Add HTTPS termination (Nginx + TLS certificates)
9. Add rate limiting on auth and sensitive endpoints
10. Ensure API errors do not leak stack traces or internal details in production
11. Store files outside the web root with signed access URLs
12. Add audit logging for admin and delete operations

---

## Estimated Migration Phases

These phases are planning estimates. Duration depends on team size and parallel work. **No code changes are implied by this audit.**

| Phase | Scope | Estimated effort | Depends on |
|-------|-------|------------------|------------|
| **0 — Planning** | Audit (this doc), architecture decision, folder skeleton | 1 week | — |
| **1 — Infrastructure** | Docker Compose, PostgreSQL, Nginx, `.env.example`, docs | 1–2 weeks | Phase 0 |
| **2 — Schema + auth** | Prisma/SQL migrations, companies, users, roles, JWT auth API | 2–3 weeks | Phase 1 |
| **3 — Machines core** | Machine CRUD API, migrate `useMachines` off localStorage | 2 weeks | Phase 2 |
| **4 — QR + public access** | QR generate/validate API, scoped public machine view | 1 week | Phase 3 |
| **5 — Tasks + maintenance** | Tasks, service records, lubrication, oil info APIs | 2–3 weeks | Phase 3 |
| **6 — Documents + files** | Upload/storage (local or MinIO), permissions API | 2 weeks | Phase 3 |
| **7 — Users + RBAC** | User management API, backend permission enforcement | 1–2 weeks | Phase 2 |
| **8 — Inventory + offers** | Parts, offers, invoices APIs | 2–3 weeks | Phase 2 |
| **9 — Time + e-learning** | Time entries, payroll, e-learning content APIs | 2–3 weeks | Phase 2 |
| **10 — Hardening** | Security review, backup scripts, pilot checklist, load test | 1–2 weeks | Phases 3–9 |
| **11 — Commercial prep** | Multi-tenant onboarding, limits, export (documentation + implementation) | 4+ weeks | Phase 10 |

**Internal pilot target:** End of Phase 6–7 (machines, QR, tasks, maintenance, documents, real auth).  
**Commercial SaaS target:** Phase 11+ with ongoing operational work.

---

## What Must Be Migrated Later (ordered)

See `docs/ARCHITECTURE_DECISION.md` for the recommended target architecture and detailed migration sequence. Summary:

1. Authentication and sessions (remove mock login)
2. Users and roles (remove mockUsers for production)
3. Machines (remove localStorage as primary store)
4. Tasks and assignees
5. Maintenance, service records, lubrication, oil info
6. Documents and file storage
7. QR codes (server-side generation and validation)
8. Inventory / parts
9. Offers and invoices
10. Time entries and payroll
11. E-learning content
12. Audit logs (new capability)
13. Deprecate Supabase client from frontend
14. Deprecate MongoDB backend (after PostgreSQL parity)
15. Retain IndexedDB/localStorage only for UI prefs and offline cache

---

## Appendix A — Environment variables referenced today

| Variable | Used by | Required for |
|----------|---------|--------------|
| `VITE_SUPABASE_URL` | Frontend | Supabase client (throws if missing) |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase client (throws if missing) |
| `MONGODB_URI` | Backend | MongoDB connection |
| `PORT` | Backend | Express listen port |
| `NODE_ENV` | Backend | Error detail leakage control |

No `.env.example` file exists in the repository at the time of this audit.

---

## Appendix B — Test and documentation files

| File | Notes |
|------|-------|
| `TEST_CREDENTIALS.md` | Contains live-style credentials — security risk |
| `PROJECT_STATUS.md` | Overstates production readiness |
| `LOCAL_SETUP_GUIDE.md` | Supabase-oriented setup |
| `SUPABASE_SETUP.md` | Cloud Supabase setup guide |
| `backend/README.md` | MongoDB backend setup |
| `backend/tests/` | Machine API tests (MongoDB in-memory) |

---

*End of audit report. Application source code was not modified.*
