import { z } from 'zod';

/**
 * Environment variable schema with Zod validation
 * All environment variables are validated at startup
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.string().default('5432').transform(Number),
  DATABASE_USER: z.string().default('postgres'),
  DATABASE_PASSWORD: z.string().default('postgres'),
  DATABASE_NAME: z.string().default('warehouse'),
  DATABASE_NAME_TEST: z.string().default('warehouse_test'),

  // Database Pool
  DATABASE_POOL_MIN: z.string().default('2').transform(Number),
  DATABASE_POOL_MAX: z.string().default('10').transform(Number),
  DATABASE_CONNECTION_TIMEOUT: z.string().default('30000').transform(Number),
  DATABASE_IDLE_TIMEOUT: z.string().default('30000').transform(Number),
  DATABASE_STATEMENT_TIMEOUT: z.string().default('30000').transform(Number),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRY: z
    .string()
    .default('86400')
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v > 0, 'JWT_EXPIRY must be a positive integer (seconds)'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRY: z
    .string()
    .default('604800')
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v > 0, 'JWT_REFRESH_EXPIRY must be a positive integer (seconds)'),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_PRETTY: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  // CORS
  CORS_ORIGIN: z.string().default('*'),
  CORS_CREDENTIALS: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
});

/**
 * Parsed and validated environment variables
 */
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:');
  parsedEnv.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

/**
 * Export validated environment configuration
 */
export const env = parsedEnv.data;

/**
 * Type for environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Check if running in development mode
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if running in production mode
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if running in test mode
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * Get database name based on environment
 */
export const getDatabaseName = (): string => {
  return isTest ? env.DATABASE_NAME_TEST : env.DATABASE_NAME;
};
