# Error Handling

## Goal

Use one simple application error model that is easy to understand and hard to misuse.

## Core Design

Use a single `AppError` type with helper factories.

Recommended structure:

```text
src/core/errors/
  app-error.ts
  error-codes.ts
  error-factories.ts
  error-handler.ts
```

## AppError Contract

`AppError` should contain:

- `code`
- `message`
- `statusCode`
- `details?`

## Factory Helpers

Recommended helpers:

- `badRequestError`
- `unauthorizedError`
- `forbiddenError`
- `notFoundError`
- `conflictError`
- `internalError`

## Service Policy

Services may throw helper-based business errors directly.

When a service uses a transaction:

1. start transaction
2. execute DB operations
3. rollback on failure
4. rethrow the original error if it is already an `AppError`
5. convert to `internalError` only for unknown failures

This avoids losing semantic errors such as `401`, `404`, or `409`.

## Error Handler Policy

The global error handler should only do these things:

1. detect `AppError`
2. map validation errors to `400`
3. optionally map known DB errors
4. fallback to `500` for unknown errors

It should not contain business rules.

## Anti-Patterns

- Catching every service error and converting all of them to `500`
- Returning HTTP error responses directly from services
- Creating deep class hierarchies for errors without real value
- Logging sensitive data such as passwords or tokens
