# Architecture Overview

## Purpose

This document is the main engineering reference for the backend architecture of Pengelola Modal Dapur.

It defines:

- the target code structure
- module boundaries
- request and dependency flow
- merchant scoping rules
- database access rules
- error handling rules
- migration direction from the current codebase to the target structure

Other engineering documents in `docs-new/engineering/` should follow this document, not contradict it.

## Architecture Goals

The backend architecture is designed to support these goals:

1. Keep business code easy to locate and maintain.
2. Keep runtime and framework concerns separate from domain logic.
3. Make merchant scoping explicit and consistent.
4. Keep database writes and transactions easy to trace.
5. Make the codebase easy to grow without turning `shared/` and `utils/` into dumping grounds.

## Architecture Style

The project uses a **hybrid module-first structure**.

This means:

- business domains are grouped by module
- global runtime concerns are grouped under `core/`
- truly reusable helpers stay under `shared/`

This approach is chosen because the project has both:

- strong business domains such as suppliers, ingredients, stock, cash, and debts
- strong application concerns such as middleware, auth, DB access, response formatting, and error handling

## Target Source Structure

```text
src/
  index.ts

  core/
    config/
      env.config.ts
      logger.config.ts
    db/
      client.ts
    errors/
      app-error.ts
      error-codes.ts
      error-factories.ts
      error-handler.ts
    http/
      response.ts
      hono.ts
    middleware/
      auth.middleware.ts
      merchant.middleware.ts
      request-id.middleware.ts
      logger.middleware.ts
      validation.middleware.ts
      role.middleware.ts

  modules/
    auth/
      auth.routes.ts
      auth.controller.ts
      auth.service.ts
      auth.repository.ts
      auth.schema.ts
      auth.types.ts

    merchants/
      merchants.routes.ts
      merchants.controller.ts
      merchants.service.ts
      merchants.repository.ts
      merchants.schema.ts
      merchants.types.ts
      config/
        merchant-config.service.ts
        merchant-config.repository.ts
        merchant-config.schema.ts
        merchant-config.types.ts

    suppliers/
      suppliers.routes.ts
      suppliers.controller.ts
      suppliers.service.ts
      suppliers.repository.ts
      suppliers.schema.ts
      suppliers.types.ts

    ingredients/
      ingredients.routes.ts
      ingredients.controller.ts
      ingredients.service.ts
      ingredients.repository.ts
      ingredients.schema.ts
      ingredients.types.ts
      units/
        ingredient-units.service.ts
        ingredient-units.repository.ts
        ingredient-units.schema.ts
        ingredient-units.types.ts

    purchase-orders/
      purchase-orders.routes.ts
      purchase-orders.controller.ts
      purchase-orders.service.ts
      purchase-orders.repository.ts
      purchase-orders.schema.ts
      purchase-orders.types.ts

    stock/
      stock.routes.ts
      stock.controller.ts
      stock.types.ts
      services/
        stock-in.service.ts
        stock-usage.service.ts
        stock-waste.service.ts
        stock-adjustment.service.ts
      repositories/
        stock-logs.repository.ts
        ingredient-batches.repository.ts
      schemas/
        stock-in.schema.ts
        stock-usage.schema.ts
        stock-waste.schema.ts
        stock-adjustment.schema.ts

    cash/
      cash.routes.ts
      cash.controller.ts
      cash.service.ts
      cash.repository.ts
      cash.schema.ts
      cash.types.ts

    debts/
      debts.routes.ts
      debts.controller.ts
      debts.service.ts
      debts.repository.ts
      debts.schema.ts
      debts.types.ts

  shared/
    constants/
      messages.constant.ts
      roles.constant.ts
    types/
      common.types.ts
      context.types.ts
    utils/
      crypto.util.ts
      jwt.util.ts
      date.util.ts
```

## Top-Level Responsibilities

### `core/`

`core/` contains application-wide concerns.

Examples:

- environment configuration
- logger setup
- DB client and transaction helpers
- global error model
- HTTP response helpers
- global middleware

Business rules must not live in `core/`.

### `modules/`

`modules/` is the default home for business logic.

Each module owns its:

- routes
- controllers
- services
- repositories
- schemas
- module-specific types

If a file only serves one domain, it should stay inside that domain module.

### `shared/`

`shared/` is only for reusable primitives that are not part of the runtime infrastructure.

Examples:

- common types
- role constants
- crypto and JWT utilities

