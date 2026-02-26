# Rules and Best Practices

## Overview

This document consolidates all rules, conventions, and best practices for the project.

---

## DO (Best Practices)

### Architecture

- ✅ **Separate concerns**: Routes ≠ Controllers ≠ Services ≠ Repositories
- ✅ **Keep layers focused**: Each layer has one responsibility
- ✅ **Test each layer independently**
- ✅ **Use TypeScript strictly**, avoid `any` and `unknown` without need
- ✅ **Document complex logic** (comments, `.md` files, `docs/` folder)

### Routes

- ✅ **Keep routes thin and declarative**
- ✅ **Delegate to controllers**
- ✅ **Apply middleware at route level**
- ✅ **Use validation middleware (Zod)**
- ✅ **Group routes by version/access level**

### Controllers

- ✅ **Extract parameters from HTTP context**
- ✅ **Call service methods**
- ✅ **Format HTTP responses**
- ✅ **Let errors propagate to error handler**
- ✅ **Return using response utilities** (`successResponse`)

### Services

- ✅ **Implement business logic**
- ✅ **Validate business rules**
- ✅ **Call repositories**
- ✅ **Return raw data** (NOT formatted responses)
- ✅ **Throw business errors** (`notFoundError`, `validationError`)
- ✅ **Use implicit transactions for multi-step operations**
- ✅ **Log business events**

### Repositories

- ✅ **Write raw SQL with parameterized queries**
- ✅ **Use explicit field selection** (no `SELECT *`)
- ✅ **Return raw database data**
- ✅ **Support transaction connection parameter**
- ✅ **Check `deleted_at IS NULL` for soft deletes**
- ✅ **Use built in Bun SQL**
- ✅ **Bun already safety from SQL injection**
- ✅ **Payload is always JSON**, Bun handle it automatically

### Database

- ✅ **Create indexes on foreign keys**
- ✅ **Use soft deletes** (set `deleted_at` instead of hard delete)
- ✅ **Start transactions before data operations**
- ✅ **Use built in Bun SQL**

### Types

- ✅ **Define in `types` folder**
- ✅ **Define types for each layer**
- ✅ **Use consistent naming conventions**
- ✅ **Export types individually**

### Validation

- ✅ **Use Zod schemas for runtime validation**
- ✅ **Order fields following database schema**
- ✅ **Use descriptive error messages**
- ✅ **Reuse common schemas**

### Error Handling

- ✅ **Throw specific errors** (`notFoundError`, `validationError`)
- ✅ **Let errors propagate** to error handler middleware
- ✅ **Use appropriate error types**
- ✅ **Log errors with context**

### Logging

- ✅ **Use module-specific loggers**
- ✅ **Include relevant context** in log entries
- ✅ **Use appropriate log levels**
- ✅ **Use consistent field names**

### Code Style

- ✅ **Use English for comments and variable names**
- ✅ **Import at the top of file**
- ✅ **Use path aliases** (`@/` prefix)

### Comment Style

- ✅ **Use English for comments and variable names**
- ✅ **Use singgle line comment for simple explanation**
- ✅ **Use multi line comment for complex explanation**

---

## DON'T (Anti-Patterns)

### Architecture

- ❌ **Mix HTTP & business logic**
- ❌ **Call repositories from controllers**
- ❌ **Put business logic in controllers**
- ❌ **Call DB directly from routes or controllers**
- ❌ **Use `any` types**

### Routes

- ❌ **Put business logic in routes**
- ❌ **Handle errors in routes**
- ❌ **Validate in routes** (use middleware)
- ❌ **Register generic routes before specific ones**

### Controllers

- ❌ **Put business logic in controllers**
- ❌ **Call repositories directly**
- ❌ **Handle errors manually** (let middleware handle)
- ❌ **Return raw database objects without formatting**

### Services

- ❌ **Return formatted HTTP responses**
- ❌ **Handle HTTP errors**
- ❌ **Write SQL queries**
- ❌ **Access request context**

### Repositories

- ❌ **Use string interpolation in SQL** (SQL injection risk)
- ❌ **Use `SELECT *`**
- ❌ **Forget to check `deleted_at`**
- ❌ **Include business logic**

### Database

- ❌ **Hardcode configuration**
- ❌ **Skip input validation**
- ❌ **Hard delete records**
- ❌ **Forget indexes on foreign keys**

### Types

- ❌ **Reuse types across layers incorrectly**
- ❌ **Use `any` type**
- ❌ **Mix naming conventions**

### Validation

- ❌ **Ignore field ordering**
- ❌ **Use generic error messages**
- ❌ **Forget coercion for query params**

### Error Handling

- ❌ **Catch and swallow errors**
- ❌ **Return error responses in services**
- ❌ **Use generic error messages**

### Logging

- ❌ **Use `console.log`**
- ❌ **Log sensitive data** (passwords, tokens)
- ❌ **Log without context**

