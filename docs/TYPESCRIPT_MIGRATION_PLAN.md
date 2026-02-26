# TypeScript Migration Plan

Converting from SQL files to TypeScript migration files with `up` and `down` functions.

---

## File Structure (After Conversion)

```
migrations/
├── 001_create_all_enums.ts
├── 002_create_table_users.ts
├── 003_create_table_merchants.ts
├── 004_create_table_user_merchants.ts
├── 005_create_table_suppliers.ts
├── 006_create_table_ingredients.ts
├── 007_create_table_ingredient_units.ts
├── 008_create_table_ingredient_batches.ts
├── 009_create_table_purchase_orders.ts
├── 010_create_table_purchase_items.ts
├── 011_create_table_stock_logs.ts
├── 012_create_table_cash_logs.ts
├── 013_create_table_debts.ts
└── 014_create_table_debt_payments.ts
```

---

## Migration File Template

```typescript
// migrations/XXX_description.ts

import type { Sql } from '../src/config/database.config';

/**
 * Apply migration
 * Wrapped in transaction automatically by runner
 */
export const up = async (sql: Sql): Promise<void> => {
  // Statements execute sequentially (one by one)
  await sql`CREATE TABLE users (...)`;
  await sql`CREATE INDEX idx_users_email ON users(email)`;
  // ... more statements
};

/**
 * Rollback migration
 * Wrapped in transaction automatically by runner
 */
export const down = async (sql: Sql): Promise<void> => {
  // Reverse order of up()
  await sql`DROP INDEX IF EXISTS idx_users_email`;
  await sql`DROP TABLE IF EXISTS users`;
  // ... reverse all statements from up()
};
```

---

## Migration Runner Design

### Tracking Table (_migrations)

```sql
CREATE TABLE _migrations (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Execution Flow

```
1. Create SQL connection from environment variables
2. Scan migrations/ directory for *.ts files
3. Sort by filename (001, 002, 003...)
4. Query _migrations table for already executed
5. For each pending migration:
   a. Import the .ts file dynamically
   b. BEGIN transaction
   c. Call exported up(sql, transaction) function
   d. INSERT into _migrations
   e. COMMIT
   f. Log: "✅ 001_create_all_enums.ts"
6. For rollback:
   a. Get last executed migration from _migrations
   b. Import the .ts file
   c. BEGIN transaction
   d. Call exported down(sql, transaction) function
   e. DELETE from _migrations
   f. COMMIT
   g. Log: "✅ Rolled back 001_create_all_enums.ts"
