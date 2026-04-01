import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import { env } from '@/core/config/env.config';
import { createLogger } from '@/core/config/logger.config';
import { invalidTokenError, isAppError, tokenExpiredError, unauthorizedError } from '@/core/errors/app-error';
import { APP_ERROR_MESSAGES } from '@/shared/constants/messages.constant';
import type { JwtPayload } from '@/modules/auth/auth.type';
import type { AppEnv } from '@/shared/types/context.types';

const logger = createLogger({ module: 'auth-middleware' });

// Extract token from Authorization header
const extractToken = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

// Type guard to validate JWT payload structure
const isValidJwtPayload = (payload: unknown): payload is JwtPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Partial<JwtPayload>;
  return typeof candidate.userId === 'string' && candidate.userId.length > 0;
};

// JWT Authentication middleware
// Validates JWT token and sets user context
export const authenticate = createMiddleware<AppEnv>(async (c, next) => {
  // Get token from Authorization header
  const authHeader = c.req.header('Authorization');
  const token = extractToken(authHeader);

  if (!token) {
    logger.warn({ path: c.req.path }, 'Missing authorization token');
    throw unauthorizedError(APP_ERROR_MESSAGES.UNAUTHORIZED);
  }

  let payload: JwtPayload;

  try {
    // Verify JWT using Hono's jwt helper
    const verifiedPayload = await verify(token, env.JWT_SECRET, 'HS256');
    if (!isValidJwtPayload(verifiedPayload)) {
      throw invalidTokenError();
    }

    payload = verifiedPayload;
  } catch (error) {
    logger.warn({ error, path: c.req.path }, 'Token verification failed');

    if (error instanceof Error && isAppError(error)) {
      throw error;
    }

    if (error instanceof Error && error.name === 'JwtTokenExpired') {
      throw tokenExpiredError();
    }

    throw invalidTokenError();
  }

  // Set user context
  c.set('userId', payload.userId);
  c.set('token', token);

  logger.debug({ userId: payload.userId }, 'User authenticated');

  await next();
});
