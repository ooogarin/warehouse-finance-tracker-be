# Database Access

## Goal

Keep DB access explicit, predictable, and easy to trace during business workflows.

## DB Client Placement

The DB client lives in:

```text
src/core/db/client.ts
```

This module owns:

- shared SQL pool
- transaction reservation
- transaction commit
- transaction rollback
- DB executor types

## Transaction Strategy

Use manual transaction handling for multi-step write workflows.

Recommended flow:

```ts
let db: ReservedSQL | null = null;

try {
  db = await startTransaction();

  const entity = await repository.insert(db, payload);
  await anotherRepository.updateById(db, id, data);

  await commitTransaction(db);
  return entity;
} catch (error) {
  if (db) {
    await rollbackTransaction(db);
  }

  throw error;
}
```

## Repository Contract

### Default Read Methods

Use short signatures for standard non-transactional reads.

Examples:

```ts
getOneById(id)
getOneByEmail(email)
getAllByMerchantId(merchantId)
```

### Transactional Read Methods

Use separate methods only when the read must happen on the same transaction connection.

Examples:

```ts
getOneByIdTx(db, id)
getByMerchantAndIdTx(db, merchantId, id)
```

### Write Methods

Write methods must always accept the transaction executor explicitly.

Examples:

```ts
insert(db, payload)
updateById(db, id, payload)
softDeleteById(db, id)
```

## Why This Pattern

This pattern keeps the common path simple while making transactional intent explicit.

Benefits:

- standard reads remain concise
- write flows stay explicit
- transaction-sensitive reads are visible in code review
- services remain responsible for transaction boundaries

## Rules

1. Do not create separate DB pools for transaction and non-transaction flows.
2. Do not hide transactions inside repositories.
3. Do not let controllers start transactions.
4. Start transactions in services only when multiple writes must succeed together.
5. Pass `merchantId` explicitly to tenant-scoped queries.
