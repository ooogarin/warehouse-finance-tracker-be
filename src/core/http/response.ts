import { createLogger } from '@/core/config/logger.config';
import { APP_ERROR_CODES } from '@/shared/constants/error-codes.constant';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { AppErrorCode } from '@/shared/constants/error-codes.constant';
import type { ApiResponse, PaginationMeta } from '@/shared/types/common.types';
import type { AppContext } from '@/shared/types/context.types';

const logger = createLogger({ module: 'response' });

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
  const meta = createResponseMeta(context);

  const response: ApiResponse<T> = {
    success: true,
    data,
    message: message ?? 'Success',
    ...(pagination && { pagination }),
    meta,
  };

  logger.debug({ requestId: meta.requestId, statusCode, path: context.req.path, method: context.req.method }, 'Response sent');

  return context.json(response, statusCode);
};

// Error response
export const errorResponse = ({
  context,
  message,
  statusCode = 500,
  code = APP_ERROR_CODES.INTERNAL_ERROR,
  details,
}: {
  context: AppContext;
  message: string;
  statusCode?: ContentfulStatusCode;
  code?: AppErrorCode;
  details?: unknown;
}): Response => {
  const meta = createResponseMeta(context);

  logger.warn(
    { requestId: meta.requestId, statusCode, code, path: context.req.path, method: context.req.method, message },
    'Error response',
  );

  const errorObj: { code: AppErrorCode; message: string; details?: unknown } = { code, message };
  if (details) {
    errorObj.details = details;
  }

  const response: ApiResponse<never> = {
    success: false,
    message,
    error: errorObj,
    meta,
  };

  return context.json(response, statusCode);
};

// Generate unique request ID
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

const createResponseMeta = (context: AppContext): { requestId: string; timestamp: string } => {
  return {
    requestId: context.get('requestId') || generateRequestId(),
    timestamp: new Date().toISOString(),
  };
};
