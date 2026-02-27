import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { createLogger } from '@/config/logger.config';
import type { ApiResponse, PaginationMeta } from '@/types/common.types';
import type { AppContext } from '@/types/context.types';

const logger = createLogger({ module: 'response' });

// Generate unique request ID
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

// Success response
export const successResponse = <T>({
  context,
  data,
  message,
  pagination,
  statusCode = 200,
}: {
  context: AppContext;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
  statusCode?: ContentfulStatusCode;
}): Response => {
  const requestId = context.get('requestId') || generateRequestId();
  const timestamp = new Date().toISOString();

  const response: ApiResponse<T> = {
    success: true,
    data,
    message: message ?? 'Success',
    ...(pagination && { pagination }),
    meta: {
      requestId,
      timestamp,
    },
  };

  logger.debug({ requestId, statusCode, path: context.req.path, method: context.req.method }, 'Response sent');

  return context.json(response, statusCode);
};

// Failed response
export const failedResponse = ({
  context,
  message,
  statusCode = 500,
  code = 'INTERNAL_ERROR',
  details,
}: {
  context: AppContext;
  message: string;
  statusCode?: ContentfulStatusCode;
  code?: string;
  details?: unknown;
}): Response => {
  const requestId = context.get('requestId') || generateRequestId();
  const timestamp = new Date().toISOString();

  logger.warn({ requestId, statusCode, code, path: context.req.path, method: context.req.method, message }, 'Error response');

  const errorObj: { code: string; message: string; details?: unknown } = { code, message };
  if (details) {
    errorObj.details = details;
  }

  const response: ApiResponse<never> = {
    success: false,
    data: undefined as never,
    message,
    error: errorObj,
    meta: {
      requestId,
      timestamp,
    },
  };

  return context.json(response, statusCode);
};

// Error response alias for backward compatibility
export const errorResponse = failedResponse;

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
  const page = Math.max(1, parseInt(query.page ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
  return { page, limit };
};

// Parse sort params from query
export const parseSortParams = (query: { sort?: string; order?: string }): { field: string; order: 'asc' | 'desc' } => {
  const field = query.sort ?? 'created_at';
  const order = query.order === 'desc' ? 'desc' : 'asc';
  return { field, order };
};
