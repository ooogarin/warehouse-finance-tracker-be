# Implementation Execution Plan

## Purpose

This document maps current backend implementation against the screen-list source of truth and defines the execution order for the next implementation phases.

## Source of Truth Used

1. `docs/engineering/screen-lists/`
2. `docs/data/DATABASE_SCHEMA.md`

Current backend code snapshot used for this audit:

- `src/index.ts`
- `src/modules/auth/*`
- `src/core/*`
- `migrations/*`

## Current Coverage Summary

### What Is Implemented

- Public auth:
  - `POST /auth/register`
  - `POST /auth/login`
- Protected auth/account:
  - `GET /v1/auth/me`
  - `PUT /v1/auth/profile`
  - `PUT /v1/auth/password`
- Core runtime:
  - Global error handling
  - JWT auth middleware
  - Request ID and logging middleware
- Database foundation:
  - Migration files exist for users, merchants, suppliers, ingredients, purchase orders, stock, cash, debts.

### What Is Not Implemented Yet (API Layer)

- Onboarding completion flow
- Merchant context resolution (`X-Merchant-ID`) middleware
- Merchant settings endpoints
- Suppliers module
- Ingredients module
- Purchase orders module
- Stock modules
- Cash module
- Debts module
- Dashboard and reports endpoints
- Forgot-password and reset-password public flow

## Screen-List Coverage Matrix

Status legend:

- `DONE`: Screen requirements already covered by current backend endpoints.
- `PARTIAL`: Some requirements covered, but core flow still missing.
- `NOT STARTED`: No backend implementation yet.

| Screen List | Status | Notes |
|---|---|---|
| `SCREEN_LIST_01_AUTH.md` | PARTIAL | Login covered. Forgot-password and reset-password flow not implemented. |
| `SCREEN_LIST_02_ONBOARDING.md` | DONE | Register + onboarding status + complete flow are implemented. Step 2-4 are handled via one completion payload and one transaction. |
| `SCREEN_LIST_03_SUPPLIERS.md` | NOT STARTED | No suppliers module/routes yet. |
| `SCREEN_LIST_04_INGREDIENTS.md` | NOT STARTED | No ingredients module/routes yet. |
| `SCREEN_LIST_05_PURCHASE_ORDERS.md` | NOT STARTED | No purchase-orders module/routes yet. |
| `SCREEN_LIST_06_01_STOCK_MONITORING.md` | NOT STARTED | No stock monitoring endpoints yet. |
| `SCREEN_LIST_06_02_STOCK_USAGE.md` | NOT STARTED | No stock usage endpoints yet. |
| `SCREEN_LIST_06_03_STOCK_WASTE.md` | NOT STARTED | No stock waste endpoints yet. |
| `SCREEN_LIST_06_04_STOCK_ADJUSTMENT.md` | NOT STARTED | No stock adjustment endpoints yet. |
| `SCREEN_LIST_07_CASH_MANAGEMENT.md` | NOT STARTED | No cash endpoints yet. |
| `SCREEN_LIST_08_DEBT_MANAGEMENT.md` | NOT STARTED | No debt endpoints yet. |
| `SCREEN_LIST_09_DASHBOARD.md` | NOT STARTED | No dashboard endpoint yet. |
| `SCREEN_LIST_10_REPORTS.md` | NOT STARTED | No reports endpoints yet. |
| `SCREEN_LIST_11_SETTINGS.md` | PARTIAL | Account profile/password is covered by auth v1. Merchant settings is not implemented. |

## Gap Analysis (Highest Impact First)

1. Merchant-scoped foundation is missing.
   - Many screen lists assume merchant-level isolation.
   - We need merchant context middleware and access checks before most domain modules.

2. Onboarding completion flow is missing.
   - This blocks first-time setup path from screen-list perspective.
   - It is also the first multi-table transaction flow.

3. Merchant settings API is missing.
   - Required by `SCR-SET-02`.

4. Core operational modules are missing.
   - Suppliers, ingredients, purchase orders, stock, cash, debt.

