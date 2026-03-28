# Folder Structure

## Target Structure

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

## Rules

- `core/` is reserved for app-wide infrastructure and runtime concerns.
- `modules/` is the default place for business logic.
- `shared/` must stay small. If a file only serves one module, keep it inside that module.

## File Naming

- Routes: `*.routes.ts`
- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Repositories: `*.repository.ts`
- Schemas: `*.schema.ts`
- Types: `*.types.ts`
- Middleware: `*.middleware.ts`

## Module Layout

The default module layout is:

```text
modules/<module-name>/
  <module-name>.routes.ts
  <module-name>.controller.ts
  <module-name>.service.ts
  <module-name>.repository.ts
  <module-name>.schema.ts
  <module-name>.types.ts
```

## Sub-Module Layout

Use a nested folder only when the area has independent behavior or persistence rules.

Example:

```text
modules/ingredients/
  ingredients.service.ts
  units/
    ingredient-units.service.ts
    ingredient-units.repository.ts
    ingredient-units.schema.ts
    ingredient-units.types.ts
```
