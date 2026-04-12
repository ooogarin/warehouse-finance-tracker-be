import { Hono } from 'hono';
import { appValidator } from '@/core/http/validator';
import { authenticate } from '@/core/middleware/auth.middleware';
import { resolveMerchantContext } from '@/modules/merchants/merchant.middleware';
import * as supplierController from './supplier.controller';
import { createSupplierSchema, supplierListQuerySchema, supplierParamsSchema, updateSupplierSchema } from './supplier.schema';
import type { AppEnv } from '@/shared/types/context.types';

const supplierRoutesV1 = new Hono<AppEnv>();

// Apply authentication middleware to all routes
supplierRoutesV1.use('*', authenticate);

// Resolve active merchant context for all supplier routes
supplierRoutesV1.use('*', resolveMerchantContext);

// GET /v1/suppliers - List suppliers
supplierRoutesV1.get('/', appValidator('query', supplierListQuerySchema), supplierController.list);

// POST /v1/suppliers - Create supplier
supplierRoutesV1.post('/', appValidator('json', createSupplierSchema), supplierController.create);

// GET /v1/suppliers/:id - Get supplier detail
supplierRoutesV1.get('/:id', appValidator('param', supplierParamsSchema), supplierController.getDetail);

// PATCH /v1/suppliers/:id - Update supplier
supplierRoutesV1.patch(
  '/:id',
  appValidator('param', supplierParamsSchema),
  appValidator('json', updateSupplierSchema),
  supplierController.update,
);

// DELETE /v1/suppliers/:id - Archive supplier
supplierRoutesV1.delete('/:id', appValidator('param', supplierParamsSchema), supplierController.archive);

export { supplierRoutesV1 };
