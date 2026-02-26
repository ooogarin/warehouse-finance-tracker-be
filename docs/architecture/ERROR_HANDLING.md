# Error Handling

## Overview

Error handling is centralized in the error handler middleware. All errors are caught and formatted consistently.
Error handler always called in the controller layer. So all errors are thrown in the controller layer.

---

## Purpose

| What Error Handling Does                |
| --------------------------------------- |
| Catch all errors globally               |
| Format consistent error responses       |
| Log errors appropriately                |
| Handle specific error types differently |

---

## File Structure

```
src/
├── middleware/
│   └── error-handler.middleware.ts   ← Global error handler
├── utils/
│   └── errors.util.ts                ← Custom error functions
└── constants/
    ├── error-codes.constant.ts       ← Error code definitions
    └── error-messages.constant.ts    ← Error messages
```

---

## Error Handler Middleware

```typescript
// src/middleware/error-handler.middleware.ts
import type { Context } from "hono";
import { ZodError } from "zod";
import { logger } from "@/config/logger.config";
import { ErrorCode, getErrorMessage } from "@/constants/error-codes.constant";

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

/**
 * Global error handler middleware
 * Catches all errors and returns consistent error responses
 */
export const errorHandler = async (
  err: Error,
  c: Context,
): Promise<Response> => {
  // Log the error
  logger.error(
    {
      err,
      path: c.req.path,
      method: c.req.method,
      requestId: c.get("requestId"),
    },
    "Error occurred",
  );

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return c.json<ErrorResponse>(
      {
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Validation failed",
          details: err.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
      },
      400,
    );
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    return c.json<ErrorResponse>(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      },
      err.statusCode,
    );
  }

  // Handle JWT errors
  if (err.name === "JwtTokenExpired" || err.message?.includes("expired")) {
    return c.json<ErrorResponse>(
      {
        success: false,
        error: {
          code: ErrorCode.TOKEN_EXPIRED,
          message: "Token has expired",
        },
      },
      401,
    );
  }

  if (err.message?.includes("invalid token") || err.message?.includes("jwt")) {
    return c.json<ErrorResponse>(
      {
        success: false,
        error: {
          code: ErrorCode.UNAUTHORIZED,
          message: "Invalid token",
        },
      },
      401,
    );
  }

  // Handle unknown errors
  return c.json<ErrorResponse>(
    {
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message:
          process.env.NODE_ENV === "production"
            ? "An unexpected error occurred"
            : err.message,
      },
    },
    500,
  );
};
```

---

## Custom Error Classes

All custom errors are defined in the error handler middleware.
Used for specific error types.

```typescript
// src/utils/errors.util.ts
import { ErrorCode } from "@/constants/error-codes.constant";

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public logLevel: "error" | "warn" | "info" = "error",
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Validation error (400)
 * Use for invalid input data
 */
export const validationError = (message: string): AppError => {
  return new AppError(ErrorCode.VALIDATION_ERROR, message, 400, "warn");
};

/**
 * Unauthorized error (401)
 * Use for authentication failures
 */
export const unauthorizedError = (
  message: string = "Unauthorized",
): AppError => {
  return new AppError(ErrorCode.UNAUTHORIZED, message, 401, "warn");
};

/**
 * Forbidden error (403)
 * Use for authorization failures
 */
export const forbiddenError = (message: string = "Forbidden"): AppError => {
  return new AppError(ErrorCode.FORBIDDEN, message, 403, "warn");
};

/**
 * Not found error (404)
 * Use when resource is not found
 */
export const notFoundError = (
  message: string = "Resource not found",
): AppError => {
  return new AppError(ErrorCode.NOT_FOUND, message, 404, "info");
};

/**
 * Conflict error (409)
 * Use for duplicate resources
 */
export const conflictError = (message: string): AppError => {
  return new AppError(ErrorCode.CONFLICT, message, 409, "warn");
};

/**
 * Internal server error (500)
 * Use for unexpected errors
 */
export const internalError = (
  message: string = "Internal server error",
): AppError => {
  return new AppError(ErrorCode.INTERNAL_ERROR, message, 500, "error");
};

/**
 * Bad gateway error (502)
 * Use for external service failures
 */
export const badGatewayError = (
  message: string = "External service error",
): AppError => {
  return new AppError(ErrorCode.BAD_GATEWAY, message, 502, "error");
};

/**
 * Service unavailable error (503)
 * Use when service is temporarily unavailable
 */
export const serviceUnavailableError = (
  message: string = "Service unavailable",
): AppError => {
  return new AppError(ErrorCode.SERVICE_UNAVAILABLE, message, 503, "error");
};
```

