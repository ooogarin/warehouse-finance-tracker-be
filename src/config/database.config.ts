import { SQL } from 'bun';
import { env, getDatabaseName } from './env.config';
import { createLogger } from './logger.config';

const logger = createLogger({ module: 'database' });

/**
 * PostgreSQL connection pool using Bun's built-in SQL client
 *
 * Bun.SQL provides:
 * - Connection pooling
 * - Tagged template literals for queries
 * - Automatic parameterization
 * - Transaction support
 */
export const sql = new SQL({
  url: `postgres://${env.DATABASE_USER}:${env.DATABASE_PASSWORD}@${env.DATABASE_HOST}:${env.DATABASE_PORT}/${getDatabaseName()}`,
  max: env.DATABASE_POOL_MAX,
  idleTimeout: env.DATABASE_IDLE_TIMEOUT,
  connectionTimeout: env.DATABASE_CONNECTION_TIMEOUT,
});

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await sql`SELECT 1 as connected`;
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error({ error }, 'Database connection failed');
    return false;
  }
};

// Close database connections
export const closeConnection = async (): Promise<void> => {
  try {
    await sql.close();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error({ error }, 'Error closing database connections');
    throw error;
  }
};

// Connection type for transactions
export type Connection = SQL;

/**
 * Start a database transaction
 * Usage:
 * ```typescript
 * const connection = await startTransaction();
 * try {
 *   await repository.create(connection, data);
 *   await commitTransaction(connection);
 * } catch (error) {
 *   await rollbackTransaction(connection);
 *   throw error;
 * }
 * ```
 */
export const startTransaction = async (): Promise<Connection> => {
  const connection = new SQL({
    url: `postgres://${env.DATABASE_USER}:${env.DATABASE_PASSWORD}@${env.DATABASE_HOST}:${env.DATABASE_PORT}/${getDatabaseName()}`,
  });
  await connection`BEGIN`;
  return connection;
};

// Commit a transaction
export const commitTransaction = async (connection: Connection): Promise<void> => {
  await connection`COMMIT`;
  await connection.close();
};

// Rollback a transaction
export const rollbackTransaction = async (connection: Connection): Promise<void> => {
  try {
    await connection`ROLLBACK`;
  } catch (error) {
    logger.error({ error }, 'Error during rollback');
  } finally {
    await connection.close();
  }
};

/**
 * Execute a callback within a transaction
 * Automatically commits or rolls back based on success/failure
 *
 * Usage:
 * ```typescript
 * const result = await withTransaction(async (connection) => {
 *   const user = await userRepo.create(connection, userData);
 *   await merchantRepo.create(connection, merchantData);
 *   return user;
 * });
 * ```
 */
export const withTransaction = async <T>(callback: (connection: Connection) => Promise<T>): Promise<T> => {
  const connection = await startTransaction();
  try {
    const result = await callback(connection);
    await commitTransaction(connection);
    return result;
  } catch (error) {
    await rollbackTransaction(connection);
    throw error;
  }
};

// Query helper with type safety
// Wrapper around Bun.SQL tagged template
export const query = <T = unknown>(strings: TemplateStringsArray, ...values: unknown[]) => {
  return sql<T[]>(strings, ...values);
};
