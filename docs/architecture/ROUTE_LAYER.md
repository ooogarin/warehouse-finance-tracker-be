# Route Layer

## Overview

The Route Layer is the **entry point** for HTTP requests. It defines what endpoints exist and applies middleware, but contains **no business logic**.

---

## Purpose

### What It Does

- Define HTTP endpoints
- Apply middleware chains
- Delegate to controllers
- Group routes by version

### What It Doesn't Do

- Business logic
- Request parsing
- Response formatting
- Data access

---

## File Structure

```
src/routes/
├── index.ts                          ← Register all route groups
│
├── public/                           ← Public routes (no auth)
│   ├── index.ts                      ← Register public routes
│   └── auth.routes.ts                ← Login, register, refresh
│
├── internal/                         ← Internal routes
│   ├── index.ts                      ← Register internal routes
│   └── health.routes.ts              ← Health checks
│
└── v1/                               ← API v1 (auth required)
    ├── index.ts                      ← Register v1 routes
    ├── merchants.routes.ts           ← Merchant endpoints
    ├── suppliers.routes.ts           ← Supplier endpoints
    ├── ingredients.routes.ts         ← Ingredient endpoints
    ├── purchase-orders.routes.ts     ← PO endpoints
    ├── ingredient-units.routes.ts    ← Unit endpoints
    └── dashboard.routes.ts           ← Dashboard endpoints
```

---

## Route Organization

### By Access Level

```
/public/*      → No authentication required
/internal/*    → Internal use (health, metrics)
/v1/*          → API v1, requires authentication
```

### Route Registration Flow

#### Main Router

```typescript
// Main router (src/routes/index.ts)
import { Hono } from "hono";
import { publicRoutes } from "./public";
import { internalRoutes } from "./internal";
import { v1Routes } from "./v1";

const router = new Hono();

router.route("/public", publicRoutes);
router.route("/internal", internalRoutes);
router.route("/v1", v1Routes);

export { router };
```

#### Route Group

```typescript
// Route group (src/routes/v1/index.ts)
import { Hono } from "hono";
import { authMiddleware } from "@/middleware/auth.middleware";
import merchantsRoutes from "./merchants.routes";
import suppliersRoutes from "./suppliers.routes";
import ingredientsRoutes from "./ingredients.routes";

const app = new Hono();

// Apply auth to all v1 routes
app.use("*", authMiddleware);

// Register resource routes
app.route("/merchants", merchantsRoutes);
app.route("/suppliers", suppliersRoutes);
app.route("/ingredients", ingredientsRoutes);

export { app as v1Routes };
```

---

## Route Definition Examples

### Sample Basic CRUD Routes

```typescript
// src/routes/v1/merchants.routes.ts
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { merchantsController } from "@/controllers";
import type { AppContext } from "@/types/context.types";
import {
  CreateMerchantSchema,
  GetMerchantsSchema,
  UpdateMerchantSchema,
} from "@/validators/merchants.schemas";

const merchants = new Hono<AppContext>();

// GET /v1/merchants - List all merchants (paginated)
merchants.get(
  "/",
  zValidator("query", GetMerchantsSchema),
  merchantsController.getAll,
);

// GET /v1/merchants/:id - Get single merchant
merchants.get("/:id", merchantsController.getById);

// POST /v1/merchants - Create merchant
merchants.post(
  "/",
  zValidator("json", CreateMerchantSchema),
  merchantsController.create,
);

// PATCH /v1/merchants/:id - Update merchant
merchants.patch(
  "/:id",
  zValidator("json", UpdateMerchantSchema),
  merchantsController.update,
);

// DELETE /v1/merchants/:id - Soft delete merchant
merchants.delete("/:id", merchantsController.delete);

export default merchants;
```

### Public Routes (No Auth)

```typescript
// src/routes/public/auth.routes.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authController } from "@/controllers";
import type { AppContext } from "@/types/context.types";
import { LoginSchema, RegisterSchema } from "@/validators/auth.schemas";

const auth = new Hono<AppContext>();

// POST /public/auth/login
auth.post("/login", zValidator("json", LoginSchema), authController.login);

// POST /public/auth/register
auth.post(
  "/register",
  zValidator("json", RegisterSchema),
  authController.register,
);

export default auth;
```

### Health Check Routes

```typescript
// src/routes/internal/health.routes.ts
import { Hono } from "hono";
import { healthController } from "@/controllers";
import type { AppContext } from "@/types/context.types";

const health = new Hono<AppContext>();

// GET /internal/health
health.get("/", healthController.check);

export default health;
```

