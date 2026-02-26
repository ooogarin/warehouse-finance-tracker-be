# Validator (Zod Schemas)

## Overview

Validation is handled using **Zod** schemas. Schemas provide runtime validation and automatic TypeScript type inference.

---

## Purpose

### What Validators Do

- Runtime input validation
- Type inference from schemas
- Request body/query/param validation
- Clear error messages

---

## File Structure

```
src/validators/
├── index.ts                        ← Re-export all schemas
├── common.schemas.ts               ← Shared/reusable schemas
├── auth.schemas.ts                 ← Auth validation schemas
├── merchants.schemas.ts            ← Merchant validation schemas
├── suppliers.schemas.ts            ← Supplier validation schemas
├── ingredients.schemas.ts          ← Ingredient validation schemas
├── ingredient-units.schemas.ts     ← Unit validation schemas
└── purchase-orders.schemas.ts      ← Purchase Order validation schemas
```

---

## Field Ordering Rule

**Important**: Field order in Zod schemas must follow the database table schema order.

### Example: Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'owner',
    phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL
);
```

### Corresponding Zod Schema

```typescript
// Field order follows database schema
export const RegisterSchema = z.object({
  // 1. name (from users table)
  name: z.string().min(2, "Name must be at least 2 characters"),

  // 2. email (from users table)
  email: z.string().email("Invalid email format"),

  // 3. password (from users table)
  password: z.string().min(8, "Password must be at least 8 characters"),

  // 4. role (from users table - optional in request)
  role: z.enum(["owner", "manager", "staff"]).optional(),

  // 5. phone (from users table)
  phone: z.string().max(20, "Phone must be at most 20 characters").optional(),

  // Note: id, created_at, updated_at, deleted_at are handled by system
});
```

---

## Basic Schema Structure

```typescript
// src/validators/merchants.schemas.ts
import { z } from "zod";

// Merchant type enum schema
export const MerchantTypeSchema = z.enum([
  "restaurant",
  "cafe",
  "catering",
  "other",
]);

// Create merchant schema
export const CreateMerchantSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  type: MerchantTypeSchema,
  address: z
    .string()
    .max(500, "Address must be at most 500 characters")
    .optional(),
  phone: z.string().max(20, "Phone must be at most 20 characters").optional(),
});

// Update merchant schema (all fields optional)
export const UpdateMerchantSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .optional(),
  type: MerchantTypeSchema.optional(),
  address: z
    .string()
    .max(500, "Address must be at most 500 characters")
    .optional(),
  phone: z.string().max(20, "Phone must be at most 20 characters").optional(),
});

// Get merchants query params schema
export const GetMerchantsSchema = z.object({
  page: z.coerce.number().min(1, "Page must be at least 1").default(1),
  limit: z.coerce
    .number()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must be at most 100")
    .default(20),
  search: z.string().optional(),
});
```

---

## Common Schemas

```typescript
// src/validators/common.schemas.ts
import { z } from "zod";

// Pagination schema (reusable)
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// ID parameter schema
export const IdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID must be a positive integer"),
});

// UUID parameter schema
export const UuidParamSchema = z.object({
  id: z.string().uuid("Invalid UUID format"),
});

// Search query schema
export const SearchQuerySchema = z.object({
  search: z.string().optional(),
});

// Date range schema
export const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Combined pagination + search schema
export const PaginatedSearchSchema = PaginationSchema.extend({
  search: z.string().optional(),
});
```

---

## Sample Schema Files

### Auth Schemas

```typescript
// src/validators/auth.schemas.ts
import { z } from "zod";

/**
 * Login schema
 */
export const LoginSchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

// Register schema
export const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(255, "Password must be at most 255 characters"),
  phone: z.string().max(20, "Phone must be at most 20 characters").optional(),
});

// Refresh token schema
export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// Change password schema
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(255, "New password must be at most 255 characters"),
});
```

### Suppliers Schemas

```typescript
// src/validators/suppliers.schemas.ts
import { z } from "zod";
import { PaginationSchema } from "./common.schemas";

/**
 * Create supplier schema
 * Field order: merchant_id, name, contact_person, phone, email, address
 */
export const CreateSupplierSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  contactPerson: z
    .string()
    .max(100, "Contact person must be at most 100 characters")
    .optional(),
  phone: z.string().max(20, "Phone must be at most 20 characters").optional(),
  email: z
    .string()
    .email("Invalid email format")
    .max(100, "Email must be at most 100 characters")
    .optional()
    .or(z.literal("")), // Allow empty string
  address: z
    .string()
    .max(500, "Address must be at most 500 characters")
    .optional(),
});

/**
 * Update supplier schema
 */
export const UpdateSupplierSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .optional(),
  contactPerson: z
    .string()
    .max(100, "Contact person must be at most 100 characters")
    .optional(),
  phone: z.string().max(20, "Phone must be at most 20 characters").optional(),
  email: z
    .string()
    .email("Invalid email format")
    .max(100, "Email must be at most 100 characters")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(500, "Address must be at most 500 characters")
    .optional(),
});

/**
 * Get suppliers query schema
 */
