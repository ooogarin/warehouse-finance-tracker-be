import { successResponse } from '@/core/http/response';
import { getBody, getParam } from '@/shared/utils/hono.util';
import * as internalMerchantService from './internal-merchant.service';
import type { AppContext } from '@/shared/types/context.types';
import type {
  CreateInternalMerchantRequest,
  InternalMerchantParams,
  UpdateInternalMerchantRequest,
  UpdateInternalMerchantSubscriptionRequest,
} from './internal-merchant.type';

// List internal merchants
// GET /v1/internal/merchants
export const list = async (c: AppContext) => {
  const result = await internalMerchantService.list();

  return successResponse({
    context: c,
    data: result,
    message: 'Internal merchants fetched successfully',
  });
};

// Get internal merchant detail
// GET /v1/internal/merchants/:id
export const getDetail = async (c: AppContext) => {
  const params = getParam<InternalMerchantParams>(c);
  const result = await internalMerchantService.getDetail({ merchantId: params.id });

  return successResponse({
    context: c,
    data: result,
    message: 'Internal merchant detail fetched successfully',
  });
};

// Create internal merchant
// POST /v1/internal/merchants
export const create = async (c: AppContext) => {
  const data = getBody<CreateInternalMerchantRequest>(c);
  const result = await internalMerchantService.create(data);

  return successResponse({
    context: c,
    data: result,
    message: 'Internal merchant created successfully',
    statusCode: 201,
  });
};

// Update internal merchant profile
// PATCH /v1/internal/merchants/:id
export const update = async (c: AppContext) => {
  const params = getParam<InternalMerchantParams>(c);
  const data = getBody<UpdateInternalMerchantRequest>(c);
  const result = await internalMerchantService.update({ merchantId: params.id, data });

  return successResponse({
    context: c,
    data: result,
    message: 'Internal merchant updated successfully',
  });
};

// Update internal merchant subscription
// PATCH /v1/internal/merchants/:id/subscription
export const updateSubscription = async (c: AppContext) => {
  const params = getParam<InternalMerchantParams>(c);
  const data = getBody<UpdateInternalMerchantSubscriptionRequest>(c);
  const result = await internalMerchantService.updateSubscription({ merchantId: params.id, data });

  return successResponse({
    context: c,
    data: result,
    message: 'Internal merchant subscription updated successfully',
  });
};
