import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { authenticate } from '@/core/middleware/auth.middleware';
import { resolveMerchantContext } from '@/modules/merchants/merchant.middleware';
import * as purchaseOrderController from './purchase-order.controller';
import { createPurchaseOrderSchema, purchaseOrderListQuerySchema, purchaseOrderParamsSchema } from './purchase-order.schema';
import type { AppEnv } from '@/shared/types/context.types';

const purchaseOrderRoutesV1 = new Hono<AppEnv>();

// Apply authentication middleware to all routes
purchaseOrderRoutesV1.use('*', authenticate);

// Resolve active merchant context for all purchase order routes
purchaseOrderRoutesV1.use('*', resolveMerchantContext);

// GET /v1/purchase-orders - List purchase orders
purchaseOrderRoutesV1.get('/', zValidator('query', purchaseOrderListQuerySchema), purchaseOrderController.list);

// POST /v1/purchase-orders - Create purchase order
purchaseOrderRoutesV1.post('/', zValidator('json', createPurchaseOrderSchema), purchaseOrderController.create);

// GET /v1/purchase-orders/:id - Get purchase order detail
purchaseOrderRoutesV1.get('/:id', zValidator('param', purchaseOrderParamsSchema), purchaseOrderController.getDetail);

export { purchaseOrderRoutesV1 };
