# Production Design — Time Registration (Maskiina.gl)

**Date:** July 2026  
**Status:** Approved for planning — **not implemented**  
**Related:** `docs/TIME_REGISTRATION_STATUS.md` (prototype), `docs/TIME_REGISTRATION_MIGRATION_PLAN.md`, `database/prisma/schema.prisma`

---

## 1. Goals

Time registration must be:

| Stakeholder | Need |
|-------------|------|
| **Technician** | One-tap start/stop on task, machine, or work context; minimal friction |
| **Leader** | Clear approval queue; approve, reject, or request correction with notes |
| **Payroll / economy** | Export only **approved** internal hours; auditable batches |
| **Invoicing** | Attach only **approved billable** hours to customer invoices |
| **History** | Approved work visible on task and machine archive |
| **Compliance** | Every status change logged in `audit_logs`; no `localStorage` in production |

---

## 2. Business workflow

```
┌─────────────┐    start     ┌────────┐    stop+submit    ┌───────────┐
│    draft    │ ──────────► │ active │ ────────────────► │ submitted │
└─────────────┘              └────────┘                   └─────┬─────┘
      │                            │                            │
      │ manual submit              │ cancel (→ draft)             │
      └────────────────────────────┴────────────────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
        ┌──────────┐          ┌──────────┐         ┌─────────────────────┐
        │ approved │          │ rejected │         │ correction_requested │
        └────┬─────┘          └──────────┘         └──────────┬──────────┘
             │                                                 │
             │ technician resubmits                            │
             ├─────────────────────────────────────────────────┘
             │
     ┌───────┴────────┐
     ▼                ▼
exported_to_payroll  invoiced (billable only)
     │                │
     └───────┬────────┘
             ▼
        ┌──────────┐
        │ archived │  (terminal visibility state; row retained)
        └──────────┘
```

### Step-by-step

1. Technician **starts** timer on a **task** (primary), **machine**, or linked **customer/offer** context.
2. System creates `time_entries` row with `status = active`, `company_id`, `user_id`, and optional FKs.
3. Technician **stops** timer; enters description, break time, billable split, parts used.
4. Technician **submits** → `status = submitted` (locks edit except correction flow).
5. Leader reviews **approval queue** (`submitted` + `correction_requested` resubmissions).
6. Leader **approves**, **rejects**, or **requests correction** (`leader_notes` required for correction).
7. On **approve**: snapshot rates and minutes; entry eligible for payroll and (if billable) invoicing.
8. **Payroll role** batches **approved** entries → `payroll_exports` → entries move to `exported_to_payroll`.
9. **Economy role** selects **approved billable** entries → `invoice_time_lines` → `invoiced`.
10. **Archive** moves entry to `archived` (hidden from queues; visible on task/machine history).

---

## 3. Status model

### 3.1 Enum: `TimeEntryStatus`

| Status | Meaning | Who acts next |
|--------|---------|---------------|
| `draft` | Manual entry not started or saved incomplete | Technician |
| `active` | Timer running | Technician (stop) |
| `submitted` | Awaiting leader review | Leader |
| `correction_requested` | Sent back with leader notes | Technician |
| `approved` | Accepted; eligible for payroll/invoice | Payroll / economy |
| `rejected` | Not accepted; retained for audit | — (may archive) |
| `exported_to_payroll` | Included in a payroll export batch | — (may invoice if billable) |
| `invoiced` | Linked to customer invoice | — |
| `archived` | Closed for operational UI; history only | — |

### 3.2 Prototype mapping (migration)

| Prototype (`localStorage`) | Production |
|----------------------------|------------|
| `active` | `active` |
| `completed` | `submitted` |
| `approved` | `approved` |
| `rejected` | `rejected` |
| `archived: true` | `archived` |

### 3.3 Transition rules (server-enforced)

