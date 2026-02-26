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
├── suppliers.types.ts          ← Supplier types
├── ingredients.types.ts        ← Ingredient types
├── ingredient-units.types.ts   ← Unit types
└── purchase-orders.types.ts    ← Purchase Orders types
```

---

## Naming Convention

Types follow a consistent naming pattern: `<Object><Layer><Action><Shape>`

| Layer              | Suffix                   | Example                          | Style      |
| ------------------ | ------------------------ | -------------------------------- | ---------- |
| API Request Body   | `ApiCreateRequestBody`   | `MerchantApiCreateRequestBody`   | PascalCase |
| API Request Params | `ApiGetAllRequestParams` | `MerchantApiGetAllRequestParams` | PascalCase |
| API Response       | `ApiCreateResponse`      | `MerchantApiCreateResponse`      | PascalCase |
| API Response       | `ApiReadResponse`        | `MerchantApiReadResponse`        | PascalCase |
| Service Input      | `ServiceCreateInput`     | `MerchantServiceCreateInput`     | PascalCase |
| Service Output     | `ServiceCreateOutput`    | `MerchantServiceCreateOutput`    | PascalCase |
| DB Payload         | `DbInsertPayload`        | `MerchantDbInsertPayload`        | PascalCase |
| DB Model           | `DbModel`                | `MerchantDbModel`                | PascalCase |
| DB Field           | (no suffix)              | `created_at`                     | snake_case |

---

## Type Categories

### 1. Database Models

Types that match database tables exactly:

```typescript
// src/types/db-models.types.ts

/**
 * Merchant database model
 * Matches merchants table schema
 */
export interface Merchant {
  id: number;
  name: string;
  type: "restaurant" | "cafe" | "catering" | "other";
  address: string | null;
  phone: string | null;
  created_at: Date;
  updated_at: Date | null;
  deleted_at: Date | null;
}
```

### 2. Database Payloads

Types for parameter, insert, and update operations:

```typescript
// src/types/merchants.types.ts

/**
 * Database insert payload for merchants
 */
export interface MerchantDbInsertPayload {
  name: string;
  type: MerchantType;
  address?: string | null;
  phone?: string | null;
}

/**
 * Database update payload for merchants
 */
export interface MerchantDbUpdatePayload {
  name?: string;
  type?: MerchantType;
  address?: string | null;
  phone?: string | null;
}
```

### 3. API Types

Types for request/response at the controller (request handler) layer:

```typescript
// src/types/merchants.types.ts

/**
 * API request body for creating merchant
 */
export interface MerchantApiCreateRequestBody {
  name: string;
  type: MerchantType;
  address?: string;
  phone?: string;
}

/**
 * API request body for updating merchant
 */
export interface MerchantApiUpdateRequestBody {
  name?: string;
  type?: MerchantType;
  address?: string;
  phone?: string;
}

/**
 * API query params for get all merchants
 */
