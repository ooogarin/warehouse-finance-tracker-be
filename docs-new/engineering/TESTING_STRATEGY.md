# Testing Strategy

## Purpose

This document defines the testing direction for the backend codebase.

The goal is to keep regression risk low while the codebase evolves toward the target architecture.

## Source of Truth

For product behavior and persistence rules, the primary source of truth is:

1. `docs-new/data/DATABASE_SCHEMA.md`
2. `docs-new/engineering/screen-lists/`

This document defines testing priorities, not product behavior.

## Testing Priorities

Prioritize tests in this order:

1. Authentication behavior
2. Merchant access boundaries
3. Transaction-sensitive workflows
4. Inventory, debt, and cash calculations

## Test Levels

### Unit Tests

Unit tests should focus on:

- Service business rules
- Error behavior
- Pure utility functions
- Small isolated logic that does not require full request flow coverage

### Integration Tests

Integration tests should focus on:

- Route, middleware, controller, service, repository, and database flow
- Merchant-scoped request handling
- Transaction success and rollback behavior
- Multi-table workflows with important side effects

## Coverage Direction

Recommended early coverage includes:

- `auth` behavior
- Merchant middleware and merchant access checks
- Supplier CRUD under merchant scope
- Purchase order write flow
- Stock usage and stock waste flows
- Debt payment flow

## High-Risk Workflows

The following workflows should be treated as high-risk and should receive integration coverage early:

- Onboarding completion
- Purchase order creation
- Stock usage writes
- Stock waste writes
- Stock adjustment writes
- Debt payment writes

These workflows are high-risk because they coordinate multiple writes or update derived business state.

## Testing Rules

- When a workflow updates more than one table, it should have at least one integration test for success.
- When a workflow updates more than one table, it should also have at least one integration test for rollback behavior.
- Business rules should be testable from the service layer without depending on controller logic.
- Merchant-scoped access checks should be covered explicitly, not assumed indirectly.

## Scope Guidance

Prefer unit tests when:

- The rule is isolated
- The logic is deterministic
- The risk is local to one function or service

Prefer integration tests when:

- The request crosses multiple layers
- Merchant scoping is involved
- A transaction is involved
- More than one table is updated

## Summary

The testing strategy is simple:

- Test business rules at the smallest useful level
- Add integration coverage for workflows with real cross-layer risk
- Prioritize merchant boundaries and transactional safety

If a workflow can leave data inconsistent when it fails, it should not rely on unit tests alone.
