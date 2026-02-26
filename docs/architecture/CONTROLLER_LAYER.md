# Controller Layer

## Overview

The Controller Layer handles **HTTP-specific concerns**. It extracts data from requests, calls the service layer, and formats HTTP responses. Controllers contain **no business logic**.

---

## Purpose

### What It Does

- Extract params from request context
- Parse and validate request data
- Call service methods
- Format HTTP responses
- Handle HTTP-specific errors

### What It Doesn't Do

- Business rules
- SQL queries
- Data transformation (business)
- Direct DB access
- Logging (business events)

---

## File Structure

```
src/controllers/
├── index.ts                          ← Re-export all controllers
├── auth.controller.ts                ← Authentication endpoints
├── health.controller.ts              ← Health check endpoints
├── merchants.controller.ts           ← Merchant CRUD
├── suppliers.controller.ts           ← Supplier CRUD
├── ingredients.controller.ts         ← Ingredient management
├── ingredient-units.controller.ts    ← Unit management
├── purchase-orders.controller.ts     ← Purchase Order management
└── dashboard.controller.ts           ← Dashboard data
```

---

## Basic Controller Structure

```typescript
// src/controllers/merchants.controller.ts
import type { Context } from "hono";
import * as merchantsService from "@/services/merchants.service";
import type { AppContext } from "@/types/context.types";
import {
  noContentResponse,
  paginatedResponse,
  successResponse,
} from "@/utils/response.util";

/**
 * Get all merchants for current user
 *
 * GET /api/v1/merchants
 */
export const getAll = async (c: Context<AppContext>) => {
  const userId = c.get("userId");
  const query = c.req.query();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const search = query.search;

  const result = await merchantsService.getAllByUser(userId, {
    page,
    limit,
    search,
  });


  return successResponse({
    context: c,
    data: result,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
    },
  });
};

/**
 * Get merchant by ID
 *
 * GET /api/v1/merchants/:id
 */
export const getById = async (c: Context<AppContext>) => {
  const merchantId = c.req.param("id");

  const merchant = await merchantsService.getById(merchantId);

  return successResponse({
    context: c,
    data: merchant,
  });
};

/**
 * Create new merchant
 *
 * POST /api/v1/merchants
 */
export const create = async (c: Context<AppContext>) => {
  const userId = c.get("userId");
  const data = await c.req.json();

  const merchant = await merchantsService.create(userId, data);

  return successResponse({
    context: c,
    data: merchant,
    statusCode: 201,
  });
};

/**
 * Update merchant
 *
 * PATCH /api/v1/merchants/:id
 */
export const update = async (c: Context<AppContext>) => {
  const merchantId = c.req.param("id");
  const data = await c.req.json();

  const merchant = await merchantsService.update(merchantId, data);

  return successResponse({
    context: c,
    data: merchant,
  });
};

/**
 * Delete merchant
 *
 * DELETE /api/v1/merchants/:id
 */
export const delete = async (c: Context<AppContext>) => {
  const merchantId = c.req.param("id");

  await merchantsService.deleteMerchant(merchantId);

  return successResponse({
    context: c,
    data: merchantId,
    message: "Merchant deleted successfully",
    statusCode: 204,
  });
};
```

---

## Re-exporting Controllers

```typescript
// src/controllers/index.ts
export * from "./auth.controller";
export * from "./health.controller";
export * from "./merchants.controller";
export * from "./suppliers.controller";
export * from "./ingredients.controller";
export * from "./ingredient-units.controller";
export * from "./purchase-orders.controller";
export * from "./dashboard.controller";
```

---

## Request Data Extraction

### URL Parameters

```typescript
// GET /v1/merchants/:id
export const getById = async (c: Context<AppContext>) => {
  const merchantId = c.req.param("id"); // String ID
  // ...
};
```

### Query Parameters

```typescript
// GET /v1/merchants?page=1&limit=20&search=test
export const getAll = async (c: Context<AppContext>) => {
  // Manual parsing (used in actual code/service layer)
  const query = c.req.query();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const search = query.search;
  // ...
};
```

### JSON Body

```typescript
// POST /v1/merchants
export const create = async (c: Context<AppContext>) => {
  // Raw JSON (validation done in route middleware)
  const data = await c.req.json();
  // ...
};
```

### Context Values (from Middleware)

```typescript
// Values set by middleware
export const getAll = async (c: Context<AppContext>) => {
  const userId = c.get("userId"); // From auth middleware
  const merchantId = c.get("merchantId"); // From merchant middleware
  // ...
};
```

---

## Response Formatting

### Success Response

```typescript
// 200 OK with data
return successResponse({
  context: c,
  data: merchant,
});

// 200 OK with data and message
return successResponse({
  context: c,
  data: merchant,
  message: "Merchant created successfully", // optional message
});

// 201 Created
return successResponse({
  context: c,
  data: merchant,
  message: "Merchant created successfully", // optional message
  statusCode: 201, // optional to override default 200
});
```

### Failed Response

```typescript
// 400 Bad Request
return failedResponse({
  context: c,
  message: "Failed to create merchant",
  statusCode: 400,
  details: {
    message: "User not found",
  },
});

// 422 Validation error
return failedResponse({
  context: c,
  message: "Invalid request data",
  statusCode: 422,
  details: [
    {
      field: "email",
      message: "Invalid email format",
    },
    {
      field: "password",
      message: "Password must be at least 8 characters long",
    },
  ],
});

// 500 Internal Server Error
return failedResponse({
  context: c,
  message: "Failed to retrieve merchant",
  statusCode: 500,
  details: {
    error: "Internal server error",
  },
});
```

