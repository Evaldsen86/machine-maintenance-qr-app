# Time Registration Pilot — Verification Guide

Use this checklist to verify the **backend pilot only** against a real PostgreSQL database.

**Scope:** API + Prisma + audit logs. **Do not** wire the frontend yet. The React app still uses `localStorage` for time entries.

**Prerequisites:**
- Node.js 18+ (22 recommended)
- PostgreSQL 14+ (16 recommended)
- Repo root: `machine-history-qr-main/`

**Default seed accounts** (from `backend/.env.example`):

| Role        | Email                   | Password        |
|-------------|-------------------------|-----------------|
| Admin       | `admin@maskiina.local`  | `ChangeMe123!`  |
| Leader      | `leader@maskiina.local` | `ChangeMe123!`  |
| Technician  | `tech@maskiina.local`   | `ChangeMe123!`  |

**Base URL:** `http://localhost:3000/api/v1`

---

## 0. One-time backend setup

```powershell
cd backend
Copy-Item .env.example .env   # skip if .env already exists
npm install
npm run prisma:generate
```

Ensure `backend/.env` contains at minimum:

```env
DATABASE_URL=postgresql://maskiina:change-me@localhost:5432/maskiina
JWT_SECRET=change-me-long-random-secret
PORT=3000
```

`DATABASE_URL` must match your PostgreSQL user, password, host, port, and database name.

---

## 1. Start PostgreSQL

### Option A — Docker Compose (recommended if Docker is installed)

From repo root, create `.env` from `.env.example` if needed, then:

```powershell
# Repo root .env should include:
# POSTGRES_USER=maskiina
# POSTGRES_PASSWORD=change-me
# POSTGRES_DB=maskiina

docker compose up -d postgres
docker compose ps postgres
```

Wait until health is `healthy`. `backend/.env` should use **localhost** (not `postgres`):

```env
DATABASE_URL=postgresql://maskiina:change-me@localhost:5432/maskiina
```

### Option B — Docker run (Postgres only, no compose file)

```powershell
docker run -d --name maskiina-postgres `
  -e POSTGRES_USER=maskiina `
  -e POSTGRES_PASSWORD=change-me `
  -e POSTGRES_DB=maskiina `
  -p 5432:5432 `
  postgres:16-alpine
```

### Option C — Local PostgreSQL install (Windows)

1. Install PostgreSQL 16.
2. Create database and user:

```sql
CREATE USER maskiina WITH PASSWORD 'change-me';
CREATE DATABASE maskiina OWNER maskiina;
GRANT ALL PRIVILEGES ON DATABASE maskiina TO maskiina;
```

3. Confirm connectivity:

```powershell
# If psql is on PATH:
psql "postgresql://maskiina:change-me@localhost:5432/maskiina" -c "SELECT 1"
```

**Common startup errors:** port `5432` already in use, wrong password, firewall blocking localhost.

---

## 2. Run Prisma migration

```powershell
cd backend
npm run prisma:generate
npm run prisma:migrate:deploy
```

**Expected output:** migration `20250701120000_phase6a_init` applied successfully.

**Verify tables exist:**

```powershell
npx prisma db execute --stdin --schema ../database/prisma/schema.prisma <<< "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('time_entries', 'audit_logs', 'users');"
```

Or open Prisma Studio:

```powershell
npx prisma studio --schema ../database/prisma/schema.prisma
```

**Common errors:**

| Error | Cause | Fix |
|-------|-------|-----|
| `P1001: Can't reach database server` | Postgres not running or wrong host/port | Start Postgres; check `DATABASE_URL` |
| `Environment variable not found: DATABASE_URL` | Missing from `backend/.env` | Add `DATABASE_URL` to `backend/.env` |
| `extension "pgcrypto" does not exist` | Rare on managed PG without extension rights | `CREATE EXTENSION pgcrypto;` as superuser |
| Migration already applied | Re-running on same DB | Safe to ignore if schema is current |

---

## 3. Run seed

```powershell
cd backend
npm run seed:v1
```

**Expected console output:**

```
Seed complete
Company: Maskiina Internal (default-company)
Admin email: admin@maskiina.local
Leader email: leader@maskiina.local
Technician email: tech@maskiina.local
```

Seed is **idempotent** — safe to run again.

---

## 4. Start backend

```powershell
cd backend
npm run dev:v1
```

**Expected output:**

```
Phase 6A backend listening on port 3000
```

**Health check** (separate terminal):

