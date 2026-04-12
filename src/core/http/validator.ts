import { zValidator } from '@hono/zod-validator';
import { APP_ERROR_CODES } from '@/shared/constants/error-codes.constant';
import { APP_ERROR_MESSAGES } from '@/shared/constants/messages.constant';
import { errorResponse } from './response';
import type { AppContext } from '@/shared/types/context.types';

export const appValidator = ((target: Parameters<typeof zValidator>[0], schema: Parameters<typeof zValidator>[1]) =>
  zValidator(target, schema, (result, c) => {
    if (result.success) {
      return;
    }

    return errorResponse({
      context: c as unknown as AppContext,
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: APP_ERROR_MESSAGES.INVALID_REQUEST,
      statusCode: 400,
      details: result.error.issues.map((issue) => ({
        field: issue.path.length > 0 ? issue.path.map(String).join('.') : result.target,
        message: issue.message,
      })),
    });
  })) as typeof zValidator;
