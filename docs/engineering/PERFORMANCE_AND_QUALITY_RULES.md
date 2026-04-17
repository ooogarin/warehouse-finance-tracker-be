# Performance and Quality Rules

## Purpose

This document defines backend rules for code quality and performance.

It focuses on implementation choices that keep endpoints predictable, efficient, and easy to review.

## Source of Truth

For product behavior and persistence rules, the primary source of truth is:

1. `docs/data/DATABASE_SCHEMA.md`
2. `docs/engineering/screen-lists/`

This document must not introduce product behavior that is not backed by those sources.

For layer ownership, keep this document aligned with:

- `docs/engineering/CODING_RULES.md`
- `docs/engineering/MODULE_BOUNDARIES.md`
- `docs/engineering/REQUEST_FLOW.md`

## General Principles

- Return only the data required by the endpoint contract.
- Query only the columns required by the service or response map.
- Keep database access explicit and easy to trace.
- Prefer fewer predictable queries over many hidden queries.
- Avoid work that scales linearly per row when the database can do it in one bounded operation.
- Keep performance improvements readable and measurable.
- Do not add speculative complexity for performance problems that do not exist yet.

## Response Payload Rules

Response payloads should be intentional.

Rules:

- Do not return raw database rows directly from controllers.
- Map repository rows into explicit service output maps before returning them.
- Omit fields that are not required by the screen list or API contract.
- Do not include sensitive fields such as password hashes, tokens, internal notes, or audit-only fields.
- Prefer `data: null` for action-only endpoints.
- Include pagination metadata only for list endpoints that are actually paginated.

Avoid:

- Returning `SELECT *` results to the client.
- Returning related entities because they are easy to include but not required.
- Returning write payloads back to the client unless the response contract requires them.

## Column Selection Rules

Repositories must select explicit columns.

Preferred:

```sql
SELECT id, name, status, created_at
FROM suppliers
WHERE merchant_id = $1
```

Avoid:

```sql
SELECT *
FROM suppliers
WHERE merchant_id = $1
```

Rules:

- Select only columns needed by the repository row type.
- Keep repository row types aligned with selected columns.
- Add a new repository method when a use case needs a different projection.
- Do not overload one read method with many optional include flags.

## List Endpoint Rules

List endpoints must be bounded.

Rules:

- Use pagination for data that can grow over time.
- Apply merchant scoping before returning operational data.
- Apply filters in SQL, not in application memory, when the database can do it directly.
- Use deterministic ordering for lists.
- Keep search behavior explicit and backed by appropriate indexes when needed.

Avoid:

- Loading all rows and slicing in application code.
- Sorting large result sets in application code.
- Returning unbounded history tables.

## N+1 Query Rules

Avoid N+1 query patterns.

N+1 happens when code loads a list and then runs another query for each row.

Avoid:

```text
1 query to load purchase orders
N queries to load items for each purchase order
```

Preferred options:

- Use a join when the result shape is naturally relational.
- Use a batched `WHERE id IN (...)` query when related rows need separate mapping.
- Use aggregate queries when the endpoint only needs totals or counts.
- Use one repository method that returns the complete read model needed by the use case.

Review rule:

- Any loop that awaits a repository call must be treated as a performance risk.
- If a loop needs database access, explain why it cannot be batched.

## Parallel Query Rules

Run independent reads in parallel when it reduces latency and does not make behavior harder to reason about.

Good candidates:

- Dashboard summary cards from independent aggregate queries.
- Report sections that do not depend on each other.
- Independent existence checks before a read-only response.

Use:

```ts
const [summary, recentItems] = await Promise.all([
  summaryRepository.getByMerchantId(merchantId),
  itemRepository.getRecentByMerchantId(merchantId),
]);
```

Rules:

- Only run queries in parallel when they are independent.
- Do not parallelize queries where one query needs the result of another.
- Do not hide business sequencing just to use `Promise.all`.
- Keep error behavior clear. If one parallel query fails, the whole operation should fail unless the product contract says partial data is allowed.
- Be careful inside transactions. Prefer sequential transactional writes unless the transaction helper and DB executor clearly support concurrent operations.