`shared/` must stay small.

If something is only used by one module, keep it inside that module.

## First-Class Modules

The backend is organized around these business modules:

- `auth`
- `merchants`
- `suppliers`
- `ingredients`
- `purchase-orders`
- `stock`
- `cash`
- `debts`

These modules align with the product scope defined by the screen list and the database schema.

## Module Responsibilities

### `auth`

Owns:

- register
- login
- authenticated user profile
- password change
- profile update

This module is the main exception to merchant-scoped handling.

### `merchants`

Owns:

- merchant CRUD
- user-to-merchant membership lookup
- merchant access verification
- merchant configuration

### `suppliers`

Owns:

- supplier CRUD
- supplier list and detail queries

### `ingredients`

Owns:

- ingredient CRUD
- ingredient metadata
- ingredient unit management

### `purchase-orders`

Owns:

- purchase order writes
- purchase item writes
- payment split recording
- purchase history queries

### `stock`

Owns:

- stock in
- stock usage
- stock waste
- stock adjustment
- stock logs
- ingredient batch tracking

### `cash`

Owns:

- cash in
- cash out
- cash movement logging
- balance tracking

### `debts`

Owns:

- debt creation
- debt payment
- debt status tracking
- debt history

## Sub-Module Rules

Sub-modules are allowed, but only when they add clarity.

Create a sub-module when one of these is true:

1. The area has its own persistence rules.
2. The area has its own request schema and validation rules.
3. The area has enough business logic to grow independently.
4. The parent module becomes crowded and harder to scan.

Examples:

- `merchants/config`
- `ingredients/units`

Do not create sub-modules too early for trivial CRUD behavior.

## Layer Responsibilities

### Routes

Routes are declarative.

Routes should:

- define endpoints
- attach middleware
- attach validation
- delegate to controllers

Routes must not contain business logic or SQL.

### Controllers

Controllers are responsible for HTTP input and output.

Controllers should:

- read params, query, headers, and body
- read request context
- call services
- return formatted responses

Controllers must not:

- implement business rules
- call the database directly
- manage transactions

### Services

Services are responsible for business orchestration.

Services should:

- validate business rules
- coordinate multiple repositories
- manage transaction boundaries when needed
- throw business errors

Services must not:

- format HTTP responses
- depend on Hono `Context`
- contain raw SQL

### Repositories

Repositories are responsible for persistence only.

Repositories should:

- execute parameterized SQL
- select explicit columns
- expose clear read and write methods
- enforce tenant scoping through method arguments

Repositories must not:

- access request context directly
- contain business rules
- decide transaction boundaries

## Request Lifecycle

The standard request lifecycle is:

```text
Request
-> Route
-> Middleware chain
-> Controller
-> Service
-> Repository
-> Database
-> Response formatter
```

### Public Auth Flow

Examples:

- `POST /auth/register`
- `POST /auth/login`

Flow:

```text
request
-> route validation
-> controller
-> service
-> repository
-> response
```

### Authenticated Non-Merchant Flow

Examples:

- `GET /v1/auth/me`
- `PUT /v1/auth/profile`
- `PUT /v1/auth/password`

Flow:

```text
request
-> authenticate
-> route validation
-> controller
-> service
-> repository
-> response
```

### Merchant-Scoped Flow

Examples:

- `GET /v1/suppliers`
- `POST /v1/ingredients`
- `POST /v1/purchase-orders`

Flow:

```text
request
-> authenticate
-> require X-Merchant-ID
-> verify merchant access
-> route validation
-> controller
-> service
-> repository
-> response
```

## Routing Strategy

### Public Routes

Do not require JWT or merchant context.

Examples:

- `POST /auth/register`
- `POST /auth/login`

### Authenticated Non-Merchant Routes

Require JWT, but do not require `X-Merchant-ID`.

Examples:

- `GET /v1/auth/me`
- `PUT /v1/auth/profile`
- `PUT /v1/auth/password`

### Merchant-Scoped Routes

Require both:

- JWT
- `X-Merchant-ID`

Examples:

- `/v1/suppliers`
- `/v1/ingredients`
- `/v1/purchase-orders`
- `/v1/stock/...`
- `/v1/cash/...`
- `/v1/debts/...`

## Merchant Boundary

Merchant context is a first-class business boundary for almost all modules except public auth and non-merchant auth profile operations.

Merchant context is passed through the request header:

