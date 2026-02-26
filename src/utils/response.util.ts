import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { createLogger } from '@/config/logger.config';
import type { ApiResponse, PaginationMeta } from '@/types/common.types';
import type { AppContext } from '@/types/context.types';

const logger = createLogger({ module: 'response' });

// Generate a unique request ID
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

// Create success response
export const createSuccessResponse = <T>(data: T, message?: string, pagination?: PaginationMeta): Omit<ApiResponse<T>, 'meta'> => {
  return {
    success: true,
    data,
    ...(message && { message }),
    ...(pagination && { pagination }),
  };
};

/**
 * Send success response
 * Usage in controller:
 * ```typescript
 * return successResponse({
 *   context: c,
 *   data: merchants,
 *   message: "Merchants retrieved successfully",
 *   pagination: { page: 1, limit: 20, total: 100 }
 * });
 * ```
 */
export interface SuccessResponseOptions<T> {
  context: AppContext;
  data: T;
  message?: string;
  statusCode?: ContentfulStatusCode;
  pagination?: PaginationMeta;
}

export const successResponse = <T>({ context, data, message, statusCode = 200, pagination }: SuccessResponseOptions<T>): Response => {
  const requestId = context.get('requestId') || generateRequestId();
  const timestamp = new Date().toISOString();

  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    ...(pagination && { pagination }),
    meta: {
      requestId,
      timestamp,
    },
  };

  // Log successful response
  logger.debug(
    {
      requestId,
      statusCode,
      path: context.req.path,
      method: context.req.method,
    },
    'Response sent',
  );

  return context.json(response, statusCode);
};

// Create error response
export const createErrorResponse = (
  code: string,
  message: string,
  details?: { field: string; message: string }[],
): Omit<ApiResponse<never>, 'meta' | 'data'> => {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
};

/**
 * Send error response
 * Usage in controller (usually not called directly, use error handler middleware):
 * ```typescript
 * return errorResponse({
 *   context: c,
 *   code: "NOT_FOUND",
 *   message: "Merchant not found",
 *   statusCode: 404
 * });
 * ```
 */
export interface ErrorResponseOptions {
  context: AppContext;
  code: string;
  message: string;
  statusCode: ContentfulStatusCode;
  details?: { field: string; message: string }[];
}

export const errorResponse = ({ context, code, message, statusCode, details }: ErrorResponseOptions): Response => {
  const requestId = context.get('requestId') || generateRequestId();
  const timestamp = new Date().toISOString();

  const response: ApiResponse<never> = {
    success: false,
    data: undefined as never,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    meta: {
      requestId,
      timestamp,
    },
  };

  // Log error response
  logger.warn(
    {
      requestId,
      statusCode,
      path: context.req.path,
      method: context.req.method,
      errorCode: code,
    },
    `Error response: ${message}`,
  );

  return context.json(response, statusCode);
};

// Create pagination metadata
export const createPaginationMeta = (page: number, limit: number, total: number): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page,
    limit,
    total,
    total_pages: totalPages,
    has_next_page: hasNextPage,
    has_prev_page: hasPrevPage,
  };
};

// Parse pagination params from query
export const parsePaginationParams = (query: { page?: string; limit?: string }): { page: number; limit: number } => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  return { page, limit };
};

// Parse sort params from query
export const parseSortParams = (query: { sort?: string; order?: string }): { field: string; order: 'asc' | 'desc' } => {
  const field = query.sort || 'created_at';
  const order = query.order === 'desc' ? 'desc' : 'asc';
  return { field, order };
};