| From | To | Actor | Audit action |
|------|-----|-------|--------------|
| `draft` | `active` | Technician | `status_change` |
| `draft` | `submitted` | Technician | `submit` |
| `active` | `submitted` | Technician | `submit` |
| `active` | `draft` | Technician | `status_change` (cancel timer) |
| `submitted` | `approved` | Leader | `approve` |
| `submitted` | `rejected` | Leader | `reject` |
| `submitted` | `correction_requested` | Leader | `status_change` |
| `correction_requested` | `submitted` | Technician | `submit` |
| `approved` | `exported_to_payroll` | Payroll | `export` |
| `approved` / `exported_to_payroll` | `invoiced` | Economy | `status_change` |
| `*` (approved/rejected/invoiced/exported) | `archived` | Leader/Admin | `archive` |
| Any | Any | Admin override | `update` + `details.override=true` |

**Locks:** `submitted` entries cannot be edited by technicians (leader actions only). `approved`, `exported_to_payroll`, and `invoiced` entries cannot be edited by technicians or leaders without admin override. `rejected` cannot be re-submitted without correction flow or admin override.

---

## 4. Database design

Prisma proposal: `database/prisma/schema.prisma` (models appended July 2026).

### 4.1 Core table: `time_entries`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `company_id` | UUID FK | Tenant scope |
| `user_id` | UUID FK | Technician |
| `machine_id` | UUID FK nullable | Required when work is machine-bound |
| `task_id` | UUID FK nullable | Primary work-order link |
| `customer_id` | UUID FK nullable | Denormalized convenience; also on task/offer |
| `offer_id` | UUID FK nullable | When time is tied to accepted offer |
| `start_time` | timestamptz | |
| `end_time` | timestamptz nullable | Null while `active` |
| `duration_minutes` | int nullable | Computed on stop: `end - start - break` |
| `break_minutes` | int default 0 | |
| `billable_minutes` | int default 0 | ≤ duration_minutes |
| `non_billable_minutes` | int default 0 | duration - billable |
| `hourly_rate_internal` | decimal | Snapshot at approve for payroll |
| `hourly_rate_customer` | decimal nullable | Snapshot at approve for invoicing |
| `description` | text | Work performed (customer-visible when invoiced) |
| `technician_notes` | text nullable | Internal |
| `leader_notes` | text nullable | Rejection / correction |
| `status` | enum | See §3 |
| `approved_by_user_id` | UUID nullable | |
| `approved_at` | timestamptz nullable | |
| `rejected_by_user_id` | UUID nullable | |
| `rejected_at` | timestamptz nullable | |
| `submitted_at` | timestamptz nullable | |
| `payroll_export_id` | UUID FK nullable | Set when exported |
| `invoice_id` | UUID FK nullable | Set when invoiced (header link) |
| `equipment_type` | text nullable | crane / winch / truck (legacy compat) |
| `source` | enum | `timer` \| `manual` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `deleted_at` | timestamptz nullable | Soft delete |

**Indexes:** `(company_id, status)`, `(company_id, user_id, status)`, `(company_id, task_id)`, `(company_id, machine_id)`, `(company_id, submitted_at)`, `(company_id, payroll_export_id)`, `(company_id, invoice_id)`.

**Constraints:**

- One `active` entry per `(company_id, user_id)` — enforced in API (optional DB partial unique index).
- `machine_id` required if `task.machine_id` is set (validated in service layer).
- `billable_minutes + non_billable_minutes = duration_minutes` at submit/approve.

### 4.2 `time_entry_parts`

Spare parts used during the entry (replaces prototype `partsUsed` JSON).

| Column | Type |
|--------|------|
| `id`, `company_id`, `time_entry_id` | UUID |
| `inventory_part_id` | UUID nullable |
| `name`, `part_number` | text |
| `quantity` | decimal |
| `unit_price`, `line_total` | decimal |

Inventory deduction runs **server-side** on `submit` (or on `approve` — recommend **submit** with rollback on reject/delete; document in migration plan).

### 4.3 `customers` (new minimal entity)

Offers today store `customer_name` as text. Production invoicing needs `customer_id`.

| Column | Type |
|--------|------|
| `id`, `company_id` | UUID |
| `name`, `email`, `phone` | text |
| `external_ref` | text nullable (ERP customer number) |

