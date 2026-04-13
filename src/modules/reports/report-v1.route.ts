import { Hono } from 'hono';
import { appValidator } from '@/core/http/validator';
import { authenticate } from '@/core/middleware/auth.middleware';
import { resolveMerchantContext } from '@/modules/merchants/merchant.middleware';
import * as reportController from './report.controller';
import { reportFinancialQuerySchema, reportStockQuerySchema, reportSupplierQuerySchema } from './report.schema';
import type { AppEnv } from '@/shared/types/context.types';

const reportRoutesV1 = new Hono<AppEnv>();

// Apply authentication middleware to all routes
reportRoutesV1.use('*', authenticate);

// Resolve active merchant context for all report routes
reportRoutesV1.use('*', resolveMerchantContext);

// GET /v1/reports/financial - Get financial report
reportRoutesV1.get('/financial', appValidator('query', reportFinancialQuerySchema), reportController.getFinancialReport);

// GET /v1/reports/stock - Get stock report
reportRoutesV1.get('/stock', appValidator('query', reportStockQuerySchema), reportController.getStockReport);

// GET /v1/reports/suppliers - Get supplier performance report
reportRoutesV1.get('/suppliers', appValidator('query', reportSupplierQuerySchema), reportController.getSupplierReport);

export { reportRoutesV1 };
