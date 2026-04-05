import { Hono } from 'hono';
import { authenticate } from '@/core/middleware/auth.middleware';
import * as merchantController from './merchant.controller';
import { resolveMerchantContext } from './merchant.middleware';
import type { AppEnv } from '@/shared/types/context.types';

const merchantRoutesV1 = new Hono<AppEnv>();

// Apply authentication middleware to all routes
merchantRoutesV1.use('*', authenticate);

// GET /v1/merchants - List accessible merchants
merchantRoutesV1.get('/', merchantController.listAccessible);

// GET /v1/merchants/current - Get current merchant
merchantRoutesV1.get('/current', resolveMerchantContext, merchantController.getCurrent);

export { merchantRoutesV1 };
