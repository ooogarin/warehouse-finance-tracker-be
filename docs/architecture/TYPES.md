# TypeScript Types

## Overview

All TypeScript interfaces and types are defined in the `/src/types` folder. Types ensure type safety across all layers of the application.

---

## Purpose

### What Types Do

- Define data shapes for each layer
- Ensure type safety and IDE support
- Document data structures
- Enable compile-time error detection

---

## File Structure

```
src/types/
├── context.types.ts            ← Hono context types
├── auth.types.ts               ← Authentication types
├── merchants.types.ts          ← Merchant types
├── purchase-orders.types.ts    ← Purchase Orders types
└── users.types.ts              ← User types
```

---

## Naming Convention

Types follow a consistent naming pattern with PascalCase: `<Object><Layer><Action><Shape>`

| Layer                        | Suffix               | Example                   |
| ---------------------------- | -------------------- | --------------------------|
| API Request Body             | `Input`              | `MerchantInput`           |
| API Request Body             | `InputBody` (update) | `MerchantInputBody`       |
| API Request Params           | `InputParams`        | `MerchantInputParams`     |
| Service Payload              | `CreatePayload`      | `MerchantCreatePayload`   |
| Service Payload              | `UpdatePayload`      | `MerchantUpdatePayload`   |
| Service Payload              | `GetAllPayload`      | `MerchantGetAllPayload`   |
| DB Payload                   | `DbInsertPayload`    | `MerchantDbInsertPayload` |
| DB Model/Repository Response | `DbRow`              | `MerchantDbRow`           |

---

## Type Categories

### 1. Database Models / Repository Response

Types that match database tables or repository responses:

```typescript
// src/types/db-models.types.ts

/**
 * Merchant database model
 * Matches merchants table schema or repository responses
 */
export interface MerchantDbRow {
  id: number;
  name: string;
  type: MerchantType;
  address: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
```

### 2. Database Payloads

Types for parameter, insert, and update operations:

```typescript
// src/types/merchants.types.ts

// Database insert payload for merchants
export interface MerchantDbInsertPayload {
  name: string;
  type: MerchantType;
  address?: string | null;
  phone?: string | null;
}

// Database update payload for merchants
export interface MerchantDbUpdatePayload {
  name?: string;
  type?: MerchantType;
  address?: string | null;
  phone?: string | null;
}
```

### 3. API Types

Types for request at the controller (request handler) layer and validate by Zod schemas.
No response types are defined.

```typescript
// src/types/merchants.types.ts

// API request body for creating merchant
export interface MerchantInputBody {
  name: string;
  type: MerchantType;
  address?: string;
  phone?: string;
}

// API request body for updating merchant
export interface MerchantUpdateInput {
  name?: string;
  type?: MerchantType;
  address?: string;
  phone?: string;
}

// API query params for get all merchants
export interface MerchantInputParams {
  page?: number;
  limit?: number;
  search?: string;
}

```

### 4. Service Input Types

Types for service layer function parameters formatted in controller layer that match by validation schemas.
So the types is combined from request API types, no need create new types.

```typescript
// src/types/merchants.types.ts

// Service payload for creating merchant (same as API request body)
export interface MerchantInputBody {
  name: string;
  type: MerchantType;
  address?: string;
  phone?: string;
}

// Service payload for updating merchant (same as API request body with optional fields)
export interface MerchantUpdatePayload {
  id: string;
  body: MerchantUpdateInput;
}

// Service result for paginated merchants
export interface MerchantGetAllPayload {
  filter: MerchantGetAllFilter[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
```

---

## Sample Type Files

### Auth Types

```typescript
// src/types/auth.types.ts

import type { z } from 'zod';
import type { UserRole } from '@/constants/roles.constant';
import type { changePasswordSchema, loginSchema, registerSchema, updateProfileSchema } from '@/validators/auth.schemas';

// Input Types (inferred from Zod schemas)
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  type?: 'access';
  iat: number;
  exp: number;
}

```

### User Types