### Code Style

- ❌ **Commit `.env` files**
- ❌ **Make files too large**
- ❌ **Hardcode values that should be config**

---

## Naming Conventions

### Files

| Type         | Pattern           | Example                     |
| ------------ | ----------------- | --------------------------- |
| Routes       | `*.routes.ts`     | `merchants.routes.ts`       |
| Controllers  | `*.controller.ts` | `merchants.controller.ts`   |
| Services     | `*.service.ts`    | `merchants.service.ts`      |
| Repositories | `*.repository.ts` | `merchants.repository.ts`   |
| Types        | `*.types.ts`      | `merchants.types.ts`        |
| Validators   | `*.schemas.ts`    | `merchants.schemas.ts`      |
| Middleware   | `*.middleware.ts` | `auth.middleware.ts`        |
| Constants    | `*.constant.ts`   | `messages.constant.ts`      |
| Config       | `*.config.ts`     | `database.config.ts`        |
| Tests        | `*.test.ts`       | `merchants.service.test.ts` |

### Functions

| Layer      | Pattern                                                  | Example        |
| ---------- | -------------------------------------------------------- | -------------- |
| Controller | `getAll`, `getOneById`, `create`, `update`, `delete`     | `getAll`       |
| Service    | `getAll*`, `getOneById`, `create`, `update`, `delete`    | `getAllByUser` |
| Repository | `getOne*`, `getAll*`, `insert`, `update*`, `softDelete*` | `getOneById`   |

### Types

| Layer         | Pattern                          | Example                        |
| ------------- | -------------------------------- | ------------------------------ |
| API Request   | `<Object>Api<Action>RequestBody` | `MerchantApiCreateRequestBody` |
| API Response  | `<Object>ApiResponse`            | `MerchantApiResponse`          |
| Service Input | `<Object>Service<Action>Input`   | `MerchantServiceCreateInput`   |
| DB Payload    | `<Object>Db<Action>Payload`      | `MerchantDbInsertPayload`      |
| DB Model      | `<Object>`                       | `Merchant`                     |

### Variables

- Use **camelCase** for variables and functions
- Use **PascalCase** for types and classes
- Use **lower_snake_case** for request, response, and database field
- Use **UPPER_SNAKE_CASE** for constants

---

## Transaction Rules

### When to Use Transactions

- Multiple insert/update operations that must succeed together
- Operations that modify related data
- Any operation where partial failure would cause inconsistency

### Transaction Pattern

Use manual/implicit transactions pattern (`start -> doing something -> commit/rollback`)

```typescript
let connection: Connection | null = null;

try {
  // Do validations first (no transaction needed)
  await validateData(data);

  // Start transaction right before data operations
  connection = await startTransaction();

  // Perform DB operations
  const result = await repository.insert(connection, data);
  await otherRepository.insert(connection, relatedData);

  // Commit transaction
  await commitTransaction(connection);

  return result;
} catch (error) {
  // Rollback on error
  if (connection) {
    await rollbackTransaction(connection);
  }
  throw error;
}
```

### Transaction Don'ts

- ❌ Don't start transaction too early
- ❌ Don't forget to rollback on error
- ❌ Don't forget to check if connection exists before rollback

---

## SQL Query Rules

### Required

```sql
-- Use explicit fields with default parameterized queries. Bun already safety from SQL injection
SELECT id, name, email FROM users WHERE id = {id};

-- Check soft delete
SELECT id, name, email FROM users WHERE id = {id} AND deleted_at IS NULL;

-- Create indexes for foreign keys
CREATE INDEX idx_suppliers_merchant ON suppliers(merchant_id);
```

### Forbidden

```sql
-- SELECT *
SELECT * FROM users;  -- ❌ Avoid

-- Missing soft delete check
SELECT * FROM users WHERE id = {id};  -- ❌ Missing deleted_at check
```

---

## Import Rules

### Order

```typescript
// 1. External packages
import { Hono } from "hono";
import { z } from "zod";

// 2. Internal packages (using aliases)
import { env } from "@/config/env.config";
import { logger } from "@/config/logger.config";

// 3. Types
import type { User } from "@/types/auth.types";
import type { Context } from "hono";

// 4. Relative imports (avoid when possible)
import { helper } from "./utils";
```

### Use Path Aliases

```typescript
// ✅ Use @ alias
import { env } from "@/config/env.config";

// ❌ Don't use relative paths for distant files
import { env } from "../../config/env.config";
```

---

## Related Documentation

- [Layer Overview](./LAYER_OVERVIEW.md) - Layer responsibilities
- [Error Handling](./ERROR_HANDLING.md) - Error handling patterns
- [Validator](./VALIDATOR.md) - Zod validation
- [Logging](./LOGGING.md) - Logging patterns
- [Linter and Formatter](./LINTER_AND_FORMATTER.md) - Code style
