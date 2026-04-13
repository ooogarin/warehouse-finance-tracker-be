import { Hono } from 'hono';
import { appValidator } from '@/core/http/validator';
import { authenticate } from '@/core/middleware/auth.middleware';
import { resolveMerchantContext } from '@/modules/merchants/merchant.middleware';
import * as dashboardController from './dashboard.controller';
import { dashboardQuerySchema } from './dashboard.schema';
import type { AppEnv } from '@/shared/types/context.types';

const dashboardRoutesV1 = new Hono<AppEnv>();

// Apply authentication middleware to all routes
dashboardRoutesV1.use('*', authenticate);

// Resolve active merchant context for all dashboard routes
dashboardRoutesV1.use('*', resolveMerchantContext);

// GET /v1/dashboard - Get dashboard aggregate data
dashboardRoutesV1.get('/', appValidator('query', dashboardQuerySchema), dashboardController.getDashboard);

export { dashboardRoutesV1 };
