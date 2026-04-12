# Backend API by Screen List

## Purpose

This document lists backend API endpoints grouped by screen list.

It is used for implementation planning and execution tracking.

## Source of Truth

1. `docs/engineering/screen-lists/`
2. `docs/data/DATABASE_SCHEMA.md`

If this document conflicts with screen lists or schema, follow those sources.

## Status Legend

- `IMPLEMENTED`: Endpoint is available in current backend code.
- `PLANNED`: Endpoint is required by screen list but not implemented yet.

## Cross-Cutting Conventions

- Public auth routes use `/auth/*`.
- Authenticated routes use `/v1/*` with `Authorization: Bearer <token>`.
- Merchant-scoped routes should require `X-Merchant-ID`.
- Response envelope follows shared `success/data/message/meta` format.
- Response payload keys use `snake_case`.

## System Endpoints

| Endpoint | Status | Notes |
|---|---|---|
| `GET /` | IMPLEMENTED | Root info endpoint. |
| `GET /health` | IMPLEMENTED | Service health check. |

## Screen List Mapping

### `SCREEN_LIST_01_AUTH.md`

| Screen | Frontend Route | Backend API | Status |
|---|---|---|---|
| SCR-AUTH-01 Login | `/login` | `POST /auth/login` | IMPLEMENTED |
| SCR-AUTH-02 Forgot Password | `/forgot-password` | `POST /auth/forgot-password` | PLANNED |
| SCR-AUTH-03 Check Email | `/forgot-password/sent` | No API call required (UI state) | PLANNED |
| SCR-AUTH-04 Reset Password | `/reset-password?token=...` | `POST /auth/reset-password` | PLANNED |

Related account APIs:

| Endpoint | Status | Notes |
|---|---|---|
| `POST /auth/register` | IMPLEMENTED | Used by onboarding register flow. |
| `GET /v1/auth/me` | IMPLEMENTED | Account profile read. |
| `PUT /v1/auth/profile` | IMPLEMENTED | Account profile update. |
| `PUT /v1/auth/password` | IMPLEMENTED | Password update for authenticated user. |

### `SCREEN_LIST_02_ONBOARDING.md`

| Screen | Frontend Route | Backend API | Status |
|---|---|---|---|
| SCR-ONB-01 Register | `/register` | `POST /auth/register` | IMPLEMENTED |
| SCR-ONB-02 Setup Merchant | `/onboarding/merchant` | Included in completion payload | IMPLEMENTED |
| SCR-ONB-03 Opening Balance | `/onboarding/merchant/balance` | Included in completion payload | IMPLEMENTED |
| SCR-ONB-04 First Supplier | `/onboarding/merchant/supplier` | Included in completion payload | IMPLEMENTED |

Required onboarding APIs:

| Endpoint | Status | Notes |
|---|---|---|
| `GET /v1/onboarding/status` | IMPLEMENTED | Check whether user already has merchant. |
| `POST /v1/onboarding/complete` | IMPLEMENTED | Single payload, single transaction (`merchants`, `user_merchants`, optional `cash_logs`, optional `suppliers`). |

### `SCREEN_LIST_03_SUPPLIERS.md`

| Frontend Route | Backend API | Status |
|---|---|---|
| `/suppliers` | `GET /v1/suppliers` | IMPLEMENTED |
| `/suppliers/new` | `POST /v1/suppliers` | IMPLEMENTED |
| `/suppliers/[id]/edit` | `GET /v1/suppliers/:id`, `PATCH /v1/suppliers/:id` | IMPLEMENTED |
| `/suppliers/[id]` | `GET /v1/suppliers/:id` | IMPLEMENTED |
| Archive action | `DELETE /v1/suppliers/:id` (soft delete) | IMPLEMENTED |

### `SCREEN_LIST_04_INGREDIENTS.md`

| Frontend Route | Backend API | Status |
|---|---|---|
| `/ingredients` | `GET /v1/ingredients` | IMPLEMENTED |
| `/ingredients/new` | `POST /v1/ingredients` | IMPLEMENTED |
| `/ingredients/[id]/edit` | `GET /v1/ingredients/:id`, `PATCH /v1/ingredients/:id` | IMPLEMENTED |
| Delete action | `DELETE /v1/ingredients/:id` (hard delete when unused) | IMPLEMENTED |
| Unit management | `POST /v1/ingredients/:id/units`, `PATCH /v1/ingredients/:id/units/:unitId`, `DELETE /v1/ingredients/:id/units/:unitId` | IMPLEMENTED |
| Status toggle | `PATCH /v1/ingredients/:id` with `is_active` in payload | IMPLEMENTED |

Notes:
`GET /v1/ingredients/:id` returns `is_used`, `is_base_unit_editable`, and `units` for edit screen rendering.

### `SCREEN_LIST_05_PURCHASE_ORDERS.md`

