# Database Migration Guide

This document describes the migration strategy and file organization for the database schema.

---

## Migration Strategy

### Phase 1: Enums
All PostgreSQL enums are created in a single file first.

### Phase 2: Tables
Each table gets its own migration file with:
- `CREATE TABLE` statement
- All `CREATE INDEX` statements for that table

---

## Migration Files

### Phase 1: Enums

| File | Enums Created |
|------|---------------|
| `001_create_all_enums.ts` | user_role, merchant_type, merchant_subscription_plan, merchant_subscription_status, ingredient_category, stock_usage_type, stock_adjustment_flow_type, stock_log_flow_type, stock_log_reference_type, cash_log_flow_type, cash_log_category, cash_log_reference_type, debt_creditor_type, debt_status, debt_payment_method |

### Phase 2: Tables (in dependency order)

| # | File | Table | Dependencies | Notes |
|---|------|-------|--------------|-------|
| 002 | `002_create_table_users.ts` | users | None | No DB default UUID |
| 003 | `003_create_table_merchants.ts` | merchants | None | Includes merchant subscription fields |
| 004 | `004_create_table_platform_admins.ts` | platform_admins | users | Platform admin access list |
| 005 | `005_create_table_user_merchants.ts` | user_merchants | users, merchants | Junction table |
| 006 | `006_create_table_suppliers.ts` | suppliers | merchants | - |
| 007 | `007_create_table_ingredients.ts` | ingredients | merchants | Uses ingredient_category enum |
| 008 | `008_create_table_ingredient_units.ts` | ingredient_units | ingredients | - |
| 009 | `009_create_table_ingredient_batches.ts` | ingredient_batches | ingredients | FIFO tracking |
| 010 | `010_create_table_purchase_orders.ts` | purchase_orders | merchants, suppliers | Payment split: cash/owner/debt |
| 011 | `011_create_table_purchase_order_items.ts` | purchase_order_items | purchase_orders, ingredients, ingredient_units | Has generated subtotal column |
| 012 | `012_create_table_stock_usages.ts` | stock_usages | merchants | Uses stock_usage_type enum |
| 013 | `013_create_table_stock_usage_items.ts` | stock_usage_items | stock_usages, ingredients, ingredient_units | Has generated subtotal column |
| 014 | `014_create_table_stock_adjustments.ts` | stock_adjustments | merchants | - |
| 015 | `015_create_table_stock_adjustment_items.ts` | stock_adjustment_items | stock_adjustments, ingredients, ingredient_units | Uses stock_adjustment_flow_type enum |
| 016 | `016_create_table_stock_logs.ts` | stock_logs | ingredients, users | Uses stock_log_flow_type & stock_log_reference_type enums |
| 017 | `017_create_table_cash_logs.ts` | cash_logs | merchants, users | Uses flow/category/reference enums |
| 018 | `018_create_table_debts.ts` | debts | merchants, suppliers, purchase_orders | Uses creditor & status enums |
| 019 | `019_create_table_debt_payments.ts` | debt_payments | debts, users | Uses payment_method enum |

---

## File Template

### For Enums File (001_create_all_enums.ts)

```ts
import type { SQL } from 'bun';

export const up = async (trx: SQL) => {
  await trx`CREATE TYPE user_role AS ENUM ('owner', 'staff', 'cashier')`;
  await trx`CREATE TYPE merchant_type AS ENUM ('restaurant', 'cafe', 'catering', 'other')`;
  // ... other enums
};

export const down = async (trx: SQL) => {
  await trx`DROP TYPE IF EXISTS merchant_type`;
  await trx`DROP TYPE IF EXISTS user_role`;
};
```

### For Table Files (002-018)

```ts
import type { SQL } from 'bun';

export const up = async (trx: SQL) => {
  await trx`
    CREATE TABLE table_name (
      id UUID PRIMARY KEY,
      column_name DATA_TYPE constraints
    )
  `;

  await trx`CREATE INDEX idx_name ON table_name(column)`;
};

export const down = async (trx: SQL) => {
  await trx`DROP TABLE IF EXISTS table_name`;
};
```

---

## Design Principles

1. **No Database Functions**: All business logic (including updated_at) is handled at application level

2. **Application-Level UUIDs**: UUID generation is handled by the application (e.g., `crypto.randomUUID()`) to allow identity resolution before persistence.

3. **Soft Delete by Explicit Table Policy**: Use `deleted_at` only on tables that define archival behavior in `DATABASE_SCHEMA.md`. Do not assume soft delete for every table.

4. **Constraints in DB**: CHECK constraints remain in database for data integrity

5. **Generated Columns**: `subtotal` and `total_amount` remain as GENERATED ALWAYS columns

---

## Usage

```bash
# Run all migrations
bun run db:migrate

# Check migration status
bun run db:status

# Reset database (CAUTION)
bun run db:reset

# Seed database
bun run db:seed
```
