# Repository Layer

## Overview

The Repository Layer handles **database operations**. It writes raw SQL queries using Bun SQL tagged templates, executes them, and returns raw data. Repositories contain **no business logic**.

---

## Purpose

### What It Does

- Database operations
- Write and execute SQL queries
- Parameter binding (via tagged templates)
- Return raw data from database
- Support transactions

### What It Doesn't Do

- Business logic
- HTTP handling
- Response formatting
- Data validation (business)

---

## File Structure

```
src/repositories/
├── client.ts                       ← DB client (pool, query, transaction)
├── users.repository.ts             ← User data operations
├── merchants.repository.ts         ← Merchant data operations
├── user-merchants.repository.ts    ← User-Merchant relationships
└── ...
```

---

## Database Client (client.ts)

```typescript
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

type ReservedSQL = Awaited<ReturnType<typeof sql.reserve>>;

/**
 * Execute a SQL query (non-transaction)
 *
 * @example
 * const merchants = await query<Merchant>`
 *   SELECT id, name FROM merchants WHERE id = ${id}
 * `;
 */
export const query = async <T>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> => {
  const result = await sql<T[]>(strings, ...values);
  return result ?? [];
};

// Start a transaction
export const startTransaction = async (): Promise<ReservedSQL> => {
  const reserved = await sql.reserve();
  try {
    await reserved`BEGIN`;
  } catch (err) {
    reserved.release();
    throw err;
  }
  return reserved;
};

// Commit transaction
export const commitTransaction = async (connection: ReservedSQL): Promise<void> => {
  try {
    await connection`COMMIT`;
  } finally {
    connection.release();
  }
};

// Rollback transaction
export const rollbackTransaction = async (connection: ReservedSQL): Promise<void> => {
  try {
    await connection`ROLLBACK`;
  } finally {
    connection.release();
  }
};

export type { SQL, ReservedSQL };
```

---

## Function Naming Conventions

| Prefix       | Purpose                      | Example                        |
| ------------ | ---------------------------- | ------------------------------ |
| `getOne`     | Get single record            | `getOneById`, `getOneByEmail`  |
| `getAll`     | Get multiple records         | `getAll`, `getAllByMerchantId` |
| `insert`     | Insert single record         | `insert`                       |
| `bulkInsert` | Insert multiple records      | `bulkInsert`                   |
| `update`     | Update record(s)             | `updateById`                   |
| `softDelete` | Soft delete (set deleted_at) | `softDeleteById`               |
| `count`      | Count records                | `countAllById`                 |
| `exists`     | Check existence              | `existsById`                   |

---

## Parameter Rules

### Read Operations
- 1st parameter: id (optional): ID if mentioned at name
- 2nd parameter: payload (optional): payload for filter or pagination

### Insert Operations
- 1st parameter: connection (transaction or `sql`)
- 2nd parameter: payload (data object for insert operations)

### Update Operations
- 1st parameter: connection (transaction or `sql`)
- 2nd parameter: id (ID for update/delete operations)
- 3rd parameter: payload (data object for update operations)

### Delete Operations
- 1st parameter: connection (transaction or `sql`)
- 2nd parameter: id (ID for update/delete operations)


```typescript
// Read operations - no connection needed
await repository.getOneById(id);
await repository.getAllByMerchantId(merchantId);
await repository.getAllByUserId(userId, payload);

// Write operations - pass connection (transaction)
await repository.insert(connection, payload);
await repository.updateById(connection, id, payload);
await repository.softDeleteById(connection, id);
```

---

## SQL Query Patterns

### READ - Single Record

- Always return array with one element or null
- Use LIMIT 1 for clarity that is only one record

```typescript
export const getOneById = async (id: string): Promise<MerchantDbRow | null> => {
  const [result] = await query<MerchantDbRow>`
    SELECT
      id,
      name,
      type,
      address,
      phone,
      cash_balance
    FROM merchants
    WHERE id = ${id}
      AND deleted_at IS NULL
    LIMIT 1;
  `;

  return result ?? null;
};
```

### READ - Multiple Records

- Always return array with records or empty array

