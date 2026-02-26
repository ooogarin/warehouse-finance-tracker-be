import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import { env } from '@/config/env.config';
import { createLogger } from '@/config/logger.config';
import { ERROR_MESSAGES } from '@/constants/messages.constant';
import type { AppEnv, JwtPayload } from '@/types/context.types';
import { unauthorizedError } from '@/utils/errors.util';

const logger = createLogger({ module: 'auth-middleware' });

// Extract token from Authorization header
const extractToken = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * JWT Authentication middleware
 * Validates JWT token and sets user context
 *
 * Usage:
 * ```typescript
 * app.use("/api/*", authMiddleware);
 * ```
 */
export const authenticate = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = extractToken(authHeader);

  if (!token) {
    logger.warn({ path: c.req.path }, 'Missing authorization token');
    throw unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED);
  }

  try {
    // Verify JWT using Hono's jwt helper
    const payload = (await verify(token, env.JWT_SECRET, 'HS256')) as unknown as JwtPayload;

    // Set user context
    c.set('userId', payload.userId);
    c.set('token', token);

    logger.debug({ userId: payload.userId }, 'User authenticated');

    await next();
  } catch (error) {
    logger.warn({ error, path: c.req.path }, 'Token verification failed');

    if (error instanceof Error && error.name === 'JwtTokenExpired') {
      throw unauthorizedError(ERROR_MESSAGES.TOKEN_EXPIRED);
    }

    throw unauthorizedError(ERROR_MESSAGES.INVALID_TOKEN);
  }
});

/**
 * Optional authentication middleware
 * Sets user context if token is valid, but doesn't require it
 *
 * Usage:
 * ```typescript
 * app.use("/api/public/*", optionalAuthMiddleware);
 * ```
 */
export const optionalAuthenticate = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = extractToken(authHeader);

  if (token) {
    try {
      const payload = (await verify(token, env.JWT_SECRET, 'HS256')) as unknown as JwtPayload;
      c.set('userId', payload.userId);
      c.set('token', token);
      logger.debug({ userId: payload.userId }, 'Optional auth: user authenticated');
    } catch {
      // Ignore invalid token for optional auth
      logger.debug('Optional auth: invalid token, proceeding as anonymous');
    }
  }

  await next();
});