---

## Error Codes

```typescript
// src/constants/error-codes.constant.ts

/**
 * Application error codes
 */
export const ErrorCode = {
  // Client errors (4xx)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",

  // Server errors (5xx)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  BAD_GATEWAY: "BAD_GATEWAY",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  DATABASE_ERROR: "DATABASE_ERROR",
} as const;

/**
 * Default error messages
 */
export const ErrorMessages: Record<string, string> = {
  [ErrorCode.VALIDATION_ERROR]: "Validation failed",
  [ErrorCode.UNAUTHORIZED]: "Unauthorized access",
  [ErrorCode.TOKEN_EXPIRED]: "Token has expired",
  [ErrorCode.FORBIDDEN]: "Access forbidden",
  [ErrorCode.NOT_FOUND]: "Resource not found",
  [ErrorCode.CONFLICT]: "Resource conflict",
  [ErrorCode.INTERNAL_ERROR]: "Internal server error",
  [ErrorCode.BAD_GATEWAY]: "External service error",
  [ErrorCode.SERVICE_UNAVAILABLE]: "Service temporarily unavailable",
  [ErrorCode.DATABASE_ERROR]: "Database operation failed",
};
```

---

## Error Response Format

All errors follow a consistent response format:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string; // Error code from ErrorCode enum
    message: string; // Human-readable message
    details?: Array<{
      // Optional validation details
      field: string;
      message: string;
    }>;
  };
}
```

### Example Error Responses

#### Validation Error (400)

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
      },
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

#### Unauthorized Error (401)

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
  }
}
```

#### Forbidden Error (403)

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have access to this merchant"
  }
}
```

#### Not Found Error (404)

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Supplier not found"
  }
}
```

#### Internal Server Error (500)

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## Using Errors in Services

Services throw errors, which are caught by the error handler:

```typescript
// src/services/merchants.service.ts
import {
  validationError,
  notFoundError,
  forbiddenError,
} from "@/utils/errors.util";

export const getOneById = async (id: number, userId: string) => {
  try {
    const merchant = await merchantsRepository.getOneById(id);

    // Not found
    if (!merchant) {
      throw notFoundError("Merchant not found");
    }

    // Check access
    const userMerchant = await userMerchantsRepository.getByUserIdAndMerchantId(
      userId,
      id,
    );
    if (!userMerchant) {
      throw forbiddenError("You do not have access to this merchant");
    }

    return merchant;
  } catch (error) {
    throw error;
  }
};

export const create = async (userId: string, data: CreateInput) => {
  let connection: Connection | null = null;
  try {
    connection = startTransaction();

    // Business validation
    const existing = await merchantsRepository.getByName(userId, data.name);

    if (existing) {
      throw validationError("Merchant with this name already exists");
    }

    return merchantsRepository.insert(connection, payload);

    commitTransaction(connection);
  } catch (error) {
    if (connection) {
      rollbackTransaction(connection);
    }
    throw error;
  }
};

export const update = async (id: number, userId: string, data: UpdateInput) => {
  let connection: Connection | null = null;
  try {
    connection = startTransaction();

    // This will throw notFoundError if not found
    const merchant = await getOneById(id, userId);

    // Additional validation
    if (data.name && data.name !== merchant.name) {
      const existing = await merchantsRepository.getByName(userId, data.name);
      if (existing) {
        throw validationError("Merchant with this name already exists");
      }
    }

    return merchantsRepository.updateById(connection, id, data);

    commitTransaction(connection);
  } catch (error) {
    if (connection) {
      rollbackTransaction(connection);
    }
    throw error;
  }
};
```

---

## Error Handling in Middleware

### Auth Middleware

