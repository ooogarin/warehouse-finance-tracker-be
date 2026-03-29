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
| `001_create_all_enums.sql` | user_role, merchant_type, ingredient_category, stock_log_movement_type, stock_log_reference_type, cash_log_flow_type, cash_log_category, debt_creditor_type, debt_status, debt_payment_method |

### Phase 2: Tables (in dependency order)

| # | File | Table | Dependencies | Notes |
|---|------|-------|--------------|-------|
| 002 | `002_create_table_users.sql` | users | None | No DB default UUID |
| 003 | `003_create_table_merchants.sql` | merchants | None | No DB default UUID |
| 004 | `004_create_table_user_merchants.sql` | user_merchants | users, merchants | Junction table |
| 005 | `005_create_table_suppliers.sql` | suppliers | merchants | - |
| 006 | `006_create_table_ingredients.sql` | ingredients | merchants | Uses ingredient_category enum |
| 007 | `007_create_table_ingredient_units.sql` | ingredient_units | ingredients | - |
| 008 | `008_create_table_ingredient_batches.sql` | ingredient_batches | ingredients | FIFO tracking |
| 009 | `009_create_table_purchase_orders.sql` | purchase_orders | merchants, suppliers | Payment split: cash/owner/debt |
| 010 | `010_create_table_purchase_order_items.sql` | purchase_order_items | purchase_orders, ingredients, ingredient_units | Has generated subtotal column |
| 011 | `011_create_table_stock_logs.sql` | stock_logs | ingredients, users | Uses movement & reference enums |
| 012 | `012_create_table_cash_logs.sql` | cash_logs | merchants, users | Uses flow & category enums |
| 013 | `013_create_table_debts.sql` | debts | merchants, suppliers, purchase_orders | Uses creditor & status enums |
| 014 | `014_create_table_debt_payments.sql` | debt_payments | debts, users | Uses payment_method enum |

---

## File Template

### For Enums File (001_create_all_enums.sql)

```sql
-- ==========================================
-- Migration 001: Create All Enums
-- ==========================================

-- User roles
CREATE TYPE user_role AS ENUM ('owner', 'staff', 'cashier');

-- Merchant types
CREATE TYPE merchant_type AS ENUM ('restaurant', 'cafe', 'catering', 'other');

[... other enums ...]
```

### For Table Files (002-014)

```sql
-- ==========================================
-- Migration XXX: Create table_name Table
-- ==========================================

CREATE TABLE table_name (
    id UUID PRIMARY KEY,
    column_name DATA_TYPE constraints,
    ...
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,  -- managed by app
    deleted_at TIMESTAMPTZ NULL
);

-- Indexes
CREATE INDEX idx_name ON table_name(column) WHERE deleted_at IS NULL;
CREATE INDEX idx_name2 ON table_name(column1, column2) WHERE deleted_at IS NULL;
```

---

## Design Principles

1. **No Database Functions**: All business logic (including updated_at) is handled at application level

2. **Application-Level UUIDs**: UUID generation is handled by the application (e.g., `crypto.randomUUID()`) to allow identity resolution before persistence.

3. **Soft Deletes**: All tables have `deleted_at` column, indexes are partial with `WHERE deleted_at IS NULL`

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
