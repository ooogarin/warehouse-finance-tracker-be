# Architecture Overview

## Bun + Hono + PostgreSQL + Zod + Raw SQL + TypeScript

---

## Documentation Index

This document serves as an index for all architecture documentation. Each topic is documented in its own file for easier navigation and maintenance.

---

## Core Documentation

| Document                                  | Description                                                    |
| ----------------------------------------- | -------------------------------------------------------------- |
| [Tech Stack](./TECH_STACK.md)             | Core technologies, built-in Bun modules, external dependencies |
| [Folder Structure](./FOLDER_STRUCTURE.md) | Complete directory tree with descriptions                      |
| [Layer Overview](./LAYER_OVERVIEW.md)     | Architecture layers and responsibilities                       |
| [Workflow](./WORKFLOW.md)                 | Request flow through layers                                    |

---

## Layer Documentation

| Document                                  | Description                                       |
| ----------------------------------------- | ------------------------------------------------- |
| [Route Layer](./ROUTE_LAYER.md)           | HTTP endpoint definitions, middleware application |
| [Controller Layer](./CONTROLLER_LAYER.md) | HTTP request/response handling                    |
| [Service Layer](./SERVICE_LAYER.md)       | Business logic, transactions, error handling      |
| [Repository Layer](./REPOSITORY_LAYER.md) | Database operations, SQL patterns, transactions   |

---

## Data & Validation

| Document                    | Description                                        |
| --------------------------- | -------------------------------------------------- |
| [Types](./TYPES.md)         | TypeScript type definitions and naming conventions |
| [Validator](./VALIDATOR.md) | Zod schemas, field ordering, validation patterns   |

---

## Infrastructure

| Document                              | Description                                 |
| ------------------------------------- | ------------------------------------------- |
| [Configuration](./CONFIGURATION.md)   | Environment variables, database config      |
| [Logging](./LOGGING.md)               | Pino logger, log levels, structured logging |
| [Error Handling](./ERROR_HANDLING.md) | Error classes, middleware, response format  |
| [Migration](./MIGRATION.md)           | Database migrations, scripts, seeding       |

---

## Quality Assurance

| Document                                                  | Description                                  |
| --------------------------------------------------------- | -------------------------------------------- |
| [Testing](./TESTING.md)                                   | Unit tests, integration tests, test fixtures |
| [Linter and Formatter](./LINTER_AND_FORMATTER.md)         | Biome configuration, code style rules        |
| [Rules and Best Practices](./RULES_AND_BEST_PRACTICES.md) | DOs and DON'Ts, naming conventions           |

---

## Quick Reference

### Architecture Layers

```
Request → Routes → Controller → Service → Repository → Database
```

### File Naming

| Type         | Pattern           |
| ------------ | ----------------- |
| Routes       | `*.routes.ts`     |
| Controllers  | `*.controller.ts` |
| Services     | `*.service.ts`    |
| Repositories | `*.repository.ts` |
| Types        | `*.types.ts`      |
| Validators   | `*.schemas.ts`    |

### Key Principles

1. **Separate concerns** - Each layer has one responsibility
2. **No business logic in controllers** - Delegate to services
3. **No SQL in services** - Use repositories
4. **Return raw data from services** - Format in controllers
5. **Use parameterized queries** - Prevent SQL injection
6. **Soft delete** - Set `deleted_at`, don't hard delete
7. **Log with context** - Use module-specific loggers

### Response Format

```typescript
// Success
{
  "success": true,
  "message": "...",
  "data": {...}
}

// Error
{
  "success": false,
  "error": {
    "code": "...",
    "message": "..."
  }
}
```

---

## Getting Started

1. Read [Tech Stack](./TECH_STACK.md) to understand the technologies
2. Review [Folder Structure](./FOLDER_STRUCTURE.md) to navigate the codebase
3. Study [Layer Overview](./LAYER_OVERVIEW.md) to understand the architecture
4. Check [Rules and Best Practices](./RULES_AND_BEST_PRACTICES.md) for conventions

---

## Related Documentation

- [Database Schema](./DATABASE_SCHEMA.md) - Complete database schema
- [API Documentation](../API.md) - API endpoints reference
- [Setup Guide](../SETUP.md) - Development setup instructions
