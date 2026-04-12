import { Hono } from 'hono';
import { appValidator } from '@/core/http/validator';
import { authenticate } from '@/core/middleware/auth.middleware';
import { resolveMerchantContext } from '@/modules/merchants/merchant.middleware';
import * as cashController from './cash.controller';
import { cashListQuerySchema, cashParamsSchema, createCashInSchema, createCashOutSchema } from './cash.schema';
import type { AppEnv } from '@/shared/types/context.types';

const cashRoutesV1 = new Hono<AppEnv>();

// Apply authentication middleware to all routes
cashRoutesV1.use('*', authenticate);

// Resolve active merchant context for all cash routes
cashRoutesV1.use('*', resolveMerchantContext);

// GET /v1/cash - List cash transactions and summary
cashRoutesV1.get('/', appValidator('query', cashListQuerySchema), cashController.list);

// POST /v1/cash/in - Create manual cash in transaction
cashRoutesV1.post('/in', appValidator('json', createCashInSchema), cashController.createCashIn);

// POST /v1/cash/out - Create manual cash out transaction
cashRoutesV1.post('/out', appValidator('json', createCashOutSchema), cashController.createCashOut);

// GET /v1/cash/:id - Get cash transaction detail
cashRoutesV1.get('/:id', appValidator('param', cashParamsSchema), cashController.getDetail);

export { cashRoutesV1 };
