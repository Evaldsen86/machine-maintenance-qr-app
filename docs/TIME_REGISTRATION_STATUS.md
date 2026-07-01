# Time Registration — Current Status

**Last updated:** July 2026  
**Storage:** Browser `localStorage` only (`time_entries_{machineId}`)  
**Backend / PostgreSQL:** Not connected (see `docs/ROADMAP.md` Phase B)

This document describes what works today, what was fixed in the prototype hardening pass, and what remains before a PostgreSQL migration.

---

## Architecture overview

| Layer | Location |
|-------|----------|
| Route | `src/pages/TimeRegistration.tsx` → `/tidsregistrering` |
| Start/stop on machine | `src/components/machine/TimeTracking.tsx` |
| Start/stop via tasks | `src/components/dashboard/TaskWorkflow.tsx` |
| Central overview | `src/components/timetracking/TimeEntryManager.tsx` |
| Employee stats | `src/components/timetracking/EmployeeTimeDashboard.tsx` |
| Archive | `src/components/timetracking/TimeEntryArchive.tsx` |
| Edit dialog (overview) | `src/components/timetracking/TimeEntryEditDialog.tsx` |
| Shared utilities | `src/utils/timeEntryUtils.ts` |
| Parts inventory on stop/delete | `src/utils/inventoryPartUsage.ts` |
| Role access | `src/utils/rolePermissions.ts` |
| Payroll (profile) | `src/components/payroll/PayrollManager.tsx` |

### Workflow

1. Worker starts timer on a machine or from a dashboard task.
2. On stop → status `completed` (awaiting approval).
3. Leader approves or rejects on `/tidsregistrering`.
4. Approved/rejected entries can be archived.
5. Approved entries feed payroll generation on the user profile.

---

## Prototype fixes applied (July 2026)

| Fix | Detail |
|-----|--------|
| Active timer per user | `TimeTracking` only resumes an `active` entry matching `user.id` |
| Stale React state on save | `TimeTracking` uses `persistTimeEntries(mutator)` so `localStorage` is written from the latest state inside `setState` |
| Inventory on delete | Delete from machine view and `/tidsregistrering` restores stock for `partsUsed` linked to inventory (`inventoryPartId`) on completed entries |
| Payroll filter | `PayrollManager` only sums entries with `status === 'approved'` |
| Shared helpers | `loadTimeEntriesForMachine`, `shouldRestoreInventoryOnDelete`, `restoreInventoryForDeletedTimeEntry` |

### Inventory rules (prototype)

| Action | Inventory effect |
|--------|------------------|
| Stop active entry with lager-dele | Deduct from stock |
| Edit completed entry (machine view) | Adjust stock by diff |
| Delete completed/approved/rejected entry | Restore stock for lager-dele |
| Archive / restore from archive | No change (entry still exists) |
| Active entry deleted | No restore (stock was never deducted) |

---

## What works (single browser)

- Start/stop time with duration in minutes
- Description, notes, spare parts on machine view
- Approval workflow: `active` → `completed` → `approved` / `rejected`
- Cross-machine overview on `/tidsregistrering`
- Role-based visibility (workers see own entries; leaders see all)
- Batch approval for leaders
- Archive and restore
- Employee period statistics
- Spare parts search from inventory when registering time on machine
- Payroll draft from **approved** hours only

---

## Known limitations (before PostgreSQL)

### Data & sync

- **localStorage only** — data is per browser/device, not shared between users or machines.
- **No server validation** — any client can modify stored JSON.
- **No backup** — clearing browser data loses entries.

### Functional gaps

- **No spare-parts edit on `/tidsregistrering`** — `TimeEntryEditDialog` edits description, notes, and hours only; parts must be changed on the machine page.
- **No auto-save during active session** on machine view — description, notes, and parts are held in React state until stop (page refresh mid-session may lose unsaved fields). `TaskWorkflow` auto-saves parts while working.
- **Duplicate approval UI** — approve/reject exists both on machine detail and central overview.
- **Two save paths** — `TimeTracking` writes full arrays; overview uses `saveTimeEntry` per row (same storage key, compatible format).
- **Payroll is local** — generated payroll rows live in component state / profile `localStorage`, not tied to server payroll export.

### Multi-user on same machine

- Multiple workers can each have their own `active` entry on the same machine (via tasks).
- `TimeTracking` on machine detail only shows the **current user's** active timer.
- Other users' active entries are not visible on that card (by design after user filter fix).

### Not in scope yet

- PostgreSQL persistence
- Express API for time entries
- Real payroll export integration
- Overtime rules / collective agreement logic (current overtime calc is a simple 30-minute increment heuristic)

---

## Migration prerequisites (Phase B)

Before moving time registration to PostgreSQL:

1. [ ] `time_entries` table with `company_id`, `machine_id`, `user_id`, status, parts JSON or join table
2. [ ] API: CRUD + approve/reject/archive
3. [ ] Replace `loadAllTimeEntries` / `saveTimeEntry` with API calls
4. [ ] Server-side inventory deduction (or transactional job) instead of browser-only stock updates
5. [ ] Unify `TimeTracking` and `TimeEntryManager` edit capabilities (including parts)
6. [ ] Active timer: server authoritative clock or conflict detection for concurrent sessions
7. [ ] Payroll reads approved entries from API for the tenant

See `docs/ROADMAP.md` Phase B and Phase C for ordering relative to other features.

**Production design:** `docs/TIME_REGISTRATION_PRODUCTION_DESIGN.md`  
**Migration plan:** `docs/TIME_REGISTRATION_MIGRATION_PLAN.md`

---

## Testing checklist (manual, prototype)

- [ ] User A starts timer on machine — User B does not see A's active session
- [ ] Stop entry → appears on `/tidsregistrering` as "Afventer godkendelse"
- [ ] Leader approves → payroll generation includes entry; pending/rejected do not
- [ ] Delete entry with lager-dele → stock increases
- [ ] Archive and restore → stock unchanged
- [ ] Rapid start/stop does not drop entries in localStorage