```typescript
// src/types/users.types.ts

import type { UserRole } from '@/constants/roles.constant';

// User database model - matches users table schema
export interface UserDbRow {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Database insert payload for users
export type UserDbInsertPayload = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string | null;
};

// Database update payload for users
export type UserDbUpdatePayload = {
  name?: string;
  phone?: string | null;
};
```

## Utility Types

### Mapper Types

```typescript
// src/types/ingredients.types.ts

// Ingredient cost calculation mapper
export interface IngredientCostMapper {
  ingredientId: number;
  ingredientName: string;
  totalQuantity: number;
  totalCost: number;
  unitPrice: number;
}


// Stock aggregation mapper
export interface StockAggregationMapper {
  ingredientId: number;
  ingredientName: string;
  currentStock: number;
  minStock: number;
  totalValue: number;
  lastPurchaseDate: Date | null;
}


// Dashboard summary mapper
export interface DashboardSummaryMapper {
  totalIngredients: number;
  lowStockCount: number;
  totalPurchaseOrders: number;
  pendingOrders: number;
  totalSpending: number;
  monthlySpending: number;
}
```

---

## Type Exports

Each type file exports individually:

```typescript
// src/types/index.ts (optional - for convenience)
export * from "./context.types";
export * from "./auth.types";
export * from "./merchants.types";
export * from "./suppliers.types";
export * from "./ingredients.types";
export * from "./ingredient-units.types";
export * from "./purchase-orders.types";
```

---

## Usage Examples

### In Controllers

```typescript
import type { Context } from 'hono';
import * as authService from '@/services/auth.service';
import type { LoginInput, RegisterInput } from '@/types/auth.types';
import type { AppEnv } from '@/types/context.types';

export const register = async (c: Context<AppContext>) => {
  const data = getBody<RegisterInput>(c);
  // ...
};

export const login = async (c: Context<AppContext>) => {
  const data = getBody<LoginInput>(c);
  // ...
};
```

### In Services

```typescript
import type { MerchantInputBody } from "@/types/merchants.types";

export const getAll = async (payload: GetAllPayload) => {
  // ...
};

export const create = async (data: MerchantInputBody) => {
  // ...
};

export const update = async (userId: string, data: MerchantInputBody) => {
  // ...
};

```

### In Repositories

```typescript
import type {
  MerchantDbRow,
  MerchantDbInsertPayload,
  MerchantDbUpdatePayload,
} from "@/types/merchants.types";

export const insert = async (connection: ReservedSQL, payload: MerchantDbInsertPayload): Promise<MerchantDbRow> => {
  const [result] = await connection<MerchantDbRow[]>`
    INSERT INTO merchants ${sql(payload, ...allowedColumns)}
    RETURNING *;
  `;

  return result;
};

```

---

## Best Practices

### DO ✅

```typescript
// Define types for each layer
interface MerchantInputBody { ... }
interface MerchantUpdatePayload { ... }
interface MerchantDbInsertPayload { ... }
interface MerchantDbRow { ... }

// Use direct type for simple type, no need to create interface
const data: { id: number; name: string } = { id: 1, name: "Merchant" };

// Use explicit types, not any
const merchant: Merchant = await repository.getOneById(id);

// Export types individually
export interface Merchant { ... }
export interface MerchantDbInsertPayload { ... }

// Use union types for enums
export type MerchantType = 'restaurant' | 'cafe' | 'catering' | 'other';

// Use array type instead of Array<T>
export type MerchantArray = Merchant[];
```

### DON'T ❌

```typescript
// Don't use any
const merchant: any = await repository.getOneById(id);  // ❌

// Don't reuse types across layers incorrectly
function create(data: Merchant) {  // ❌ Should use input type
  // ...
}

// Don't mix naming conventions
interface merchantData { ... }  // ❌ Use PascalCase
interface Merchant_Data { ... }  // ❌ Use PascalCase without underscores
```

---

## Related Documentation

- [Repository Layer](./REPOSITORY_LAYER.md) - Database operations
- [Service Layer](./SERVICE_LAYER.md) - Business logic
- [Controller Layer](./CONTROLLER_LAYER.md) - HTTP handling
- [Validator](./VALIDATOR.md) - Zod schemas