```

### Runner Responsibilities

The runner script (`scripts/migrate.ts`) handles:
- Database connection creation
- Reading environment variables
- Scanning and sorting migration files
- Tracking applied migrations
- Wrapping each migration in transaction
- Logging

Migration files (`migrations/*.ts`) handle:
- Pure SQL operations
- No business logic
- No external dependencies (only `bun` types)

### CLI Interface

```bash
# Run all pending migrations (execute up())
bun run migrate

# Rollback last migration (execute down())
bun run migrate --rollback

# Show status
bun run migrate --status

# Rollback specific count
bun run migrate --rollback --count 3
```

---

## Conversion: SQL to TypeScript

### Example: 001_create_all_enums.ts

**Current SQL:**
```sql
CREATE TYPE user_role AS ENUM ('owner', 'staff', 'cashier');
CREATE TYPE merchant_type AS ENUM ('restaurant', 'cafe', 'catering', 'other');
-- ... more enums
```

**TypeScript Version:**
```typescript
import type { SQL } from 'bun';

export const up = async (sql: SQL, transaction: SQL): Promise<void> => {
  await transaction`CREATE TYPE user_role AS ENUM ('owner', 'staff', 'cashier')`;
  await transaction`CREATE TYPE merchant_type AS ENUM ('restaurant', 'cafe', 'catering', 'other')`;
  // ... all enums
};

export const down = async (sql: SQL, transaction: SQL): Promise<void> => {
  // Reverse order: drop last enum first
  await transaction`DROP TYPE IF EXISTS debt_payment_method CASCADE`;
  await transaction`DROP TYPE IF EXISTS debt_status CASCADE`;
  await transaction`DROP TYPE IF EXISTS debt_creditor_type CASCADE`;
  // ... reverse order for all enums
};
```

### Example: 002_create_table_users.ts

**Current SQL:**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    ...
);

CREATE UNIQUE INDEX idx_users_email_unique ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
```

**TypeScript Version:**
```typescript
import type { SQL } from 'bun';

export const up = async (sql: SQL, transaction: SQL): Promise<void> => {
  await transaction`
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
    )
  `;

  await transaction`
    CREATE UNIQUE INDEX idx_users_email_unique 
        ON users(email) 
        WHERE deleted_at IS NULL
  `;

  await transaction`
    CREATE INDEX idx_users_deleted_at 
        ON users(deleted_at) 
        WHERE deleted_at IS NULL
  `;
};

export const down = async (sql: SQL, transaction: SQL): Promise<void> => {
  await transaction`DROP INDEX IF EXISTS idx_users_deleted_at`;
  await transaction`DROP INDEX IF EXISTS idx_users_email_unique`;
  await transaction`DROP TABLE IF EXISTS users`;
};
```

---

## Key Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| File extension | `.ts` | TypeScript for type safety |
| Exports | `up`, `down` | Standard convention |
| Transaction | Per migration | All-or-nothing per file |
| Execution | Sequential | Statements run one-by-one in order |
| Logging | Simple | Just migration filename, no statement-level logs |
| Dynamic import | `await import()` | Load .ts files at runtime |
| SQL Import | `from 'bun'` | No dependency on src/ folder |
| SQL Parameter | Passed from runner | Runner creates connection, passes to migration |

---

## Migration Runner Features

### Run Pending (Default)
```typescript
// Pseudocode
import { SQL } from 'bun';

// Create SQL connection in runner
const sql = new SQL({ url: process.env.DATABASE_URL });

const pending = files.filter(f => !executed.includes(f));
for (const file of pending) {
  const { up } = await import(`./migrations/${file}`);
  await sql.begin(async (trx) => {
    await up(sql, trx);  // Pass both sql and transaction
    await trx`INSERT INTO _migrations VALUES (${file})`;
  });
  logger.info(`✅ ${file}`);
}
```

### Rollback Last
```typescript
// Pseudocode
const last = executed[executed.length - 1];
const { down } = await import(`./migrations/${last}`);
await sql.begin(async (trx) => {
  await down(sql, trx);  // Pass both sql and transaction
  await trx`DELETE FROM _migrations WHERE filename = ${last}`;
});
logger.info(`✅ Rolled back ${last}`);
```

### Status
```
✅ 001_create_all_enums.ts
✅ 002_create_table_users.ts
⏳ 003_create_table_merchants.ts
...

Total: 2/14 migrations executed
```

---

## Conversion Checklist (14 Files)

| # | File | Status |
|---|------|--------|
| 001 | create_all_enums.ts | ⏳ Pending |
| 002 | create_table_users.ts | ⏳ Pending |
| 003 | create_table_merchants.ts | ⏳ Pending |
| 004 | create_table_user_merchants.ts | ⏳ Pending |
| 005 | create_table_suppliers.ts | ⏳ Pending |
| 006 | create_table_ingredients.ts | ⏳ Pending |
| 007 | create_table_ingredient_units.ts | ⏳ Pending |
| 008 | create_table_ingredient_batches.ts | ⏳ Pending |
| 009 | create_table_purchase_orders.ts | ⏳ Pending |
| 010 | create_table_purchase_items.ts | ⏳ Pending |
| 011 | create_table_stock_logs.ts | ⏳ Pending |
| 012 | create_table_cash_logs.ts | ⏳ Pending |
| 013 | create_table_debts.ts | ⏳ Pending |
| 014 | create_table_debt_payments.ts | ⏳ Pending |

---

**Review this plan. Once confirmed, I'll implement:**
1. New `migrate.ts` runner (TypeScript-based)
2. Convert all 14 SQL files to .ts files
3. Test the migration flow

**Ready to proceed?**