```typescript
export const getAll = async (): Promise<MerchantDbRow[]> => {
  const result = await query<MerchantDbRow>`
    SELECT
      id,
      name,
      type,
      address,
      phone,
      cash_balance
    FROM merchants
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC;
  `;

  return result;
};
```

### READ - Where Clause

- Parameterized queries are safe to use, no SQL injection

```typescript
export const getByType = async (type: string): Promise<MerchantDbRow[]> => {
  const result = await query<MerchantDbRow>`
    SELECT
      id,
      name,
      type,
      address,
      phone,
      cash_balance
    FROM merchants
    WHERE type = ${type}
      AND deleted_at IS NULL
    ORDER BY created_at DESC;
  `;

  return result;
};
```

### READ - Where In Clause

- Parameterized queries are safe to use, no SQL injection

```typescript
export const getByIds = async (ids: string[]): Promise<MerchantDbRow[]> => {
  if (ids.length === 0) {
    return [];
  }

  const result = await query<MerchantDbRow>`
    SELECT
      id,
      name,
      type,
      address,
      phone,
      cash_balance
    FROM merchants
    WHERE id = ANY(${ids})
      AND deleted_at IS NULL
    ORDER BY created_at DESC;
  `;

  return result;
};
```

### READ - Conditional Queries (Search/Filter)

```typescript
import { sql, query } from "./client";

export const getAllByUserId = async (
  userId: string,
  filters: { search?: string; limit: number; offset: number },
): Promise<MerchantDbRow[]> => {
  const searchPattern = filters.search
    ? sql`AND m.name ILIKE %${filters.search}%`
    : sql``;

  return await query<MerchantDbRow>`
    SELECT DISTINCT 
      m.id, m.name, m.type, m.address, m.phone, m.cash_balance, 
      m.created_at, m.updated_at
    FROM merchants m
    INNER JOIN user_merchants um ON m.id = um.merchant_id
    WHERE um.user_id = ${userId}
      AND m.deleted_at IS NULL
      AND um.deleted_at IS NULL
      ${searchPattern}
    ORDER BY m.created_at DESC
    LIMIT ${filters.limit} OFFSET ${filters.offset}
  `;
};
```

### INSERT - Single Insert

```typescript
import { sql, type ReservedSQL } from "./client";

export const insert = async (
  connection: ReservedSQL,
  payload: MerchantDbInsertPayload,
): Promise<MerchantDbRow> => {
  const allowedColumns = ["id", "name", "type", "address", "phone", "cash_balance"] as const;

  const [result] = await connection<MerchantDbRow[]>`
    INSERT INTO merchants ${sql(payload, ...allowedColumns)}
    RETURNING id, name, type, address, phone, cash_balance, created_at, updated_at, deleted_at
  `;

  if (!result) {
    throw new Error("Insert failed: no row returned");
  }

  return result;
};

// Usage in service:
// await insert(connection, {
//   id: 'uuid',
//   name: 'My Restaurant',
//   type: 'restaurant',
//   address: 'Jakarta',
//   phone: '0812',
//   cash_balance: 0
// });
```

### INSERT - Bulk Insert

```typescript
import { sql, type ReservedSQL } from "./client";

export const bulkInsert = async (
  connection: ReservedSQL,
  payloads: MerchantDbInsertPayload[],
): Promise<MerchantDbRow[]> => {
  if (payloads.length === 0) {
    return [];
  }

  const allowedColumns = ["id", "name", "type", "address", "phone", "cash_balance"] as const;

  const result = await connection<MerchantDbRow[]>`
    INSERT INTO merchants ${sql(payloads, ...allowedColumns)}
    RETURNING id, name, type, address, phone, cash_balance, created_at, updated_at, deleted_at
  `;

  if (!result.length) {
    throw new Error("Bulk insert failed: no rows returned");
  }

  return result;
};

// Usage in service:
// await insert(connection, [
//   {
//     id: 'uuid',
//     name: 'My Restaurant',
//     type: 'restaurant',
//     address: 'Jakarta',
//     phone: '0812',
//     cash_balance: 0
//   },
//   {
//     id: 'uuid',
//     name: 'My Other Restaurant',
//     type: 'restaurant',
//     cash_balance: 0
//   }
// ]);
```

### UPDATE - Using Object Helper with Column Picking

