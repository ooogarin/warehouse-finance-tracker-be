import { Hono } from 'hono';
import { appValidator } from '@/core/http/validator';
import { authenticate } from '@/core/middleware/auth.middleware';
import { requirePlatformAdmin } from '@/core/middleware/platform-admin.middleware';
import * as internalMerchantController from './internal-merchant.controller';
import {
  createInternalMerchantSchema,
  internalMerchantParamsSchema,
  updateInternalMerchantSchema,
  updateInternalMerchantSubscriptionSchema,
} from './internal-merchant.schema';
import type { AppEnv } from '@/shared/types/context.types';

const internalMerchantRoutesV1 = new Hono<AppEnv>();

internalMerchantRoutesV1.use('*', authenticate, requirePlatformAdmin);

internalMerchantRoutesV1.get('/merchants', internalMerchantController.list);
internalMerchantRoutesV1.get('/merchants/:id', appValidator('param', internalMerchantParamsSchema), internalMerchantController.getDetail);
internalMerchantRoutesV1.post('/merchants', appValidator('json', createInternalMerchantSchema), internalMerchantController.create);
internalMerchantRoutesV1.patch(
  '/merchants/:id',
  appValidator('param', internalMerchantParamsSchema),
  appValidator('json', updateInternalMerchantSchema),
  internalMerchantController.update,
);
internalMerchantRoutesV1.patch(
  '/merchants/:id/subscription',
  appValidator('param', internalMerchantParamsSchema),
  appValidator('json', updateInternalMerchantSubscriptionSchema),
  internalMerchantController.updateSubscription,
);

export { internalMerchantRoutesV1 };
