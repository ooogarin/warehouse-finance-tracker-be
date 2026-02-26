# Configuration

## Overview

Configuration is managed through environment variables with Zod validation. All configuration files are in `src/config/`.

---

## File Structure

```
src/config/
├── env.config.ts          ← Environment variables (Zod validated)
├── database.config.ts     ← Database connection pool config
└── logger.config.ts       ← Logger configuration
```

---

## Environment Variables

### Environment File Template

```bash
# .env.example

# ============================================
# Server Configuration
# ============================================
NODE_ENV=development
PORT=3000

# ============================================
# Database Configuration
# ============================================
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=warehouse
DATABASE_NAME_TEST=warehouse_test

# ============================================
# Database Pool Configuration
# ============================================
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_CONNECTION_TIMEOUT=30000
DATABASE_IDLE_TIMEOUT=30000
DATABASE_STATEMENT_TIMEOUT=30000

# ============================================
# JWT Configuration
# ============================================
JWT_SECRET=your-super-secret-key-min-32-characters-long
JWT_EXPIRY=24h

# ============================================
# Logging Configuration
# ============================================
LOG_LEVEL=info
LOG_PRETTY=true
```

---

## Environment Configuration (env.config.ts)

```typescript
// src/config/env.config.ts
import { z } from "zod";

/**
 * Environment configuration schema
 * Validates all required environment variables at startup
 */
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z
    .enum(["development", "staging", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().min(1).max(65535).default(3000),

  // Database Configuration
  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().min(1).max(65535).default(5432),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
  DATABASE_NAME: z.string().min(1),
  DATABASE_NAME_TEST: z.string().min(1),

  // Database Pool Configuration
  DATABASE_POOL_MIN: z.coerce.number().min(0).default(2),
  DATABASE_POOL_MAX: z.coerce.number().min(1).default(10),
  DATABASE_CONNECTION_TIMEOUT: z.coerce.number().min(1000).default(30000),
  DATABASE_IDLE_TIMEOUT: z.coerce.number().min(1000).default(30000),
  DATABASE_STATEMENT_TIMEOUT: z.coerce.number().min(1000).default(30000),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRY: z.string().default("24h"),

  // Logging Configuration
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  LOG_PRETTY: z
    .string()
    .transform((val) => val === "true")
    .pipe(z.boolean())
    .default(true),
});

/**
 * Parsed and validated environment configuration
 * @throws {ZodError} If environment variables are invalid or missing
 */
export const env = envSchema.parse(process.env);

// Type-safe environment configuration
export type Env = z.infer<typeof envSchema>;

// Check if running in development mode
export const isDevelopment = env.NODE_ENV === "development";

// Check if running in production mode
export const isProduction = env.NODE_ENV === "production";

// Check if running in test mode
export const isTest = env.NODE_ENV === "test";
```

---

## Database Configuration (database.config.ts)

```typescript
// src/config/database.config.ts
import type { PoolConfig } from "pg";
import { env, isTest } from "./env.config";

// PostgreSQL connection pool configuration
// Uses different database for test environment
export const databaseConfig: PoolConfig = {
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: isTest ? env.DATABASE_NAME_TEST : env.DATABASE_NAME,

  // Connection pool settings
  min: env.DATABASE_POOL_MIN,
  max: env.DATABASE_POOL_MAX,
  connectionTimeoutMillis: env.DATABASE_CONNECTION_TIMEOUT,
  idleTimeoutMillis: env.DATABASE_IDLE_TIMEOUT,
  statement_timeout: env.DATABASE_STATEMENT_TIMEOUT,

  // Additional settings
  allowExitOnIdle: false,
};
```

### Configuration Options

| Variable                      | Description                  | Default  |
| ----------------------------- | ---------------------------- | -------- |
| `DATABASE_HOST`               | Database server host         | Required |
| `DATABASE_PORT`               | Database server port         | 5432     |
| `DATABASE_USER`               | Database user                | Required |
| `DATABASE_PASSWORD`           | Database password            | Required |
| `DATABASE_NAME`               | Database name                | Required |
| `DATABASE_NAME_TEST`          | Test database name           | Required |
| `DATABASE_POOL_MIN`           | Minimum pool connections     | 2        |
| `DATABASE_POOL_MAX`           | Maximum pool connections     | 10       |
| `DATABASE_CONNECTION_TIMEOUT` | Connection timeout (ms)      | 30000    |
| `DATABASE_IDLE_TIMEOUT`       | Idle connection timeout (ms) | 30000    |
| `DATABASE_STATEMENT_TIMEOUT`  | Statement timeout (ms)       | 30000    |

---

## Logger Configuration (logger.config.ts)