```typescript
import { sql, type ReservedSQL } from "./client";

export const updateById = async (
  connection: ReservedSQL,
  id: string,
  payload: MerchantDbUpdatePayload,
): Promise<MerchantDbRow> => {
  const allowedColumns = ["name", "type", "address", "phone"] as const;

  const [result] = await connection<MerchantDbRow[]>`
    UPDATE merchants
    SET
      ${sql(payload, ...allowedColumns)},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
      AND deleted_at IS NULL
    RETURNING id, name, type, address, phone, cash_balance, created_at, updated_at, deleted_at
  `;

  if (!result) {
    throw new Error("Update failed: merchant not found or already deleted");
  }

  return result;
};

// Usage in service:
// await updateById(connection, 'uuid', { name: 'Garin' });
// await updateById(connection, 'uuid', { name: 'Garin', type: 'owner' });
// await updateById(connection, 'uuid', { address: 'Jakarta', phone: '0812' });
```

### UPDATE - Soft Delete

```typescript
import { sql, type ReservedSQL } from "./client";

export const softDeleteById = async (
  connection: ReservedSQL,
  id: string,
): Promise<number> => {
  const [result] = await connection<number>`
    UPDATE merchants
    SET
      deleted_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
      AND deleted_at IS NULL
  `;

  if (!result) {
    throw new Error(
      "Soft delete failed: merchant not found or already deleted",
    );
  }

  return result;
};
```

### UPDATE - Arithmetic Operations

```typescript
import { sql, type ReservedSQL } from "./client";

export const decreaseCashBalance = async (
  connection: ReservedSQL,
  id: string,
  amount: number,
): Promise<number> => {
  const [result] = await connection<number>`
    UPDATE merchants
    SET
      cash_balance = cash_balance - ${amount},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
      AND deleted_at IS NULL
  `;

  if (!result) {
    throw new Error(
      "Decrease cash balance failed: merchant not found or already deleted",
    );
  }

  return result;
};

export const increaseCashBalance = async (
  connection: SQL,
  id: string,
  amount: number,
): Promise<void> => {
  await connection`
    UPDATE merchants
    SET cash_balance = cash_balance + ${amount},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id} AND deleted_at IS NULL
  `;
};
```

---

## Transaction Usage in Service Layer

### Explicit Transaction Pattern

```typescript
// services/merchant.ts

import {
  startTransaction,
  commitTransaction,
  rollbackTransaction,
} from "@/repositories/client";

export const createMerchant = async (userId: string, data: CreateData) => {
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

## Best Practices

### DO ✅

```typescript
// Use tagged template literals that built-in BUN SQL
await query<Merchant>`SELECT id, name, type FROM merchants WHERE id = ${id}`;

// Use object helper with column picking for INSERT
await connection<
  Merchant[]
>`INSERT INTO merchants ${sql(payload, "id", "name", "type")}`;

// Use object helper with column picking for UPDATE
await connection<Merchant[]>`
  UPDATE merchants 
    SET ${sql(payload, "name", "type")},
      updated_at = CURRENT_TIMESTAMP 
  WHERE id = ${id}
`;

// Select explicit fields
await query<Merchant>`SELECT id, name, type FROM merchants WHERE id = ${id}`;

// Check soft delete
await query<Merchant>`SELECT id, name, type FROM merchants WHERE id = ${id} AND deleted_at IS NULL`;

// Use explicit transaction
function createData() {
  const connection = await startTransaction();
  try {
    await repo.insert(connection, data);
    await commitTransaction(connection);
  } catch (error) {
    await rollbackTransaction(connection);
    throw error;
  }
}
```

### DON'T ❌

```typescript
// Don't use SELECT *
await query<Merchant>`SELECT * FROM merchants`; // ❌ Be explicit

// Don't forget soft delete check
await query<Merchant>`SELECT * FROM merchants WHERE id = ${id}`; // ❌ Missing deleted_at

// Don't hardcode values
await query<Merchant>`SELECT * FROM merchants WHERE status = 'active'`; // ❌ Use parameter
```

---

## Related Documentation

- [Service Layer](./SERVICE_LAYER.md) - Business logic
- [Types](./TYPES.md) - TypeScript definitions
