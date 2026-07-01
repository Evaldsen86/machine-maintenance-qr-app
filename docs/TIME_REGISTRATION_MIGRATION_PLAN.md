# Migration Plan — Time Registration (localStorage → PostgreSQL)

**Date:** July 2026  
**Status:** Planning only — **do not execute until Phase B approval**  
**Design:** `docs/TIME_REGISTRATION_PRODUCTION_DESIGN.md`  
**Prototype:** `docs/TIME_REGISTRATION_STATUS.md` (remains until final cutover)

---

## 1. Principles

1. **Prototype stays live** until API-backed UI is feature-complete for internal pilot.
2. **No big-bang** — dual-write optional; prefer read-from-API with localStorage fallback only during short transition.
3. **Do not auto-import** localStorage into PostgreSQL without explicit admin action (data is unreliable / per-browser).
4. **Server is source of truth** once a phase is marked complete.
5. **No frontend routing changes** — same URLs, new data layer (`useTimeEntries` hook → API).

---

## 2. Prototype → production mapping

### 2.1 Storage keys

| Prototype | Production |
|-----------|------------|
| `localStorage.time_entries_{machineId}` | `time_entries` table (`machine_id` FK) |
| `TimeEntry.partsUsed[]` | `time_entry_parts` rows |
| `PayrollManager` in-memory / profile localStorage | `payroll_exports` + `payroll_export_lines` |
| `InvoiceGenerator` selected entries | `invoices` + `invoice_time_lines` |
| `entry.archived` boolean | `status = archived` |

### 2.2 Status mapping

| Prototype `status` | Prototype `archived` | Production `status` |
|--------------------|----------------------|---------------------|
| `active` | false | `active` |
| `completed` | false | `submitted` |
| `approved` | false | `approved` |
| `rejected` | false | `rejected` |
| `approved` / `rejected` | true | `archived` |
| — | — | `draft` (new manual entries) |
| — | — | `correction_requested` (new) |
| — | — | `exported_to_payroll` (new) |
| — | — | `invoiced` (new) |

### 2.3 Field mapping

| Prototype (`TimeEntry`) | Production column |
|-------------------------|-------------------|
| `userId` | `user_id` |
| `userName` | denormalized in API response from `users.full_name` |
| `machineId` | `machine_id` |
| — | `task_id` (null for legacy; link via description heuristics optional) |
| — | `customer_id` (null unless inferred from task/offer) |
| `startTime` | `start_time` |
| `endTime` | `end_time` |
| `duration` | `duration_minutes` |
| — | `break_minutes` (default 0) |
| — | `billable_minutes` (= duration unless flagged) |
| — | `non_billable_minutes` |
| — | `hourly_rate_internal` / `hourly_rate_customer` (set on approve) |
| `description` | `description` |
| `notes` | `technician_notes` |
| — | `leader_notes` |
| `approvedBy` | `approved_by_user_id` (resolve by name — manual) |
| `approvedAt` | `approved_at` |
| `equipmentType` | `equipment_type` |
| `partsUsed[]` | `time_entry_parts` |

---

## 3. Migration phases

### Phase 0 — Schema & API foundation (no UI change)

**Goal:** Database and backend ready; prototype untouched.

| Step | Task | Owner |
|------|------|-------|
| 0.1 | Apply Prisma migration: `customers`, `time_entries`, `time_entry_parts`, `payroll_exports`, `payroll_export_lines`, `invoices`, `invoice_time_lines` | Backend |
| 0.2 | Seed permissions: `time:*` codes per design doc | Backend |
| 0.3 | Implement `timeEntryService` + audit logging | Backend |
| 0.4 | Implement routes: start, stop, submit, approve, reject, request-correction | Backend |
| 0.5 | Integration tests for status machine + tenant isolation | Backend |
| 0.6 | Document OpenAPI / extend `docs/API_PHASE_6A.md` | Backend |

**Exit criteria:** Postman/CI can complete full technician → leader flow without frontend.

---

### Phase 1 — Internal pilot (API-backed timer)

**Goal:** Technicians and leaders use PostgreSQL on staging; prototype code path behind feature flag.

| Step | Task |
|------|------|
| 1.1 | Add `useTimeEntriesApi` hook (TanStack Query) |
| 1.2 | Feature flag `VITE_TIME_ENTRIES_API=true` |
| 1.3 | Rewire `TimeTracking` start/stop/submit to API when flag on |
| 1.4 | Rewire `TaskWorkflow` timer to API when flag on |
| 1.5 | Rewire `TimeEntryManager` queue to API (approve/reject/correction) |
| 1.6 | Server-side inventory deduction on submit |
| 1.7 | Remove localStorage **writes** when flag on (reads still fallback for 2 weeks optional) |

**Exit criteria:** Two technicians + one leader complete week on staging with API only.

---

### Phase 2 — Payroll & invoice linkage

