# Coding Rules

## General Rules

- Use English for engineering documentation, code comments, variable names, and identifiers.
- Keep modules small and cohesive.
- Prefer explicit behavior over clever abstractions.
- Do not move business logic into controllers or middleware.

## Layer Rules

### Routes

- declarative only
- attach middleware
- attach validation
- delegate to controllers

### Controllers

- extract request input
- read request context
- call services
- send formatted responses

### Services

- enforce business rules
- orchestrate repositories
- manage transactions when needed
- throw business errors

### Repositories

- execute SQL only
- select explicit columns
- enforce tenant filters through method inputs
- avoid business logic

## File Size Rule

When a module file becomes difficult to scan, split it by use case or sub-module.

Examples:

- split `stock.service.ts` into `stock-in.service.ts`, `stock-usage.service.ts`, and others
- split `merchants` config behavior into `merchants/config/`

## Shared Rule

Before adding something to `shared/`, ask:

1. Is this used by multiple modules today?
2. Is it not a core runtime concern?
3. Does moving it out actually reduce duplication without hiding ownership?

If the answer is no, keep it in the module.

## Docs Rule

Write new engineering guidance in `docs-new/engineering`.
Do not extend old architecture docs in `docs/architecture` unless there is a specific migration reason.
