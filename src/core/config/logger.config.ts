import pino from 'pino';
import { env } from './env.config';

// Fields that should be redacted in logs
const redactFields = ['password', 'token', 'refresh_token', 'access_token', 'authorization', 'cookie', 'secret', 'api_key', 'credit_card'];

/**
 * Create a logger instance with context
 *
 * Usage:
 * ```typescript
 * const logger = createLogger({ module: "auth-service" });
 * logger.info("User logged in");
 * logger.error({ error, userId }, "Login failed");
 * ```
 */
export const createLogger = (context: { module: string; [key: string]: unknown } = { module: 'app' }) => {
  return pino({
    level: env.LOG_LEVEL,
    transport: env.LOG_PRETTY
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
    redact: {
      paths: redactFields,
      censor: '[REDACTED]',
    },
    base: {
      env: env.NODE_ENV,
      ...context,
    },
  });
};

// Default application logger
export const logger = createLogger({ module: 'app' });

// Generate a unique request ID
export const generateRequestId = () => crypto.randomUUID();

// Request context logger
// Attaches request ID and other request metadata
export const createRequestLogger = (requestId: string, path: string) => {
  return createLogger({
    module: 'http',
    requestId,
    path,
  });
};