```powershell
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/health
```

**Expected:**

```json
{ "success": true, "message": "Backend foundation alive" }
```

```json
{ "success": true, "message": "Phase 6A API is running" }
```

---

## 5. Test login

### Technician

```powershell
curl -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"tech@maskiina.local","password":"ChangeMe123!"}'
```

### Leader

```powershell
curl -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"leader@maskiina.local","password":"ChangeMe123!"}'
```

### Admin (needed to create a machine)

```powershell
curl -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@maskiina.local","password":"ChangeMe123!"}'
```

**Expected response (200):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "tech@maskiina.local",
    "fullName": "Test Technician",
    "companyId": "uuid",
    "isCompanyAdmin": false
  }
}
```

Save tokens for later steps:

```powershell
$TECH_TOKEN = "<paste technician token>"
$LEADER_TOKEN = "<paste leader token>"
$ADMIN_TOKEN = "<paste admin token>"
```

**Common errors:**

| Status | Message | Cause |
|--------|---------|-------|
| 401 | `Invalid credentials` | Wrong email/password or user not seeded |
| 401 | `Missing or invalid authorization header` | Used on protected route without `Authorization: Bearer` |

---

## 6. Test start timer

**Prerequisite:** a machine UUID. Create one as admin:

```powershell
curl -X POST http://localhost:3000/api/v1/machines `
  -H "Authorization: Bearer $ADMIN_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"name":"Pilot Machine","model":"PM-1","serialNumber":"PILOT-001","status":"active","specifications":{}}'
```

Save `$MACHINE_ID` from `data.id`.

**Optional:** create a task for task-history verification (no public task API yet):

```powershell
cd backend
node -e "
require('./src/config/env');
const { prisma } = require('./src/lib/prisma');
(async () => {
  const machine = await prisma.machine.findFirst({ where: { serialNumber: 'PILOT-001' } });
  const task = await prisma.task.create({
    data: { companyId: machine.companyId, machineId: machine.id, title: 'Pilot task', status: 'in_progress' }
  });
  console.log('TASK_ID=' + task.id);
  await prisma.\$disconnect();
})();
"
```

Save `$TASK_ID` if created.

**Start timer (technician):**

```powershell
curl -X POST http://localhost:3000/api/v1/time-entries/start `
  -H "Authorization: Bearer $TECH_TOKEN" `
  -H "Content-Type: application/json" `
  -d "{`"machineId`":`"$MACHINE_ID`",`"taskId`":`"$TASK_ID`",`"description`":`"Pilot verification`"}"
```

(Omit `taskId` from JSON if you skipped task creation.)

**Expected response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "active",
    "source": "timer",
    "startTime": "2026-07-01T12:00:00.000Z",
    "endTime": null,
    "durationMinutes": null,
    "description": "Pilot verification",
    "user": { "id": "uuid", "fullName": "Test Technician", "email": "tech@maskiina.local" },
    "machine": { "id": "uuid", "name": "Pilot Machine" },
    "task": { "id": "uuid", "title": "Pilot task" },
    "parts": []
  }
}
```

Save `$ENTRY_ID` from `data.id`.

**Verify active timer:**

```powershell
curl http://localhost:3000/api/v1/time-entries/active `
  -H "Authorization: Bearer $TECH_TOKEN"
