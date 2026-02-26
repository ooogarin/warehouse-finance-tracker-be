#!/usr/bin/env bun
/**
 * Database Migration Runner
 *
 * Usage:
 *   bun run migrate              # Run all pending migrations
 *   bun run migrate --rollback   # Rollback last migration
 *   bun run migrate --status     # Show migration status
 */

import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { SQL } from 'bun';

// ==========================================
// Configuration
// ==========================================

const MIGRATIONS_DIR = join(process.cwd(), 'migrations');

// Database URL from environment
const DATABASE_URL = `postgres://${process.env.DATABASE_USER || 'postgres'}:${process.env.DATABASE_PASSWORD || 'postgres'}@${process.env.DATABASE_HOST || 'localhost'}:${process.env.DATABASE_PORT || '5432'}/${process.env.DATABASE_NAME || 'warehouse'}`;

// Simple logger
const logger = {
  info: (message: string) => console.log(`[${new Date().toISOString()}] [migrate] ${message}`),
  error: (message: string) => console.error(`[${new Date().toISOString()}] [migrate] ERROR: ${message}`),
  warn: (message: string) => console.warn(`[${new Date().toISOString()}] [migrate] WARN: ${message}`),
};

// ==========================================
// Types
// ==========================================

interface MigrationRecord {
  id: number;
  filename: string;
  executed_at: string;
}

interface MigrationModule {
  up: (transaction: SQL) => Promise<void>;
  down: (transaction: SQL) => Promise<void>;
}

// ==========================================
// Database Functions
// ==========================================

const createConnection = (): SQL => {
  return new SQL({
    url: DATABASE_URL,
    max: 5,
    idleTimeout: 30000,
    connectionTimeout: 30000,
  });
};

const testConnection = async (sql: SQL): Promise<boolean> => {
  try {
    await sql`SELECT 1 as connected`;
    return true;
  } catch (error) {
    logger.error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
};

const initMigrationsTable = async (sql: SQL): Promise<void> => {
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `;
};

const getExecutedMigrations = async (sql: SQL): Promise<string[]> => {
  const result = await sql<MigrationRecord[]>`
    SELECT filename FROM _migrations ORDER BY id
  `;
  return result.map((r) => r.filename);
};

const getMigrationFiles = async (): Promise<string[]> => {
  const files = await readdir(MIGRATIONS_DIR);
  return files.filter((f) => f.endsWith('.ts')).sort();
};

// ==========================================
// Migration Execution
// ==========================================

const executeMigration = async (sql: SQL, filename: string): Promise<void> => {
  const filepath = join(MIGRATIONS_DIR, filename);

  logger.info(`Executing: ${filename}`);

  try {
    // Import migration module
    const module = (await import(filepath)) as MigrationModule;

    if (!module.up) {
      throw new Error(`Migration ${filename} does not export 'up' function`);
    }

    // Execute in transaction
    await sql.begin(async (trx) => {
      await module.up(trx);
      await trx`INSERT INTO _migrations (filename) VALUES (${filename})`;
    });

    logger.info(`✅ Completed: ${filename}`);
  } catch (error) {
    logger.error(`Migration failed: ${filename}`);
    throw error;
  }
};

const rollbackMigration = async (sql: SQL, filename: string): Promise<void> => {
  const filepath = join(MIGRATIONS_DIR, filename);

  logger.warn(`Rolling back: ${filename}`);

  try {
    // Import migration module
    const module = (await import(filepath)) as MigrationModule;

    if (!module.down) {
      throw new Error(`Migration ${filename} does not export 'down' function`);
    }

    // Execute in transaction
    await sql.begin(async (trx) => {
      await module.down(trx);
      await trx`DELETE FROM _migrations WHERE filename = ${filename}`;
    });

    logger.info(`✅ Rolled back: ${filename}`);
  } catch (error) {
    logger.error(`Rollback failed: ${filename}`);
    throw error;
  }
};

// ==========================================
// Commands
// ==========================================

const migrate = async (sql: SQL): Promise<void> => {
  logger.info('Starting migrations...');

  await initMigrationsTable(sql);

  const executed = await getExecutedMigrations(sql);
  const files = await getMigrationFiles();
  const pending = files.filter((f) => !executed.includes(f));

  if (pending.length === 0) {
    logger.info('No pending migrations');
    return;
  }

  logger.info(`Found ${pending.length} pending migrations`);

  for (const filename of pending) {
    await executeMigration(sql, filename);
  }

  logger.info(`All migrations completed (${pending.length} executed)`);
};

const rollback = async (sql: SQL, count: number = 1): Promise<void> => {
  logger.info('Starting rollback...');

  const executed = await getExecutedMigrations(sql);

  if (executed.length === 0) {
    logger.info('No migrations to rollback');
    return;
  }

  const toRollback = executed.slice(-count);

  logger.info(`Rolling back ${toRollback.length} migration(s)`);

  // Rollback in reverse order (last first)
  for (const filename of toRollback.reverse()) {
    await rollbackMigration(sql, filename);
  }

  logger.info(`Rollback completed (${toRollback.length} rolled back)`);
};

const status = async (sql: SQL): Promise<void> => {
  await initMigrationsTable(sql);

  const executed = await getExecutedMigrations(sql);
  const files = await getMigrationFiles();

  console.log('\n📊 Migration Status');
  console.log('==================\n');

  for (const file of files) {
    const isExecuted = executed.includes(file);
    const icon = isExecuted ? '✅' : '⏳';
    console.log(`${icon} ${file}`);
  }

  console.log(`\nTotal: ${executed.length}/${files.length} migrations executed\n`);
};

// ==========================================
// Main
// ==========================================

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const command = args[0];

  // Create SQL connection
  const sql = createConnection();

  // Test connection
  const connected = await testConnection(sql);
  if (!connected) {
    process.exit(1);
  }

  try {
    switch (command) {
      case '--run': {
        const filename = args[1];
        if (!filename) {
          logger.error('Filename required. Usage: bun run migrate --run 003_create_table_merchants.ts');
          process.exit(1);
        }

        await initMigrationsTable(sql);

        const executed = await getExecutedMigrations(sql);
        if (executed.includes(filename)) {
          logger.warn(`Migration already executed: ${filename}`);
          process.exit(0);
        }

        await executeMigration(sql, filename);
        break;
      }
      case '--rollback': {
        const countArg = args.find((a) => a.startsWith('--count='));
        const count = countArg ? parseInt(countArg.split('=')[1], 10) : 1;
        await rollback(sql, count);
        break;
      }
      case '--status':
        await status(sql);
        break;
      case '--help':
        console.log(`
          Database Migration Runner

          Usage:
            bun run db:migrate                        Run pending migrations
            bun run db:migrate:select <filename>      Run a specific migration
            bun run db:rollback                       Rollback last migration
            bun run db:rollback --count=3             Rollback 3 migrations
            bun run db:status                         Show migration status
            bun run db:reset                          Reset database
            bun run db:seed                           Seed database
            bun run db:help                           Show this help
        `);
        break;
      default:
        await migrate(sql);
    }
  } catch (error) {
    logger.error(`Script failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  } finally {
    await sql.close();
  }
};

main();
