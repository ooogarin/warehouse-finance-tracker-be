# Testing Strategy

## Goal

Add tests in the same direction as the new architecture so regression risk stays low while modules grow.

## Priorities

1. auth behavior
2. merchant access boundary
3. transaction-sensitive workflows
4. inventory and cash calculations

## Test Levels

### Unit Tests

Focus on:

- service business rules
- error behavior
- pure utility functions

### Integration Tests

Focus on:

- route + middleware + controller + service + repository flow
- merchant-scoped request handling
- transaction success and rollback cases

## Recommended Early Coverage

- `auth.service`
- `auth.routes`
- merchant middleware
- supplier CRUD under merchant scope
- purchase order write flow
- stock usage and waste flow
- debt payment flow

## Rule

When a workflow updates more than one table, it should have at least one integration test for success and one for rollback behavior.