```

**Expected:** `data.id` matches `$ENTRY_ID`, `data.status` is `"active"`.

**Common errors:**

| Status | Message | Cause |
|--------|---------|-------|
| 403 | `Technician access required` | Logged in as user without technician role |
| 404 | `Machine not found` | Wrong `machineId` or different tenant |
| 409 | `You already have an active time entry` | Stop or submit existing active entry first (`details.activeId`) |

---

## 7. Test stop timer

Stop with an explicit `endTime` so duration is > 0 (important for submit):

```powershell
$END_TIME = (Get-Date).AddHours(1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

curl -X POST "http://localhost:3000/api/v1/time-entries/$ENTRY_ID/stop" `
  -H "Authorization: Bearer $TECH_TOKEN" `
  -H "Content-Type: application/json" `
  -d "{`"endTime`":`"$END_TIME`",`"breakMinutes`":0,`"description`":`"Work completed`"}"
```

**Expected response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "active",
    "startTime": "...",
    "endTime": "...",
    "durationMinutes": 60,
    "breakMinutes": 0,
    "billableMinutes": 60,
    "nonBillableMinutes": 0,
    "description": "Work completed"
  }
}
```

Note: status stays **`active`** after stop until submit (by design).

**Common errors:**

| Status | Message | Cause |
|--------|---------|-------|
| 403 | `Not your time entry` | Wrong user token |
| 409 | `Only active entries can be stopped` | Entry already submitted/approved |
| 400 | `End time must be after start time` | `endTime` before `startTime` |
| 400 | `Validation failed` | Invalid ISO datetime in `endTime` |

---

## 8. Test submit timer

```powershell
curl -X POST "http://localhost:3000/api/v1/time-entries/$ENTRY_ID/submit" `
  -H "Authorization: Bearer $TECH_TOKEN"
```

**Expected response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "submitted",
    "submittedAt": "2026-07-01T13:00:00.000Z",
    "durationMinutes": 60,
    "billableMinutes": 60,
    "nonBillableMinutes": 0
  }
}
```

**Audit check** (Prisma Studio or SQL):

```sql
SELECT action, entity_type, details, created_at
FROM audit_logs
WHERE entity_type = 'time_entry' AND entity_id = '<ENTRY_ID>'
ORDER BY created_at;
```

Expect actions including: `create`, `status_change` (stop), `submit`.

**Common errors:**

| Status | Message | Cause |
|--------|---------|-------|
| 400 | `Stop the timer before submitting` | No `endTime` set |
| 400 | `Duration must be greater than zero to submit` | Stop without meaningful duration (use explicit `endTime`) |
| 409 | `Cannot submit from status approved` | Entry already past submitted |

---

## 9. Test approve / reject

### Approve (leader)

```powershell
curl -X POST "http://localhost:3000/api/v1/time-entries/$ENTRY_ID/approve" `
  -H "Authorization: Bearer $LEADER_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"leaderNotes":"Approved in pilot verification"}'
```

**Expected response (200):**

```json
{
  "success": true,
  "data": {
    "status": "approved",
    "approvedAt": "...",
    "leaderNotes": "Approved in pilot verification"
  }
}
```

### Reject (separate entry — create another for reject flow)

```powershell
# Start → stop → submit a second entry, then:
curl -X POST "http://localhost:3000/api/v1/time-entries/<ENTRY_ID_2>/reject" `
  -H "Authorization: Bearer $LEADER_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"leaderNotes":"Wrong machine selected"}'
```

**Expected response (200):** `data.status` is `"rejected"`.

### Request correction (on a submitted entry)

```powershell
curl -X POST "http://localhost:3000/api/v1/time-entries/<ENTRY_ID_3>/request-correction" `
  -H "Authorization: Bearer $LEADER_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"leaderNotes":"Please add parts used"}'
```

**Expected response (200):** `data.status` is `"correction_requested"`.

### Approval queue

```powershell
curl http://localhost:3000/api/v1/time-entries/queue `
  -H "Authorization: Bearer $LEADER_TOKEN"
```

**Expected:** array of entries with `status: "submitted"`, ordered by `submittedAt`.

**Common errors:**

| Status | Message | Cause |
|--------|---------|-------|
| 403 | `Leader access required` | Technician token on leader route |
| 403 | `You cannot approve your own time entry` | Leader approved their own submission |
| 409 | `Only submitted entries can be approved` | Entry not in `submitted` status |
| 400 | `Validation failed` | Reject/correction without required `leaderNotes` |

---

## 10. Test machine / task time history

### Machine history (leader sees all; technician sees own)

```powershell
curl "http://localhost:3000/api/v1/machines/$MACHINE_ID/time-entries" `
  -H "Authorization: Bearer $LEADER_TOKEN"
```

```powershell
curl "http://localhost:3000/api/v1/machines/$MACHINE_ID/time-entries" `
  -H "Authorization: Bearer $TECH_TOKEN"
```

**Expected response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "approved",
      "machineId": "uuid",
      "user": { "fullName": "Test Technician" },
      "parts": []
    }
  ]
}
```

Leader list includes all users' entries; technician list includes only their own.

### Task history (requires `$TASK_ID` from step 6)

```powershell
curl "http://localhost:3000/api/v1/tasks/$TASK_ID/time-entries" `
  -H "Authorization: Bearer $LEADER_TOKEN"
```

**Include archived** (optional query):

```powershell
curl "http://localhost:3000/api/v1/machines/$MACHINE_ID/time-entries?includeArchived=true" `
  -H "Authorization: Bearer $LEADER_TOKEN"
```

**Common errors:**

| Status | Message | Cause |
|--------|---------|-------|
| 404 | `Machine not found` | Invalid UUID or soft-deleted machine |
| 404 | `Task not found` | Invalid task UUID |

---

## 11. Run integration tests

Ensure Postgres is running, migrations applied, and `backend/.env` has `DATABASE_URL` and `JWT_SECRET`.

```powershell
cd backend
$env:RUN_PHASE6A_DB_TESTS = "true"
npm test -- tests/time_entries_api.test.js tests/phase6a_api.test.js
```

**Expected:** both suites pass (not skipped). `time_entries_api.test.js` covers start → stop → submit → approve, reject, correction, history, admin override, and audit logs.

Run full backend test suite (optional; legacy Mongo tests may fail):

```powershell
cd backend
$env:RUN_PHASE6A_DB_TESTS = "true"
npm test
```

**If tests are skipped**, confirm:

```powershell
$env:RUN_PHASE6A_DB_TESTS   # must be "true"
# DATABASE_URL and JWT_SECRET loaded from backend/.env
```

---

## Expected API response shapes (summary)

| Endpoint | Status | Key fields |
|----------|--------|------------|
| `POST /auth/login` | 200 | `token`, `user` |
| `POST /time-entries/start` | 201 | `data.status = "active"` |
| `GET /time-entries/active` | 200 | `data` object or `null` |
| `POST /.../stop` | 200 | `durationMinutes`, `endTime`; status still `active` |
| `POST /.../submit` | 200 | `status = "submitted"`, `submittedAt` |
| `GET /time-entries/queue` | 200 | `data[]` submitted entries |
| `POST /.../approve` | 200 | `status = "approved"`, `approvedAt` |
| `POST /.../reject` | 200 | `status = "rejected"`, `leaderNotes` |
| `POST /.../request-correction` | 200 | `status = "correction_requested"` |
| `GET /machines/:id/time-entries` | 200 | `data[]` scoped by role |
| `GET /tasks/:id/time-entries` | 200 | `data[]` scoped by role |
| Error responses | 4xx/5xx | `{ "success": false, "message": "..." }` optionally `details` |

Success wrapper is always `{ "success": true, data: ... }` for v1 routes.

---

## Common errors (quick reference)

| Code | Typical `message` | When |
|------|-------------------|------|
| 400 | `Validation failed` | Zod schema mismatch; see `details` |
| 400 | `Stop the timer before submitting` | Submit without `endTime` |
| 400 | `Duration must be greater than zero to submit` | Zero-minute entry |
| 401 | `Missing or invalid authorization header` | No/expired JWT |
| 401 | `Invalid credentials` | Bad login |
| 401 | `Authentication failed` | User deleted/disabled |
| 403 | `Technician access required` | Non-technician on tech route |
| 403 | `Leader access required` | Non-leader on queue/approve |
| 403 | `Not your time entry` | Accessing another user's entry |
| 403 | `You cannot approve your own time entry` | Self-approval blocked |
| 404 | `Time entry not found` | Wrong ID or other tenant |
| 404 | `Machine not found` / `Task not found` | Invalid FK |
| 409 | `You already have an active time entry` | Second concurrent timer |
| 409 | `Only active entries can be stopped` | Wrong status for stop |
| 409 | `Only submitted entries can be approved` | Wrong status for approve/reject/correction |
| 409 | `Cannot edit time entry in status ...` | Technician patch on locked status |
| 500 | `Internal server error` | Unhandled server error; check backend logs |

---

## Verification checklist

- [ ] PostgreSQL running and reachable
- [ ] Migration `20250701120000_phase6a_init` applied
- [ ] Seed created admin, leader, technician
- [ ] Backend `npm run dev:v1` healthy on port 3000
- [ ] Login returns JWT for all three roles
- [ ] Technician: start → active → stop → submit
- [ ] Leader: queue shows entry → approve (or reject / request-correction)
- [ ] Machine history returns entry; task history if task created
- [ ] `audit_logs` rows for create, stop, submit, approve
- [ ] `RUN_PHASE6A_DB_TESTS=true npm test` passes time entry + phase6a suites

---

## What this does **not** verify

- Frontend / localStorage cutover
- Time entry parts or inventory deduction
- Payroll export or invoice attach APIs
- Manual draft entry creation (`POST /time-entries` without timer)
- Batch approve, archive, or delete endpoints

See `docs/TIME_REGISTRATION_MIGRATION_PLAN.md` for frontend integration steps after this checklist passes.