5. Read-model endpoints are missing.
   - Dashboard and reports depend on upstream operational modules.

## Execution Plan

### Phase 0 — Stabilize Current Auth Baseline

- [ ] Confirm final auth contracts (messages, response shape, status codes).
- [ ] Keep only required auth scope in backend for now:
  - register/login/get-me/update-profile/change-password.
- [ ] Add automated tests for existing auth endpoints before adding new modules.

Acceptance criteria:

- Existing auth endpoints pass integration tests.
- No breaking contract changes during next phases without explicit note.

### Phase 1 — Merchant Scope Foundation

- [ ] Add merchant access repository for `user_merchants`.
- [ ] Add merchant context middleware:
  - require `X-Merchant-ID`
  - verify authenticated user has access to merchant
  - set `merchantId` and `merchant` in context.
- [ ] Wire middleware for merchant-scoped route groups.

Acceptance criteria:

- Unauthorized merchant access returns `FORBIDDEN`.
- Missing/invalid merchant header returns `VALIDATION_ERROR`.
- Context values are available in controller/service for merchant-scoped routes.

### Phase 2 — Onboarding Completion

- [x] Add onboarding module and routes.
- [x] Implement `GET /v1/onboarding/status`.
- [x] Implement `POST /v1/onboarding/complete` with single transaction:
  - create `merchants`
  - create `user_merchants`
  - create opening-balance `cash_logs` only when balance > 0
  - create optional first suppliers.
- [x] Add conflict guard for already-onboarded users.

Acceptance criteria:

- One request completes onboarding as defined in screen list.
- Transaction rollback works on any partial failure.
- Onboarding status changes after success.

### Phase 3 — Settings Completion

- [ ] Add merchant settings endpoints (`SCR-SET-02`):
  - read current merchant info
  - update merchant info.
- [ ] Keep account settings under auth module (`SCR-SET-01`).

Acceptance criteria:

- `/settings/merchant` backend requirements are fully covered.
- Field constraints align with schema and screen list.

### Phase 4 — Master Data Modules

- [ ] Implement suppliers module (`SCR-SUP-*`).
- [ ] Implement ingredients module (`SCR-ING-*`), including unit-related rules.

Acceptance criteria:

- CRUD and detail/list flows work under merchant scope.
- Soft delete and read filters follow schema constraints.

### Phase 5 — Transactional Operations

- [ ] Implement purchase orders module (`SCR-PO-*`).
- [ ] Implement stock usage/waste/adjustment modules (`SCR-STK-*` writes).
- [ ] Ensure stock logs, cash logs, and debts side effects are consistent.

Acceptance criteria:

- Multi-table writes are transaction-safe.
- All derived values are computed consistently and traceable.

### Phase 6 — Financial Operations and Read Models

- [ ] Implement cash management endpoints (`SCR-CSH-*`).
- [ ] Implement debt management endpoints (`SCR-DEBT-*`).
- [ ] Implement dashboard endpoint (`SCR-DSH-01`).
- [ ] Implement reports endpoints (`SCR-RPT-*`).

Acceptance criteria:

- Dashboard and reports queries return merchant-scoped data only.
- Performance is acceptable for expected dataset size.

### Phase 7 — Auth Completion (Public Reset Flow)

- [ ] Implement forgot-password request endpoint.
- [ ] Implement reset-password endpoint with token flow.
- [ ] Add token expiry and invalid-token behavior tests.

Acceptance criteria:

- `SCREEN_LIST_01_AUTH` becomes fully covered.
- Security behavior is explicit and tested.

## Suggested Implementation Order (Short Version)

1. Merchant scope foundation
2. Onboarding complete flow
3. Merchant settings
4. Suppliers + ingredients
5. Purchase orders + stock writes
6. Cash + debts
7. Dashboard + reports
8. Forgot/reset password

## Notes

- Keep implementation incremental per phase and avoid parallel module starts before foundation phases are complete.
- Use this plan as execution checklist; update status after each merged phase.
