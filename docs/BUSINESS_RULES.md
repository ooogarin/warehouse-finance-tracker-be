# Business Rules

## Purpose

This document defines cross-module business behavior for internal team alignment and AI assistant context.

This is a consolidated rule map, not the primary source of truth.

## Source of Truth

The fixed references are:

1. `docs/data/DATABASE_SCHEMA.md`
2. `docs/engineering/screen-lists/`

If there is any conflict, always follow the database schema and screen lists.

## Scope

This file only captures cross-cutting rules that affect multiple modules, for example:

- Merchant scoping
- Transaction finality
- Cash, stock, and debt side effects
- Derived state behavior
- Historical integrity constraints

This document is intentionally concise. Screen-level details still belong to screen lists.

## Merchant Scoping

- Operational data is merchant-scoped by default.
- Public authentication flows can run without active merchant context.
- Merchant-scoped actions must only access data belonging to the active merchant.
- Merchant access must be validated before operational read/write actions.

## Final Transaction Rule

These transactions are final after save:

- Purchase orders
- Stock usage
- Stock waste
- Stock adjustment
- Cash transactions

Final means:

- No in-place edit in normal operations.
- No hard delete in normal operations.
- Corrections use compensating records or dedicated follow-up flows.

## Multi-Table Atomicity Rule

If one business action writes multiple tables, all writes must succeed or fail together in one transaction.

Critical transactional workflows:

- Onboarding completion
- Purchase order creation
- Stock usage creation
- Stock waste creation
- Stock adjustment creation
- Debt payment creation
- Cash balance update with cash log creation

## Cash Rules

- `merchants.cash_balance` is the current merchant cash balance.
- Cash-in and cash-out actions must update `cash_logs` and `merchants.cash_balance` together.
- `cash_logs.balance_after` must match the resulting merchant balance at write time.
- Cash-out is invalid when requested amount exceeds available balance.
- Cash transactions are final records.

Cash log sources include:

- Manual cash-in or cash-out
- Purchase-order `paid_cash`
- Debt payment outflow
- Opening balance on onboarding

Important exception:

- `paid_owner` does not change `merchants.cash_balance`.
- `paid_owner` creates owner debt, not a merchant cash movement.

## Debt Rules

- Stored debt status values are `unpaid`, `partial`, and `paid`.
- Overdue is derived from due date and unpaid state.
- Overdue must not be stored as a dedicated database status.
- Debt can be created manually or from purchase-order side effects.
- Debt payment updates debt state and records the corresponding cash outflow.

Creditor rules:

- `supplier` requires `supplier_id`; `creditor_name` is stored from the supplier name as a debt snapshot.
- `owner` requires `creditor_name` and must not use `supplier_id`.
- `other` requires `creditor_name` and must not use `supplier_id`.

Automatic debt creation from purchase orders:

- `paid_owner > 0` creates owner debt.
- `debt_amount > 0` creates supplier debt.

## Purchase Order Rules

- Purchase orders are final transactions.
- Payment split is `paid_cash`, `paid_owner`, and `debt_amount`.
- The split total must equal total purchase amount.
- Supplier debt is invalid when the purchase order has no supplier.

Required side effects for purchase-order save:

- Create `purchase_orders`.
- Create `purchase_order_items`.
- Update ingredient stock.
- Create inventory batches when applicable.
- Create stock logs.
- Create cash log for `paid_cash`.
- Create owner debt for `paid_owner`.
- Create supplier debt for `debt_amount`.

## Stock Rules

- Ingredient stock quantity is system-managed.
- Do not directly edit stock quantity from ingredient master form.
- Usage, waste, and adjustment flows must mutate stock via stock transactions.
- Operational selectors should show active ingredients and active units only.
- Every stock movement must be traceable through `stock_logs`.

Base unit rules:

- Internal stock is tracked in base unit.
- Unit conversion must run before stock, batch, and stock-log writes.
- Base-unit changes must preserve historical meaning of old transactions.

Ingredient and unit activation rules:

- Active items can be used in operational flows.
- Inactive items remain for historical read context.
- Edit/deactivate/delete constraints depend on transaction usage history.

## Derived State Rules

Treat these as derived values unless explicitly stored in schema:

- Supplier last order date
- Purchase-order payment display status
- Debt overdue label
- Dashboard alert counts
- Human-readable inventory display formatting
- Stock and cash display labels from enum combinations

Do not promote derived values to stored columns unless there is an explicit schema decision.

## Soft Delete Rule

- Use soft delete only for tables that explicitly define it in schema.
- Soft-deleted records are excluded from active operational lists.
- Historical references must remain understandable after archival.
- Soft delete is not a universal table policy.

## Validation Responsibility

- Request-shape validation belongs to route or schema layer.
- Business validation belongs to service layer.
- Data integrity constraints belong to database schema.

Common business validation cases:

- Cash-out exceeds available balance
- Supplier debt without supplier
- Invalid purchase payment split total
- Stock-out exceeds available stock
- Base-unit edit conflicts with historical usage

## Historical Integrity Rule

Historical records must remain explainable after future configuration or master-data updates.

This especially applies to:

- Base unit changes
- Ingredient and unit activation changes
- Stock movement history
- Debt payment history
- Cash movement history

If a change risks breaking historical meaning, enforce restriction instead of convenience edit.

## Implementation Review Checklist

- Merchant scoping is enforced.
- Multi-table side effects are transactional.
- Stored state versus derived state is applied correctly.
- Historical integrity is preserved.
- Final transactions are corrected via compensating records.
- Cash, debt, and stock side effects match screen-list behavior.

## Summary

The cross-cutting business direction is:

- Merchant-bound operational ownership
- Final operational transactions
- Transactional multi-table writes
- Traceable stock, cash, and debt movements
- Strong historical integrity over convenience edits
