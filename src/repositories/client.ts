import { SQL } from 'bun';
import { env } from '@/config/env.config';

export const sql = new SQL({
  hostname: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  username: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  max: env.DATABASE_POOL_MAX,
  idleTimeout: env.DATABASE_IDLE_TIMEOUT,
  connectionTimeout: env.DATABASE_CONNECTION_TIMEOUT,
});

type ReservedSQL = Awaited<ReturnType<typeof sql.reserve>>;

// Execute a SQL query (non-transaction)
export const query = async <T>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> => {
  const result = await sql<T[]>(strings, ...values);
  return result ?? [];
};

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

export type { SQL, ReservedSQL };
