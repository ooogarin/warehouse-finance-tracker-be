# Coding Rules

## Purpose

This document defines general coding rules for the backend codebase.

It focuses on durable implementation rules, not product behavior.

## Source of Truth

For product behavior and persistence rules, the primary source of truth is:

1. `docs/data/DATABASE_SCHEMA.md`
2. `docs/engineering/screen-lists/`

For engineering structure and ownership, this document should stay aligned with:

- `docs/engineering/ARCHITECTURE_OVERVIEW.md`
- `docs/engineering/MODULE_BOUNDARIES.md`
- `docs/engineering/FOLDER_STRUCTURE.md`
- `docs/engineering/PERFORMANCE_AND_QUALITY_RULES.md`
- `docs/engineering/REQUEST_FLOW.md`

## General Rules

- Use English for engineering documentation, code comments, variable names, and identifiers.
- Keep modules small and cohesive.
- Prefer explicit behavior over clever abstractions.
- Prefer readability over premature indirection.
- Do not move business logic into controllers, middleware, or repositories.
- Keep module ownership easy to locate.
- Keep runtime concerns separate from domain logic.

## Layer Discipline

### Routes

Routes should:

- Stay declarative
- Attach middleware
- Attach validation
- Delegate to controllers

Routes must not:

- Implement business rules
- Execute SQL
- Start transactions

### Controllers

Controllers should:

- Extract request input
- Read request context
- Call services
- Return formatted responses

Response contract rule:

- Use shared response helpers to keep one response envelope across endpoints.
- For action-only operations, return `data: null` instead of unrelated identifiers.
- Keep response `message` explicit for user-facing success flows.
- Use `snake_case` for response payload keys.

Controllers must not:

- Implement business rules
- Access the database directly
- Manage transactions

### Services

Services should:

- Enforce business rules
- Orchestrate repositories
- Manage transactions when needed
- Throw business-level errors

Services must not:

- Format HTTP responses
- Depend on Hono `Context`
- Contain raw SQL

### Repositories

Repositories should:

- Execute SQL
- Select explicit columns
- Accept scoping inputs explicitly
- Stay focused on persistence

Repositories must not:

- Read HTTP context directly
- Implement business rules
- Decide transaction boundaries

## Naming Rules

Module structure rule:

- Module root represents a business capability.
- Child entities or subordinate operations should use subfolders under the owning module.
- One `repository` file and one `type` file should focus on one owned table or one tightly-coupled persistence operation.
- Services may orchestrate multiple repositories, but repositories must not become workflow coordinators.

Use singular file suffixes consistently:

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

Examples:

- `modules/merchants/merchant.service.ts`
- `modules/suppliers/supplier.repository.ts`
- `modules/ingredients/ingredient.schema.ts`

Child-entity examples:

- `modules/ingredients/ingredient-units/ingredient-unit.repository.ts`
- `modules/purchase-orders/purchase-order-items/purchase-order-item.repository.ts`
- `modules/debts/debt-payments/debt-payment.repository.ts`

### Type Naming Rule

Use explicit type naming by role:

- Repository response or DB row: `*Row`
- Repository write payload: `*InsertPayload`, `*UpdatePayload`
- Request contract from body/query/param: `*Request`
- Service operation mapping type: `*Map`

Examples:

- `UserRow`
- `UserInsertPayload`
- `UserUpdatePayload`
- `CreateUserRequest`
- `GetUserRequest`
- `UserMap`

## File and Module Size Rule

When a file becomes difficult to scan, split it by use case or sub-area.

Split a module further only when the split improves ownership and readability.

Typical signs that a split is justified:

1. One area has distinct persistence behavior.
2. One area has distinct validation rules.
3. One area has business rules that can grow independently.
4. The module root becomes crowded and hard to scan.

Do not split files or modules too early for trivial CRUD behavior.

When one aggregate root has a clear child entity, keep the aggregate root files in the module root and place the child entity in a subfolder.

Examples:

- `purchase-orders/purchase-order.repository.ts`
- `purchase-orders/purchase-order-items/purchase-order-item.repository.ts`
- `debts/debt.repository.ts`
- `debts/debt-payments/debt-payment.repository.ts`

## Shared Code Rule

Before adding something to `shared/`, ask:

1. Is this used by multiple modules today?
2. Is it not a core runtime concern?
3. Does moving it reduce duplication without hiding ownership?

