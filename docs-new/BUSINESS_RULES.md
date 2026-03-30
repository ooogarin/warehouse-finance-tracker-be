# Business Rules

## Purpose

This document summarizes the most important cross-module business rules in one place.

It is a working reference for:

- Internal team discussion
- Implementation review
- AI assistant context

It is not the primary source of truth. It is a consolidated guide.

## Source of Truth

The primary source of truth remains:

1. `docs-new/data/DATABASE_SCHEMA.md`
2. `docs-new/engineering/screen-lists/`

If this document conflicts with the database schema or the screen lists, follow the schema and screen lists.

## Scope

This document focuses on rules that affect more than one screen or more than one backend module.

Typical examples:

- Transaction finality
- Merchant scoping
- Stock and cash side effects
- Debt and payment rules
- Derived state rules

## Merchant Scope

- Operational data is merchant-scoped by default.
- Users may authenticate without merchant context for public or account-level flows.
- Merchant-scoped workflows must only read or write data that belongs to the active merchant.
- Merchant access must be verified before operational actions are executed.

## Transaction Finality

The following operational transactions are final after they are saved:

- Purchase orders
- Stock usage
- Stock waste
- Stock adjustment
- Cash transactions

Final means:

- They are not edited in place
- They are not deleted as part of normal operations
- Corrections should happen through new compensating records or dedicated follow-up flows

## Multi-Table Transaction Rule

When one business action affects multiple tables, all writes must succeed or fail together.

Important workflows that must remain transactional:

- Onboarding completion
- Purchase order creation
- Stock usage creation
- Stock waste creation
- Stock adjustment creation
- Debt payment creation
- Cash balance updates paired with cash log creation

## Cash Rules

- `merchants.cash_balance` is the current cash balance of the merchant.
- Manual cash transactions update both `cash_logs` and `merchants.cash_balance`.
- `cash_logs.balance_after` must remain consistent with the resulting merchant balance at the time of the write.
- Cash out must not exceed available merchant cash balance.
- Cash transactions are final after they are recorded.

### Cash Sources

Cash logs may come from:

- Manual cash-in and cash-out flows
- Purchase-order cash payment
- Debt payment outflow
- Opening balance during onboarding

### Important Exception

- `paid_owner` in purchase orders does not change merchant cash balance.
- `paid_owner` creates debt to the owner, not a cash movement inside the merchant.

## Debt Rules

- Debt status is stored as `unpaid`, `partial`, or `paid`.
- Overdue is derived from due date and current unpaid state. It is not stored as a separate database status.
- Debt may be created manually or automatically from purchase orders.
- Debt payment updates debt state and also creates the related cash outflow.

### Creditor Types

- `supplier` requires `supplier_id`
- `owner` does not require `supplier_id`
- `other` requires `creditor_name`

### Automatic Debt Creation

Purchase orders may create debt automatically:

- `paid_owner > 0` creates owner debt
- `debt_amount > 0` creates supplier debt

## Purchase Order Rules

- A purchase order is final after it is saved.
- Purchase payment is split into:
  - `paid_cash`
  - `paid_owner`
  - `debt_amount`
- The payment split must always match the total purchase amount.
- Supplier debt cannot be recorded when the purchase order has no supplier.

### Purchase Order Side Effects

Saving a purchase order may:

- Create `purchase_orders`
- Create `purchase_order_items`
- Increase ingredient stock
- Create inventory batches
- Create stock logs
- Create cash logs for `paid_cash`
- Create owner debt for `paid_owner`
- Create supplier debt for `debt_amount`

## Stock Rules

- Stock quantity is system-managed, not manually edited in ingredient master data.
- Usage, waste, and adjustment operate on ingredient stock through stock transactions.
- Operational stock dropdowns should only show active ingredients and active ingredient units.
- Stock movements must be traceable through `stock_logs`.

### Base Unit Rule

- Ingredient stock is tracked in base unit form internally.
- Unit conversions must be applied before updating stock, batches, or stock logs.
- Historical integrity must be protected when base unit decisions affect previous transactions.

### Ingredient and Unit Activation Rule

- Active ingredients and units are available in operational flows.
- Inactive ingredients and units are retained for historical integrity.
- Delete, deactivate, and edit permissions depend on whether the ingredient or unit has already been used in transactions.

## Derived State Rules

The following values are derived and should not be treated as primary stored state unless explicitly defined in the schema:

- Supplier last order date
- Purchase-order payment status display
- Debt overdue state
- Dashboard alert counts
- Inventory display formatting in human-readable units
- Stock and cash display labels derived from enum combinations

## Soft Delete Rule

Soft delete is used only where explicitly defined by the schema and screen lists.

Important implications:

- Soft-deleted records should not appear in normal active lists.
- Historical references must remain understandable after archival.
- Soft delete is not a universal rule for every table.

## Validation Responsibility

Validation is split across layers:

- Request-shape validation belongs near the route or schema layer.
- Business validation belongs in services.
- Database integrity constraints belong in the schema.

Business validation examples include:

- Cash out exceeding available balance
- Supplier debt without supplier
- Invalid payment split totals
- Stock out exceeding available stock
- Editing base unit after historical usage

## Historical Integrity Rule

Historical business records must remain explainable after future updates.

This affects:

- Ingredient base unit changes
- Ingredient and unit activation status
- Stock movement history
- Debt payment history
- Cash transaction history

When a rule risks corrupting past meaning, prefer restrictions over convenience edits.

## Review Checklist

When reviewing an implementation, verify:

- Is merchant scope enforced correctly?
- Are multi-table side effects inside one transaction?
- Is the rule using stored state versus derived state correctly?
- Does the workflow preserve historical integrity?
- Is the workflow using compensating records instead of editing final transactions?
- Are stock, cash, and debt side effects consistent with the screen lists?

## Summary

The business rules in this project are centered on:

- Explicit merchant ownership
- Final operational transactions
- Transactional multi-table writes
- Traceable cash and stock movement
- Debt state that stays consistent with payment activity
- Protection of historical integrity

This document should stay concise and cross-cutting. Detailed behavior still belongs in the screen lists and database schema.