### 4.4 `payroll_exports`

| Column | Type |
|--------|------|
| `id`, `company_id` | UUID |
| `period_start`, `period_end` | date |
| `status` | `draft` \| `finalized` \| `sent` |
| `exported_by_user_id` | UUID |
| `exported_at` | timestamptz |
| `total_minutes`, `total_amount` | aggregated |
| `file_path` | text nullable (CSV/XML export) |
| `metadata` | jsonb |

### 4.5 `payroll_export_lines`

| Column | Type |
|--------|------|
| `id`, `company_id` | UUID |
| `payroll_export_id`, `time_entry_id` | UUID |
| `user_id` | UUID (denormalized) |
| `minutes`, `hourly_rate`, `line_amount` | snapshot |

Unique: `(payroll_export_id, time_entry_id)`.

### 4.6 `invoices` + `invoice_time_lines`

**`invoices`** (header — may exist partially in frontend today):

| Column | Type |
|--------|------|
| `id`, `company_id`, `customer_id` | UUID |
| `invoice_number` | text unique per company |
| `status` | draft / sent / paid / void |
| `issue_date`, `due_date` | date |
| `subtotal`, `tax`, `total` | decimal |

**`invoice_time_lines`:**

| Column | Type |
|--------|------|
| `id`, `company_id`, `invoice_id`, `time_entry_id` | UUID |
| `line_number` | int |
| `description` | text |
| `hours` | decimal (from `billable_minutes`) |
| `hourly_rate` | decimal (`hourly_rate_customer` snapshot) |
| `line_total` | decimal |

Only `approved` or `exported_to_payroll` entries with `billable_minutes > 0` may be attached. On attach → entry `status = invoiced`.

Part lines from `time_entry_parts` may become separate `invoice_part_lines` (future); v1 can duplicate part lines on invoice from time entry parts at invoice creation.

### 4.7 Task / machine history integration

- **Task detail:** `GET /api/v1/tasks/:id/time-entries?includeArchived=true`
- **Machine detail:** `GET /api/v1/machines/:id/time-entries?includeArchived=true`
- Approved+ entries appear in history tabs without separate archive table duplication.
- `archived` status filters default lists; history views include archived.

Optional: `task.actual_hours` recalculated from sum of approved `duration_minutes` on task close.

---

## 5. Audit logging

Extend `AuditAction` enum (or use `status_change` with typed `details`):

| Event | `entity_type` | `action` | `details` (JSON) |
|-------|---------------|----------|------------------|
| Timer started | `time_entry` | `create` | `{ status: "active", task_id, machine_id }` |
| Submitted | `time_entry` | `submit` | `{ from, to, duration_minutes }` |
| Approved | `time_entry` | `approve` | `{ from, to, approved_by }` |
| Rejected | `time_entry` | `reject` | `{ from, to, leader_notes }` |
| Correction requested | `time_entry` | `status_change` | `{ from, to, leader_notes }` |
| Resubmitted | `time_entry` | `submit` | `{ from: "correction_requested" }` |
| Payroll export created | `payroll_export` | `export` | `{ time_entry_ids[], period, exported_by }` |
| Each entry in payroll export | `time_entry` | `export` | `{ payroll_export_id, from: "approved", to: "exported_to_payroll" }` |
| Invoice created / time attached | `invoice` | `update` | `{ time_entry_ids[], customer_id }` |
| Each entry invoiced | `time_entry` | `status_change` | `{ invoice_id, from, to: "invoiced" }` |
| Archived | `time_entry` | `archive` | `{ from, to }` |
| Admin override | `time_entry` | `update` | `{ override: true, fields[], reason }` |

Every write path calls `auditLogService.record({ companyId, actorUserId, ... })` in the same DB transaction.

---

## 6. API design (v1)

Base: `/api/v1` — all routes require JWT + `company_id` scope.