### Response Utilities

```typescript
// src/utils/response.util.ts

export const successResponse = <T>({
  context: Context;
  data: T;
  message?: string;
  pagination?: Pagination;
  statusCode?: number = 200,
}) => {
  const response = {
    success: true,
    data,
    message: message ?? "Success",
    pagination: pagination ?? undefined,
    meta: {
      requestId: context.get("requestId"),
      timestamp: context.get("timestamp"),
    }
  };

  return context.json(response, statusCode);
};

export const failedResponse = <T>({
  context: Context;
  message?: string;
  statusCode?: number = 500;
  details?: T,
}) => {
  const response = {
    success: false,
    message: message ?? "Failed",
    error: {
      message,
      details: details ?? undefined,
    },
    meta: {
      requestId: context.get("requestId"),
      timestamp: context.get("timestamp"),
    }
  };

  return context.json(response, statusCode);
};
```

---

## Sample Controller Files

### Auth Controller

```typescript
// src/controllers/auth.controller.ts
import type { Context } from "hono";
import * as authService from "@/services/auth.service";
import type { AppContext } from "@/types/context.types";
import { successResponse } from "@/utils/response.util";

export const login = async (c: Context<AppContext>) => {
  const { email, password } = await c.req.json();

  const result = await authService.login(email, password);

  return successResponse({
    context: c,
    data: result,
  });
};

export const register = async (c: Context<AppContext>) => {
  const data = await c.req.json();

  const result = await authService.register(data);

  return successResponse({
    context: c,
    data: result,
    statusCode: 201,
  });
};
```

### Purchase Orders Controller

```typescript
// src/controllers/purchase-orders.controller.ts
import type { Context } from "hono";
import * as purchaseOrdersService from "@/services/purchase-orders.service";
import type { AppContext } from "@/types/context.types";
import { successResponse } from "@/utils/response.util";

export const getAll = async (c: Context<AppContext>) => {
  const merchantId = c.get("merchantId");

  const result = await purchaseOrdersService.getAll(merchantId);

  return successResponse({
    context: c,
    data: result,
    pagination: {
      page: 1,
      limit: result.limit,
      total: result.total,
    },
  });
};

export const getById = async (c: Context<AppContext>) => {
  const id = c.req.param("id");
  const merchantId = c.get("merchantId");

  const order = await purchaseOrdersService.getById(id, merchantId);

  return successResponse({
    context: c,
    data: order,
  });
};

export const create = async (c: Context<AppContext>) => {
  const merchantId = c.get("merchantId");
  const userId = c.get("userId");
  const data = await c.req.json();

  const order = await purchaseOrdersService.create(merchantId, data, userId);

  return successResponse({
    context: c,
    data: {
      id: order.id,
    },
    statusCode: 201,
  });
};
```

### Health Controller

```typescript
// src/controllers/health.controller.ts
import type { Context } from "hono";
import { testConnection } from "@/repositories/client";

export const check = async (c: Context) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
};

export const checkDatabase = async (c: Context) => {
  const isConnected = await testConnection();

  return c.json({
    status: isConnected ? "ok" : "error",
    database: isConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
};
```

---

## Error Handling in Controllers

Controllers don't handle errors directly - the error handler middleware does. Just throw or let errors propagate:

```typescript
// ✅ CORRECT: Let errors propagate
export const getById = async (c: Context<AppContext>) => {
  const merchantId = c.req.param("id");

  // Service throws NotFoundError if not found
  // Error handler middleware catches and formats
  const merchant = await merchantsService.getById(merchantId);

  return successResponse({
    context: c,
    data: merchant,
  });
};

// ❌ WRONG: Don't handle errors in controller
export const getById = async (c: Context<AppContext>) => {
  try {
    const merchant = await merchantsService.getById(merchantId);
    return successResponse({
      context: c,
      data: merchant,
    });
  } catch (error) {
    return c.json({ error: "Not found" }, 404); // ❌ Use error handler
  }
};
```

---

## Best Practices

### DO ✅

```typescript
// Extract params cleanly
const merchantId = c.req.param("id");
const userId = c.get("userId");

// Parse query params
const query = c.req.query();
const page = Number(query.page) || 1;

// Get JSON body
const data = await c.req.json();

// Delegate to service
const result = await merchantsService.create(userId, data);

// Return formatted response
return successResponse({
  context: c,
  data: result,
  statusCode: 201,
});
```

### DON'T ❌

```typescript
// Don't put business logic in controllers
export const create = async (c: Context<AppContext>) => {
  const data = await c.req.json();

  // ❌ Business logic belongs in service
  if (!data.name || data.name.length < 2) {
    return c.json({ error: "Invalid name" }, 400);
  }

  // ❌ Direct DB access
  const result = await db.query("INSERT INTO...");

  return c.json(result);
};

// Don't handle errors manually
export const getById = async (c: Context<AppContext>) => {
  const item = await merchantsService.getById(id);

  // ❌ Let error handler deal with null
  if (!item) {
    return c.json({ error: "Not found" }, 404);
  }

  return successResponse({
    context: c,
    data: item,
  });
};
```

---

## Related Documentation

- [Route Layer](./ROUTE_LAYER.md) - Route definitions
- [Service Layer](./SERVICE_LAYER.md) - Business logic
- [Error Handling](./ERROR_HANDLING.md) - Error middleware
- [Validator](./VALIDATOR.md) - Zod schemas
