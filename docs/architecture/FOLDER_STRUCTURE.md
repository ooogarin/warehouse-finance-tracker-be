# Folder Structure

## Overview

This document describes the project's directory structure and the purpose of each folder/file.

---

## Complete Directory Tree

```
warehouse-api/
│
├── src/                                      ← Source code (main application)
│   │
│   ├── index.ts                              ← Entry point - starts the server
│   │
│   ├── config/                               ← Configuration files
│   │   ├── database.config.ts                ← PostgreSQL connection pool config
│   │   ├── env.config.ts                     ← Environment variables (Zod validated)
│   │   └── logger.config.ts                  ← Pino logger configuration
│   │
│   ├── constants/                            ← Application constants
│   │   ├── messages.constant.ts              ← User-facing messages
│   │   ├── error-codes.constant.ts           ← Error code definitions
│   │   └── roles.constant.ts                 ← User role definitions
│   │
│   ├── controllers/                          ← HTTP Request Handlers
│   │   ├── index.ts                          ← Re-export all controllers
│   │   ├── auth.controller.ts                ← Authentication endpoints
│   │   ├── health.controller.ts              ← Health check endpoints
│   │   ├── merchants.controller.ts           ← Merchant CRUD operations
│   │   ├── suppliers.controller.ts           ← Supplier CRUD operations
│   │   ├── ingredients.controller.ts         ← Ingredient management
│   │   └── ...                               ← Other controllers
│   │
│   ├── middleware/                           ← HTTP Middleware
│   │   ├── error-handler.middleware.ts       ← Global error handler
│   │   ├── auth.middleware.ts                ← JWT authentication
│   │   ├── merchant.middleware.ts            ← Merchant context loader
│   │   ├── role.middleware.ts                ← Role-based access control
│   │   ├── validation.middleware.ts          ← Request validation
│   │   ├── metrics.middleware.ts             ← Request metrics
│   │   ├── request-id.middleware.ts          ← Request ID tracking
│   │   └── timeout.middleware.ts             ← Request timeout handler
│   │
│   ├── repositories/                         ← Database Access Layer
│   │   ├── client.ts                         ← DB client (pool, query execution, transaction)
│   │   ├── users.repository.ts               ← User data operations
│   │   ├── merchants.repository.ts           ← Merchant data operations
│   │   ├── suppliers.repository.ts           ← Supplier data operations
│   │   ├── ingredients.repository.ts         ← Ingredient data operations
│   │   ├── purchase-orders.repository.ts     ← PO data operations
│   │   └── ...                               ← Other repositories
│   │
│   ├── routes/                               ← HTTP Endpoint Definitions
│   │   ├── index.ts                          ← Register all route groups
│   │   │
│   │   ├── public/                           ← Public routes (no auth required)
│   │   │   ├── index.ts                      ← Register public routes
│   │   │   └── auth.routes.ts                ← Login, register, refresh
│   │   │
│   │   ├── internal/                         ← Internal routes (health checks)
│   │   │   ├── index.ts                      ← Register internal routes
│   │   │   └── health.routes.ts              ← Health check endpoints
│   │   │
│   │   └── v1/                               ← API v1 routes (auth required)
│   │       ├── index.ts                      ← Register v1 routes
│   │       ├── merchants.routes.ts           ← Merchant endpoints
│   │       ├── suppliers.routes.ts           ← Supplier endpoints
│   │       ├── ingredients.routes.ts         ← Ingredient endpoints
│   │       ├── purchase-orders.routes.ts     ← PO endpoints
│   │       ├── ingredient-units.routes.ts    ← Unit endpoints
│   │       └── dashboard.routes.ts           ← Dashboard endpoints
│   │
│   ├── services/                             ← Business Logic Layer
│   │   ├── auth.service.ts                   ← Authentication logic
│   │   ├── merchants.service.ts              ← Merchant business logic
│   │   ├── suppliers.service.ts              ← Supplier business logic
│   │   ├── ingredients.service.ts            ← Ingredient business logic
│   │   ├── purchase-orders.service.ts        ← PO business logic
│   │   ├── fifo.service.ts                   ← FIFO calculation logic
│   │   ├── ingredient-units.service.ts       ← Unit conversion logic
│   │   └── dashboard.service.ts              ← Dashboard aggregation
│   │
│   ├── types/                                ← TypeScript Type Definitions
│   │   ├── context.types.ts                  ← Hono context types
│   │   ├── auth.types.ts                     ← Auth-related types
│   │   ├── merchants.types.ts                ← Merchant types
│   │   ├── suppliers.types.ts                ← Supplier types
│   │   ├── ingredients.types.ts              ← Ingredient types
│   │   ├── purchase-orders.types.ts          ← PO types
│   │   └── ingredient-units.types.ts         ← Unit types
│   │
│   ├── utils/                                ← Utility Functions
│   │   ├── response.util.ts                  ← API response formatters
│   │   ├── errors.util.ts                    ← Custom error classes
│   │   ├── database.util.ts                  ← DB helper functions
│   │   ├── date.util.ts                      ← Date utilities
│   │   └── jwt.util.ts                       ← JWT utilities
│   │
│   └── validators/                           ← Zod Validation Schemas
│       ├── index.ts                          ← Re-export all schemas
│       ├── common.schemas.ts                 ← Shared schemas (pagination, etc.)
│       ├── auth.schemas.ts                   ← Auth validation schemas
│       ├── merchants.schemas.ts              ← Merchant validation schemas
│       ├── suppliers.schemas.ts              ← Supplier validation schemas
│       ├── ingredients.schemas.ts            ← Ingredient validation schemas
│       ├── purchase-orders.schemas.ts        ← PO validation schemas
│       └── ingredient-units.schemas.ts       ← Unit validation schemas
│
├── tests/                                    ← Test Files
│   ├── unit/                                 ← Unit tests (isolated)
│   │   ├── controllers/                      ← Controller tests
│   │   │   └── merchants.controller.test.ts
│   │   ├── services/                         ← Service tests
│   │   │   └── merchants.service.test.ts
│   │   ├── repositories/                     ← Repository tests
│   │   │   └── merchants.repository.test.ts
│   │   └── utils/                            ← Utility tests
│   │       └── response.util.test.ts
│   │
│   ├── integration/                          ← Integration tests (full flow)
│   │   └── merchants.integration.test.ts
│   │
│   ├── fixtures/                             ← Test fixtures
│   │   ├── db.ts                             ← Test database setup
│   │   ├── factory.ts                        ← Test data factory
│   │   └── mocks.ts                          ← Mock data & functions
│   │
│   └── setup.ts                              ← Global test configuration
│
├── migrations/                               ← Database Migrations
│   ├── 001_create_initial_schema.sql         ← Initial DB schema
│   ├── 002_add_unknown_supplier.sql          ← Add supplier changes
│   ├── 003_add_po_status.sql                 ← Add PO status
│   └── up.ts                                 ← Migration runner
│
├── scripts/                                  ← Utility Scripts
│   ├── migrate.ts                            ← Run migrations
│   ├── seed.ts                               ← Seed database
│   ├── reset-db.ts                           ← Reset database (dev only!)
│   └── migrate-rollback.ts                   ← Rollback migrations
│
├── config/                                   ← Config Files
│   ├── tsconfig.json                         ← TypeScript configuration
│   ├── biome.json                            ← Linter & formatter config
│   └── bunfig.toml                           ← Bun runtime config
│
├── docs/                                     ← Documentation
│   ├── api/                                  ← API documentation
│   ├── SETUP.md                              ← Setup instructions
│   └── architect/                            ← Architecture docs
│       ├── ARCHITECTURE_OVERVIEW.md          ← Main architecture index
│       └── ...                               ← Split architecture docs
│
├── .env.example                              ← Environment template
├── .env.local                                ← Local environment (gitignored)
├── .gitignore                                ← Git ignore rules
├── package.json                              ← Project metadata & scripts
├── bun.lockb                                 ← Lock file
├── README.md                                 ← Project readme
└── LICENSE                                   ← License file
```

