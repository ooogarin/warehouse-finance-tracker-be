# Service Layer

## Overview

The Service Layer contains **business logic**. It orchestrates operations, validates business rules, and coordinates between controllers and repositories. Services return **raw data**, not formatted HTTP responses.

---

## Purpose

### What It Does

- Implement business rules
- Validate business constraints
- Orchestrate multiple operations
- Call repositories
- Throw business errors
- Log business events
- Manage transactions

### What It Doesn't Do

- HTTP req/res handling
- SQL query construction
- Response formatting
- Direct database access (use repos)
- Parse request data
- Handle HTTP status codes

---

## File Structure

```
src/services/
├── auth.service.ts                 ← Authentication logic
├── merchants.service.ts            ← Merchant business logic
├── suppliers.service.ts            ← Supplier business logic
├── ingredients.service.ts          ← Ingredient business logic
├── ingredient-units.service.ts     ← Unit conversion logic
├── purchase-orders.service.ts      ← Purchase orders business logic
├── fifo.service.ts                 ← FIFO calculation logic
├── dashboard.service.ts            ← Dashboard aggregation
└── index.ts                        ← Re-export all services
```

---

## Service Naming Conventions

### Methods

| Method Pattern    | Purpose                  | Type         |
| ----------------- | ------------------------ | ------------ |
| `userMerchantMap` | Mapping user to merchant | Mapping data |
| `calculate`       | Calculation logic        | Calculation  |
| `getAll*`         | Get list with pagination | CRUD         |
| `getById`         | Get single by ID         | CRUD         |
| `getBy*`          | Get by specific field    | CRUD         |
| `create`          | Create new resource      | CRUD         |
| `update`          | Update existing resource | CRUD         |
| `delete*`         | Soft delete resource     | CRUD         |

### Variables

- Use **camelCase** for variables and functions
- Use **PascalCase** for types and classes
- Use **lower_snake_case** for request, response, and database field
- Use **UPPER_SNAKE_CASE** for constants

---

## Basic Service Structure

```typescript
// src/services/merchants.service.ts
import { logger } from "@/config/logger.config";
import { ERROR_MESSAGES } from "@/constants/messages.constant";
import {
  commitTransaction,
  rollbackTransaction,
  startTransaction,
} from "@/repositories/client";
import * as merchantsRepository from "@/repositories/merchants.repository";
import * as userMerchantsRepository from "@/repositories/user-merchants.repository";
import type {
  MerchantApiGetOneResponse,
  MerchantServiceCreateData,
} from "@/types/merchants.types";
import { InternalError, NotFoundError } from "@/utils/errors.util";

/**
 * Get merchant by ID
 */
export const getById = async (
  merchantId: string,
): Promise<MerchantApiGetOneResponse> => {
  try {
    const merchant = await merchantsRepository.getOneById(merchantId);

    if (!merchant) {
      throw new NotFoundError(ERROR_MESSAGES.MERCHANT_NOT_FOUND);
    }

    return {
      id: merchant.id,
      name: merchant.name,
      type: merchant.type,
      address: merchant.address,
      phone: merchant.phone,
      cash_balance: parseFloat(merchant.cash_balance),
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }

    logger.error({ error, merchantId }, "Failed to get merchant");
    throw new InternalError("Failed to get merchant");
  }
};

/**
 * Create new merchant
 * Creates merchant and links user as owner within a transaction
 */
export const create = async (
  userId: string,
  data: MerchantServiceCreateData,
): Promise<MerchantApiGetOneResponse> => {
  let connection: Connection | null = null;

  try {
    // Generate new merchant ID by built in UUID v4
    const merchantId = crypto.randomUUID();

    // Using object helper for cleaner syntax
    const payload: MerchantDbInsertPayload = {
      id: merchantId,
      name: data.name,
      type: data.type,
      address: data.address,
      phone: data.phone,
      cash_balance: 0,
    };
    // Only insert by specified fields in payload object
    const merchant = await merchantsRepository.insert(connection, payload);

    // Always use payload object for cleaner syntax
    const userMerchantPayload: UserMerchantDbInsertPayload = {
      id: crypto.randomUUID(),
      user_id: userId,
      merchant_id: merchantId,
    };
    await userMerchantsRepository.insert(connection, userMerchantPayload);

    // Commit transaction
    await commitTransaction(connection);

    logger.info({ merchantId, userId }, "Merchant created successfully");

    // Return formatted response
    return {
      id: merchant.id,
      name: merchant.name,
      type: merchant.type,
      address: merchant.address,
      phone: merchant.phone,
      cash_balance: parseFloat(merchant.cash_balance),
      created_at: merchant.created_at.toISOString(),
      updated_at: merchant.updated_at.toISOString(),
    };
  } catch (error) {
    if (connection) {
      // Rollback on error
      await rollbackTransaction(connection);
    }

    logger.error({ error, userId, data }, "Failed to create merchant");
    throw new InternalError("Failed to create merchant");
  }
};
```

