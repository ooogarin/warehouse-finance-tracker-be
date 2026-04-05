import { createMiddleware } from 'hono/factory';
import { forbiddenError, validationError } from '@/core/errors/app-error';
import { APP_ERROR_MESSAGES } from '@/shared/constants/messages.constant';
import * as merchantRepository from './merchant.repository';
import type { AppEnv } from '@/shared/types/context.types';

// Validate UUID format for X-Merchant-ID header
const isValidUuid = (value: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

// Resolve merchant context from X-Merchant-ID header
export const resolveMerchantContext = createMiddleware<AppEnv>(async (c, next) => {
  const userId = c.get('userId');
  const merchantId = c.req.header('X-Merchant-ID');

  if (!merchantId) {
    throw validationError('X-Merchant-ID header is required');
  }

  if (!isValidUuid(merchantId)) {
    throw validationError('X-Merchant-ID must be a valid UUID');
  }

  const merchant = await merchantRepository.getOneAccessibleByIdAndUserId(merchantId, userId);
  if (!merchant) {
    throw forbiddenError(APP_ERROR_MESSAGES.FORBIDDEN);
  }

  c.set('merchantId', merchant.id);
  c.set('merchant', {
    id: merchant.id,
    name: merchant.name,
    user_role: merchant.user_role,
  });

  await next();
});