---

## Directory Purposes

### `/src` - Source Code

| Directory       | Responsibility                                     |
| --------------- | -------------------------------------------------- |
| `config/`       | Application configuration (env, database, logger)  |
| `constants/`    | Static values used throughout the app              |
| `controllers/`  | HTTP request handling, request/response formatting |
| `middleware/`   | Cross-cutting concerns (auth, logging, errors)     |
| `repositories/` | Database operations, raw SQL queries               |
| `routes/`       | HTTP endpoint definitions (declarative only)       |
| `services/`     | Business logic and orchestration                   |
| `types/`        | TypeScript type definitions                        |
| `utils/`        | Shared utility functions                           |
| `validators/`   | Zod validation schemas                             |

### `/tests` - Test Files

| Directory      | Type                          |
| -------------- | ----------------------------- |
| `unit/`        | Isolated tests for each layer |
| `integration/` | Full API flow tests           |
| `fixtures/`    | Test utilities and data       |

### `/migrations` - Database Migrations

SQL files for database schema changes, numbered for execution order.

### `/scripts` - Utility Scripts

Development and maintenance scripts (migrate, seed, reset).

### `/config` - Configuration Files

Application configuration (env, database, logger). Get values from environment variables.

### `/docs` - Documentation

Project documentation and architecture guides.

---

## Key Files

### Entry Point

```typescript
// src/index.ts
import { Hono } from "hono";
import { registerRoutes } from "./routes";

const app = new Hono();
registerRoutes(app);

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
};
```

---

## Naming Conventions

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

## Route Organization

Routes are organized by access level:

```
routes/
├── public/    ← No authentication required (login, register)
├── internal/  ← Internal use (health checks, metrics)
└── v1/        ← API version 1 (requires authentication)
```

### Example: Route Registration Flow

```typescript
// src/routes/index.ts
import { publicRoutes } from "./public";
import { internalRoutes } from "./internal";
import { v1Routes } from "./v1";

export const registerRoutes = (app: Hono) => {
  app.route("/public", publicRoutes);
  app.route("/internal", internalRoutes);
  app.route("/v1", v1Routes);
};
```

```typescript
// src/routes/v1/index.ts
import { merchantsRoutes } from "./merchants.routes";
import { suppliersRoutes } from "./suppliers.routes";

const app = new Hono();

app.route("/merchants", merchantsRoutes);
app.route("/suppliers", suppliersRoutes);

export { app as v1Routes };
```

---

## Import Paths

The project uses path aliases for clean imports:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Usage Examples

```typescript
// Instead of relative imports
import { env } from "../../config/env.config";
import { logger } from "../../config/logger.config";

// Use path aliases
import { env } from "@/config/env.config";
import { logger } from "@/config/logger.config";
```

---

## Related Documentation

- [Layer Overview](./LAYER_OVERVIEW.md) - How layers interact
- [Route Layer](./ROUTE_LAYER.md) - Route definitions
- [Controller Layer](./CONTROLLER_LAYER.md) - Request handling
- [Service Layer](./SERVICE_LAYER.md) - Business logic
- [Repository Layer](./REPOSITORY_LAYER.md) - Database access