export interface MerchantApiGetAllRequestParams {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * API response for merchant
 */
export interface MerchantApiResponse {
  id: number;
  name: string;
  type: MerchantType;
  address: string | null;
  phone: string | null;
}
```

### 4. Service Input Types

Types for service layer function parameters:

```typescript
// src/types/merchants.types.ts

/**
 * Service payload for creating merchant
 */
export interface MerchantServiceCreatePayload {
  name: string;
  type: MerchantType;
  address?: string;
  phone?: string;
}

/**
 * Service payload for updating merchant
 */
export interface MerchantServiceUpdatePayload {
  name?: string;
  type?: MerchantType;
  address?: string;
  phone?: string;
}

/**
 * Service options for get all merchants
 */
export interface MerchantServiceGetAllOptions {
  page: number;
  limit: number;
  search?: string;
}

/**
 * Service result for paginated merchants
 */
export interface MerchantServiceGetAllResult {
  merchants: Merchant[];
  page: number;
  limit: number;
  total: number;
}
```

### 5. Context Types

Types for Hono context:

```typescript
// src/types/context.types.ts
import type { Context } from "hono";

/**
 * User variables stored in context
 */
interface UserVariables {
  userId: string;
  userRole: UserRole;
  email: string;
}

/**
 * Merchant variables stored in context
 */
interface MerchantVariables {
  merchantId: number;
  merchantRole: "owner" | "manager" | "staff";
}

/**
 * Combined app context variables
 */
type AppVariables = UserVariables & MerchantVariables;

/**
 * Hono app context type
 */
export type AppContext = {
  Variables: AppVariables;
};

/**
 * Typed context parameter for controllers
 */
export type TypedContext = Context<AppContext>;
```

---

## Sample Type Files

### Merchants Types

```typescript
// src/types/merchants.types.ts

// Enums
export type MerchantType = "restaurant" | "cafe" | "catering" | "other";

// Database Models
export interface Merchant {
  id: number;
  name: string;
  type: MerchantType;
  address: string | null;
  phone: string | null;
  created_at: Date;
  updated_at: Date | null;
  deleted_at: Date | null;
}

// Database Payloads
export interface MerchantDbInsertPayload {
  name: string;
  type: MerchantType;
  address?: string | null;
  phone?: string | null;
  created_at: Date;
}

export interface MerchantDbUpdatePayload {
  name?: string;
  type?: MerchantType;
  address?: string | null;
  phone?: string | null;
  updated_at: Date;
}

// API Types
export interface MerchantApiCreateRequestBody {
  name: string;
  type: MerchantType;
  address?: string;
  phone?: string;
}

export interface MerchantApiUpdateRequestBody {
  name?: string;
  type?: MerchantType;
  address?: string;
  phone?: string;
}

export interface MerchantApiGetAllRequestParams {
  page?: number;
  limit?: number;
  search?: string;
}

// Service Types
export interface MerchantServiceCreateInput {
  name: string;
  type: MerchantType;
  address?: string;
  phone?: string;
}

export interface MerchantServiceUpdateInput {
  name?: string;
  type?: MerchantType;
  address?: string;
  phone?: string;
}

export interface MerchantServiceGetAllOptions {
  page: number;
  limit: number;
  search?: string;
}

export interface MerchantServiceGetAllResult {
  merchants: Merchant[];
  page: number;
  limit: number;
  total: number;
}
```

### Auth Types

```typescript
// src/types/auth.types.ts

// Enums
export type UserRole = "owner" | "manager" | "staff";

// Database Models
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string | null;
  created_at: Date;
  updated_at: Date | null;
  deleted_at: Date | null;
}

// Database Payloads
export interface UserDbInsertPayload {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string | null;
  created_at: Date;
}

// API Types
export interface AuthApiLoginRequestBody {
  email: string;
  password: string;
}

export interface AuthApiRegisterRequestBody {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthApiRefreshRequestBody {
  refresh_token: string;
}

export interface AuthApiLoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

// Service Types
export interface AuthServiceRegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  role: UserRole;
  type?: "access" | "refresh";
  iat: number;
  exp: number;
}
```

## Utility Types

### Mapper Types

```typescript
// src/types/ingredients.types.ts

/**
 * Ingredient cost calculation mapper
 */
export interface IngredientCostMapper {
  ingredientId: number;
  ingredientName: string;
  totalQuantity: number;
  totalCost: number;
  unitPrice: number;
}

/**
 * Stock aggregation mapper
 */
export interface StockAggregationMapper {
  ingredientId: number;
  ingredientName: string;
  currentStock: number;
  minStock: number;
  totalValue: number;
  lastPurchaseDate: Date | null;
}

/**
 * Dashboard summary mapper
 */
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
import type { AppContext } from "@/types/context.types";
import type {
  MerchantApiCreateRequestBody,
  MerchantApiGetAllRequestParams,
} from "@/types/merchants.types";

export const create = async (c: Context<AppContext>) => {
  const data = c.req.valid("json") as MerchantApiCreateRequestBody;
  // ...
};

export const getAll = async (c: Context<AppContext>) => {
  const params = c.req.valid("query") as MerchantApiGetAllRequestParams;
  // ...
};
```

### In Services

```typescript
import type {
  Merchant,
  MerchantServiceCreateInput,
  MerchantServiceGetAllResult,
} from "@/types/merchants.types";

export const create = async (
  userId: string,
  data: MerchantServiceCreateInput,
): Promise<Merchant> => {
  // ...
};

export const getAll = async (
  userId: string,
  options: MerchantServiceGetAllOptions,
): Promise<MerchantServiceGetAllResult> => {
  // ...
};
```

### In Repositories

```typescript
import type {
  Merchant,
  MerchantDbInsertPayload,
  MerchantDbUpdatePayload,
} from "@/types/merchants.types";

export const insert = async (
  connection: TransactionClient | null,
  payload: MerchantDbInsertPayload,
): Promise<Merchant> => {
  // ...
};

export const updateById = async (
  connection: TransactionClient | null,
  id: number,
  payload: MerchantDbUpdatePayload,
): Promise<Merchant> => {
  // ...
};
```

---

## Best Practices

### DO ✅

```typescript
// Define types for each layer
interface MerchantApiCreateRequestBody { ... }
interface MerchantServiceCreateInput { ... }
interface MerchantDbInsertPayload { ... }

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
