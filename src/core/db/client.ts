import { SQL } from 'bun';
import { env, getDatabaseName } from '@/core/config/env.config';
import { createLogger } from '@/core/config/logger.config';

const logger = createLogger({ module: 'database' });

export const sql = new SQL({
  hostname: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  username: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: getDatabaseName(),
  max: env.DATABASE_POOL_MAX,
  idleTimeout: env.DATABASE_IDLE_TIMEOUT,
  connectionTimeout: env.DATABASE_CONNECTION_TIMEOUT,
});

type ReservedSQL = Awaited<ReturnType<typeof sql.reserve>>;

// Start a transaction
export const startTransaction = async (): Promise<ReservedSQL> => {
  const reserved = await sql.reserve();
  try {
    await reserved`BEGIN`;
  } catch (err) {
    reserved.release();
    throw err;
  }
  return reserved;
};

// Commit transaction
export const commitTransaction = async (connection: ReservedSQL): Promise<void> => {
  try {
    await connection`COMMIT`;
  } finally {
    connection.release();
  }
};

// Rollback transaction
export const rollbackTransaction = async (connection: ReservedSQL): Promise<void> => {
  try {
    await connection`ROLLBACK`;
  } finally {
    connection.release();
  }
};

// Health check for application startup
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

// Graceful shutdown helper for database pool
export const closeConnection = async (): Promise<void> => {
  try {
    await sql.close();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error({ error }, 'Error closing database connections');
    throw error;
  }
};

export type { SQL, ReservedSQL };
