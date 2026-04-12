# Module Boundaries

## Purpose

This document defines ownership boundaries between backend modules.

It should answer one question clearly:

Which module owns which business behavior and persistence responsibility?

## Source of Truth

For product behavior and persistence rules, the primary source of truth is:

1. `docs/data/DATABASE_SCHEMA.md`
2. `docs/engineering/screen-lists/`

This document must stay aligned with those sources.

If this document conflicts with the database schema or the screen lists, follow the schema and screen lists.

## First-Class Modules

The current module boundaries are:

- `auth`
- `merchants`
- `suppliers`
- `ingredients`
- `purchase-orders`
- `inventory`
- `cash`
- `debts`

These are the main business ownership areas in the backend.

## Core Boundary

`core/` owns application-wide runtime concerns:

- Environment parsing
- Logging
- DB client and transaction helpers
- Global error model and error handler
- Request and response helpers
- Global middleware

Business rules must not live in `core/`.

## Shared Boundary

`shared/` may contain small reusable primitives such as:

- Shared constants
- Primitive shared types
- Low-level utilities such as crypto or JWT helpers

`shared/` must not become a generic dumping ground for business logic.

If something is owned by one domain, keep it in that module.

Type contracts should remain close to module ownership:

- Keep module-specific `*Request`, `*Map`, `*Row`, `*InsertPayload`, and `*UpdatePayload` in that module's `*.type.ts`.
- Move a type to `shared/` only when more than one module uses it.

## Module Ownership

### `auth`

Owns account-level user behavior and identity-related flows, including:

- Register
- Login
- Authenticated user context
- Account profile update
- Password change for authenticated users

This module is the main exception to merchant-scoped handling.

Current implementation status snapshot:

- Implemented in backend now: register, login, get-me, update profile, change password.
- Public forgot-password and reset-password flow is part of product scope from screen lists, but backend implementation can be scheduled separately.

### `merchants`

Owns merchant-level data and merchant access concerns, including:

- Merchant creation during onboarding
- Merchant membership lookup
- Merchant access checks
- Merchant profile updates

Merchant settings belong here because they update `merchants` data.

### `suppliers`

Owns supplier data and supplier-related reads and writes, including:

- Supplier create, update, archive, and detail flows
- Supplier list queries
- Supplier-related purchase history reads

### `ingredients`

Owns ingredient master data and ingredient unit data, including:

- Ingredient create, update, activate, deactivate, and delete rules
- Ingredient stock metadata
- Ingredient unit create, update, activate, deactivate, and delete rules

### `purchase-orders`

Owns purchase-order recording and purchase-order read flows, including:

- Purchase order writes
- Payment split recording
- Purchase history reads

This module owns `purchase_orders` as the aggregate root.

`purchase_order_items` is a child entity under this module and should live in a subfolder such as:

- `modules/purchase-orders/purchase-order-items/`

This module coordinates with inventory, cash, and debts during write workflows, but it does not own those domains.

### `inventory`

Owns inventory movement and inventory history behavior, including:

- Stock monitoring
- Stock usage
- Stock waste
- Stock adjustment
- Stock logs
- Ingredient batch tracking

### `cash`

Owns merchant cash movement behavior, including:

- Manual cash-in and cash-out flows
- Cash movement logging
- Cash balance tracking
- Cash transaction history reads

### `debts`

Owns debt lifecycle behavior, including:

- Debt creation
- Debt payment
- Debt status tracking
- Debt history and due-date monitoring

## Ownership Rules

Use these rules when deciding where code belongs:

1. Ownership follows business responsibility, not UI grouping.
2. Ownership follows the underlying data being changed.
3. A module may coordinate another module's repository data in a transaction, but that does not transfer ownership.
4. Settings screens do not automatically require a separate backend module.
5. One repository and one type file should own one table or one tightly-coupled operation.
6. Child tables or subordinate entities should use subfolders under the owning module.

Examples of the child-entity rule:

- `modules/ingredients/ingredient-units/`
- `modules/purchase-orders/purchase-order-items/`
- `modules/debts/debt-payments/`

Examples:

- Account settings stay in `auth` because they update `users`.
- Merchant settings stay in `merchants` because they update `merchants`.
- Purchase-order side effects may write cash and debt records, but cash logic still belongs to `cash` and debt logic still belongs to `debts`.
- A service may orchestrate multiple repositories in one transaction, but repositories must not become workflow coordinators.

## Dependency Direction

Allowed direction:

- Routes may depend on controllers
- Controllers may depend on services
- Services may depend on repositories and `core/` or `shared/` helpers
- Repositories may depend on DB primitives and shared low-level helpers

Not allowed:

- Repositories depending on controllers
- Repositories reading HTTP context directly
- Controllers implementing business rules
- Middleware owning domain logic

Type dependency rule:

- Controllers should consume `*Request` contracts.
- Services should expose operation maps (`*Map`) when returning domain data.
- Repositories should expose persistence contracts (`*Row`, `*InsertPayload`, `*UpdatePayload`).

## Sub-Module Rule

Create a sub-module only when one of these is true:

1. The area has distinct persistence behavior.
2. The area has distinct request schema and validation rules.
3. The area has independent business rules that can grow on its own.
4. The module root becomes too crowded to read comfortably.

Do not create sub-modules too early for trivial CRUD behavior.

When a child entity is clearly subordinate to one aggregate root, keep the root files in the module root and place the child under a subfolder.

Example:

- `purchase-orders/purchase-order.repository.ts`
- `purchase-orders/purchase-order-items/purchase-order-item.repository.ts`

## Summary

The module boundaries are designed to keep ownership explicit:

- `auth` owns account-level user behavior
- `merchants` owns merchant-level data and access
- `suppliers`, `ingredients`, `purchase-orders`, `inventory`, `cash`, and `debts` own their respective operational domains

When in doubt, choose the module that owns the business rule and underlying persisted data.
