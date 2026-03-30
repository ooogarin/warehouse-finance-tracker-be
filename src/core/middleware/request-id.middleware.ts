import { createMiddleware } from 'hono/factory';
import { generateRequestId } from '@/core/config/logger.config';
import type { AppEnv } from '@/shared/types/context.types';

// Request ID middleware
// Assigns a unique request ID to each request for tracing
export const requestIdMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  // Get request ID from header or generate new one
  const requestId = c.req.header('X-Request-ID') || generateRequestId();

  // Set request ID in context
  c.set('requestId', requestId);
  c.set('startTime', Date.now());

  // Add request ID to response headers
  c.header('X-Request-ID', requestId);

  await next();
});