### 6.1 Technician — timer lifecycle

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/time-entries/start` | Body: `{ taskId?, machineId?, customerId?, offerId? }` → creates `active` entry |
| `POST` | `/time-entries/:id/stop` | Body: `{ endTime?, breakMinutes?, description, technicianNotes?, parts?[] }` → sets times; stays `active` or moves to `draft` until submit |
| `POST` | `/time-entries/:id/submit` | `active`/`draft`/`correction_requested` → `submitted` |
| `GET` | `/time-entries/active` | Current user's active entry (if any) |
| `PATCH` | `/time-entries/:id` | Edit own entry only in `draft`, `active`, `correction_requested` |
| `DELETE` | `/time-entries/:id` | Soft-delete own `draft`/`active` only; restore inventory |

### 6.2 Leader — approval queue

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/time-entries/queue` | `status IN (submitted)`; filters: user, machine, task, date range |
| `POST` | `/time-entries/:id/approve` | Body: `{ leaderNotes? }` → snapshots rates |
| `POST` | `/time-entries/:id/reject` | Body: `{ leaderNotes }` required |
| `POST` | `/time-entries/:id/request-correction` | Body: `{ leaderNotes }` required |
| `POST` | `/time-entries/batch-approve` | Body: `{ ids: uuid[] }` |
| `POST` | `/time-entries/:id/archive` | → `archived` |

### 6.3 Payroll export

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/time-entries/payroll-candidates` | `status=approved`, date range, user filter |
| `POST` | `/payroll-exports` | Body: `{ periodStart, periodEnd, timeEntryIds[] }` → creates export + lines; entries → `exported_to_payroll` |
| `GET` | `/payroll-exports` | List exports |
| `GET` | `/payroll-exports/:id` | Detail + lines |
| `GET` | `/payroll-exports/:id/download` | CSV file |

### 6.4 Invoicing

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/time-entries/invoice-candidates` | `status IN (approved, exported_to_payroll)`, `billable_minutes > 0`, not invoiced |
| `POST` | `/invoices` | Body: `{ customerId, timeEntryIds[], ... }` → creates invoice + `invoice_time_lines` |
| `POST` | `/invoices/:id/time-lines` | Attach more approved billable entries |