| Step | Task |
|------|------|
| 2.1 | Implement payroll export API + CSV |
| 2.2 | Replace `PayrollManager` mock with API payroll tab |
| 2.3 | Implement invoice time line API |
| 2.4 | Wire `InvoiceGenerator` to approved billable candidates API |
| 2.5 | Enforce: only `approved` → payroll; only billable → invoice |

**Exit criteria:** Economy exports one payroll batch and one invoice from approved time.

---

### Phase 3 — History, archive & admin

| Step | Task |
|------|------|
| 3.1 | Task/machine history endpoints in UI |
| 3.2 | Archive API wired to archive tab |
| 3.3 | Admin override endpoint + UI (restricted) |
| 3.4 | Auto-save during `active` session (PATCH debounce) |
| 3.5 | Parts edit from `/tidsregistrering` when `correction_requested` |

**Exit criteria:** Machine history shows full audit trail; archived entries hidden from queue.

---

### Phase 4 — Optional legacy import & prototype retirement

| Step | Task |
|------|------|
| 4.1 | Admin tool: **Import from browser JSON** (export from prototype `localStorage`) |
| 4.2 | Import script maps statuses per §2.2; sets `source=manual`; `metadata.legacyId` |
| 4.3 | Import does **not** auto-deduct inventory (flag `inventory_already_deducted`) |
| 4.4 | Remove feature flag; delete localStorage read fallback |
| 4.5 | Mark prototype helpers `@deprecated` in `timeEntryUtils.ts` |
| 4.6 | Update `docs/TIME_REGISTRATION_STATUS.md` → “retired prototype” |

**Exit criteria:** Production uses API only; no `time_entries_*` localStorage keys written.

---

## 4. Inventory migration note

| Prototype behavior | Production |
|--------------------|------------|
| Deduct on stop | Deduct on **submit** (transactional) |
| Restore on delete | Restore on delete/correction reject (if parts unchanged) |
| Edit diff on machine | `PATCH` parts → `timeEntryPartService.sync` + inventory delta |

During Phase 1 dual-run: **do not** deduct in both browser and server. When API flag on, browser inventory hooks are no-ops for time entries.

---

## 5. User / ID resolution for legacy import

Prototype uses string IDs (`time-1739…`, mock user ids). Import rules:

- Skip entries without resolvable `user_id` in PostgreSQL.
- Map `machineId` via machine UUID if localStorage used UUID keys; else skip.
- `task_id` left null unless `description` matches `Arbejde på: {task.title}` pattern and unique match.
- `approved_by` — match `users.full_name` or leave null.

**Recommendation:** Treat import as **archived historical data**, not active payroll input.

---

## 6. Rollback plan

| Phase | Rollback |
|-------|----------|
| 0 | Drop new tables (migration down) — no user impact |
| 1 | Set `VITE_TIME_ENTRIES_API=false` — prototype resumes |
| 2–3 | Disable economy tabs; core timer still on API or revert flag |
| 4 | Irreversible without restore from DB backup |

Take PostgreSQL backup before Phase 4 cutover.

---

## 7. Testing checklist (per phase)

### Phase 0 (API)

- [ ] Tenant A cannot read tenant B time entries
- [ ] One active timer per user enforced
- [ ] Submit → approve → audit log rows created
- [ ] Reject and correction_requested paths audited

### Phase 1 (UI pilot)

- [ ] Start on task links `task_id` and `machine_id`
- [ ] Leader queue shows submitted only
- [ ] Technician cannot approve own time
- [ ] Page refresh preserves active session (server)

### Phase 2 (Payroll / invoice)

- [ ] Non-approved excluded from payroll candidates
- [ ] Export sets `exported_to_payroll` + `payroll_export_id`
- [ ] Invoice attach sets `invoiced` + lines
- [ ] Double-export blocked

### Phase 3 (Archive)

- [ ] Archived hidden from queue, visible on machine history
- [ ] Admin override requires reason in audit

---

## 8. What to implement first (internal pilot minimum)

Minimum order for a **usable internal pilot**:

1. **Phase 0.1–0.5** — schema + core API (start, stop, submit, approve, reject)
2. **Phase 1.1–1.5** — API hook + rewire timer + leader queue
3. **Server inventory on submit** (Phase 1.6)
4. **Basic task/machine history read** (subset of Phase 3.1)

Defer to post-pilot: payroll CSV export (Phase 2), invoice attach (Phase 2), legacy import (Phase 4), admin override UI (Phase 3.3).

---

## 9. Document maintenance

When each phase completes, update:

- [ ] `docs/TIME_REGISTRATION_STATUS.md` — add “API mode” section
- [ ] `docs/ROADMAP.md` Phase B checkboxes
- [ ] `docs/DATABASE_SCHEMA.md` — entity table for time registration
- [ ] `docs/API_PHASE_6A.md` — endpoint reference
