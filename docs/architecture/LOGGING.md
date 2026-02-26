# Logging

## Overview

Logging is implemented using **Pino**, a high-performance JSON logger. Logs are structured, searchable, and environment-aware.

---

## Purpose

### What Logging Does

- Record application events
- Debug issues in production
- Track request flow
- Monitor business events
- Capture errors with context

---

## File Structure

```
src/config/
└── logger.config.ts    ← Logger configuration

src/services/
└── *.service.ts        ← Business event logging
```

---

## Logger Configuration

```typescript
// src/config/logger.config.ts
import pino from "pino";
import { env, isDevelopment } from "./env.config";

// Pino logger configuration
export const logger = pino({
  // Log level from env
  level: env.LOG_LEVEL,

  // Redact sensitive fields
  redact: {
    paths: [
      "password",
      "token",
      "authorization",
      "jwt",
      "secret",
      "apiKey",
      "creditCard",
    ],
    remove: true, // Remove from output entirely
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
            singleLine: false,
          },
        }
      : undefined,

  // Base fields included in all logs
  base: {
    env: env.NODE_ENV,
    app: "warehouse-api",
  },

  // ISO timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Create a child logger with additional context
export const createLogger = (context: Record<string, unknown>) => {
  return logger.child(context);
};
```

---

## Log Levels

| Level   | When to Use                            | Numeric Value |
| ------- | -------------------------------------- | ------------- |
| `fatal` | Application crash, unrecoverable error | 60            |
| `error` | Errors that should be investigated     | 50            |
| `warn`  | Unexpected but handled situations      | 40            |
| `info`  | Normal business events                 | 30            |
| `debug` | Detailed information for debugging     | 20            |
| `trace` | Very detailed tracing                  | 10            |

### Setting Log Level

```bash
# .env
LOG_LEVEL=info      # Production
LOG_LEVEL=debug     # Development
LOG_LEVEL=warn      # Test
```

---

## Using the Logger

### Basic Usage

```typescript
import { logger } from "@/config/logger.config";

logger.info("Application started");
logger.info({ port: 3000 }, "Server listening");
```

### Creating Module-Specific Loggers

```typescript
import { createLogger } from "@/config/logger.config";

const log = createLogger({ module: "merchants-service" });

log.info("Merchant created");
log.info({ merchantId: 1, userId: "user_123" }, "Merchant created");
```

### In Services

```typescript
// src/services/merchants.service.ts
import { createLogger } from "@/config/logger.config";

const logger = createLogger({ module: "merchants-service" });

export const create = async (userId: string, data: CreateInput) => {
  logger.debug({ data }, "Creating merchant");

  const merchant = await merchantsRepository.insert(null, payload);

  logger.info(
    { userId, merchantId: merchant.id, name: merchant.name },
    "Merchant created",
  );

  return merchant;
};

export const update = async (id: number, userId: string, data: UpdateInput) => {
  logger.info({ merchantId: id, userId, changes: data }, "Merchant updated");
  // ...
};
```

### In Error Handler

```typescript
// src/middleware/error-handler.middleware.ts
import { logger } from "@/config/logger.config";

export const errorHandler = async (err: Error, c: Context) => {
  logger.error(
    {
      err,
      path: c.req.path,
      method: c.req.method,
      requestId: c.get("requestId"),
      userId: c.get("userId"),
    },
    "Error occurred",
  );

  // Return error response
};
```

---

## Log Format

### Development (Pretty Print)

```
10:30:45 INFO [merchants-service] Merchant created
    merchantId: 1
    userId: "user_123"
    name: "Restaurant ABC"
```

### Production (JSON)

```json
{
  "level": 30,
  "time": "2026-02-21T10:30:45.123Z",
  "env": "production",
  "app": "warehouse-api",
  "module": "merchants-service",
  "merchantId": 1,
  "userId": "user_123",
  "name": "Restaurant ABC",
  "msg": "Merchant created"
}
```

---

## Structured Logging

### Include Context

```typescript
// ✅ CORRECT: Include relevant context
logger.info({ merchantId: 1, userId: "user_123" }, "Merchant created");

// ❌ WRONG: No context
logger.info("Merchant created");
```

### Log Object + Message

```typescript
// Object first, message second
logger.info(
  {
    merchantId: 1,
    items: items.length,
    totalAmount: calculateTotal(items),
  },
  "Purchase order created",
);
```

### Use Consistent Field Names

```typescript
// Use consistent field names across logs
logger.info({ merchantId: 1 }, "..."); // ✅
logger.info({ merchant_id: 1 }, "..."); // ❌ Inconsistent
logger.info({ mid: 1 }, "..."); // ❌ Inconsistent
```

---

## Sensitive Data Redaction

Sensitive fields are automatically removed:

```typescript
// Input
logger.info({
  email: 'user@test.com',
  password: 'secret123'
}, 'User logged in');

// Output (password removed)
{
  "level": 30,
  "email": "user@test.com",
  "msg": "User logged in"
}
```

### Redacted Fields

```typescript
redact: {
  paths: [
    'password',
    'token',
    'authorization',
    'jwt',
    'secret',
    'apiKey',
    'creditCard',
  ],
  remove: true,
}
```

---

## Request Logging

### Request ID Tracking

```typescript
// src/middleware/request-id.middleware.ts
import { v4 as uuidv4 } from "uuid";
import { createLogger } from "@/config/logger.config";

const logger = createLogger({ module: "request" });

export const requestIdMiddleware = async (c: Context, next: Next) => {
  const requestId = c.req.header("x-request-id") || uuidv4();
  c.set("requestId", requestId);

  logger.info(
    {
      requestId,
      method: c.req.method,
      path: c.req.path,
      userAgent: c.req.header("user-agent"),
    },
    "Request started",
  );

  await next();

  logger.info(
    {
      requestId,
      status: c.res.status,
      duration: Date.now() - c.get("startTime"),
    },
    "Request completed",
  );
};
```

