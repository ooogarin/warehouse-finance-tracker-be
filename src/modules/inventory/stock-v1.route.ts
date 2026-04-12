import { Hono } from 'hono';
import { appValidator } from '@/core/http/validator';
import { authenticate } from '@/core/middleware/auth.middleware';
import { resolveMerchantContext } from '@/modules/merchants/merchant.middleware';
import * as stockController from './stock.controller';
import { stockListQuerySchema, stockLogListQuerySchema, stockParamsSchema } from './stock.schema';
import * as stockAdjustmentController from './stock-adjustments/stock-adjustment.controller';
import {
  createStockAdjustmentSchema,
  estimateStockAdjustmentOutSchema,
  stockAdjustmentListQuerySchema,
  stockAdjustmentParamsSchema,
} from './stock-adjustments/stock-adjustment.schema';
import * as stockUsageController from './stock-usages/stock-usage.controller';
import {
  createStockUsageSchema,
  estimateStockUsageSchema,
  stockUsageListQuerySchema,
  stockUsageParamsSchema,
} from './stock-usages/stock-usage.schema';
import type { AppEnv } from '@/shared/types/context.types';

const stockRoutesV1 = new Hono<AppEnv>();

// Apply authentication middleware to all routes
stockRoutesV1.use('*', authenticate);

// Resolve active merchant context for all stock routes
stockRoutesV1.use('*', resolveMerchantContext);

// GET /v1/stock - List stock
stockRoutesV1.get('/', appValidator('query', stockListQuerySchema), stockController.list);

// GET /v1/stock/usages - List stock usages
stockRoutesV1.get('/usages', appValidator('query', stockUsageListQuerySchema), stockUsageController.list);

// POST /v1/stock/usages - Create stock usage
stockRoutesV1.post('/usages', appValidator('json', createStockUsageSchema), stockUsageController.create);

// POST /v1/stock/usages/estimate - Estimate stock usage COGS
stockRoutesV1.post('/usages/estimate', appValidator('json', estimateStockUsageSchema), stockUsageController.estimate);

// GET /v1/stock/usages/:id - Get stock usage detail
stockRoutesV1.get('/usages/:id', appValidator('param', stockUsageParamsSchema), stockUsageController.getDetail);

// GET /v1/stock/wastes - List stock wastes
stockRoutesV1.get('/wastes', appValidator('query', stockUsageListQuerySchema), stockUsageController.listWastes);

// POST /v1/stock/wastes - Create stock waste
stockRoutesV1.post('/wastes', appValidator('json', createStockUsageSchema), stockUsageController.createWaste);

// POST /v1/stock/wastes/estimate - Estimate stock waste value
stockRoutesV1.post('/wastes/estimate', appValidator('json', estimateStockUsageSchema), stockUsageController.estimateWaste);

// GET /v1/stock/wastes/:id - Get stock waste detail
stockRoutesV1.get('/wastes/:id', appValidator('param', stockUsageParamsSchema), stockUsageController.getWasteDetail);

// GET /v1/stock/adjustments - List stock adjustments
stockRoutesV1.get('/adjustments', appValidator('query', stockAdjustmentListQuerySchema), stockAdjustmentController.list);

// POST /v1/stock/adjustments - Create stock adjustment
stockRoutesV1.post('/adjustments', appValidator('json', createStockAdjustmentSchema), stockAdjustmentController.create);

// POST /v1/stock/adjustments/estimate-out - Estimate stock adjustment out value
stockRoutesV1.post(
  '/adjustments/estimate-out',
  appValidator('json', estimateStockAdjustmentOutSchema),
  stockAdjustmentController.estimateOut,
);

// GET /v1/stock/adjustments/:id - Get stock adjustment detail
stockRoutesV1.get('/adjustments/:id', appValidator('param', stockAdjustmentParamsSchema), stockAdjustmentController.getDetail);

// GET /v1/stock/:ingredientId/logs - List stock logs
stockRoutesV1.get(
  '/:ingredientId/logs',
  appValidator('param', stockParamsSchema),
  appValidator('query', stockLogListQuerySchema),
  stockController.listLogs,
);

// GET /v1/stock/:ingredientId - Get stock detail
stockRoutesV1.get('/:ingredientId', appValidator('param', stockParamsSchema), stockController.getDetail);

export { stockRoutesV1 };