### 6.5 Read / history

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/time-entries` | Paginated list (role-scoped) |
| `GET` | `/time-entries/:id` | Detail + parts |
| `GET` | `/tasks/:id/time-entries` | Task history |
| `GET` | `/machines/:id/time-entries` | Machine history |

### 6.6 Admin override

| Method | Path | Description |
|--------|------|-------------|
| `PATCH` | `/time-entries/:id/admin` | Body: `{ reason, ...fields }` — requires `time:admin_override` |

---

## 7. Role permissions

Map to `permissions.code` (company-scoped):

| Permission | Roles | Capability |
|--------------|-------|------------|
| `time:create` | technician, mechanic, … | Start/stop/submit own |
| `time:read_own` | technician | View own entries |
| `time:read_team` | leader, admin | View all company entries |
| `time:approve` | leader, admin | Approve/reject/correction/archive queue |
| `time:export_payroll` | payroll, economy, admin | Create payroll exports |
| `time:invoice` | economy, admin | Attach billable time to invoices |
| `time:archive` | leader, admin | Archive entries |
| `time:admin_override` | admin | Edit locked entries with audit reason |

**Technician rules:**

- Create/edit/delete own entries in `draft`, `active`, `correction_requested` only.
- Cannot approve own time.

**Leader rules:**

- Full queue access; batch approve.
- Cannot export payroll (separation of duties) unless also granted `time:export_payroll`.

**Admin rules:**

- All leader actions + override with mandatory audit `reason`.

---

## 8. Frontend workflow design (target UI)

Prototype routes remain (`/tidsregistrering`, machine detail) but **read/write via API**. No routing changes in migration phase 1.

### 8.1 Technician — simple start/stop

**Surfaces:**

- Floating **“Min aktive tid”** bar (global when `active` entry exists)
- **Task detail** / `TaskWorkflow` — primary entry point (“Start arbejde”)
- **Machine detail** — secondary (“Start tid på maskine”)
- Mobile-first: large start/stop, haptic-friendly

**Flow:**

1. Tap **Start** → API `POST /time-entries/start` (pre-filled `taskId`/`machineId`).
2. Optional: add parts, description while running (auto-save `PATCH` every 30s).
3. Tap **Stop** → modal: break minutes, billable toggle/split, description.
4. Tap **Indsend til godkendelse** → `submit`.

**Do not show:** approval controls, payroll, invoice actions.

### 8.2 Leader — approval queue

**Route:** `/tidsregistrering` → tab **Godkendelse** (rename from “Oversigt” emphasis).

| UI element | Behavior |
|------------|----------|
| Queue table | `submitted` entries, sorted oldest first |
| Row actions | Approve / Reject / Request correction |
| Batch select | Multi-approve |
| Filters | Employee, machine, task, week |
| Detail drawer | Full entry, parts, technician notes |
| Correction | Opens leader notes field; notifies technician (in-app later) |

### 8.3 Payroll export view

**Route:** `/tidsregistrering` → tab **Lønexport** (or `/payroll` when economy module grows).

| UI element | Behavior |
|------------|----------|
| Period picker | Month / custom range |
| Candidate list | Approved, not yet exported |
| Preview totals | Per employee hours + amount |
| Export button | Creates `payroll_export`; download CSV |
| History | Past exports read-only |

### 8.4 Invoice time selection

**Route:** Existing invoices flow + **“Tilføj godkendt tid”** step.

| UI element | Behavior |
|------------|----------|
| Customer select | Required |
| Billable entries | Checkbox list filtered by customer/machine/task |
| Rate display | `hourly_rate_customer` snapshot |
| Confirm | Creates `invoice_time_lines`; marks entries `invoiced` |

### 8.5 Task / machine time archive

| Surface | Content |
|---------|---------|
| Task detail tab **Tid** | All entries for `task_id`; badge by status |
| Machine detail **Tidsregistrering** | Entries for `machine_id`; link to task |
| Archive filter | Toggle “Vis arkiverede” |

---

## 9. Rate and minutes calculation (server)

On **approve**:

```text
duration_minutes = floor((end_time - start_time) / 60s) - break_minutes
non_billable_minutes = duration_minutes - billable_minutes
hourly_rate_internal = user.internal_rate ?? company.default_internal_rate
hourly_rate_customer = task.customer_rate ?? offer.rate ?? machine.default_rate
```

Store snapshots on row — never recalculate retroactively after approve.

---

## 10. Non-functional requirements

| Topic | Requirement |
|-------|-------------|
| Concurrency | Optimistic locking via `updated_at` check on PATCH |
| Idempotency | `Idempotency-Key` header on start/submit/export |
| Timezone | Store UTC; display in `company.timezone` |
| Performance | Approval queue paginated; index on `(company_id, status, submitted_at)` |
| Security | All queries `WHERE company_id = :tenant` |

---

## 11. Out of scope (v1 production)

- External payroll system API (CSV export only in v1)
- Overtime / shift rules engine
- GPS geofence on clock-in
- Offline PWA sync (design for later; server is source of truth)

---

## 12. Related documents

| Document | Purpose |
|----------|---------|
| `docs/TIME_REGISTRATION_MIGRATION_PLAN.md` | Phased cutover from localStorage |
| `docs/TIME_REGISTRATION_STATUS.md` | Current prototype behavior |
| `docs/ROADMAP.md` Phase B | Program ordering |
| `database/prisma/schema.prisma` | Prisma models (proposal) |

---

## 13. Non-negotiable business rules

These rules are **server-enforced**. The API must reject any request that violates them, regardless of UI state.

| Rule | Enforcement |
|------|-------------|
| Payroll export | `time_entry.status` must be `approved` at export time. `submitted`, `rejected`, `draft`, `active`, and `correction_requested` are **never** exportable. |
| Invoice attach | `status IN (approved, exported_to_payroll)` **and** `billable_minutes > 0` **and** `invoice_id IS NULL`. Non-billable time is never invoiced. |
| Audit trail | Every `approve`, `reject`, `request-correction`, `submit` (resubmit), `export` (payroll), invoice attach, and `archive` action writes one `audit_logs` row in the **same transaction** as the state change. |
| Technician edit lock | Technicians may `PATCH` only their own entries in `draft`, `active`, or `correction_requested`. **Forbidden** for technicians: `submitted`, `approved`, `rejected`, `exported_to_payroll`, `invoiced`, `archived`. |
| Leader actions | Users with `time:approve` may approve, reject, request correction, and archive. Leaders **without** `time:export_payroll` cannot create payroll exports. |
| Payroll / economy export | Users with `time:export_payroll` may export **only** entries where `status = approved` and `payroll_export_id IS NULL`. |
| Admin override | Only `time:admin_override` may edit locked entries; `details.reason` is required in audit log. |
| Self-approval | No user may approve their own time entry. |
| Double export | A time entry may appear in at most one payroll export (`payroll_export_lines` unique on `time_entry_id`). |
| Double invoice | A time entry may appear on at most one invoice (`invoice_time_lines` unique on `time_entry_id`). |

---

## 14. Detailed flows

### 14.1 Payroll export flow

```
Leader approves entries (status → approved)
        │
        ▼