### Request Timing

```typescript
// src/middleware/metrics.middleware.ts
import { createLogger } from "@/config/logger.config";

const logger = createLogger({ module: "metrics" });

export const metricsMiddleware = async (c: Context, next: Next) => {
  const start = Date.now();

  await next();

  const duration = Date.now() - start;

  logger.info(
    {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      duration,
      requestId: c.get("requestId"),
    },
    "Request completed",
  );
};
```

---

## Business Event Logging

### CRUD Operations

```typescript
// Create
logger.info({ merchantId: merchant.id, userId }, "Merchant created");

// Update
logger.info({ merchantId: id, userId, changes: data }, "Merchant updated");

// Delete
logger.info({ merchantId: id, userId }, "Merchant deleted");
```

### Purchase Order Events

```typescript
// Order created
logger.info(
  {
    orderId: order.id,
    orderNumber,
    merchantId,
    userId,
    itemCount: items.length,
    totalAmount,
  },
  "Purchase order created",
);

// Order approved
logger.info(
  {
    orderId: id,
    approvedBy: userId,
    previousStatus: "pending",
    newStatus: "approved",
  },
  "Purchase order approved",
);

// Order received
logger.info(
  {
    orderId: id,
    receivedBy: userId,
    itemsReceived: items.length,
  },
  "Purchase order received",
);
```

### Stock Operations

```typescript
// Stock added
logger.info(
  {
    ingredientId,
    quantityAdded: quantity,
    newStock: ingredient.currentStock,
    batchId: batch.id,
  },
  "Stock added from purchase order",
);

// Stock consumed
logger.info(
  {
    ingredientId,
    quantityConsumed: quantity,
    remainingStock: newStock,
    batchesUsed: consumptions.length,
  },
  "Stock consumed (FIFO)",
);
```

---

## Error Logging

### In Error Handler

```typescript
// Different log levels for different errors
if (err instanceof AppError) {
  if (err.statusCode >= 500) {
    logger.error(
      {
        err,
        code: err.code,
        statusCode: err.statusCode,
        requestId: c.get("requestId"),
        path: c.req.path,
      },
      "Server error",
    );
  } else if (err.statusCode >= 400) {
    logger.warn(
      {
        code: err.code,
        statusCode: err.statusCode,
        requestId: c.get("requestId"),
        path: c.req.path,
        message: err.message,
      },
      "Client error",
    );
  }
}
```

### In Services

```typescript
try {
  const result = await someOperation();
  return result;
} catch (error) {
  logger.error(
    {
      err: error,
      merchantId,
      operation: "createOrder",
    },
    "Failed to create order",
  );
  throw error;
}
```

---

## Log Examples

### Successful Request

```json
{
  "level": 30,
  "time": "2026-02-21T10:30:45.123Z",
  "env": "production",
  "app": "warehouse-api",
  "module": "request",
  "requestId": "req_abc123",
  "method": "POST",
  "path": "/v1/merchants",
  "status": 201,
  "duration": 45,
  "msg": "Request completed"
}
```

### Error Log

```json
{
  "level": 50,
  "time": "2026-02-21T10:30:45.123Z",
  "env": "production",
  "app": "warehouse-api",
  "module": "error-handler",
  "requestId": "req_abc123",
  "path": "/v1/merchants",
  "method": "POST",
  "err": {
    "type": "AppError",
    "message": "Merchant with this name already exists",
    "stack": "..."
  },
  "msg": "Error occurred"
}
```

### Business Event

```json
{
  "level": 30,
  "time": "2026-02-21T10:30:45.123Z",
  "env": "production",
  "app": "warehouse-api",
  "module": "purchase-orders-service",
  "orderId": 42,
  "orderNumber": "PO-20260221-001",
  "merchantId": 1,
  "userId": "user_123",
  "itemCount": 3,
  "totalAmount": 650000,
  "msg": "Purchase order created"
}
```

---

## Best Practices

### DO ✅

```typescript
// Use module-specific loggers
const log = createLogger({ module: "merchants-service" });

// Include relevant context
log.info({ merchantId: 1, userId }, "Merchant created");

// Use appropriate log level
log.debug({ data }, "Processing request"); // Debug
log.info({ merchantId }, "Merchant created"); // Info
log.warn({ stock: 0 }, "Stock depleted"); // Warn
log.error({ err }, "Database error"); // Error

// Use consistent message format
log.info({ merchantId }, "Merchant created");
log.info({ supplierId }, "Supplier created");
```

### DON'T ❌

```typescript
// Don't use console.log
console.log("Merchant created"); // ❌

// Don't log sensitive data
log.info({ password }, "User logged in"); // ❌

// Don't log without context
log.info("Something happened"); // ❌

// Don't use inconsistent formats
log.info("Created merchant with id 1"); // ❌
log.info({ m_id: 1 }, "Merchant created"); // ❌
```

---

## Log Aggregation

In production, logs are typically aggregated:

1. **JSON Output**: Logs are structured JSON
2. **Log Shipper**: Forward to log aggregation service
3. **Log Platform**: Elasticsearch, Datadog, CloudWatch, etc.
4. **Querying**: Search by fields (module, merchantId, error code, etc.)

### Example Queries

```
# Find all errors
level: >= 50

# Find logs for specific merchant
merchantId: 1

# Find slow requests
duration: > 1000

# Find specific module
module: "merchants-service"
```

---

## Related Documentation

- [Configuration](./CONFIGURATION.md) - Logger configuration setup
- [Error Handling](./ERROR_HANDLING.md) - Error logging
- [Service Layer](./SERVICE_LAYER.md) - Business event logging