export const GetSuppliersSchema = PaginationSchema.extend({
  search: z.string().optional(),
});
```

## Re-exporting Schemas

```typescript
// src/validators/index.ts
export * from "./common.schemas";
export * from "./auth.schemas";
export * from "./merchants.schemas";
export * from "./suppliers.schemas";
export * from "./ingredients.schemas";
export * from "./ingredient-units.schemas";
export * from "./purchase-orders.schemas";
```

---

## Usage with Routes

### Body Validation

```typescript
import { zValidator } from "@hono/zod-validator";
import { CreateMerchantSchema } from "@/validators";

// Validates JSON body
merchants.post(
  "/",
  zValidator("json", CreateMerchantSchema),
  merchantsController.create,
);
```

### Query Validation

```typescript
import { GetMerchantsSchema } from "@/validators";

// Validates query parameters
merchants.get(
  "/",
  zValidator("query", GetMerchantsSchema),
  merchantsController.getAll,
);
```

### Param Validation

```typescript
import { IdParamSchema } from "@/validators/common.schemas";

// Validates URL parameters
merchants.get(
  "/:id",
  zValidator("param", IdParamSchema),
  merchantsController.getOneById,
);
```

### Combined Validation

```typescript
import { zValidator } from "@hono/zod-validator";
import { IdParamSchema } from "./common.schemas";
import { UpdateMerchantSchema } from "./merchants.schemas";

// Multiple validators
merchants.patch(
  "/:id",
  zValidator("param", IdParamSchema),
  zValidator("json", UpdateMerchantSchema),
  merchantsController.update,
);
```

---

## Type Inference

Zod schemas automatically generate TypeScript types:

```typescript
import { z } from "zod";
import { CreateMerchantSchema } from "@/validators/merchants.schemas";

// Infer type from schema
type CreateMerchantInput = z.infer<typeof CreateMerchantSchema>;

// Equivalent to:
// {
//   name: string;
//   type: 'restaurant' | 'cafe' | 'catering' | 'other';
//   address?: string;
//   phone?: string;
// }

// Use in controller
export const create = async (c: Context) => {
  const data: CreateMerchantInput = c.req.valid("json");
  // ...
};
```

---

## Validation Patterns

### Coercion

```typescript
// Coerce string to number (for query params)
page: z.coerce.number().min(1).default(1);

// Coerce string to boolean
active: z.coerce.boolean().default(true);

// Coerce string to date
startDate: z.coerce.date().optional();
```

### Optional & Nullable

```typescript
// Optional field
phone: z.string().optional();

// Nullable field
deletedAt: z.date().nullable();

// Optional or nullable
address: z.string().optional().nullable();
```

### Transform

```typescript
// Transform value
email: z.string()
  .email()
  .transform((val) => val.toLowerCase());

// Transform and validate
phone: z.string()
  .transform((val) => val.replace(/\D/g, "")) // Remove non-digits
  .refine((val) => val.length >= 10, "Phone must have at least 10 digits");
```

### Refinement

```typescript
// Custom validation
password: z.string()
  .min(8)
  .refine(
    (val) => /[A-Z]/.test(val),
    "Password must contain at least one uppercase letter",
  )
  .refine(
    (val) => /[0-9]/.test(val),
    "Password must contain at least one number",
  );

// Object refinement
endDate: z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(
  (data) => data.endDate > data.startDate,
  "End date must be after start date",
);
```

### Arrays

```typescript
// Array of items
items: z.array(z.string()).min(1, "At least one item required");

// Array of objects
items: z.array(
  z.object({
    id: z.number(),
    quantity: z.number().positive(),
  }),
).min(1);
```

---

## Error Handling

Zod validation errors are handled by the error handler middleware:

```typescript
// Error handler catches ZodError
// Returns formatted error response
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

---

## Best Practices

### DO ✅

```typescript
// Follow database schema order for fields
export const CreateSchema = z.object({
  name: z.string().min(2), // 1st field in table
  email: z.string().email(), // 2nd field in table
  phone: z.string().optional(), // 3rd field in table
});

// Use descriptive error messages
name: z.string().min(2, "Name must be at least 2 characters");

// Reuse common schemas
export const GetListSchema = PaginationSchema.extend({
  search: z.string().optional(),
});

// Use coercion for query params
page: z.coerce.number().min(1).default(1);
```

### DON'T ❌

```typescript
// Don't ignore field ordering
export const CreateSchema = z.object({
  phone: z.string().optional(),   // ❌ Wrong order
  name: z.string(),               // ❌ Should be first
  email: z.string().email(),      // ❌ Should be second
});

// Don't use generic messages
name: z.string().min(2, 'Invalid')  // ❌ Too vague

// Don't forget coercion for query params
page: z.number().min(1)  // ❌ Query params are strings!

// Don't duplicate schemas
// ❌ Create separate schema for same shape
export const GetUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});
// ✅ Reuse common schema
export const GetUsersSchema = PaginationSchema.extend({ ... });
```

---

## Related Documentation

- [Route Layer](./ROUTE_LAYER.md) - Using validators in routes
- [Error Handling](./ERROR_HANDLING.md) - Validation error handling
- [Types](./TYPES.md) - TypeScript type definitions
