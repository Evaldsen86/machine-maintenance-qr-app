# Design — Automatic Maintenance & Lubrication Reminders

**Date:** July 2026  
**Status:** Planned — **not implemented**  
**Roadmap:** Phase C in `docs/ROADMAP.md`

This document describes the target architecture for server-side service and lubrication reminders. **No frontend or backend reminder logic should be built until this design is approved and prerequisite data migration (PostgreSQL machines + maintenance schedules) is complete.**

---

## 1. Problem statement

Workshop staff need timely notice when service or lubrication is due or overdue, per machine and per equipment type (crane, winch, truck, etc.). The product already exposes reminder settings in **Settings → Notifikationer**, but:

| Gap | Detail |
|-----|--------|
| No persistence | `notificationSettings` in `src/pages/Settings.tsx` is React state only; `save*` handlers show a toast and close the dialog |
| No scheduler | No cron job, worker, or backend process checks due dates |
| No email | No SMTP, SendGrid, Resend, or similar integration |
| Disconnected intervals | `equipmentSpecificIntervals` in Settings are not applied to machine `maintenanceSchedules` |
| Browser-only due dates | `nextDue` on schedules is updated in the UI when lubrication is registered (`MachineDetail.tsx`) but is not yet authoritative in PostgreSQL |

Reminders must run **on the server**, once per company, with idempotent delivery logging.

---

## 2. Goals

1. **Persist** company-level notification preferences and equipment-specific lubrication intervals in PostgreSQL.
2. **Evaluate** daily (configurable) which machines have upcoming or overdue service/lubrication based on `maintenance_schedules.next_due` (and related records).
3. **Notify in-app** users via a `notifications` table (or equivalent).
4. **Create or update tasks** when a reminder becomes due, linked to the machine and reminder type.
5. **Send email** in a later sub-phase via backend mail provider; never from the browser.
6. **Deduplicate** outbound reminders using a delivery log so the same due event does not email twice.
7. **Support recipients** per company and per reminder type (service vs lubrication).

---

## 3. Non-goals (initial release)

- SMS and mobile push (UI toggles exist in `NotificationSettings` but are deferred).
- Per-user reminder preferences (company-level settings first; user overrides later).
- Real-time reminders (daily batch is sufficient for v1).
- Replacing manual task creation in the UI.

---

## 4. Current frontend reference (do not extend yet)

Settings UI fields map to `NotificationSettings` in `src/types/index.ts`:

- `serviceRemindersEnabled`, `serviceReminderInterval`, `serviceCustomInterval`, `serviceIntervalUnit`
- `lubricationRemindersEnabled`, `lubricationReminderInterval`, `lubricationCustomInterval`, `lubricationIntervalUnit`
- `daysBeforeDeadline`, `emailNotifications`
- `serviceRecipients[]`, `lubricationRecipients[]`
- `equipmentSpecificIntervals[]` (`EquipmentSpecificInterval`: `equipmentType`, `interval`, `unit`, `enabled`)

Machine-side data (today in localStorage / mock):

- `Machine.maintenanceSchedules[]` with `nextDue`, `lastPerformed`, `interval`, `equipmentType`
- Lubrication registration updates `nextDue` in `MachineDetail.tsx`

**Frontend changes are out of scope until backend APIs and the reminder job exist.** When wired, Settings should read/write via API only.

---

## 5. Target data model (PostgreSQL)

All tables include `company_id` and standard audit columns (`created_at`, `updated_at`). Names are indicative; final names follow Prisma conventions in `database/prisma/schema.prisma`.

### 5.1 `company_notification_settings`

One row per company (or normalized key-value; one row preferred for simplicity).

| Column | Type | Description |
|--------|------|-------------|
| `company_id` | UUID PK/FK | Tenant |
| `service_reminders_enabled` | boolean | Master switch for service |
| `service_reminder_interval` | enum/text | `weekly`, `biweekly`, `monthly`, `quarterly`, `yearly`, `custom` |
| `service_custom_interval` | int nullable | When interval = `custom` |
| `service_interval_unit` | enum | `days`, `weeks`, `months` |
| `lubrication_reminders_enabled` | boolean | Master switch for lubrication |
| `lubrication_reminder_interval` | enum/text | Same vocabulary as service |
| `lubrication_custom_interval` | int nullable | |
| `lubrication_interval_unit` | enum | |
| `days_before_deadline` | int | Send “upcoming” notices N days before `next_due` |
| `email_notifications_enabled` | boolean | Gate for outbound email (phase 2) |
| `in_app_notifications_enabled` | boolean | Default true |
| `auto_create_tasks` | boolean | Create/update tasks when due |

### 5.2 `company_equipment_lubrication_intervals`

Replaces disconnected Settings UI state.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `company_id` | UUID FK | |
| `equipment_type` | enum/text | `crane`, `winch`, `truck`, `hooklift`, … |
| `interval_value` | int | e.g. 14 |
| `interval_unit` | enum | `days`, `weeks`, `months` |
| `enabled` | boolean | |

