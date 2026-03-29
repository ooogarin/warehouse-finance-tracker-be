# Request Flow

## Purpose

This document defines the standard flow of a backend request through the application layers.

It exists to keep request handling predictable and to prevent boundary violations between routes, controllers, services, and repositories.

## Source of Truth

For product behavior and persistence rules, the primary source of truth is:

1. `docs-new/data/DATABASE_SCHEMA.md`
2. `docs-new/engineering/screen-lists/`

This document does not define product behavior. It defines how requests should move through the backend.

## Default Request Lifecycle

The default lifecycle is:

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

This is the normal path unless a very specific case requires a deviation.

## Flow Variants

### Public Flow

Use this for flows that do not require authentication.

Typical path:

```text
request
-> route validation
-> controller
-> service
-> repository
-> response
```

### Authenticated Non-Merchant Flow

Use this for authenticated account-level behavior that does not depend on merchant context.

Typical path:

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

Use this for operational behavior that must run inside a merchant boundary.

Typical path:

```text
request
-> authenticate
-> resolve merchant context
-> route validation
-> controller
-> service
-> repository
-> response
```

Merchant context resolution belongs in middleware.

## Layer Responsibilities

### Route

Routes should:

- Declare endpoints
- Attach middleware
- Attach validation
- Delegate to controllers

Routes must not:

- Implement business rules
- Execute SQL
- Start transactions

### Controller

Controllers should:

- Read params, query, headers, and body
- Read request context populated by middleware
- Call services
- Return formatted HTTP responses

Controllers must not:

- Implement business rules
- Access the database directly
- Start or manage transactions

### Service

Services should:

- Enforce business rules
- Orchestrate repository calls
- Manage transactions when needed
- Throw business-level errors

Services must not:

- Format HTTP responses
- Depend on Hono `Context`
- Contain raw SQL

### Repository

Repositories should:

- Execute parameterized SQL
- Map rows to data structures
- Accept scoping inputs explicitly
- Stay focused on persistence

Repositories must not:

- Read HTTP context directly
- Implement business rules
- Decide transaction boundaries

## Validation Placement

Validation is split by concern:

- Request-shape validation belongs at the route or schema layer
- Business validation belongs in services
- Database integrity constraints belong in the database schema

Do not push business validation into controllers or repositories.

## Merchant Context Rule

When a flow is merchant-scoped:

- Merchant context must be resolved before controller execution
- Services must receive the merchant scope explicitly
- Repositories must accept `merchantId` explicitly where required

Merchant scoping must not rely on hidden global state.

The merchant middleware should:

- Read the merchant identifier from the request
- Validate the merchant identifier format
- Verify that the authenticated user has access to that merchant
- Store merchant context for downstream controller and service use

## Transaction Rule

Transactions belong in services.

Use them when a workflow writes across multiple tables and partial success would leave business data inconsistent.

Typical examples include:

- Onboarding completion
- Purchase order creation
- Stock movement writes
- Debt payment flows

Controllers and repositories must not start transactions.

## Error Flow Rule

Errors should move through the stack in a controlled way:

- Services throw business-level errors
- Repositories may surface persistence failures
- The global error handler converts known errors into HTTP responses

Do not convert every failure into a generic internal error too early.

## Anti-Patterns

Avoid these patterns:

- Controller calling repository directly
- Middleware implementing domain logic
- Repository reading request context
- Service formatting HTTP responses
- Transaction control inside controllers
- Hidden merchant scoping

## Summary

The purpose of request flow rules is simple:

- Keep request handling predictable
- Keep each layer focused on one responsibility
- Keep merchant scoping explicit
- Keep transaction ownership in services

If a request flow becomes hard to explain in these terms, the design is probably drifting.