```text
X-Merchant-ID
```

The merchant middleware must:

1. read the header
2. validate the header value
3. verify that the authenticated user has access to the merchant
4. store `merchantId` and merchant context in request variables

Merchant-scoped repository methods must accept `merchantId` explicitly.

Examples:

```ts
getAllByMerchantId(merchantId)
getOneByMerchantAndId(merchantId, id)
```

Merchant scoping must never depend on hidden global state.

## Database Access Strategy

Database access is handled through a single DB client module in:

```text
src/core/db/client.ts
```

This module owns:

- the shared SQL pool
- transaction reservation
- transaction commit
- transaction rollback
- DB executor types

The codebase should not maintain separate DB client implementations for different layers.

## Transaction Strategy

The project uses **manual transaction handling** for multi-step write workflows.

Services are responsible for transaction boundaries.

Recommended pattern:

```ts
let db: ReservedSQL | null = null;

try {
  db = await startTransaction();

  const order = await purchaseOrdersRepository.insert(db, payload);
  await stockLogsRepository.insert(db, stockLogPayload);
  await cashLogsRepository.insert(db, cashLogPayload);

  await commitTransaction(db);
  return order;
} catch (error) {
  if (db) {
    await rollbackTransaction(db);
  }

  throw error;
}
```

Use transactions when:

- multiple writes must succeed together
- multiple related tables are updated together
- partial failure would leave business data inconsistent

Do not start transactions in controllers or repositories.

## Repository Contract

The repository contract is intentionally explicit.

### Standard Read Methods

Use short signatures for normal reads.

Examples:

```ts
getOneById(id)
getOneByEmail(email)
getAllByMerchantId(merchantId)
```

### Transactional Read Methods

Use dedicated transactional read methods only when the read must use the same reserved DB connection.

Examples:

```ts
getOneByIdTx(db, id)
getByMerchantAndIdTx(db, merchantId, id)
```

### Write Methods

Write methods must always receive the DB executor explicitly.

Examples:

```ts
insert(db, payload)
updateById(db, id, payload)
softDeleteById(db, id)
```

This keeps:

- normal reads concise
- transactional intent explicit
- write flows easy to review

## Error Handling Strategy

The project uses a single application error model based on `AppError`.

Recommended structure:

```text
src/core/errors/
  app-error.ts
  error-codes.ts
  error-factories.ts
  error-handler.ts
```

`AppError` should contain:

- `code`
- `message`
- `statusCode`
- `details?`

Recommended helper factories:

- `badRequestError`
- `unauthorizedError`
- `forbiddenError`
- `notFoundError`
- `conflictError`
- `internalError`

## Error Flow Rules

Services may throw business errors directly.

When transactions are used:

1. rollback if needed
2. rethrow the original error if it is already an `AppError`
3. convert to `internalError` only for unknown failures

Avoid this anti-pattern:

- catching every error and converting everything into `500`

The global error handler should:

1. detect `AppError`
2. map validation errors to `400`
3. optionally map known DB constraint errors
4. fallback to `500` for unknown failures

## Dependency Direction

Allowed direction:

```text
routes
-> controllers
-> services
-> repositories
-> database
```

Additionally:

- services may use `core/` and `shared/`
- repositories may use `core/db` and shared primitives

Not allowed:

- controllers calling repositories directly
- repositories depending on controllers
- services depending on Hono `Context`
- business logic inside middleware

## Naming Rules

Use these file suffixes consistently:

- `*.routes.ts`
- `*.controller.ts`
- `*.service.ts`
- `*.repository.ts`
- `*.schema.ts`
- `*.types.ts`
- `*.middleware.ts`

When a module grows too large, split by sub-module or by use case without breaking the module boundary.

## Migration Direction

The current codebase is still transitioning from a layer-first structure into the target hybrid module-first structure.

The migration should be incremental, not a big-bang rewrite.

Recommended order:

1. establish `core/db` and `core/errors`
2. move auth into `modules/auth`
3. add merchant middleware based on `X-Merchant-ID`
4. implement new modules in the target structure
5. migrate old files only when they are actively being worked on

## Summary

This architecture aims to keep the codebase explicit, modular, and easy to evolve.

The main decisions are:

- hybrid module-first structure
- explicit merchant scoping via `X-Merchant-ID`
- manual transaction handling in services
- explicit repository contracts
- single `AppError` model

All engineering documents should stay aligned with these decisions.
