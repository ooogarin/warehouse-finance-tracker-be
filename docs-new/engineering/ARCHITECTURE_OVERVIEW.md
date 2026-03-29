# Architecture Overview

## Purpose

This document defines the high-level backend architecture direction for Pengelola Modal Dapur.

It is intentionally concise. It should capture architectural decisions, not restate every screen flow or implementation detail.

## Source of Truth

For product behavior and persistence rules, the primary source of truth is:

1. `docs-new/data/DATABASE_SCHEMA.md`
2. `docs-new/engineering/screen-lists/`

This document must not override those sources.

If this document conflicts with the database schema or the screen lists, follow the schema and screen lists.

## Architecture Goals

The backend architecture should:

1. Keep business code easy to locate
2. Keep runtime concerns separate from domain logic
3. Make merchant scoping explicit
4. Make multi-table write workflows easy to trace
5. Stay practical for an incrementally evolving codebase

## Architecture Style

The project uses a hybrid module-first structure.

This means:

- Business domains live in `modules/`
- Application-wide runtime concerns live in `core/`
- Only truly reusable primitives live in `shared/`

This is the default direction unless there is a strong reason to do otherwise.

## Target Source Structure

```text
src/
  index.ts

  core/
    config/
    db/
    errors/
    http/
    middleware/

  modules/
    auth/
    merchants/
    suppliers/
    ingredients/
    purchase-orders/
    stock/
    cash/
    debts/

  shared/
    constants/
    types/
    utils/
```

The exact internal file split may evolve, but the ownership model should remain stable.

## Top-Level Ownership

### `core/`

`core/` owns application-wide infrastructure:

- Environment configuration
- Logger setup
- DB client and transaction helpers
- Error model and global error handling
- HTTP helpers
- Middleware

Business rules must not live in `core/`.

### `modules/`

`modules/` is the default home for business logic.

Each module should own its:

- Routes
- Controllers
- Services
- Repositories
- Request schemas (validators)
- Module-specific types (types/interfaces)

If a file only serves one domain, keep it inside that domain module.

### `shared/`

`shared/` is only for reusable primitives that are not runtime infrastructure and are not owned by one module.

Typical examples:

- Primitive shared types
- Low-level utilities
- Simple shared constants

`shared/` must stay small.

## Domain Modules

The current architecture direction is organized around these first-class modules:

- `auth`
- `merchants`
- `suppliers`
- `ingredients`
- `purchase-orders`
- `stock`
- `cash`
- `debts`

These modules align with the stable product areas currently defined by the screen lists and database schema.

Settings-related behavior should be implemented through the modules that own the underlying data:

- Account settings belong to `auth`
- Merchant settings belong to `merchants`

This keeps ownership aligned with persistence and business rules rather than UI navigation.

## Layer Responsibilities

### Routes

Routes should:

- Declare endpoints
- Attach middleware
- Attach validation
- Delegate to controllers

Routes must not contain business logic or SQL.

### Controllers

Controllers should:

- Read request input
- Read request context
- Call services
- Return formatted responses

Controllers must not:

- Implement business rules
- Access the database directly
- Manage transactions

### Services

Services should:

- Enforce business rules
- Orchestrate repository calls
- Manage transaction boundaries when needed
- Throw business-level errors

Services must not:

- Format HTTP responses
- Depend on Hono `Context`
- Contain raw SQL

### Repositories

Repositories should:

- Execute parameterized SQL
- Expose explicit read and write methods
- Accept scoping inputs such as `merchantId` explicitly
- Stay focused on persistence

Repositories must not:

- Depend on HTTP context
- Contain business rules
- Decide transaction boundaries

## Request Flow

The default request lifecycle is:

```text
request
-> route
-> middleware
-> controller
-> service
-> repository
-> database
-> response
```

This is the standard flow unless a very specific case requires otherwise.

## Merchant Scoping

Merchant scoping is a first-class business boundary for most modules.

The default rule is:

- Public auth flows are not merchant-scoped
- Authenticated account-level flows may be non-merchant-scoped
- Merchant operational flows are merchant-scoped

Merchant-scoped repository methods must accept `merchantId` explicitly.

Merchant scoping must never depend on hidden global state.

## Transaction Strategy

Use manual transaction handling for workflows that write across multiple tables.

Services own transaction boundaries.

Typical cases include:

- Onboarding completion
- Purchase order creation
- Stock usage, waste, and adjustment writes
- Debt payment flows

Controllers and repositories must not start transactions.

## Database Access Strategy

The project should use a single DB client module under `src/core/db/`.

The DB layer should own:

- The shared pool
- Transaction reservation
- Transaction commit
- Transaction rollback
- DB executor types

Do not maintain separate DB client implementations for different layers.

## Error Handling Strategy

Use a single application error model based on `AppError`.

The error design should stay simple:

- Services may throw business errors directly
- Unknown failures may be converted to internal errors
- The global error handler maps known errors to HTTP responses

Avoid deep error hierarchies that do not add practical value.

## Dependency Direction

Allowed dependency direction:

```text
routes
-> controllers
-> services
-> repositories
-> database
```

Additionally:

- Services may use `core/` and `shared/`
- Repositories may use `core/db` and shared primitives

Not allowed:

- Controllers calling repositories directly
- Repositories depending on controllers
- Services depending on Hono `Context`
- Business logic inside middleware

## Naming Conventions

Use these suffixes consistently:

- `*.route.ts`
- `*.controller.ts`
- `*.service.ts`
- `*.repository.ts`
- `*.schema.ts`
- `*.type.ts`
- `*.constant.ts`
- `*.middleware.ts`

Use plural folder names for collections where that naming is natural.

Use singular base names for main files inside a module.

Example:

- `modules/merchants/merchant.service.ts`
- `modules/suppliers/supplier.repository.ts`
- `modules/ingredients/ingredient.route.ts`

Split a module further only when the split improves clarity and ownership.

## Relationship to Other Engineering Docs

This document is the high-level architectural summary.

More specific rules belong in dedicated documents such as:

- Module boundaries
- Request flow
- Routing and merchant context
- DB access
- Error handling
- Testing strategy

Those documents should remain consistent with this overview and with the source of truth documents.

## Migration Direction

The codebase is still evolving toward this target structure.

Migration should be incremental:

1. Preserve current behavior
2. Move code toward module ownership
3. Make merchant scoping explicit
4. Isolate runtime concerns under `core/`
5. Avoid broad rewrites unless they are necessary

## Summary

The architecture direction is:

- Hybrid module-first
- Explicit ownership by domain
- Explicit merchant scoping
- Transaction control in services
- Persistence-only repositories
- Simple shared infrastructure

This document should stay stable, short, and decision-oriented.