Unique constraint: `(company_id, equipment_type)`.

**Behaviour:** When a lubrication schedule is created or recalculated for a machine equipment slot, the engine uses the company equipment interval if enabled; otherwise falls back to company default lubrication interval.

### 5.3 `company_reminder_recipients`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `company_id` | UUID FK | |
| `reminder_type` | enum | `service`, `lubrication` |
| `email` | text | Recipient address |
| `active` | boolean | |

Unique constraint: `(company_id, reminder_type, email)`.

### 5.4 `maintenance_schedules` (existing domain — must be in PostgreSQL)

Reminder engine reads from authoritative schedules linked to machines:

| Column | Relevant fields |
|--------|-----------------|
| `machine_id` | FK |
| `schedule_type` | `service` \| `lubrication` |
| `equipment_type` | optional, for per-equipment lubrication |
| `next_due` | timestamptz — primary comparison field |
| `last_performed` | timestamptz |
| `interval` / `custom_interval` | for recalculation after completion |

*If this table does not exist in Prisma yet, it must be added in Phase A before Phase C.*

### 5.5 `notifications` (in-app)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `company_id` | UUID FK | |
| `user_id` | UUID FK nullable | null = company-wide feed for admins |
| `type` | enum | `service_reminder`, `lubrication_reminder`, `overdue_*` |
| `machine_id` | UUID FK | |
| `schedule_id` | UUID FK nullable | |
| `title` | text | |
| `body` | text | |
| `due_date` | date | |
| `read_at` | timestamptz nullable | |
| `created_at` | timestamptz | |

### 5.6 `reminder_delivery_log` (deduplication)

Prevents duplicate emails and duplicate auto-tasks for the same logical event.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `company_id` | UUID FK | |
| `machine_id` | UUID FK | |
| `schedule_id` | UUID FK | |
| `reminder_type` | enum | `service`, `lubrication` |
| `delivery_kind` | enum | `upcoming`, `due`, `overdue` |
| `channel` | enum | `in_app`, `email`, `task` |
| `due_date` | date | The `next_due` date this delivery refers to |
| `sent_at` | timestamptz | |
| `recipient_email` | text nullable | For email channel |

Unique constraint (example):

`(company_id, schedule_id, delivery_kind, channel, due_date, coalesce(recipient_email, ''))`

---

## 6. Reminder engine (backend)

### 6.1 Execution model

```
┌─────────────────┐     daily cron      ┌──────────────────────┐
│  OS cron /      │ ──────────────────► │  reminder-worker     │
│  k8s CronJob /  │     (e.g. 06:00 UTC)│  (Node script or     │
│  node-cron in   │                     │   separate container)│
│  backend)       │                     └──────────┬───────────┘
└─────────────────┘                                │
                                                   ▼
                                        For each active company:
                                        load settings + schedules
                                                   │
                     ┌─────────────────────────────┼─────────────────────────────┐
                     ▼                             ▼                             ▼
              upcoming window              due today                      overdue
         (today + days_before)         (next_due = today)            (next_due < today)
                     │                             │                             │
                     ▼                             ▼                             ▼
           in-app notification            in-app + optional task        in-app + task +
           (if not logged)                (if auto_create_tasks)        escalate overdue
                     │                             │                             │
                     └─────────────────────────────┴─────────────────────────────┘
                                                   │
                                    Phase 2: email via SMTP/provider
                                    (check delivery_log first)
```

**Requirements**

- Runs **only on the server** (Docker sidecar, `backend/src/jobs/reminderJob.ts`, or system cron invoking a CLI).
- Processes companies independently; failure in one company does not abort others.
- Uses a database transaction per schedule evaluation where writes occur.
- Idempotent: always consult `reminder_delivery_log` before creating notifications, tasks, or emails.

### 6.2 Evaluation rules

For each `maintenance_schedule` where reminders are enabled for its type:

| Condition | `delivery_kind` | Actions |
|-----------|-----------------|---------|
| `next_due` ∈ [today, today + `days_before_deadline`] | `upcoming` | In-app notification to relevant users/admins |
| `next_due` = today | `due` | In-app notification; create or update task if `auto_create_tasks` |
| `next_due` < today | `overdue` | In-app notification; ensure open overdue task exists |

Skip schedule if:

- Company master switch for that reminder type is off.
- `next_due` is null.
- A log entry already exists for the same `(schedule_id, delivery_kind, channel, due_date)`.

### 6.3 Task auto-creation

When `auto_create_tasks` is true and `delivery_kind` is `due` or `overdue`:

- If no open task exists for `(machine_id, schedule_id, reminder_type)`, create one with status `pending`, due date = `next_due`, title derived from machine name + type.
- If an open task exists, update `due_date` or priority if overdue severity increased.
- Log `channel = task` in `reminder_delivery_log`.