If the answer is no, keep it in the owning module.

`shared/` must not become a dumping ground for convenience helpers.

Do not keep speculative shared code:

- Remove unused shared types.
- Remove unused shared utilities.
- Avoid barrel index files in `shared/` unless there is a clear import ergonomics need.

## Query and Persistence Rule

- Keep SQL in repositories.
- Keep repository methods explicit.
- Pass scoping values such as `merchantId` explicitly.
- Let services coordinate multi-repository workflows.

If a workflow writes across multiple tables, transaction ownership belongs in the service layer.

Repository contract:

- Use concise method names for standard non-transactional reads.
- Use explicit transactional variants only when the read must run on the same transaction connection.
- Make write methods accept the DB executor explicitly.
- Keep repository ownership explicit.
- Do not mix writes for unrelated owned tables in one repository.

Examples of intended patterns:

- Standard read: `getOneById(id)`
- Merchant-scoped read: `getAllByMerchantId(merchantId)`
- Transactional read: `getOneByIdTx(db, id)`
- Write method: `insert(db, payload)`
- Write method: `updateById(db, id, payload)`
- Write method: `updatePasswordById(db, id, password)`

Repository type contract:

- Query result should return `*Row | null` for single-record lookup.
- Write payload should use explicit `*InsertPayload` or `*UpdatePayload`.
- Repository methods should not return HTTP-specific shapes.

DB client rule:

- Keep the shared DB client and transaction helpers under `src/core/db/`.
- Do not create separate DB clients for transactional and non-transactional flows.

## Validation Rule

Validation is split by concern:

- Request-shape validation belongs near the route or schema layer.
- Business validation belongs in services.
- Data integrity constraints belong in the database schema.

Do not hide business validation in controllers or repositories.

## Transaction Rule

Use manual transaction handling for multi-step write workflows.

Typical rules:

1. Start transactions in services only.
2. Do not hide transaction control inside repositories.
3. Do not let controllers start transactions.
4. Use transactions when multiple writes must succeed together.
5. Keep transactional intent explicit in code review.

## Error Handling Rule

Use one simple application error model.

Recommended structure:

```text
src/core/errors/
  app-error.ts

src/core/middleware/
  error-handler.middleware.ts

src/shared/constants/
  error-codes.constant.ts
  messages.constant.ts
```

Use explicit naming for shared error constants:

- `APP_ERROR_CODES`
- `APP_ERROR_STATUS_BY_CODE`
- `APP_ERROR_MESSAGES`

`AppError` should stay minimal and explicit.

Recommended fields:

- `code`
- `message`
- `statusCode`
- `details?`

Use helper factories as the standard way to throw application errors.

Recommended helpers:

- `validationError`
- `unauthorizedError`
- `forbiddenError`
- `notFoundError`
- `conflictError`
- `internalError`

Service error rule:

- Services should throw the helper that matches the business case directly.
- Known business errors should not be wrapped in `internalError`.
- If a transaction is active, rollback first when needed.
- Rethrow existing `AppError` instances as-is.
- Convert to `internalError` only for unknown failures or unexpected internal errors.

Typical intent:

- `validationError` for invalid business input or invalid state transitions
- `unauthorizedError` for authentication failures
- `forbiddenError` for access-denied cases
- `notFoundError` for missing resources
- `conflictError` for duplicate or conflicting state
- `internalError` as the fallback for unknown failures

Auth-specific intent:

- Use `invalidTokenError` for malformed or unverifiable tokens.
- Use `tokenExpiredError` for expired tokens.
- Keep `unauthorizedError` for missing login or generic auth-required state.

Global error handler rule:

- Detect `AppError`
- Fallback to `500` for unknown failures

The global error handler must not contain business rules.

Avoid these error-handling anti-patterns:

- Catching every service error and converting everything to `500`
- Returning HTTP error responses directly from services
- Creating deep error hierarchies without practical value
- Logging sensitive data such as passwords or tokens

## Documentation Rule

Write new engineering guidance in `docs/engineering`.

Keep engineering docs short, stable, and decision-oriented.

Do not use engineering docs to introduce new product behavior that is not backed by the schema or screen lists.

## Summary

The coding rules are simple:

- Keep ownership explicit
- Keep layers disciplined
- Keep naming consistent
- Keep modules cohesive
- Keep business rules out of infrastructure layers

If a change makes the code harder to place, explain, or review, it probably needs a simpler design.
