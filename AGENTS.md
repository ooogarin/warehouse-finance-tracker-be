# AGENTS.md - Pengelola Modal Dapur (Warehouse & Finance Management API)

This file provides essential information for AI coding agents working on this project.

---

## Project Overview

**Pengelola Modal Dapur** is a Warehouse & Finance Management API designed for small-to-medium restaurants, cafes, and catering businesses. It helps owners track cash flow, manage inventory, handle supplier relationships, and monitor debts.

### Target Users

- Restaurant owners (10-50 employees)
- Cafes, catering services, food trucks
- Owners without financial background who need simple yet powerful tools

### Core Value Propositions

- **Simplicity**: Easy to use, minimal learning curve
- **Cash Leakage Prevention**: Track every transaction to stop money leaks
- **Stock Management**: FIFO tracking with expiry date awareness
- **Debt Management**: Clear tracking of supplier and owner debts
- **Real-time Insights**: Dashboard with actionable recommendations

---

## Technology Stack

| Technology     | Purpose                      |
| -------------- | ---------------------------- |
| **Bun**        | JavaScript runtime & toolkit |
| **Hono**       | Web framework                |
| **PostgreSQL** | Relational database          |
| **TypeScript** | Type-safe JavaScript         |
| **Zod**        | Runtime validation           |
| **Pino**       | Logging                      |

### Why This Stack?

- **Bun**: Fast, all-in-one toolkit with built-in TypeScript support, test runner, SQL client, password hashing, and JWT handling
- **Hono**: Lightweight (~14KB), type-safe, edge-ready web framework
- **PostgreSQL**: Battle-tested RDBMS with full SQL control (no ORM)
- **Zod**: Runtime validation with automatic TypeScript type inference

### Built-in Bun Modules Used

```typescript
// Use Bun's built-in alternatives (NO external packages needed)
import { password, JWT } from 'bun'; // Auth
const uuid = crypto.randomUUID(); // UUID generation
const env = process.env; // Auto-loaded .env
import { SQL } from 'bun'; // PostgreSQL client
```

---

## Project Architecture

### Layered Architecture

```
Request → Routes → Controller → Service → Repository → Database
                ↓              ↓            ↓
         Middleware    Error Handler   Transactions
```

| Layer            | Responsibility                                        | Key Rule                               |
| ---------------- | ----------------------------------------------------- | -------------------------------------- |
| **Routes**       | Define HTTP endpoints, apply middleware               | No business logic                      |
| **Controllers**  | Extract request data, call services, format responses | No business logic, no direct DB access |
| **Services**     | Business logic, validation, orchestration             | No SQL, return raw data                |
| **Repositories** | Raw SQL queries, database operations                  | No business logic                      |
| **Database**     | PostgreSQL with raw SQL                               | Soft deletes only                      |

### Request Flow

1. Route receives HTTP request and applies middleware (auth, validation)
2. Controller extracts parameters from request context
3. Service implements business logic and calls repositories
4. Repository executes raw SQL queries
5. Service returns raw data to controller
6. Controller formats HTTP response using response utilities

---

## Directory Structure

