import type { Context } from 'hono';
import { createLogger } from '@/config/logger.config';
import { ERROR_CODES } from '@/constants/error-codes.constant';
import { ERROR_MESSAGES } from '@/constants/messages.constant';
import { isAppError } from '@/utils/errors.util';
import { errorResponse, generateRequestId } from '@/utils/response.util';

const logger = createLogger({ module: 'error-handler' });

// Global error handler middleware
// Catches all errors and formats them into consistent API responses
export const errorHandler = (err: Error, c: Context): Response => {
  const requestId = c.get('requestId') || generateRequestId();
  const path = c.req.path;
  const method = c.req.method;

  // Handle known application errors
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

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const zodError = err as {
      errors?: {
        path: (string | number)[];
        message: string;
      }[];
    };
    const details =
      zodError.errors?.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })) || [];

    logger.warn(
      {
        requestId,
        path,
        method,
        details,
      },
      'Validation error',
    );

    return errorResponse({
      context: c,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: ERROR_MESSAGES.INVALID_REQUEST,
      statusCode: 400,
      details,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    logger.warn(
      {
        requestId,
        path,
        method,
        errorName: err.name,
        message: err.message,
      },
      'JWT error',
    );

    const isExpired = err.name === 'TokenExpiredError';
    return errorResponse({
      context: c,
      code: isExpired ? ERROR_CODES.TOKEN_EXPIRED : ERROR_CODES.INVALID_TOKEN,
      message: isExpired ? ERROR_MESSAGES.TOKEN_EXPIRED : ERROR_MESSAGES.INVALID_TOKEN,
      statusCode: 401,
    });
  }

  // Handle PostgreSQL errors
  if (err.name === 'PostgresError') {
    const pgError = err as { code?: string; detail?: string };

    // Unique constraint violation
    if (pgError.code === '23505') {
      logger.warn(
        {
          requestId,
          path,
          method,
          detail: pgError.detail,
        },
        'Duplicate key error',
      );

      return errorResponse({
        context: c,
        code: ERROR_CODES.DUPLICATE_EMAIL,
        message: ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
        statusCode: 409,
      });
    }

    // Foreign key constraint violation
    if (pgError.code === '23503') {
      logger.warn(
        {
          requestId,
          path,
          method,
          detail: pgError.detail,
        },
        'Foreign key violation',
      );

      return errorResponse({
        context: c,
        code: ERROR_CODES.BUSINESS_RULE_VIOLATION,
        message: 'Related data not found',
        statusCode: 422,
      });
    }

    // Other PostgreSQL errors
    logger.error(
      {
        requestId,
        path,
        method,
        error: err,
        code: pgError.code,
      },
      'Database error',
    );

    return errorResponse({
      context: c,
      code: ERROR_CODES.DATABASE_ERROR,
      message: ERROR_MESSAGES.UNKNOWN_ERROR,
      statusCode: 500,
    });
  }

  // Handle unknown errors (programmer errors)
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
    code: ERROR_CODES.INTERNAL_ERROR,
    message: isDevelopment() ? err.message || ERROR_MESSAGES.UNKNOWN_ERROR : ERROR_MESSAGES.UNKNOWN_ERROR,
    statusCode: 500,
  });
};

// Not found handler middleware
// Handles 404 errors for undefined routes
export const notFoundHandler = (c: Context): Response => {
  return errorResponse({
    context: c,
    code: ERROR_CODES.NOT_FOUND,
    message: 'Endpoint not found',
    statusCode: 404,
  });
};

// Check if running in development mode
const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};
