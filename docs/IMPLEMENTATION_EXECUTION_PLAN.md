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
  - `POST /auth/login`
- Protected auth/account:
  - `GET /v1/auth/me`
  - `PUT /v1/auth/profile`
  - `PUT /v1/auth/password`
- Merchant scope foundation:
  - `resolveMerchantContext` middleware with `X-Merchant-ID` access validation
- Onboarding:
  - `GET /v1/onboarding/status`
  - `POST /v1/onboarding/complete` (single transaction)
- Merchants:
  - `GET /v1/merchants`
  - `GET /v1/merchants/current`
  - `PATCH /v1/merchants/current`
- Suppliers:
  - `GET /v1/suppliers`
  - `POST /v1/suppliers`
  - `GET /v1/suppliers/:id`
  - `PATCH /v1/suppliers/:id`
  - `DELETE /v1/suppliers/:id` (soft delete)
- Ingredients:
  - `GET /v1/ingredients`
  - `POST /v1/ingredients`
  - `GET /v1/ingredients/:id`
  - `PATCH /v1/ingredients/:id`
  - `DELETE /v1/ingredients/:id` (hard delete when unused)
  - `POST /v1/ingredients/:id/units`
  - `PATCH /v1/ingredients/:id/units/:unitId`
  - `DELETE /v1/ingredients/:id/units/:unitId`
- Purchase orders:
  - `GET /v1/purchase-orders`
  - `POST /v1/purchase-orders`
  - `GET /v1/purchase-orders/:id`
- Stock:
  - `GET /v1/stock`
  - `GET /v1/stock/:ingredientId`
  - `GET /v1/stock/:ingredientId/logs`
  - `GET /v1/stock/usages`
  - `POST /v1/stock/usages`
  - `POST /v1/stock/usages/estimate`
  - `GET /v1/stock/usages/:id`
  - `GET /v1/stock/wastes`
  - `POST /v1/stock/wastes`
  - `POST /v1/stock/wastes/estimate`
  - `GET /v1/stock/wastes/:id`
  - `GET /v1/stock/adjustments`
  - `POST /v1/stock/adjustments`
  - `POST /v1/stock/adjustments/estimate-out`
  - `GET /v1/stock/adjustments/:id`
- Cash:
  - `GET /v1/cash`
  - `GET /v1/cash/:id`
  - `POST /v1/cash/in`
  - `POST /v1/cash/out`
- Debts:
  - `GET /v1/debts`
  - `POST /v1/debts`
  - `GET /v1/debts/:id`
  - `POST /v1/debts/:id/payments`
- Dashboard:
  - `GET /v1/dashboard`
- Core runtime:
  - Global error handling
  - JWT auth middleware
  - Request ID and logging middleware
- Database foundation:
  - Migration files exist for users, merchants, suppliers, ingredients, purchase orders, stock, cash, debts.

### What Is Not Implemented Yet (API Layer)