```
warehouse-api/
├── src/
│   ├── index.ts                    # Entry point - starts server
│   ├── config/                     # Configuration files
│   │   ├── database.config.ts      # PostgreSQL connection pool
│   │   ├── env.config.ts           # Environment variables (Zod validated)
│   │   └── logger.config.ts        # Pino logger configuration
│   ├── constants/                  # Application constants
│   │   ├── messages.constant.ts    # User-facing messages
│   │   ├── error-codes.constant.ts # Error code definitions
│   │   └── roles.constant.ts       # User role definitions
│   ├── controllers/                # HTTP Request Handlers
│   │   ├── index.ts                # Re-export all controllers
│   │   ├── auth.controller.ts
│   │   ├── merchants.controller.ts
│   │   ├── suppliers.controller.ts
│   │   ├── ingredients.controller.ts
│   │   ├── purchase-orders.controller.ts
│   │   └── ...
│   ├── middleware/                 # HTTP Middleware
│   │   ├── error-handler.middleware.ts   # Global error handler
│   │   ├── auth.middleware.ts      # JWT authentication
│   │   ├── merchant.middleware.ts  # Merchant context loader
│   │   ├── role.middleware.ts      # Role-based access control
│   │   └── validation.middleware.ts
│   ├── repositories/               # Database Access Layer
│   │   ├── client.ts               # DB client, transactions
│   │   ├── users.repository.ts
│   │   ├── merchants.repository.ts
│   │   └── ...
│   ├── routes/                     # HTTP Endpoint Definitions
│   │   ├── index.ts                # Register all route groups
│   │   ├── public/                 # No auth required (login, register)
│   │   ├── internal/               # Health checks
│   │   └── v1/                     # API v1 (auth required)
│   ├── services/                   # Business Logic Layer
│   │   ├── auth.service.ts
│   │   ├── merchants.service.ts
│   │   ├── suppliers.service.ts
│   │   ├── ingredients.service.ts
│   │   ├── purchase-orders.service.ts
│   │   └── fifo.service.ts         # FIFO calculation logic
│   ├── types/                      # TypeScript Type Definitions
│   │   ├── context.types.ts
│   │   ├── auth.types.ts
│   │   ├── merchants.types.ts
│   │   └── ...
│   ├── utils/                      # Utility Functions
│   │   ├── response.util.ts        # API response formatters
│   │   ├── errors.util.ts          # Custom error classes
│   │   └── database.util.ts
│   └── validators/                 # Zod Validation Schemas
│       ├── index.ts
│       ├── common.schemas.ts
│       ├── auth.schemas.ts
│       └── ...
├── tests/
│   ├── unit/                       # Unit tests (isolated)
│   ├── integration/                # Integration tests (full flow)
│   └── fixtures/                   # Test fixtures
├── migrations/                     # TypeScript Database Migrations
│   ├── 001_create_all_enums.ts
│   ├── 002_create_table_users.ts
│   └── ... (14 total)
├── scripts/                        # Utility Scripts
│   ├── migrate.ts
│   ├── seed.ts
│   └── reset-db.ts
├── docs/                           # Documentation
│   ├── PROJECT_OVERVIEW.md
│   ├── FEATURE_OVERVIEW.md
│   ├── USER_FLOWS_FE.md
│   └── architecture/               # Detailed architecture docs
├── config/
│   ├── tsconfig.json
│   ├── biome.json                  # Linter & formatter config
│   └── bunfig.toml
├── .env.example                    # Environment template
└── package.json
```

---

## File Naming Conventions

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

---

## Coding Standards & Best Practices

### DO ✅

```typescript
// 1. Separate concerns - Each layer has one responsibility
// Routes: Define endpoints only
merchants.get("/", merchantsController.getAll);

// Controllers: Extract params, call service, format response
export const getAll = async (c: Context<AppContext>) => {
  const userId = c.get("userId");
  const result = await merchantsService.getAllByUser(userId);
  return successResponse({ context: c, data: result });
};

// Services: Business logic, return raw data
export const getAllByUser = async (userId: string) => {
  const merchants = await merchantsRepository.getAllByUserId(userId);
  return merchants; // Raw data, NOT formatted response
};

// Repositories: Raw SQL, parameterized queries
export const getAllByUserId = async (userId: string): Promise<Merchant[]> => {
  return await query<Merchant>`
    SELECT id, name, type FROM merchants 
    WHERE user_id = ${userId} AND deleted_at IS NULL
  `;
};

// 2. Use explicit transaction pattern
let connection: Connection | null = null;
try {
  // Validate first (no transaction needed)
  await validateData(data);

  // Start transaction right before data operations
  connection = await startTransaction();

  // Perform DB operations
  const result = await repository.insert(connection, data);
  await otherRepository.insert(connection, relatedData);

  // Commit
  await commitTransaction(connection);
  return result;
} catch (error) {
  if (connection) {
    await rollbackTransaction(connection);
  }
  throw error;
}

// 3. Use proper error types
if (!merchant) {
  throw notFoundError(ERROR_MESSAGES.MERCHANT_NOT_FOUND);
}

// 4. Log with context
const logger = createLogger({ module: 'merchants-service' });
logger.info({ merchantId, userId }, 'Merchant created successfully');

// 5. Use path aliases
import { env } from '@/config/env.config';

// 6. Use block comment for multi-line explanation
/*
  This is a complex logic that needs explanation
  across multiple lines. Use this for:
  - Complex algorithms
  - Business rules
  - Non-obvious code behavior
*/

```