---

## Error Handling in Services

Services throw business errors using custom error classes:

```typescript
// Example of error handling in services
import {
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  InternalError,
} from "@/utils/errors.util";
import { ERROR_MESSAGES } from "@/constants/messages.constant";

// Not found error (404)
const merchant = await merchantsRepository.getOneById(id);
if (!merchant) {
  throw new NotFoundError(ERROR_MESSAGES.MERCHANT_NOT_FOUND);
}

// Unauthorized error (401)
if (!user) {
  throw new UnauthorizedError("Invalid credentials");
}

// Forbidden error (403)
if (merchant.user_id !== userId) {
  throw new ForbiddenError("Access denied");
}

// Internal error (500) - for unexpected errors
logger.error({ error }, "Unexpected error");
throw new InternalError("Something went wrong");
```

---

## Transaction Management

Services manage transactions using explicit `startTransaction`, `commitTransaction`, and `rollbackTransaction`:
Transaction open not at begin of function, but right before db operations.

```typescript
// 1. Do some tasks
// 2. Start transaction
// 3. Do db operations
// 4. Commit transaction when success
// 5. Rollback transaction when error
// 6. Return data
```

### Transaction Pattern (Recommended)

```typescript
// ✅ CORRECT: Transaction starts right before data operations
export const createMerchant = async (data: CreateInput) => {
  import {
    startTransaction,
    commitTransaction,
    rollbackTransaction,
    type SQL,
  } from "@/repositories/client";

  export const createWithItems = async (
    merchantId: string,
    userId: string,
    data: CreatePurchaseOrderDTO,
  ) => {
    let connection: Connection | null = null;

    try {
      // Doing some tasks

      // Start transaction
      connection = await startTransaction();

      // Doing db operations

      // Commit transaction
      await commitTransaction(connection);

      return data;
    } catch (error) {
      if (connection) {
        // Rollback on error
        await rollbackTransaction(connection);
      }

      throw new InternalError("Internal server error");
    }
  };
};
```

---

## Sample Service Files

### Auth Service

```typescript
// src/services/auth.service.ts
import * as usersRepository from "@/repositories/users.repository";
import { UnauthorizedError, ValidationError } from "@/utils/errors.util";
import { generateToken } from "@/utils/jwt.util";
import { ROLE } from "@/constants/enums.constant";

export const login = async (email: string, password: string) => {
  // Find user
  const user = await usersRepository.getOneByEmail(email);
  if (!user) {
    throw new UnauthorizedError("Invalid credentials");
  }

  // Verify password using Bun's built-in
  const isValid = await Bun.password.verify(password, user.password);
  if (!isValid) {
    throw new UnauthorizedError("Invalid credentials");
  }

  // Generate tokens
  const accessToken = await generateToken({ userId: user.id, role: user.role });

  return {
    access_token: accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
};

export const register = async (data: RegisterInput) => {
  let connection: Connection | null = null;
  try {
    // Start transaction
    connection = await startTransaction();

    // Check if email exists
    const existing = await usersRepository.getOneByEmail(data.email);
    if (existing) {
      throw new ValidationError("Email already registered");
    }

    // Hash password using Bun's built-in
    const hashedPassword = await Bun.password.hash(data.password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    // Using object helper for cleaner syntax
    // Using constants for role
    const payload: UserDbInsertPayload = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: ROLE.OWNER,
    };

    // Create user
    const user = await usersRepository.insert(payload);

    // Commit transaction
    await commitTransaction(connection);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    if (connection) {
      // Rollback on error
      await rollbackTransaction(connection);
    }

    throw new InternalError("Internal server error");
  }
};
```

### Purchase Orders Service

