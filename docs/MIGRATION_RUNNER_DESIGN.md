# Migration Runner Design

## Overview
The migration runner executes SQL migrations in sequential order and tracks which migrations have been applied.

---

## Core Features

| Feature | Description |
|---------|-------------|
| Track Applied Migrations | Record which migration files have been executed |
| Sequential Execution | Run migrations in numeric order (001 → 002 → 003) |
| Transaction Safety | Each migration runs in a transaction (all-or-nothing) |
| Skip Applied | Skip migrations already recorded in tracking table |
| Error Handling | Stop on first error, don't record failed migration |

---

## Tracking Table

```sql
CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMPTZ WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Design Decision**: Only track filename (no checksum). Migrations are immutable once committed.

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `bun run migrate` | Run all pending migrations |
| `bun run migrate --status` | Show applied vs pending migrations |
| `bun run migrate --help` | Show usage help |

---

## Execution Flow

```
1. Connect to database
2. Create _migrations tracking table if not exists
3. Get list of already executed migrations (from _migrations table)
4. Read all .sql files from migrations/ directory
5. Sort files by filename (001, 002, 003...)
6. Filter out already executed migrations
7. For each pending migration:
   a. Log: "Executing: {filename}"
   b. Read SQL file content
   c. BEGIN transaction
   d. Execute SQL
   e. INSERT into _migrations
   f. COMMIT
   g. Log: "Completed: {filename}"
8. If error occurs:
   a. ROLLBACK
   b. Log error
   c. Exit with error code
```

---

## Output Format

### Normal Execution
```
[2025-02-26T14:30:00Z] [migrate] Starting migrations...
[2025-02-26T14:30:00Z] [migrate] Executing: 001_create_all_enums.sql
[2025-02-26T14:30:01Z] [migrate] Completed: 001_create_all_enums.sql
[2025-02-26T14:30:01Z] [migrate] Executing: 002_create_table_users.sql
[2025-02-26T14:30:01Z] [migrate] Completed: 002_create_table_users.sql
[2025-02-26T14:30:01Z] [migrate] All migrations completed (2 executed)
```

### Status Command
```
📊 Migration Status
==================

✅ 001_create_all_enums.sql
✅ 002_create_table_users.sql
⏳ 003_create_table_merchants.sql
⏳ 004_create_table_user_merchants.sql
...

Total: 2/14 migrations executed
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| SQL syntax error | Rollback, log error, exit code 1 |
| Database connection fail | Exit code 1, no changes |
| Migration already executed | Skip silently |
| Missing migration file | Ignore (just process existing files) |

---

## Design Decisions to Confirm

### 1. Rollback Support
| Option | Description |
|--------|-------------|
| A | **No rollback** - Manual fix required (simplest) |
| B | **Require down migration** - Each .sql has corresponding .down.sql |
| C | **Backup restore** - Document manual rollback procedure |

**Recommendation**: Option A (no rollback) for simplicity. Migrations should be tested before commit.

### 2. Transaction Per Migration
| Option | Description |
|--------|-------------|
| A | **Each migration in transaction** (recommended) |
| B | **All migrations in one transaction** |

**Recommendation**: Option A - If migration 005 fails, 001-004 remain applied.

### 3. Checksum Validation
| Option | Description |
|--------|-------------|
| A | **No checksum** - Trust filename only (simple) |
| B | **MD5 checksum** - Detect if file changed after applied |

**Recommendation**: Option A - Add complexity only if needed later.

### 4. Dry Run Mode
| Option | Description |
|--------|-------------|
| A | **No dry run** (simple) |
| B | `--dry-run` flag - Show what would be executed |

**Recommendation**: Option A for now, can add later if needed.

---

## File Structure

```
scripts/
└── migrate.ts          # Main migration runner

migrations/
├── 001_create_all_enums.sql
├── 002_create_table_users.sql
├── 003_create_table_merchants.sql
└── ...
```

---

## Script Dependencies

- `fs/promises` - Read migration files
- `path` - Path manipulation
- `src/config/database.config.ts` - SQL client
- `src/config/logger.config.ts` - Logging

---

## CLI Args Parsing

```typescript
const args = process.argv.slice(2);

if (args.includes('--status')) {
    await showStatus();
} else if (args.includes('--help')) {
    showHelp();
} else {
    await runMigrations();
}
```

---

**Please confirm the design decisions above, then I'll implement the script.**