Avoid:

- `Promise.all` for dependent writes.
- Parallel queries that make lock ordering unpredictable.
- Parallelizing tiny operations when it makes code harder to read without meaningful latency benefit.

## Transaction Performance Rules

Transactions should be as short as practical.

Rules:

- Start transactions in services only.
- Perform request validation and non-transactional reads before opening a transaction when possible.
- Keep only required writes and consistency-critical reads inside the transaction.
- Do not call external services or slow non-database work while a transaction is open.
- Use a consistent write order when updating multiple tables to reduce lock risk.

Avoid:

- Opening a transaction before simple request-shape validation.
- Holding a transaction open while formatting response data.
- Running unrelated reads inside a write transaction.

## Aggregate and Reporting Rules

Reports and dashboard endpoints should let the database do aggregate work.

Rules:

- Use SQL aggregates for sums, counts, minimums, maximums, and grouped totals.
- Filter by merchant and date range in SQL.
- Return only the aggregate shape required by the endpoint.
- Prefer one clear aggregate query over loading detailed rows and calculating totals in TypeScript.
- Keep date range handling explicit and consistent with the product contract.

Avoid:

- Loading full histories only to calculate totals in application code.
- Running one query per chart bucket when a grouped query can return all buckets.

## Batch Write Rules

When writing multiple related rows, prefer bounded batch operations where they keep behavior clear.

Rules:

- Validate the full input before starting the write transaction.
- Insert child rows in a batch when possible.
- Keep parent and child writes in one transaction when they must succeed together.
- Return only the response contract, not every inserted row by default.

Avoid:

- One insert query per item when a batch insert is straightforward.
- Partial writes without a transaction for one logical operation.
- Batch operations that hide per-row business validation.

## Index Awareness Rules

Queries should match known access patterns.

Rules:

- For frequent filters, check whether the database schema has an appropriate index.
- Common candidates include `merchant_id`, foreign keys, status fields, date fields, and unique business keys.
- When adding a query that will scan growing tables, consider whether a migration should add an index.
- Do not add indexes blindly. Each index has write and storage cost.

Review rule:

- If a new endpoint filters or orders by a column on a growing table, mention the index expectation in review or implementation notes.

## Memory and CPU Rules

Application code should avoid unnecessary large in-memory work.

Rules:

- Stream or paginate large datasets instead of loading everything at once.
- Use maps for repeated lookups instead of nested loops.
- Keep expensive formatting outside hot repository loops.
- Normalize numeric and date calculations in one place when reused.

Avoid:

- Nested loops over large arrays when a keyed map would make lookup constant-time.
- Duplicating aggregate calculations in multiple services.
- Parsing the same request or row data repeatedly.

## Error and Logging Rules

Performance work must not reduce debuggability.

Rules:

- Keep error paths explicit.
- Log enough context to debug failures without logging sensitive data.
- Do not swallow errors from parallel queries.
- Do not convert known business errors into generic internal errors.

Avoid:

- Logging full request bodies when they can contain sensitive data.
- Logging large query results.
- Catching errors only to return partial data without a defined contract.

## Review Checklist

Use this checklist when implementing or reviewing an endpoint:

1. Does the endpoint return only required fields?
2. Do repositories select explicit columns?
3. Are list results bounded by pagination, filters, or a clear limit?
4. Is merchant scoping applied in the database query where required?
5. Is there any repository call inside a loop?
6. Can independent reads run in parallel safely?
7. Are transactional operations short and ordered?
8. Are aggregates calculated in SQL when practical?
9. Does the query need an index for expected growth?
10. Are sensitive fields excluded from responses and logs?

## Summary

Good backend performance should come from simple habits:

- Return less data.
- Query fewer times.
- Batch related work.
- Parallelize only independent reads.
- Keep transactions short.
- Let the database handle filtering, joining, and aggregation.

If a performance change makes the code much harder to understand, it needs a clearer reason or a simpler implementation.