Economy opens "Lønexport" view
        │
        ▼
GET /time-entries/payroll-candidates
  WHERE status = 'approved'
    AND payroll_export_id IS NULL
    AND deleted_at IS NULL
  [optional: period, user_id filters]
        │
        ▼
User selects entries + period → preview totals
        │
        ▼
POST /payroll-exports { periodStart, periodEnd, timeEntryIds[] }
  BEGIN TRANSACTION
    1. Validate ALL ids: status = approved, not already exported
    2. INSERT payroll_exports (totals computed)
    3. INSERT payroll_export_lines (snapshot minutes, hourly_rate_internal, line_amount)
    4. UPDATE time_entries SET status = exported_to_payroll, payroll_export_id = :id
    5. INSERT audit_logs (action = export, entity = payroll_export)
  COMMIT
        │
        ▼
GET /payroll-exports/:id/download → CSV for external payroll system
```

**CSV columns (v1):** employee name, employee id, period, date, duration_minutes, hourly_rate_internal, line_amount, task title, machine name, time_entry_id.

**After export:** entry is locked for technician edit. May still be invoiced if `billable_minutes > 0`.

### 14.2 Invoice time line flow

```
Leader approves entries (status → approved)
        │
        ▼
[Optional] Payroll export (status → exported_to_payroll) — not required before invoicing
        │
        ▼
Economy opens invoice flow → "Tilføj godkendt tid"
        │
        ▼
GET /time-entries/invoice-candidates
  WHERE status IN ('approved', 'exported_to_payroll')
    AND billable_minutes > 0
    AND invoice_id IS NULL
    AND deleted_at IS NULL
  [optional: customer_id, machine_id, task_id filters]
        │
        ▼
User selects customer + billable entries → preview
        │
        ▼
POST /invoices { customerId, timeEntryIds[], issueDate, dueDate, ... }
  BEGIN TRANSACTION
    1. Validate ALL ids: approved|exported_to_payroll, billable_minutes > 0, not invoiced
    2. INSERT invoices (header)
    3. INSERT invoice_time_lines per entry (hours = billable_minutes/60, rate = hourly_rate_customer)
    4. [Optional v1] Copy time_entry_parts to invoice part lines
    5. UPDATE time_entries SET status = invoiced, invoice_id = :invoiceId
    6. INSERT audit_logs (action = update, entity = invoice, details.time_entry_ids)
  COMMIT
```

**Billing rule:** `line_total = (billable_minutes / 60) × hourly_rate_customer` using values snapshotted at **approve**.

**Attach more time later:** `POST /invoices/:id/time-lines` with same validations.

### 14.3 Task / machine archive flow

Archive is a **visibility and queue state**, not data deletion.

```
Entry reaches terminal workflow state:
  approved | rejected | exported_to_payroll | invoiced
        │
        ▼
Leader/Admin: POST /time-entries/:id/archive
  BEGIN TRANSACTION
    1. Validate status is archivable (not draft/active/submitted/correction_requested)
    2. UPDATE time_entries SET status = archived
    3. INSERT audit_logs (action = archive)
  COMMIT
        │
        ▼