### DON'T ❌

```typescript
// 1. Don't put business logic in routes or controllers
merchants.get("/", async (c) => {
  const data = await db.query("SELECT * FROM merchants"); // ❌ Direct DB access
  return c.json(data);
});

// 2. Don't use SELECT *
await query<Merchant>`SELECT * FROM merchants`; // ❌ Be explicit

// 3. Don't forget soft delete check
await query<Merchant>`SELECT * FROM merchants WHERE id = ${id}`; // ❌ Missing deleted_at

// 4. Don't use console.log
console.log("Merchant created"); // ❌ Use logger

// 5. Don't return formatted responses from services
return { success: true, data: merchant }; // ❌ Services return raw data only

// 6. Don't use Array<T> syntax
const result: Array<{ id: string; name: string }> = []; // ❌ Use { id: string; name: string }[]

// 7. Don't use block comment for simple comment
/*
  This is a simple comment
*/

// Use single line comment instead
// This is a simple comment
```

---

## Database Schema Overview

### Core Entities

| Entity               | Description                                           |
| -------------------- | ----------------------------------------------------- |
| `users`              | Application users (owners, staff, cashiers)           |
| `merchants`          | Restaurants/cafes/businesses                          |
| `user_merchants`     | Many-to-many relationship between users and merchants |
| `suppliers`          | Suppliers for each merchant                           |
| `ingredients`        | Inventory items (bahan baku)                          |
| `ingredient_units`   | Unit conversions for ingredients                      |
| `ingredient_batches` | FIFO batch tracking for cost calculation              |
| `purchase_orders`    | Purchase orders to suppliers                          |
| `purchase_items`     | Line items in purchase orders                         |
| `stock_logs`         | Track all stock movements (in/use/waste/adjustment)   |
| `cash_logs`          | Track all cash transactions                           |
| `debts`              | Track debts to suppliers and owner withdrawals        |
| `debt_payments`      | Payment history for debts                             |

### Key Design Patterns

- **Soft Deletes**: All tables have `deleted_at` column; never hard delete
- **UUID Primary Keys**: All entities use UUID for IDs (app-generated)
- **Audit Trail**: `created_at`, `updated_at` on all tables
- **Multi-tenancy**: `merchant_id` filters all data per business
- **FIFO Cost Tracking**: `ingredient_batches` tracks purchase batches for accurate COGS

---

## Database Migrations

### Migration Files (TypeScript)

Migrations are written in TypeScript with `up` and `down` functions:

```typescript
// migrations/001_create_all_enums.ts
import type { SQL } from 'bun';

export const up = async (transaction: SQL): Promise<void> => {
  await transaction`CREATE TYPE user_role AS ENUM ('owner', 'staff', 'cashier')`;
  // ... more statements
};

export const down = async (transaction: SQL): Promise<void> => {
  await transaction`DROP TYPE IF EXISTS user_role CASCADE`;
  // ... reverse order
};
```

### Migration Principles

1. **One file per table/enum group** - Sequential numbering (001, 002, 003...)
2. **Both up() and down()** - Every migration must have both functions
3. **Sequential execution** - Statements run one-by-one in order
4. **Transaction per migration** - All-or-nothing execution
5. **No src/ dependency** - Migrations only import from `bun`
6. **snake_case everywhere** - Database columns use snake_case

### Migration Commands

```bash
bun run db:status              # Show pending/applied migrations
bun run db:migrate             # Run all pending up() functions
bun run db:rollback            # Rollback last down() function
bun run db:rollback --count=3  # Rollback 3 migrations
bun run db:reset               # Drop all tables (DEV ONLY!)
bun run db:seed                # Insert test data
```

---

## Error Handling

### Error Types

