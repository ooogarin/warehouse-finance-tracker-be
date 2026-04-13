import { successResponse } from '@/core/http/response';
import { getBody } from '@/shared/utils/hono.util';
import * as merchantService from './merchant.service';
import type { AppContext } from '@/shared/types/context.types';
import type { UpdateCurrentMerchantRequest } from './merchant.type';

// List accessible merchants
// GET /v1/merchants
export const listAccessible = async (c: AppContext) => {
  const userId = c.get('userId');
  const result = await merchantService.listAccessible({ userId });

  return successResponse({
    context: c,
    data: result,
    message: 'Accessible merchants fetched successfully',
  });
};

// Get current merchant
// GET /v1/merchants/current
export const getCurrent = async (c: AppContext) => {
  const userId = c.get('userId');
  const merchantId = c.get('merchantId');
  const result = await merchantService.getCurrent({ userId, merchantId });

  return successResponse({
    context: c,
    data: result,
    message: 'Current merchant fetched successfully',
  });
};

// Update current merchant
// PATCH /v1/merchants/current
export const updateCurrent = async (c: AppContext) => {
  const userId = c.get('userId');
  const merchantId = c.get('merchantId');
  const data = getBody<UpdateCurrentMerchantRequest>(c);

  const result = await merchantService.updateCurrent({ userId, merchantId, data });

  return successResponse({
    context: c,
    data: result,
    message: 'Current merchant updated successfully',
  });
};
