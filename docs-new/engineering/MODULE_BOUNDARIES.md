# Module Boundaries

## First-Class Modules

- `auth`
- `merchants`
- `suppliers`
- `ingredients`
- `purchase-orders`
- `stock`
- `cash`
- `debts`

## Core Boundary

`core/` owns:

- environment parsing
- logging
- DB client and transaction helpers
- global error model and error handler
- request/response helpers
- global middleware

Business rules must not live in `core/`.

## Shared Boundary

`shared/` may contain:

- shared constants
- primitive types
- low-level utilities such as crypto or JWT helpers

`shared/` must not become a generic dumping ground for business logic.

## Module Responsibilities

### `auth`

- register
- login
- password change
- profile update
- authenticated user context

This module is the main exception to merchant-scoped handling.

### `merchants`

- merchant CRUD
- merchant membership lookup
- merchant access checks
- merchant configuration sub-module

### `suppliers`

- supplier CRUD
- supplier list and detail reads

### `ingredients`

- ingredient CRUD
- ingredient stock metadata
- ingredient unit sub-module

### `purchase-orders`

- purchase order recording
- purchase item recording
- supplier payment split tracking

### `stock`

- stock in
- stock usage
- stock waste
- stock adjustment
- stock logs and ingredient batches

### `cash`

- cash inflow and outflow logging
- cash balance movement tracking

### `debts`

- debt creation
- debt payment
- debt status tracking

## Dependency Direction

- routes may depend on controllers
- controllers may depend on services
- services may depend on repositories and shared/core helpers
- repositories may depend on DB client and shared/core primitives
- repositories must not depend on controllers or HTTP context

## Sub-Module Rule

Create a sub-module only when one of these is true:

1. The area has distinct persistence behavior.
2. The area has distinct request schema and validation rules.
3. The area has independent business rules that can grow on its own.
4. The module root becomes too crowded to read comfortably.
