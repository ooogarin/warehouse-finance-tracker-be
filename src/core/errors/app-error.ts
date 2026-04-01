import { APP_ERROR_CODES, getStatusCodeForAppError } from '@/shared/constants/error-codes.constant';
import { APP_ERROR_MESSAGES } from '@/shared/constants/messages.constant';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { AppErrorCode } from '@/shared/constants/error-codes.constant';

type ErrorDetail = { field: string; message: string };

/**
 * Custom application error class
 * All application errors should use this shared shape
 */
export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly statusCode: ContentfulStatusCode;
  public readonly details?: ErrorDetail[];
  public readonly isOperational: boolean;

  constructor(code: AppErrorCode, message: string, details?: ErrorDetail[], isOperational = true) {
    super(message);
    this.code = code;
    this.statusCode = getStatusCodeForAppError(code);
    this.details = details;
    this.isOperational = isOperational;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Type guard to check if an error is an instance of AppError
export const isAppError = (error: Error): error is AppError => {
  return error instanceof AppError;
};

// ====================================================================================================
// List of factory functions for creating specific types of application errors
// ====================================================================================================
export const validationError = (message: string = APP_ERROR_MESSAGES.INVALID_REQUEST, details?: ErrorDetail[]): AppError => {
  return new AppError(APP_ERROR_CODES.VALIDATION_ERROR, message, details);
};

export const unauthorizedError = (message: string = APP_ERROR_MESSAGES.UNAUTHORIZED): AppError => {
  return new AppError(APP_ERROR_CODES.UNAUTHORIZED, message);
};

export const invalidTokenError = (message: string = APP_ERROR_MESSAGES.INVALID_TOKEN): AppError => {
  return new AppError(APP_ERROR_CODES.INVALID_TOKEN, message);
};

export const tokenExpiredError = (message: string = APP_ERROR_MESSAGES.TOKEN_EXPIRED): AppError => {
  return new AppError(APP_ERROR_CODES.TOKEN_EXPIRED, message);
};

export const forbiddenError = (message: string = APP_ERROR_MESSAGES.FORBIDDEN): AppError => {
  return new AppError(APP_ERROR_CODES.FORBIDDEN, message);
};

export const notFoundError = (message: string = APP_ERROR_MESSAGES.NOT_FOUND): AppError => {
  return new AppError(APP_ERROR_CODES.NOT_FOUND, message);
};

export const conflictError = (message: string = APP_ERROR_MESSAGES.CONFLICT): AppError => {
  return new AppError(APP_ERROR_CODES.CONFLICT, message);
};

export const internalError = (message: string = APP_ERROR_MESSAGES.INTERNAL_ERROR): AppError => {
  return new AppError(APP_ERROR_CODES.INTERNAL_ERROR, message, undefined, false);
};
