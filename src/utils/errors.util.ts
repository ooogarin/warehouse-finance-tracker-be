import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ErrorCode } from '@/constants/error-codes.constant';
import { getHttpStatusForError } from '@/constants/error-codes.constant';
import { ERROR_MESSAGES } from '@/constants/messages.constant';

/**
 * Custom application error class
 * All errors thrown in the application should use this or its subclasses
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: ContentfulStatusCode;
  public readonly details?: { field: string; message: string }[];
  public readonly isOperational: boolean;

  constructor(code: ErrorCode, message: string, details?: { field: string; message: string }[], isOperational = true) {
    super(message);
    this.code = code;
    this.statusCode = getHttpStatusForError(code);
    this.details = details;
    this.isOperational = isOperational;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error (400 Bad Request)
export class ValidationError extends AppError {
  constructor(message: string = ERROR_MESSAGES.INVALID_REQUEST, details?: { field: string; message: string }[]) {
    super('VALIDATION_ERROR', message, details);
  }
}

// Unauthorized error (401 Unauthorized)
export class UnauthorizedError extends AppError {
  constructor(message: string = ERROR_MESSAGES.UNAUTHORIZED) {
    super('UNAUTHORIZED', message);
  }
}

// Forbidden error (403 Forbidden)
export class ForbiddenError extends AppError {
  constructor(message: string = ERROR_MESSAGES.FORBIDDEN) {
    super('FORBIDDEN', message);
  }
}

// Not found error (404 Not Found)
export class NotFoundError extends AppError {
  constructor(message: string = ERROR_MESSAGES.UNKNOWN_ERROR) {
    super('NOT_FOUND', message);
  }
}

// Conflict error (409 Conflict)
export class ConflictError extends AppError {
  constructor(message: string = ERROR_MESSAGES.UNKNOWN_ERROR) {
    super('CONFLICT', message);
  }
}

// Internal server error (500 Internal Server Error)
export class InternalError extends AppError {
  constructor(message: string = ERROR_MESSAGES.UNKNOWN_ERROR) {
    super('INTERNAL_ERROR', message, undefined, false);
  }
}

// Helper function to create a validation error
export const validationError = (message?: string, details?: { field: string; message: string }[]): ValidationError => {
  return new ValidationError(message, details);
};

// Helper function to create an unauthorized error
export const unauthorizedError = (message?: string): UnauthorizedError => {
  return new UnauthorizedError(message);
};

// Helper function to create a forbidden error
export const forbiddenError = (message?: string): ForbiddenError => {
  return new ForbiddenError(message);
};

// Helper function to create a not found error
export const notFoundError = (message?: string): NotFoundError => {
  return new NotFoundError(message);
};

// Helper function to create a conflict error
export const conflictError = (message?: string): ConflictError => {
  return new ConflictError(message);
};

// Helper function to create an internal error
export const internalError = (message?: string): InternalError => {
  return new InternalError(message);
};

// Check if an error is an operational error (expected, not a bug)
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

// Check if an error is an AppError
export const isAppError = (error: Error): error is AppError => {
  return error instanceof AppError;
};