---

## Middleware Application

### Per-Route Middleware

```typescript
// Apply validation to specific route
merchants.post(
  "/",
  zValidator("json", CreateMerchantSchema), // Validation middleware
  merchantsController.create,
);
```

### Group-Level Middleware

```typescript
// Apply auth to all routes in group
const v1 = new Hono();
v1.use("*", authMiddleware); // All v1/* routes require auth

// Apply merchant context to specific routes
purchaseOrders.use("*", merchantMiddleware);
```

---

## Route Patterns

### RESTful CRUD

| Method | Endpoint         | Action  | Controller Method |
| ------ | ---------------- | ------- | ----------------- |
| GET    | `/merchants`     | List    | `getAll`          |
| GET    | `/merchants/:id` | Get one | `getById`         |
| POST   | `/merchants`     | Create  | `create`          |
| PATCH  | `/merchants/:id` | Update  | `update`          |
| DELETE | `/merchants/:id` | Delete  | `delete`          |

---

## Parameter Extraction

Routes define parameters, controllers extract them:

```typescript
// Route definition
merchants.get("/:id", merchantsController.getById);

// Controller extracts
export const getById = async (c: Context<AppContext>) => {
  const merchantId = c.req.param("id"); // URL param
  const userId = c.get("userId"); // Context from middleware
  const query = c.req.query(); // Query params
  // ...
};
```

### Parameter Types

| Source         | Method                     | Example              |
| -------------- | -------------------------- | -------------------- |
| URL Param      | `c.req.param('id')`        | `/merchants/:id`     |
| Query String   | `c.req.query()`            | `/merchants?page=1`  |
| JSON Body      | `c.req.json()`             | `{ "name": "Test" }` |
| Validated Data | `c.req.valid('json')`      | After zValidator     |
| Context        | `c.get('userId')`          | Set by middleware    |
| Header         | `c.req.header('x-custom')` | Custom headers       |

---

## Validation Integration

### Zod Schema with Route

```typescript
// Define schema (validators/merchants.schemas.ts)
export const GetMerchantsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
});

// Use in route
merchants.get(
  "/",
  zValidator("query", GetMerchantsSchema),
  merchantsController.getAll,
);

// Controller gets validated data OR parses manually
export const getAll = async (c: Context<AppContext>) => {
  const query = c.req.query();
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  // ...
};
```

### Validation Sources

```typescript
// Validate different parts of request
zValidator("json", schema); // Request body
zValidator("query", schema); // Query parameters
zValidator("param", schema); // URL parameters
zValidator("header", schema); // Headers
```

---

## Best Practices

### DO ✅

```typescript
// Keep routes declarative and thin
merchants.get("/", merchantsController.getAll);

// Apply validation middleware
merchants.post(
  "/",
  zValidator("json", CreateMerchantSchema),
  merchantsController.create,
);

// Group related routes
const v1 = new Hono();
v1.route("/merchants", merchants);

// Use consistent naming
merchants.get("/:id", merchantsController.getById);
```

### DON'T ❌

```typescript
// Don't put business logic in routes
merchants.get("/", async (c) => {
  const data = await db.query("SELECT * FROM merchants"); // ❌
  return c.json(data);
});

// Don't handle errors in routes
merchants.post("/", async (c) => {
  try {
    // ...
  } catch (error) {
    return c.json({ error: "Failed" }, 500); // ❌
  }
});

// Don't validate in routes (use middleware)
merchants.post("/", async (c) => {
  const body = await c.req.json();
  if (!body.name) {
    // ❌ Use Zod instead
    return c.json({ error: "Name required" }, 400);
  }
});
```

---

## Route Registration Order

Routes are registered in order, more specific routes first:

```typescript
// ✅ CORRECT: Specific routes first
const merchants = new Hono();

merchants.get("/search", merchantsController.search); // /search
merchants.get("/:id", merchantsController.getById); // /:id

// ❌ WRONG: Generic route catches all
merchants.get("/:id", merchantsController.getById); // Catches /search too!
merchants.get("/search", merchantsController.search); // Never reached
```

---

## Related Documentation

- [Controller Layer](./CONTROLLER_LAYER.md) - Handling requests
- [Validator](./VALIDATOR.md) - Zod schemas
- [Workflow](./WORKFLOW.md) - Request flow
- [Error Handling](./ERROR_HANDLING.md) - Error middleware
