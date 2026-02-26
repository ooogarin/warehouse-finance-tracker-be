import { createMiddleware } from 'hono/factory';
import { createRequestLogger } from '@/config/logger.config';
import type { AppEnv } from '@/types/context.types';

// HTTP request logger middleware
// Logs all incoming requests and their responses
export const requestLogger = createMiddleware<AppEnv>(async (c, next) => {
  const requestId = c.get('requestId');
  const startTime = Date.now();
  const path = c.req.path;
  const method = c.req.method;

  // Create request-specific logger
  const requestLogger = createRequestLogger(requestId, path);

  // Log request
  requestLogger.info(
    {
      method,
      query: Object.fromEntries(new URL(c.req.url).searchParams),
      user_agent: c.req.header('User-Agent'),
      ip: c.req.header('X-Forwarded-For') || 'unknown',
    },
    '→ Request',
  );

  await next();

  // Calculate duration
  const duration = Date.now() - startTime;
  const status = c.res.status;

  // Determine log level based on status
  const logLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

  // Log response
  requestLogger[logLevel](
    {
      method,
      status,
      duration: `${duration}ms`,
    },
    '← Response',
  );

  // Add response time header
  c.header('X-Response-Time', `${duration}ms`);
});