Entry removed from:
  - Approval queue
  - Payroll candidate list (already exported or not applicable)
  - Invoice candidate list (already invoiced or not applicable)
        │
        ▼
Entry visible in:
  - GET /tasks/:id/time-entries?includeArchived=true
  - GET /machines/:id/time-entries?includeArchived=true
  - GET /time-entries?status=archived (leader/admin)
```

**History tab defaults:** show `approved`, `rejected`, `exported_to_payroll`, `invoiced`, and `archived`; hide `draft`, `active`, `submitted`, `correction_requested` unless “show in progress” toggle is on (leader only).

**Task rollup:** `task.actual_hours` may be updated as `SUM(duration_minutes) / 60` for entries where `status IN (approved, exported_to_payroll, invoiced, archived)` and `task_id` matches.

**Machine service history:** approved time entries appear alongside service/lubrication records as a unified timeline (UI composition; no duplicate storage).

---

## 15. Edit permission matrix

| Status | Technician (own) | Technician (other) | Leader | Payroll/Economy | Admin |
|--------|------------------|--------------------|--------|-----------------|-------|
| `draft` | Edit, delete | — | Read | — | Override |
| `active` | Edit, stop, delete | — | Read | — | Override |
| `submitted` | Read only | — | Approve/reject/correct | Read | Override |
| `correction_requested` | Edit, resubmit | — | Read | — | Override |
| `approved` | Read only | — | Archive | Export payroll / invoice candidates | Override |
| `rejected` | Read only | — | Archive | — | Override |
| `exported_to_payroll` | Read only | — | Archive | Read export | Override |
| `invoiced` | Read only | — | Archive | Read invoice | Override |
| `archived` | Read only | — | Read | Read | Override |

---

## 16. Internal pilot — minimal scope

**Goal:** Technicians and leaders can run real work on staging with PostgreSQL as source of truth.

### In scope (pilot v1)

| # | Deliverable |
|---|-------------|
| 1 | Prisma migration applied (all time-registration tables) |
| 2 | API: start, stop, submit, active, patch, delete (technician) |
| 3 | API: queue, approve, reject, request-correction, batch-approve (leader) |
| 4 | Audit logging on all above actions |
| 5 | `useTimeEntriesApi` hook + feature flag |
| 6 | Rewire `TaskWorkflow` + `TimeTracking` timer to API |
| 7 | Rewire `TimeEntryManager` approval queue to API |
| 8 | Server-side inventory deduction on submit |
| 9 | Task + machine time history read (API + basic UI tab) |

### Out of scope (post-pilot)

| # | Deferred |
|---|----------|
| 1 | Payroll export API + Lønexport tab |
| 2 | Invoice time line API + invoice UI integration |
| 3 | Archive API + archive tab migration |
| 4 | Admin override UI |
| 5 | localStorage import tool |
| 6 | In-app notifications on correction_requested |
| 7 | Overtime / break policy engine |

### Pilot exit criteria

- [ ] Two technicians register time on tasks across two machines for one week
- [ ] One leader approves/rejects/requests correction from queue
- [ ] No localStorage writes when feature flag is on
- [ ] Audit log shows full trail for sampled entries
- [ ] Tenant isolation verified (company A cannot see company B)

---

## 17. Design completion checklist

| Item | Document section |
|------|------------------|
| Prisma schema proposal | §4, `database/prisma/schema.prisma` |
| Status enum + transitions | §3 |
| Payroll export flow | §14.1 |
| Invoice time line flow | §14.2 |
| Task/machine archive flow | §14.3 |
| API endpoints | §6 |
| Frontend screens | §8 |
| Role permissions | §7, §15 |
| Audit requirements | §5, §13 |
| Migration plan | `docs/TIME_REGISTRATION_MIGRATION_PLAN.md` |
| Prototype coexistence | `docs/TIME_REGISTRATION_STATUS.md` |

**Status:** Design documentation complete. Implementation not started.