```typescript
// src/middleware/auth.middleware.ts
import { unauthorizedError } from "@/utils/errors.util";
import { verify } from "@/utils/jwt.util";

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw unauthorizedError("Missing or invalid authorization header");
    }

    const token = authHeader.slice(7);

    const payload = await verify(token);

    c.set("userId", payload.userId);
    c.set("userRole", payload.role);

    await next();
  } catch (error) {
    throw unauthorizedError("Invalid or expired token");
  }
};
```

### Role Middleware

```typescript
// src/middleware/role.middleware.ts
import { forbiddenError } from "@/utils/errors.util";
import type { UserRole } from "@/types/auth.types";

export const roleMiddleware = (allowedRoles: UserRole[]) => {
  return async (c: Context, next: Next) => {
    const userRole = c.get("userRole");

    if (!allowedRoles.includes(userRole)) {
      throw forbiddenError("Insufficient permissions");
    }

    await next();
  };
};
```

### Merchant Middleware

```typescript
// src/middleware/merchant.middleware.ts
import { forbiddenError, notFoundError } from "@/utils/errors.util";
import { userMerchantsRepository } from "@/repositories/user-merchants.repository";

export const merchantMiddleware = async (c: Context, next: Next) => {
  const userId = c.get("userId");
  const merchantId = c.req.header("x-merchant-id");

  if (!merchantId) {
    throw forbiddenError("Merchant ID header required");
  }

  const userMerchant = await userMerchantsRepository.getByUserIdAndMerchantId(
    userId,
    merchantId,
  );

  if (!userMerchant) {
    throw notFoundError("Merchant not found or access denied");
  }

  c.set("merchantId", merchantId);
  c.set("merchantRole", userMerchant.role);

  await next();
};
```

---

## Logging Errors

Errors are logged with context:

```typescript
// In error handler middleware
logger.error(
  {
    err, // Error object
    path: c.req.path, // Request path
    method: c.req.method, // HTTP method
    requestId: c.get("requestId"), // Request ID
    userId: c.get("userId"), // User ID (if authenticated)
    body: c.req.json, // Request body (sanitize first)
  },
  "Error occurred",
);
```

### Log Levels by Error Type

| Error Type   | Status Code | Log Level |
| ------------ | ----------- | --------- |
| Validation   | 400         | `warn`    |
| Unauthorized | 401         | `warn`    |
| Forbidden    | 403         | `warn`    |
| Not Found    | 404         | `info`    |
| Conflict     | 409         | `warn`    |
| Internal     | 500         | `error`   |
| Bad Gateway  | 502         | `error`   |

---

## Error Flow

```
Request
    │
    ▼
Middleware/Handler
    │
    ├── throw AppError ───────────┐
    ├── throw ZodError ───────────┤
    ├── throw Error ──────────────┤
    │                             │
    ▼                             ▼
Error Handler Middleware
    │
    ├── Log error
    ├── Determine error type
    ├── Format response
    │
    ▼
Error Response (JSON)
```

---

## Best Practices

### DO ✅

```typescript
// Throw specific errors
if (!merchant) {
  throw notFoundError("Merchant not found");
}

// Use appropriate error types
if (!user.hasAccess) {
  throw forbiddenError("Access denied");
}

// Let errors propagate to handler
export const getOneById = async (id: number) => {
  const item = await repository.getOneById(id);
  if (!item) throw notFoundError("Item not found");
  return item;
};
```

### DON'T ❌

```typescript
// Don't catch and swallow errors
export const getOneById = async (id: number) => {
  try {
    return await repository.getOneById(id);
  } catch (error) {
    return null; // ❌ Swallows error
  }
};

// Don't return error responses in services
export const getOneById = async (id: number) => {
  if (!item) {
    return { success: false, error: "Not found" }; // ❌ Throw instead
  }
  return item;
};

// Don't use generic messages
throw validationError("Invalid"); // ❌ Too vague
throw validationError("Name must be at least 2 characters"); // ✅ Specific
```

---

## Related Documentation

- [Service Layer](./SERVICE_LAYER.md) - Throwing errors in services
- [Route Layer](./ROUTE_LAYER.md) - Middleware setup
- [Logging](./LOGGING.md) - Error logging
- [Validator](./VALIDATOR.md) - Zod validation errors
