# Folder Structure

## Purpose

This document defines the target backend folder structure and the rules for placing files inside it.

It should help answer:

- Where a new file should live
- When a file belongs in `core/`, `modules/`, or `shared/`
- When a module should be split further

## Source of Truth

For product behavior and persistence rules, the primary source of truth is:

1. `docs/data/DATABASE_SCHEMA.md`
2. `docs/engineering/screen-lists/`

For structural decisions, this document should stay aligned with:

- `docs/engineering/ARCHITECTURE_OVERVIEW.md`
- `docs/engineering/MODULE_BOUNDARIES.md`

## Target Structure

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

The exact file set may evolve, but the top-level ownership model should remain stable.

## Current Implementation Snapshot

The current codebase already follows the top-level target structure:

- `src/core/`
- `src/modules/`
- `src/shared/`

Current implemented business module:

- `src/modules/auth/`

Current shared snapshot:

- `src/shared/types/` is intentionally small and keeps only active cross-module contracts.
- `src/shared/utils/` has no barrel index and only keeps utilities that are actively used.

## Top-Level Placement Rules

### `core/`

Put a file in `core/` only if it is application-wide runtime infrastructure.

Typical examples:

- Environment config
- Logger setup
- DB client and transaction helpers
- Error model and global error handling
- HTTP helpers
- Middleware

Do not put business rules in `core/`.

### `modules/`

`modules/` is the default location for business logic.

If a file belongs to one domain, it should usually live inside that module.

Typical module contents:

- Routes
- Controllers
- Services
- Repositories
- Request schemas
- Module-specific types

### `shared/`

Use `shared/` only for small reusable primitives that are:

- Used by multiple modules
- Not runtime infrastructure
- Not clearly owned by one domain

If the ownership is obvious, keep the file in the owning module instead.

When a shared file is no longer used, remove it instead of keeping speculative utilities.

## Default Module Layout

The default module layout is:

```text
modules/<module-name>/
  <singular-name>.route.ts
  <singular-name>-v1.route.ts (only when route versioning is needed)
  <singular-name>.controller.ts
  <singular-name>.service.ts
  <singular-name>.repository.ts
  <singular-name>.schema.ts
  <singular-name>.type.ts
```

This is the starting point, not a rigid requirement.

If a module stays small, this layout is enough.

For example:

- `modules/merchants/merchant.service.ts`
- `modules/suppliers/supplier.repository.ts`
- `modules/ingredients/ingredient.schema.ts`
- `modules/auth/auth-v1.route.ts`

## Sub-Module Layout

Use a nested folder only when it improves clarity.

Typical reasons:

1. The area has distinct persistence behavior.
2. The area has distinct validation or request-shape rules.
3. The area has enough business logic to grow independently.
4. The module root becomes crowded and hard to scan.

Example:

```text
modules/ingredients/
  ingredient.route.ts
  ingredient.controller.ts
  ingredient.service.ts
  ingredient.repository.ts
  ingredient.schema.ts
  ingredient.type.ts
  units/
    ingredient-unit.service.ts
    ingredient-unit.repository.ts
    ingredient-unit.schema.ts
    ingredient-unit.type.ts
```

Do not create sub-modules too early for trivial CRUD behavior.

## File Naming Rules

Use these suffixes consistently:

- `*.route.ts`
- `*.controller.ts`
- `*.service.ts`
- `*.repository.ts`
- `*.schema.ts`
- `*.type.ts`
- `*.constant.ts`
- `*.middleware.ts`

Type naming inside `*.type.ts` should follow role-based naming:

- Request contracts: `*Request`
- Service operation maps: `*Map`
- Repository row contracts: `*Row`
- Repository write payloads: `*InsertPayload`, `*UpdatePayload`

Consistency matters more than novelty here.

Folder naming rule:

- Use plural folder names for collections such as `modules/`, `constants/`, and `types/`
- Use singular base names and singular file suffixes for main files inside a module
- Example: `modules/merchants/merchant.service.ts`, not `modules/merchants/merchants.service.ts`

## Placement Heuristics

Use these rules when deciding where a file goes:

1. If it owns business behavior for one domain, put it in that module.
2. If it is runtime infrastructure used across the app, put it in `core/`.
3. If it is a small reusable primitive with no single owner, put it in `shared/`.
4. If you are unsure, prefer module ownership over `shared/`.

Examples:

- Account settings logic belongs in `modules/auth/`
- Merchant settings logic belongs in `modules/merchants/`
- Merchant middleware belongs in `core/middleware/`
- DB transaction helpers belong in `core/db/`

## Anti-Patterns

Avoid these structure problems:

- Putting business logic in `core/`
- Growing `shared/` into a dumping ground
- Creating a new top-level module just because the UI has a separate page
- Splitting tiny modules into sub-modules too early
- Mixing unrelated domains inside one module

## Summary

The folder structure should reinforce ownership:

- `core/` for runtime infrastructure
- `modules/` for domain logic
- `shared/` for small cross-module primitives

If the folder structure makes ownership less obvious, the structure is probably wrong.