- Reports export endpoints
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
| `SCREEN_LIST_03_SUPPLIERS.md` | DONE | Supplier list/create/detail/update/archive endpoints are implemented. |
| `SCREEN_LIST_04_INGREDIENTS.md` | PARTIAL | Ingredient list/create/detail/update, status toggle via `PATCH /:id` (`is_active`), and unit CRUD are implemented. Detail usage flags and base-unit edit safeguards are implemented. Remaining scope is broader lifecycle completeness (for example delete/archive flow and full operational integration with stock/purchase modules). |
| `SCREEN_LIST_05_PURCHASE_ORDERS.md` | DONE | Purchase order list/create/detail endpoints are implemented. Create flow writes purchase orders, items, stock quantity, ingredient batches, stock logs, cash outflow for `paid_cash`, and debts for `paid_owner` / supplier `debt_amount` in one transaction. |
| `SCREEN_LIST_06_01_STOCK_MONITORING.md` | DONE | Stock list/detail/log endpoints are implemented. List/detail include summary, inventory value, stock status, formatted stock quantities, active batches, and movement history. |
| `SCREEN_LIST_06_02_STOCK_USAGE.md` | DONE | Stock usage list/create/detail and FIFO COGS estimate endpoints are implemented. Create flow writes usage header/items, consumes FIFO batches, updates ingredient stock, and writes stock logs in one transaction. |
| `SCREEN_LIST_06_03_STOCK_WASTE.md` | DONE | Stock waste list/create/detail and FIFO waste estimate endpoints are implemented. Create flow writes waste header/items, consumes FIFO batches, updates ingredient stock, and writes stock logs in one transaction. |
| `SCREEN_LIST_06_04_STOCK_ADJUSTMENT.md` | DONE | Stock adjustment list/create/detail and FIFO out estimate endpoints are implemented. Create flow supports mixed in/out items, writes adjustment header/items, updates ingredient batches and stock quantity, and writes stock logs in one transaction. |
| `SCREEN_LIST_07_CASH_MANAGEMENT.md` | DONE | Cash list/detail plus manual cash-in and cash-out endpoints are implemented. Cash balance and cash log writes are transaction-safe. |
| `SCREEN_LIST_08_DEBT_MANAGEMENT.md` | DONE | Debt list/detail/create plus debt payment endpoint are implemented. Debt payment writes update debt state and create cash outflow in one transaction. |
| `SCREEN_LIST_09_DASHBOARD.md` | DONE | Dashboard aggregate endpoint is implemented. It returns cash summary, expense breakdown, stock alerts, top waste this month, and debt alerts in one merchant-scoped response. |
| `SCREEN_LIST_10_REPORTS.md` | PARTIAL | Financial, stock, and supplier report endpoints are implemented. Export endpoints are still planned. |
| `SCREEN_LIST_11_SETTINGS.md` | DONE | Account profile/password is covered by auth v1. Merchant settings read/update endpoints are implemented. |

## Gap Analysis (Highest Impact First)

1. Financial read/write endpoints are now implemented.
   - Remaining financial scope is downstream reporting read models, not core cash/debt CRUD/payment flows.

2. Report export endpoints are missing.
   - Report read-model endpoints are implemented for financial, stock, and suppliers.

3. Ingredient lifecycle completeness is still partial.
   - Advanced rules for detail/edit are covered.
   - Delete/archive flow and downstream operational integrations are not fully complete.

## Execution Plan

### Phase 0 — Stabilize Current Auth Baseline

- [ ] Confirm final auth contracts (messages, response shape, status codes).
- [ ] Keep only required auth scope in backend for now:
  - login/get-me/update-profile/change-password.
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

- [x] Add merchant settings endpoints (`SCR-SET-02`):
  - read current merchant info
  - update merchant info.
- [ ] Keep account settings under auth module (`SCR-SET-01`).

Acceptance criteria:

- `/settings/merchant` backend requirements are fully covered.
- Field constraints align with schema and screen list.

### Phase 4 — Master Data Modules

- [x] Implement suppliers module (`SCR-SUP-*`).
- [ ] Implement ingredients module (`SCR-ING-*`) remaining lifecycle items:
  - delete/archive flow consistency with business rules
  - integration with downstream stock and purchase operation behaviors

Acceptance criteria:

- CRUD and detail/list flows work under merchant scope.
- Soft delete and read filters follow schema constraints.

### Phase 5 — Transactional Operations

- [x] Implement purchase orders module (`SCR-PO-*`).
- [x] Implement stock adjustment module (`SCR-STK-*` writes).
- [ ] Ensure stock logs, cash logs, and debts side effects are consistent.

Acceptance criteria:

- Multi-table writes are transaction-safe.
- All derived values are computed consistently and traceable.

### Phase 6 — Financial Operations and Read Models

- [x] Implement cash management endpoints (`SCR-CSH-*`).
- [x] Implement debt management endpoints (`SCR-DEBT-*`).
- [x] Implement dashboard endpoint (`SCR-DSH-01`).
- [x] Implement reports endpoints (`SCR-RPT-*`).
- [ ] Implement reports export endpoints.

Acceptance criteria:

- Reports queries return merchant-scoped data only.
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
5. Stock write endpoints
6. Cash + debts endpoints
7. Reports export
8. Forgot/reset password

## Notes

- Keep implementation incremental per phase and avoid parallel module starts before foundation phases are complete.
- Use this plan as execution checklist; update status after each merged phase.
