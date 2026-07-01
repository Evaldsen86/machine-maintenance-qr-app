# Product & Technical Roadmap — Maskiina.gl

**Last updated:** July 2026  
**Status:** Planning document — no implementation commitment order beyond documented phases.

This roadmap tracks planned capabilities for self-hosted Maskiina.gl. Items are grouped by theme. See linked design docs for detail where noted.

**Related documents**

| Document | Purpose |
|----------|---------|
| `docs/ARCHITECTURE_DECISION.md` | Target production stack (PostgreSQL, Express, multi-tenant) |
| `docs/DATABASE_SCHEMA.md` | Current and planned PostgreSQL schema |
| `docs/AUDIT_REPORT.md` | Current prototype gaps |
| `docs/REMINDERS_DESIGN.md` | Automatic maintenance & lubrication reminders (design) |
| `docs/TIME_REGISTRATION_PRODUCTION_DESIGN.md` | Production time registration design |
| `docs/TIME_REGISTRATION_MIGRATION_PLAN.md` | localStorage → PostgreSQL cutover plan |

---

## Completed / In progress (baseline)

| Area | Status | Notes |
|------|--------|-------|
| React CMMS UI | ✅ Prototype | Machines, tasks, service, lubrication, inventory, time tracking, offers |
| Self-hosting skeleton | 🟡 Partial | Docker Compose, docs; production Dockerfiles pending |
| Express + PostgreSQL API (Phase 6a) | 🟡 Partial | Auth, users, companies; domain APIs incomplete |
| Frontend → API migration | 🔴 Not started | Business data still primarily in `localStorage` / IndexedDB |

---

## Phase A — Data & auth foundation

- [ ] Single source of truth: PostgreSQL via Express API
- [ ] Migrate machines, tasks, service/lubrication history from browser storage
- [ ] Server-side RBAC enforced on all routes
- [ ] Tenant isolation (`company_id`) on every query

---

## Phase B — Operations & inventory

- [ ] Inventory API backed by PostgreSQL (replace IndexedDB / localStorage)
- [ ] Time entries API and approval workflow
- [ ] See `docs/TIME_REGISTRATION_PRODUCTION_DESIGN.md` and `docs/TIME_REGISTRATION_MIGRATION_PLAN.md`
- [ ] See `docs/TIME_REGISTRATION_STATUS.md` for current prototype limits
- [ ] Offers / invoices persistence on server
- [ ] File uploads (documents, images) to MinIO or local storage

---

## Phase C — Automatic maintenance & lubrication reminders

**Design:** `docs/REMINDERS_DESIGN.md`  
**Status:** 📋 Planned — **do not implement until Phase A machine/maintenance data lives in PostgreSQL**

### Current status

The Settings UI exposes notification configuration (service reminders, lubrication reminders, equipment-specific intervals, email recipients, days-before-deadline). These values exist only in React component state. Saving shows a toast but does **not** persist settings or send email. No backend scheduler exists.

### Target capabilities

1. Store notification settings in PostgreSQL per company.
2. Store equipment-specific lubrication intervals in PostgreSQL.
3. Add backend reminder engine that runs daily.
4. Compare machine maintenance schedules and lubrication `nextDue` dates against today.
5. Create in-app notifications for upcoming and overdue service/lubrication.
6. Create or update tasks automatically when reminders are due.
7. Add email sending later through backend using SMTP or another mail provider.
8. Log all sent reminders to avoid duplicate emails.
9. Support recipients per company and per reminder type.
10. Do **not** rely on frontend/browser for sending reminders.

### Implementation order (when started)

| Step | Deliverable | Depends on |
|------|-------------|------------|
| C1 | Prisma models + migrations for notification settings, equipment intervals, reminder log | Phase A |
| C2 | CRUD API for company notification settings (admin only) | C1 |
| C3 | Daily reminder job (cron / worker) — in-app notifications + task creation | C1, maintenance schedules in DB |
| C4 | Wire Settings UI to API (read/write persisted settings) | C2 |
| C5 | Email provider integration + `reminder_deliveries` deduplication | C3 |
| C6 | Admin UI for reminder delivery history | C5 |

### Explicitly out of scope for first reminder release

- SMS and push notifications (types exist in UI only)
- Browser-based or client-side scheduled jobs
- Sending email before in-app notification path is validated

---

## Phase D — Reporting & compliance

- [ ] Export service / lubrication compliance reports per machine and fleet
- [ ] Payroll and time-entry export
- [ ] Audit log viewer for admins

---

## Phase E — Hardening & scale

- [ ] Automated PostgreSQL backups (see `docs/BACKUP_AND_RESTORE.md`)
- [ ] Security review checklist (`docs/SECURITY_CHECKLIST.md`)
- [ ] Rate limiting and API monitoring
- [ ] Optional read replicas / horizontal backend scaling

---

## How to propose changes

1. Add or update a row in the relevant phase above.
2. For non-trivial features, add or extend a design doc under `docs/`.
3. Link the design doc from this file.
4. Do not implement roadmap items marked **Planned** without explicit approval and prerequisite phases complete.
