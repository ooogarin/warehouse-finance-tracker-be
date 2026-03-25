# Database Schema (Readable Table Format)

Warehouse & Finance Tracker

------------------------------------------------------------------------

## Table: users

| Column | Description |
| --- | --- |
| id | User ID |
| name | User name |
| email | Login email |
| password | User password |
| role | User role (owner, staff, cashier) |
| phone | Phone number |
| created_at | Record creation time |
| updated_at | Last updated time |
| deleted_at | Soft delete flag |

------------------------------------------------------------------------

## Table: merchants

| Column | Description |
| --- | --- |
| id | Merchant / business ID |
| name | Business name |
| type | Business type |
| address | Business address |
| phone | Phone number |
| cash_balance | Merchant cash balance |
| created_at | Record creation time |
| updated_at | Last updated time |
| deleted_at | Soft delete flag |

------------------------------------------------------------------------

## Table: user_merchants

| Column | Description |
| --- | --- |
| id | Relation ID |
| merchant_id | Accessed merchant |
| user_id | User who has access |
| created_at | Record creation time |
| updated_at | Last updated time |
| deleted_at | Soft delete flag |

------------------------------------------------------------------------

## Table: suppliers

| Column | Description |
| --- | --- |
| id | Supplier ID |
| merchant_id | Owning merchant |
| name | Supplier name |
| phone | Supplier phone number |
| address | Supplier address |
| notes | Additional notes |
| created_at | Record creation time |
| updated_at | Last updated time |
| deleted_at | Soft delete flag |

------------------------------------------------------------------------

## Table: ingredients

| Column | Description |
| --- | --- |
| id | Ingredient ID |
| merchant_id | Owning merchant |
| name | Ingredient name |
| category | Ingredient category |
| base_unit | Base measurement unit |
| stock_quantity | Current stock quantity |
| min_stock | Minimum stock threshold |
| created_at | Record creation time |
| updated_at | Last updated time |
| deleted_at | Soft delete flag |

------------------------------------------------------------------------

## Table: ingredient_units

| Column | Description |
| --- | --- |
| id | Unit ID |
| ingredient_id | Related ingredient |
| unit_name | Unit name |
| conversion_factor | Conversion to base unit |
| is_default | Is the default unit |
| description | Unit description |
| created_at | Record creation time |
| updated_at | Last updated time |
| deleted_at | Soft delete flag |

------------------------------------------------------------------------

## Table: ingredient_batches

| Column | Description |
| --- | --- |
| id | Batch ID |
| ingredient_id | Related ingredient |
| qty_purchased | Quantity purchased |
| qty_remaining | Remaining batch quantity |
| cost_per_unit | Cost per unit |
| purchase_date | Purchase date |
| created_at | Record creation time |
| updated_at | Last updated time |
| deleted_at | Soft delete flag |

------------------------------------------------------------------------

## Table: purchase_orders

| Column | Description |
| --- | --- |
| id | Purchase order ID |
| merchant_id | Buying merchant |
| supplier_id | Supplier ID |
| purchase_date | Purchase date |
| invoice_number | Invoice number |
| total_amount | Total purchase amount |
| paid_cash | Paid from cash |
| paid_owner | Paid by owner |
| debt_amount | Outstanding debt amount |
| notes | Notes |
| created_at | Record creation time |
| updated_at | Last updated time |
| deleted_at | Soft delete flag |

------------------------------------------------------------------------

## Table: purchase_items

| Column | Description |
| --- | --- |
| id | Purchase item ID |
| purchase_order_id | Reference purchase order |
| ingredient_id | Purchased ingredient |
| quantity | Quantity purchased |
| ingredient_unit_id | Unit used |
| unit_price | Price per unit |
| subtotal | Item total |
| notes | Notes |
| created_at | Record creation time |
| updated_at | Last updated time |
| deleted_at | Soft delete flag |

------------------------------------------------------------------------

## Table: stock_logs

| Column | Description |
| --- | --- |
| id | Stock log ID |
| ingredient_id | Related ingredient |
| movement_type | Stock movement type |
| reference_type | Reference transaction type |
| reference_id | Reference transaction ID |
| base_unit_quantity | Quantity change in base unit |
| base_unit_price | Price per base unit |
| total_amount | Total value change |
| reason | Reason for change |
| notes | Notes |
| balance_after | Balance after change |
| created_by | User who created the log |
| created_at | Log creation time |

------------------------------------------------------------------------

## Table: cash_logs

| Column | Description |
| --- | --- |
| id | Cash log ID |
| merchant_id | Related merchant |
| flow_type | Cash flow direction (in/out) |
| amount | Amount of money |
| category | Transaction category |
| reference_id | Reference transaction ID |
| description | Description |
| balance_after | Balance after transaction |
| created_by | User who created the log |
| created_at | Transaction time |

------------------------------------------------------------------------

## Table: debts

| Column | Description |
| --- | --- |
| id | Debt ID |
| merchant_id | Related merchant |
| creditor_type | Creditor type |
| supplier_id | Related supplier |
| creditor_name | Creditor name |
| purchase_order_id | Reference purchase order |
| total_amount | Total debt amount |
| paid_amount | Amount already paid |
| status | Debt status |
| debt_date | Debt date |
| due_date | Due date |
| paid_date | Settlement date |
| description | Debt notes |
| created_at | Record creation time |
| updated_at | Last updated time |
| deleted_at | Soft delete flag |

------------------------------------------------------------------------

## Table: debt_payments

| Column | Description |
| --- | --- |
| id | Payment ID |
| debt_id | Related debt |
| amount | Payment amount |
| payment_method | Payment method |
| reference_number | Reference number |
| notes | Notes |
| created_by | User who created the payment |
| created_at | Payment time |
