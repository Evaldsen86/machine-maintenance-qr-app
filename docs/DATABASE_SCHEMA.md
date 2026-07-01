# PostgreSQL / Prisma Schema Design (Phase 5)

## Scope
This document defines the **target production data model** for self-hosted Maskiina.gl.

- Uses PostgreSQL + Prisma
- Supports multi-company / multi-tenant isolation
- Does **not** connect the existing frontend yet
- Does **not** remove MongoDB, Supabase, localStorage, IndexedDB, or mockData yet

Schema file: `database/prisma/schema.prisma`

---

## Design Principles

1. **Tenant-first model**
   - Every business table includes `company_id`.
   - All app queries must be scoped by `company_id` in backend code.

2. **UUID everywhere**
   - Primary keys use UUID (`gen_random_uuid()`).
   - Avoids predictable IDs across tenants.

3. **Auditability**
   - `created_at` and `updated_at` added to mutable records.
   - `audit_logs` table tracks actor, action, entity, and metadata.

4. **Soft delete**
   - `deleted_at` present on records where restore/history may be useful.
   - Business logic later decides whether to hard-delete child records.

5. **Operational indexing**
   - Explicit indexes for tenant scoping and common lookups:
     - `company_id`
     - `machine_id`
     - `status`
     - assigned users (`task_assignees.user_id`)
     - QR lookup (`qr_token`, `public_slug`, payload hash)

---

## Entity Overview

### Tenant / Identity / Authorization

| Table | Purpose |
|---|---|
| `companies` | Tenant root and company-level metadata |
| `users` | Auth identity inside a company |
| `roles` | Role catalog per company |
| `permissions` | Permission catalog per company |
| `user_roles` | User-role (+ optional permission override) mapping |

### Core CMMS Domain

| Table | Purpose |
|---|---|
| `machines` | Asset master records |
| `machine_documents` | Document metadata and storage path references |
| `qr_codes` | QR lifecycle + lookup tokens/slugs |
| `tasks` | Work items linked to machines |
| `task_assignees` | Many-to-many task assignments |
| `maintenance_records` | Maintenance logs |
| `service_records` | Service history events |
| `oil_information` | Oil intervals/specification tracking |
| `inventory_parts` | Parts/stock records |
| `offers` | Offer/quote header |
| `offer_lines` | Offer line items |
| `customers` | Customer master for invoicing |
| `time_entries` | Technician time registration |
| `time_entry_parts` | Parts used on a time entry |
| `payroll_exports` | Payroll export batches |
| `payroll_export_lines` | Time entries included in payroll export |
| `invoices` | Customer invoice headers |
| `invoice_time_lines` | Billable time linked to invoices |
| `audit_logs` | Security and data-change activity trail |

---

## Core Relations

- `companies 1 -> n users`
- `companies 1 -> n machines`
- `machines 1 -> n tasks`
- `tasks n -> n users` via `task_assignees`
- `machines 1 -> n maintenance_records`
- `machines 1 -> n service_records`
- `machines 1 -> n oil_information`
- `machines 1 -> n machine_documents`
- `machines 1 -> n qr_codes`
- `machines 1 -> n offers`
- `offers 1 -> n offer_lines`
- `inventory_parts 1 -> n offer_lines` (optional link)
- `users n -> n roles` via `user_roles`
- `users / companies -> audit_logs` (actor + tenant context)

---

## Table-by-Table Notes

### `companies`
- Unique `slug` for tenant routing / subdomain style mapping.
- Includes `status` (`active`, `suspended`, `archived`).

### `users`
- Unique per tenant on `(company_id, email)`.
- `password_hash` for secure server-side auth (later).
- `is_company_admin` for company-level administration.

### `roles`, `permissions`, `user_roles`
- Full RBAC base model included from the start.
- `user_roles` includes optional `permission_id` to support granular assignment patterns.

### `machines`
- Enforces tenant-local unique serial: `(company_id, serial_number)`.
- Includes status, geo fields, and `specifications`/`metadata` JSON.

### `machine_documents`
- Stores metadata and file path/key, not file bytes.
- Supports `access_level` for backend-enforced access rules.

### `qr_codes`
- Tenant-local unique `qr_token`.
- Optional tenant-local unique `public_slug`.
- Status (`active`, `revoked`, `expired`) and expiration support.

### `tasks` + `task_assignees`
- `tasks` support status/priority and machine link.
- `task_assignees` enables multiple assignees and indexing by `user_id` (required for workload views).

### `maintenance_records`, `service_records`, `oil_information`
- Dedicated history tables for compliance and machine lifecycle tracking.
- Optional `task_id` links allow traceability between planned task and performed work.

### `inventory_parts`
- Supports stock quantities, minimum threshold, and status.
- Indexed by tenant and status for stock dashboards.

### `offers` + `offer_lines`
- Header + lines pattern for quoting.
- Tenant-local unique `offer_number`.
- Optional links to machine and inventory parts.

### `audit_logs`
- Append-only style history for create/update/delete/auth events.
- Includes actor, action, entity type/id, and metadata JSON.

---

## Multi-Tenant Enforcement Strategy (for backend phase later)

When backend APIs are implemented, each request must resolve `company_id` from authenticated user/session and apply it to every query:

- Read: `WHERE company_id = :tenant`
- Write: auto-set `company_id = :tenant`
- Update/Delete: require both `id` and `company_id`

This prevents cross-tenant data access even if IDs are guessed.

---

## Soft Delete Strategy

Soft delete (`deleted_at`) exists on major business entities:
- users
- roles
- permissions
- machines
- machine_documents
- qr_codes
- tasks
- maintenance_records
- service_records
- oil_information
- inventory_parts
- offers
- offer_lines

Default backend queries should later filter `deleted_at IS NULL` unless explicitly requesting archived data.

---

## Indexing Highlights

Implemented in Prisma via `@@index` and `@@unique`:

- Tenant-scope indexes: every major table includes `@@index([companyId, ...])`
- Machine flow: indexes on `(company_id, machine_id)`
- Task status + assignment:
  - `tasks(company_id, status)`
  - `task_assignees(company_id, user_id)`
- QR lookup:
  - unique `(company_id, qr_token)`
  - unique `(company_id, public_slug)`
  - index `(company_id, payload_hash)`

---

## Compatibility Note

Current frontend uses mixed field naming (`serialNumber` vs `serial_number`) and multiple data sources. This schema intentionally standardizes DB columns in snake_case (mapped in Prisma models). API mapping to frontend shape will be handled in later backend phases, not in this phase.