| Frontend Route | Backend API | Status |
|---|---|---|
| `/purchase-orders` | `GET /v1/purchase-orders` | IMPLEMENTED |
| `/purchase-orders/new` | `POST /v1/purchase-orders` | IMPLEMENTED |
| `/purchase-orders/[id]` | `GET /v1/purchase-orders/:id` | IMPLEMENTED |

### `SCREEN_LIST_06_01_STOCK_MONITORING.md`

| Frontend Route | Backend API | Status |
|---|---|---|
| `/stock` | `GET /v1/stock` | IMPLEMENTED |
| `/stock/[ingredient_id]` | `GET /v1/stock/:ingredientId` | IMPLEMENTED |
| Stock movement history | `GET /v1/stock/:ingredientId/logs` | IMPLEMENTED |

### `SCREEN_LIST_06_02_STOCK_USAGE.md`

| Frontend Route | Backend API | Status |
|---|---|---|
| `/stock/usage` | `GET /v1/stock/usages` | IMPLEMENTED |
| `/stock/usage/new` | `POST /v1/stock/usages`, `POST /v1/stock/usages/estimate` | IMPLEMENTED |
| `/stock/usage/[id]` | `GET /v1/stock/usages/:id` | IMPLEMENTED |

### `SCREEN_LIST_06_03_STOCK_WASTE.md`

| Frontend Route | Backend API | Status |
|---|---|---|
| `/stock/waste` | `GET /v1/stock/wastes` | IMPLEMENTED |
| `/stock/waste/new` | `POST /v1/stock/wastes`, `POST /v1/stock/wastes/estimate` | IMPLEMENTED |
| `/stock/waste/[id]` | `GET /v1/stock/wastes/:id` | IMPLEMENTED |

### `SCREEN_LIST_06_04_STOCK_ADJUSTMENT.md`

| Frontend Route | Backend API | Status |
|---|---|---|
| `/stock/adjustment` | `GET /v1/stock/adjustments` | IMPLEMENTED |
| `/stock/adjustment/new` | `POST /v1/stock/adjustments`, `POST /v1/stock/adjustments/estimate-out` | IMPLEMENTED |
| `/stock/adjustment/[id]` | `GET /v1/stock/adjustments/:id` | IMPLEMENTED |

### `SCREEN_LIST_07_CASH_MANAGEMENT.md`

| Frontend Route | Backend API | Status |
|---|---|---|
| `/cash` | `GET /v1/cash`, `POST /v1/cash/in`, `POST /v1/cash/out` | IMPLEMENTED |
| `/cash/[id]` | `GET /v1/cash/:id` | IMPLEMENTED |

### `SCREEN_LIST_08_DEBT_MANAGEMENT.md`

| Frontend Route | Backend API | Status |
|---|---|---|
| `/debt` | `GET /v1/debts`, `POST /v1/debts` | IMPLEMENTED |
| `/debt/[id]` | `GET /v1/debts/:id` | IMPLEMENTED |
| Debt payment action | `POST /v1/debts/:id/payments` | IMPLEMENTED |

### `SCREEN_LIST_09_DASHBOARD.md`

| Frontend Route | Backend API | Status |
|---|---|---|
| `/dashboard` | `GET /v1/dashboard` | PLANNED |

### `SCREEN_LIST_10_REPORTS.md`

| Frontend Route | Backend API | Status |
|---|---|---|
| `/reports/financial` | `GET /v1/reports/financial` | PLANNED |
| `/reports/stock` | `GET /v1/reports/stock` | PLANNED |
| `/reports/supplier` | `GET /v1/reports/suppliers` | PLANNED |
| Export action | `GET /v1/reports/*/export` | PLANNED |

### `SCREEN_LIST_11_SETTINGS.md`

| Frontend Route | Backend API | Status |
|---|---|---|
| `/settings/account` | `GET /v1/auth/me`, `PUT /v1/auth/profile`, `PUT /v1/auth/password` | IMPLEMENTED |
| `/settings/merchant` | `GET /v1/merchants/current` | IMPLEMENTED |
| `/settings/merchant` | `PATCH /v1/merchants/current` | PLANNED |
| Shared merchant selector context | `GET /v1/merchants` | IMPLEMENTED |

## Current Route Inventory (From Code)

Implemented route mount summary:

- `app.route('/auth', authRoutes)`
- `app.route('/v1/auth', authRoutesV1)`
- `app.route('/v1/onboarding', onboardingRoutesV1)`
- `app.route('/v1/merchants', merchantRoutesV1)`
- `app.route('/v1/suppliers', supplierRoutesV1)`
- `app.route('/v1/ingredients', ingredientRoutesV1)`

## Update Rule

When adding or changing endpoints:

1. Update module route files.
2. Update this document in the matching screen-list section.
3. Keep status column accurate (`IMPLEMENTED` or `PLANNED`).