```typescript
// src/config/logger.config.ts
import pino from "pino";
import { env, isDevelopment } from "./env.config";

/**
 * Pino logger configuration
 * - Pretty printing in development
 * - JSON logging in production
 * - Redacts sensitive data (passwords, tokens)
 */
export const logger = pino({
  level: env.LOG_LEVEL,

  // Redact sensitive fields
  redact: {
    paths: ["password", "token", "authorization", "jwt", "secret"],
    remove: true,
  },

  // Pretty print in development
  transport:
    env.LOG_PRETTY && isDevelopment
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        }
      : undefined,

  // Base configuration
  base: {
    env: env.NODE_ENV,
  },

  // Timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Create a child logger with additional context
 *
 * @param context - Additional context to include in logs
 * @returns Child logger instance
 *
 * @example
 * const log = createLogger({ module: 'auth' });
 * log.info('User logged in');
 */
export const createLogger = (context: Record<string, unknown>) => {
  return logger.child(context);
};
```

---

## Configuration Usage

### In Application Code

```typescript
// Import configuration
import { env, isDevelopment, isProduction } from "@/config/env.config";
import { logger, createLogger } from "@/config/logger.config";

// Use environment variables
const port = env.PORT;
const dbHost = env.DATABASE_HOST;

// Check environment
if (isDevelopment) {
  console.log("Running in development mode");
}

// Use logger
const log = createLogger({ module: "merchants-service" });
log.info("Merchant created", { merchantId: 1 });
```

### In Repository

```typescript
// src/repositories/client.ts
import { SQL } from "bun";
import { env } from "@/config/env.config";

export const sql = new SQL({
  hostname: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  username: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  max: env.DATABASE_POOL_MAX,
  idleTimeout: env.DATABASE_IDLE_TIMEOUT,
  connectionTimeout: env.DATABASE_CONNECTION_TIMEOUT,
  adapter: "postgres",
});
```

---

## Environment-Specific Behavior

### Development

```typescript
// Development behavior
NODE_ENV=development

// Logging
- LOG_LEVEL=debug (more verbose)
- LOG_PRETTY=true (colored output)

// Database
- Uses DATABASE_NAME
- Connection pool: 2-10 connections

// Error handling
- Shows full error stack traces
- Detailed error messages in responses
```

### Production

```typescript
// Production behavior
NODE_ENV=production

// Logging
- LOG_LEVEL=info (less verbose)
- LOG_PRETTY=false (JSON output)

// Database
- Uses DATABASE_NAME
- Connection pool: optimized for load

// Error handling
- Generic error messages in responses
- Full errors logged only
```

### Test

```typescript
// Test behavior
NODE_ENV=test

// Database
- Uses DATABASE_NAME_TEST (isolated test database)
- Connection pool: minimal

// Logging
- LOG_LEVEL=warn or higher
- LOG_PRETTY=false
```

---

## Validation at Startup

Environment variables are validated when the application starts:

```typescript
// src/index.ts
import "./config/env.config"; // Validates env at import

// If validation fails, the app crashes with clear error:
// ZodError: [
//   {
//     "code": "too_small",
//     "minimum": 32,
//     "type": "string",
//     "path": ["JWT_SECRET"],
//     "message": "JWT_SECRET must be at least 32 characters"
//   }
// ]
```

---

## Configuration Best Practices

### DO ✅

```typescript
// Use imported config values
import { env } from "@/config/env.config";
const port = env.PORT;

// Use environment helpers
import { isDevelopment, isProduction } from "@/config/env.config";
if (isDevelopment) {
  /* ... */
}

// Create module-specific loggers
const log = createLogger({ module: "merchants-service" });
log.info("Merchant created", { merchantId: 1 });

// Keep .env.example updated
// Document all required variables
```

### DON'T ❌

```typescript
// Don't access process.env directly
const port = process.env.PORT; // ❌ No validation

// Don't hardcode configuration values
const dbHost = "localhost"; // ❌ Use env config

// Don't commit .env files
// .env should be in .gitignore

// Don't use weak JWT secrets
JWT_SECRET = secret; // ❌ Too short, use 32+ characters
```

---

## Security Considerations

### Secrets Management

| Secret              | Requirements                         |
| ------------------- | ------------------------------------ |
| `JWT_SECRET`        | Minimum 32 characters, random string |
| `DATABASE_PASSWORD` | Strong password, never commit        |
| `NODE_ENV`          | Set to `production` in production    |

---

## Related Documentation

- [Logging](./LOGGING.md) - Detailed logging configuration
- [Repository Layer](./REPOSITORY_LAYER.md) - Database client setup
- [Tech Stack](./TECH_STACK.md) - Bun's built-in env handling
