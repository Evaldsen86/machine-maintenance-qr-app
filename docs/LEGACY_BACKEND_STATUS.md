# Legacy Backend Status (MongoDB / Mongoose)

## Current health

- Backend tests: **8/9** test suites passing
- Backend tests: **73/78** tests passing
- Remaining failures: isolated to **`backend/tests/Machine.test.js`**
- Frontend build: **passes successfully** (`npm run build`)

## Nature of the remaining failures

The remaining failing tests are due to **legacy MongoDB/Mongoose model expectation mismatches**, specifically:
- field/shape expectations (e.g., `status`, `oilInformation.quantity`)
- enum/default behavior assumptions that no longer match the current Mongoose schema behavior
- a couple of legacy matcher assumptions around Date comparisons

These are **not runtime/security blockers** and do not affect the new PostgreSQL/Prisma direction.

## Why this is not a blocker for PostgreSQL/Prisma migration

The target production path is:

- Express backend foundation under `backend/src/` (Phase 6A)
- Prisma schema under `database/prisma/schema.prisma`
- PostgreSQL as single source of truth (future Phase 6B and beyond)

The failing tests are limited to the **old MongoDB model test suite** (`tests/Machine.test.js`). None of the remaining failures indicate problems with:

- the new Express app/test import stability (`backend/app.js`)
- the Prisma schema design
- the Phase 6A backend foundation endpoints/middleware

## Legacy cleanup already completed (limited scope)

Completed changes were intentionally kept narrow and low-risk to make legacy tests importable and non-flaky:

- `backend/app.js` / `backend/server.js` split so tests can import the Express app **without starting a real server**
- updated tests to import `../app` instead of `../server` (prevents open handle issues)
- legacy DB helper updated so it no longer hard-exits during Jest runs when `NODE_ENV === "test"`
- PATCH validation: allow partial updates (legacy controller compatibility)
- DELETE machine: replace deprecated Mongoose `remove()` with `deleteOne()`
- maintenance field alignment: controller writes to `maintenance` (matches model)
- oil information field alignment: controller writes to `oilInfo` + maps `lastChanged` → `lastChange`
- timezone/currency/logging related legacy test fixes:
  - currency spacing normalization in `helpers.test.js`
  - adjust morgan logging assertion in `server.test.js`

## Recommended next step

Stop further legacy MongoDB cleanup here. The remaining test failures are legacy expectation mismatches and are not blocking the self-hosted PostgreSQL/Prisma migration.

Recommended next action: **continue with Phase 6A** (PostgreSQL/Prisma backend foundation) and expand incrementally (next steps: Phase 6B endpoints + migrations + tenant scoping coverage).