| Error               | Status | Use Case                 |
| ------------------- | ------ | ------------------------ |
| `ValidationError`   | 400    | Invalid input data       |
| `UnauthorizedError` | 401    | Authentication failure   |
| `ForbiddenError`    | 403    | Insufficient permissions |
| `NotFoundError`     | 404    | Resource not found       |
| `ConflictError`     | 409    | Duplicate resource       |
| `InternalError`     | 500    | Unexpected server error  |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name must be at least 2 characters"
      }
    ]
  }
}
```

### Error Handling Rule

- Services throw errors using custom error functions
- Controllers let errors propagate to error handler middleware
- Error handler middleware catches all errors and formats responses

---

## Response Format

### Success Response

```typescript
return successResponse({
  context: c,
  data: merchant,
  message: "Merchant created successfully", // optional
  statusCode: 201, // optional, default 200
  pagination: { page: 1, limit: 20, total: 100 }, // optional
});
```

```json
{
  "success": true,
  "data": { "id": "...", "name": "..." },
  "message": "Merchant created successfully",
  "pagination": { "page": 1, "limit": 20, "total": 100 },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-02-26T10:30:45.123Z"
  }
}
```

---

## Environment Configuration

Required environment variables in `.env`:

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=warehouse
DATABASE_NAME_TEST=warehouse_test

# Database Pool
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_CONNECTION_TIMEOUT=30000
DATABASE_IDLE_TIMEOUT=30000
DATABASE_STATEMENT_TIMEOUT=30000

# JWT
JWT_SECRET=your-super-secret-key-min-32-characters-long
JWT_EXPIRY=24h

# Logging
LOG_LEVEL=info
LOG_PRETTY=true
```

---

## Build & Development Commands

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Run tests
bun test

# Run linting
bun run lint

# Run formatter
bun run format

# Database migrations
bun run migrate
bun run migrate:rollback

# Seed database
bun run seed

# Reset database (development only!)
bun run db:reset
```

---

## Testing Strategy

### Unit Tests

- Test each layer in isolation
- Mock dependencies
- Located in `tests/unit/`

### Integration Tests

- Test full API flows
- Use test database
- Located in `tests/integration/`

### Test Database

- Separate test database (`warehouse_test`)
- Migrations run before tests
- Data cleaned up after each test

---

## Security Considerations

### Authentication

- JWT-based authentication
- Tokens expire after 24 hours (configurable)
- Passwords hashed with bcrypt (built-in Bun)

### Authorization

- Role-based access control (owner, staff, cashier)
- Merchant context validation via middleware
- Users can only access their assigned merchants

### Data Protection

- Sensitive fields redacted in logs (password, token, etc.)
- Parameterized queries prevent SQL injection
- Soft deletes preserve data integrity

### Secrets Management

- Never commit `.env` files
- JWT_SECRET must be at least 32 characters
- Database passwords strong and unique

---

## Key Documentation Files

| File                                            | Description                                 |
| ----------------------------------------------- | ------------------------------------------- |
| `docs/PROJECT_OVERVIEW.md`                      | Full product vision, features, user stories |
| `docs/FEATURE_OVERVIEW.md`                      | Feature specifications (Indonesian)         |
| `docs/USER_FLOWS_FE.md`                         | Frontend user flows and page specs          |
| `docs/architecture/ARCHITECTURE_OVERVIEW.md`    | Architecture index                          |
| `docs/architecture/TECH_STACK.md`               | Technology details                          |
| `docs/architecture/FOLDER_STRUCTURE.md`         | Directory structure                         |
| `docs/architecture/DATABASE_SCHEMA.md`          | Complete database schema                    |
| `docs/architecture/ROUTE_LAYER.md`              | Route patterns                              |
| `docs/architecture/CONTROLLER_LAYER.md`         | Controller patterns                         |
| `docs/architecture/SERVICE_LAYER.md`            | Service patterns                            |
| `docs/architecture/REPOSITORY_LAYER.md`         | Repository patterns                         |
| `docs/architecture/ERROR_HANDLING.md`           | Error handling patterns                     |
| `docs/architecture/TYPES.md`                    | TypeScript naming conventions               |
| `docs/architecture/VALIDATOR.md`                | Zod validation patterns                     |
| `docs/architecture/LOGGING.md`                  | Logging patterns                            |
| `docs/architecture/RULES_AND_BEST_PRACTICES.md` | Complete DOs and DON'Ts                     |

---

## Language Notes

- **Code**: English (variables, functions, comments)
- **Documentation**: English
- **User-facing messages**: English
- **Error messages**: English

## Code Style & Conventions

### Database Naming Convention

**CRITICAL**: Database fields use `snake_case` and **MUST** match TypeScript property names exactly. No camelCase transformation.

```typescript
// ✅ CORRECT - Database field names match TypeScript exactly
export interface User {
  id: UUID;
  email: string;
  full_name: string;    // snake_case matches database column
  created_at: string;   // snake_case matches database column
  deleted_at: string | null;
}

