import { isDevelopment } from '@/core/config/env.config';
import { createLogger } from '@/core/config/logger.config';
import { isAppError } from '@/core/errors/app-error';
import { errorResponse, generateRequestId } from '@/core/http/response';
import { APP_ERROR_CODES } from '@/shared/constants/error-codes.constant';
import { APP_ERROR_MESSAGES } from '@/shared/constants/messages.constant';
import type { Context } from 'hono';

const logger = createLogger({ module: 'error-handler' });

// Global error handler middleware
// Catches all errors and formats them into consistent API responses
export const errorHandler = (err: Error, c: Context): Response => {
  const requestId = c.get('requestId') || generateRequestId();
  const path = c.req.path;
  const method = c.req.method;

  if (isAppError(err)) {
    logger.warn(
      {
        requestId,
        path,
        method,
        code: err.code,
        statusCode: err.statusCode,
        message: err.message,
        details: err.details,
      },
      'Application error',
    );

    return errorResponse({
      context: c,
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      details: err.details,
    });
  }

  logger.error(
    {
      requestId,
      path,
      method,
      error: err,
      stack: err.stack,
    },
    'Unexpected error',
  );

  return errorResponse({
    context: c,
    code: APP_ERROR_CODES.INTERNAL_ERROR,
    message: isDevelopment ? err.message || APP_ERROR_MESSAGES.UNKNOWN_ERROR : APP_ERROR_MESSAGES.UNKNOWN_ERROR,
    statusCode: 500,
  });
};

// Not found handler middleware
// Handles 404 errors for undefined routes
export const notFoundHandler = (c: Context): Response => {
  return errorResponse({
    context: c,
    code: APP_ERROR_CODES.NOT_FOUND,
    message: 'Endpoint not found',
    statusCode: 404,
  });
};