```typescript
// src/services/purchase-orders.service.ts
import { sql } from "@/repositories/client";
import * as purchaseOrdersRepository from "@/repositories/purchase-orders.repository";
import * as purchaseItemsRepository from "@/repositories/purchase-items.repository";
import * as ingredientsRepository from "@/repositories/ingredients.repository";
import * as stockLogsRepository from "@/repositories/stock-logs.repository";
import * as merchantsRepository from "@/repositories/merchants.repository";
import { NotFoundError, ValidationError } from "@/utils/errors.util";

export const create = async (
  merchantId: string,
  data: CreatePurchaseOrderDTO,
  userId: string,
) => {
  let connection: Connection | null = null;

  try {
    // Validate supplier
    const supplier = await suppliersRepository.getOneById(data.supplier_id);
    if (!supplier || supplier.merchant_id !== merchantId) {
      throw new NotFoundError("Supplier not found");
    }

    // Calculate totals
    let totalAmount = 0;
    for (const item of data.items) {
      totalAmount += item.quantity * item.unit_price;
    }

    // Start transaction
    connection = await startTransaction();

    // Always create variabl payload
    const purchaseOrderPayload: PurchaseOrderDbInsertPayload = {
      id: crypto.randomUUID(),
      merchant_id: merchantId,
      supplier_id: data.supplier_id,
      total_amount: totalAmount,
      paid_amount: data.paid_amount,
      remaining_debt: totalAmount - data.paid_amount,
      purchase_date: data.purchase_date,
    };

    const order = await purchaseOrdersRepository.insert(connection, payload);

    // Process items
    const purchaseItemPayload: PurchaseItemDbInsertPayload[] = [];
    const stockLogPayload: StockLogDbInsertPayload[] = [];
    const ingredientPayload: IngredientDbUpdatePayload[] = [];

    // Loop for build payload only, no DB operation
    for (const item of data.items) {
      purchaseItemPayload.push({
        id: crypto.randomUUID(),
        purchase_order_id: order.id,
        ingredient_id: item.ingredient_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      });

      stockLogPayload.push({
        id: crypto.randomUUID(),
        merchant_id: merchantId,
        ingredient_id: item.ingredient_id,
        quantity: item.quantity,
        movement_type: MOVEMENT_TYPE.IN,
        reference_type: REFERENCE_TYPE.PURCHASE,
        reference_id: order.id,
        created_by: userId,
      });

      ingredientPayload.push({
        id: item.ingredient_id,
        stock: item.quantity,
      });
    }

    // Parallel execution if possible
    await Promise.all([
      // Create item
      purchaseItemsRepository.insert(connection, purchaseItemPayload),

      // Update stock
      ingredientsRepository.increaseStock(connection, ingredientPayload),

      // Create stock log
      stockLogsRepository.insert(connection, stockLogPayload),
    ]);

    // Update cash if paid
    if (data.paid_amount > 0) {
      await merchantsRepository.decreaseCashBalance(
        connection,
        merchantId,
        data.paid_amount,
      );
    }

    await commitTransaction(connection);

    logger.info({ orderId: order.id }, "Purchase order created");

    return { id: order.id };
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }

    throw error;
  }
};
```

---

## Logging in Services

Services log important business events using the logger from config. Don't use console.log in services.

```typescript
import { logger } from "@/config/logger.config";

// Log creation
logger.info(
  { userId, merchantId: merchant.id },
  "Merchant created successfully",
);

// Log updates
logger.info({ merchantId }, "Merchant updated successfully");

// Log deletions
logger.info({ merchantId }, "Merchant deleted successfully");

// Log errors
logger.error({ error, userId, data }, "Failed to create merchant");
```

---

## Best Practices

### DO ✅

```typescript
// Return raw data (not formatted response)
export const create = async (userId: string, data: Input) => {
  const merchant = await repository.insert(connection, payload);
  return merchant; // Raw data
};

// Throw business errors
if (!item) {
  throw new NotFoundError("Item not found");
}

// Use explicit transactions
let connection: Connection | null = null;
try {
  connection = await startTransaction();
  await repository.insert(connection, data);
  await commitTransaction(connection);
} catch (error) {
  if (connection) {
    await rollbackTransaction(connection);
  }
  throw error;
}

// Log business events
logger.info({ userId, resourceId }, "Resource created");

// Use Bun SQL helpers
// Use object as payload for cleaner code
await merchantsRepository.insert(connection, {
  id: crypto.randomUUID(),
  name: data.name,
  cash_balance: 0,
});
```

### DON'T ❌

```typescript
// Don't return formatted HTTP responses
export const create = async (data: Input) => {
  const merchant = await repository.insert(connection, data);
  return {
    success: true, // ❌ This belongs in controller
    message: "Created",
    data: merchant,
  };
};

// Don't use callbacks for transactions
await sql.begin(async (txn) => {
  // ❌ Use explicit start/commit/rollback
  // ...
});

// Don't write SQL queries
export const getMerchants = async () => {
  const result = await sql`SELECT * FROM merchants`; // ❌ Use repository
  return result;
};
```

---

## Related Documentation

- [Controller Layer](./CONTROLLER_LAYER.md) - HTTP handling
- [Repository Layer](./REPOSITORY_LAYER.md) - Database access
- [Error Handling](./ERROR_HANDLING.md) - Error utilities
- [Logging](./LOGGING.md) - Logger configuration