// ❌ WRONG - Do NOT use camelCase for database-mapped properties
export interface User {
  fullName: string;     // Wrong!
  createdAt: string;    // Wrong!
}
```

**Rule**: 
- Use `snake_case` for all database column names and their corresponding TypeScript interface properties
- Use `PascalCase` for Type/Interface names only
- Use `camelCase` for variables, functions, and methods

### Comment Style

Use appropriate comment style for the context:

```typescript
// ✅ Use // for simple/single-line comments
const userId = c.get('userId'); // Get user from context

// ✅ Use /** */ for JSDoc/documentation
/**
 * Authenticate user with JWT token
 * @param token - JWT token from Authorization header
 * @returns Decoded payload
 * @throws UnauthorizedError if token is invalid
 */
export const authenticate = async (token: string): Promise<JwtPayload> => {
  // ...
};

// ✅ Use block comment for multi-line explanations
/*
  This is a complex logic that needs explanation
  across multiple lines. Use this for:
  - Complex algorithms
  - Business rules
  - Non-obvious code behavior
*/
```

### Code Formatting

| Setting | Value |
|---------|-------|
| Quotes | Single (`'`) |
| Semicolons | Required |
| Indentation | 2 spaces |
| Line width | 140 characters |
| Trailing commas | ES5 style |

### Type Definitions

- **Complex types**: Define in `/types/*.types.ts` files
- **Simple inline types**: Can be defined directly in functions

```typescript
// ✅ Simple return type - inline is fine
const parsePagination = (query: { page?: string }): { page: number; limit: number } => {
  return { page: 1, limit: 20 };
};

// ✅ Complex type - define in types file
// In types/users.types.ts
export interface UserWithMerchants extends User {
  merchants: Merchant[];
  permissions: Permission[];
}
```

### Import Organization

Always place imports at the **top** of the file:

```typescript
// 1. External libraries
import { Hono } from 'hono';
import { z } from 'zod';

// 2. Internal types (type imports)
import type { User, Merchant } from '@/types/auth.types';

// 3. Internal modules
import { createLogger } from '@/config/logger.config';
import { ERROR_MESSAGES } from '@/constants/messages.constant';
```

---

## Quick Reference Checklist

Before committing code:

- [ ] Follows file naming conventions
- [ ] Each layer has single responsibility
- [ ] Services return raw data (not formatted responses)
- [ ] Repositories use parameterized queries
- [ ] Soft delete check (`deleted_at IS NULL`) on all queries
- [ ] Database field names use `snake_case` (match DB columns exactly)
- [ ] Proper error types used
- [ ] Logging with context (no console.log)
- [ ] Path aliases used (`@/` not `../../`)
- [ ] Types defined for each layer
- [ ] Single quotes for strings
- [ ] `//` for simple comments, `/** */` for JSDoc
- [ ] Tests written and passing

---

## Getting Help

If you need more context:

1. Check the relevant documentation in `docs/architecture/`
2. Look at existing implementations in the same layer
3. Follow the established patterns in the codebase
4. When in doubt, ask for clarification

---

**Last Updated**: 2026-02-26  
**Project Version**: 1.0  
**Status**: Active Development

---

## Changelog

### 2026-02-26
- Clarified database naming convention (snake_case must match TypeScript properties)
- Documented comment style guidelines (`//` vs `/** */` vs `/* */`)
- Added code formatting specifications
- Updated language policy (English only for all code and messages)
- Migrated from SQL to TypeScript migrations (up/down functions)