Task model should align with existing `tasks` table in Prisma (link `machine_id`, optional `maintenance_schedule_id`).

### 6.4 In-app notifications

- Insert into `notifications`.
- Phase 1 recipients: company admins + users with mechanic/leader roles (exact RBAC TBD).
- Frontend polls or subscribes via `GET /api/notifications` in a **later** UI task — not part of this design implementation.

---

## 7. Email delivery (later sub-phase)

Email is **phase C5** in the roadmap — after in-app + task paths are stable.

### 7.1 Provider

Configure via environment variables on the backend:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Or provider API key (SendGrid, Resend, Amazon SES)

### 7.2 Send rules

- Only when `email_notifications_enabled` is true for the company.
- Recipients from `company_reminder_recipients` filtered by `reminder_type`.
- Check `reminder_delivery_log` for `(schedule_id, delivery_kind, channel=email, due_date, recipient_email)` before send.
- On success, insert log row with `sent_at`.

### 7.3 Email content (template sketch)

- Subject: `[Maskiina] Service forfald: {machineName}` / `Smøring forfald: {machineName}`
- Body: machine name, equipment type, due date, days overdue (if any), link to machine detail page (`/machine/{id}`).

**Never** send from the React app or expose SMTP credentials to the client.

---

## 8. API surface (planned)

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/api/v1/companies/:id/notification-settings` | Admin | Read settings |
| PUT | `/api/v1/companies/:id/notification-settings` | Admin | Update settings |
| GET | `/api/v1/companies/:id/equipment-lubrication-intervals` | Admin | List equipment intervals |
| PUT | `/api/v1/companies/:id/equipment-lubrication-intervals` | Admin | Replace intervals |
| GET | `/api/v1/companies/:id/reminder-recipients` | Admin | List emails |
| POST | `/api/v1/companies/:id/reminder-recipients` | Admin | Add recipient |
| DELETE | `/api/v1/companies/:id/reminder-recipients/:id` | Admin | Remove recipient |
| GET | `/api/v1/notifications` | Authenticated | In-app feed |
| PATCH | `/api/v1/notifications/:id/read` | Authenticated | Mark read |
| GET | `/api/v1/admin/reminder-deliveries` | Admin | Audit log (optional) |

Internal only (not public HTTP):

- `POST /internal/jobs/run-reminders` with shared secret, or CLI `node backend/src/jobs/runReminders.js`

---

## 9. Migration from current UI

When implementation begins:

1. Add Prisma models and seed default settings for existing companies.
2. Implement GET/PUT settings APIs.
3. Map `Settings.tsx` state to API on load/save (replace toast-only save).
4. Migrate `equipmentSpecificIntervals` defaults from current hardcoded values in `Settings.tsx` into `company_equipment_lubrication_intervals` seed.
5. Ensure machine `maintenance_schedules` are written to PostgreSQL when lubrication/service is recorded (API migration from `MachineDetail`).
6. Deploy reminder worker.
7. Add notifications UI (navbar badge, list page).
8. Enable email sub-phase.

---

## 10. Testing strategy

| Test | Description |
|------|-------------|
| Unit | Date window logic (`upcoming`, `due`, `overdue`) with fixed clock |
| Unit | Deduplication: second run same day does not duplicate log rows |
| Integration | Seed company + schedule with `next_due` tomorrow → upcoming notification created |
| Integration | `next_due` today → task created once |
| Integration | Email mock transport → one message per recipient per event |
| E2E | Admin updates settings via API → next job run respects new `days_before_deadline` |

Use dependency injection for `now()` and mail transport in tests.

---

## 11. Security & operations

- Reminder job credentials: service account or backend env only.
- Recipient emails validated on write; no arbitrary BCC from user input in job.
- Rate-limit internal job endpoint if exposed over HTTP.
- Log job duration, companies processed, notifications created, emails sent, errors per company.
- Alert if job fails to run for > 25 hours.

---

## 12. Open questions

1. Should upcoming reminders repeat daily within the window, or fire once when entering the window?
2. Per-machine override of company lubrication interval?
3. Assign auto-created tasks to machine default mechanic vs unassigned pool?
4. Timezone for “today”: company timezone setting vs UTC?

*Default recommendation for v1: fire once per `(schedule, delivery_kind, due_date)` via delivery log; company timezone `Europe/Copenhagen`; tasks unassigned.*

---

## 13. Checklist before implementation starts

- [ ] Machines and `maintenance_schedules` persisted in PostgreSQL (Phase A)
- [ ] This design reviewed and open questions resolved
- [ ] Prisma migration drafted for tables in §5
- [ ] Reminder worker deployment approach chosen (cron vs sidecar)
- [ ] Explicit approval to begin Phase C1

**Until the checklist is complete: do not implement reminder logic or change frontend Settings persistence.**
