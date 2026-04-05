import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
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
supplierRoutesV1.get('/', zValidator('query', supplierListQuerySchema), supplierController.list);

// POST /v1/suppliers - Create supplier
supplierRoutesV1.post('/', zValidator('json', createSupplierSchema), supplierController.create);

// GET /v1/suppliers/:id - Get supplier detail
supplierRoutesV1.get('/:id', zValidator('param', supplierParamsSchema), supplierController.getDetail);

// PATCH /v1/suppliers/:id - Update supplier
supplierRoutesV1.patch(
  '/:id',
  zValidator('param', supplierParamsSchema),
  zValidator('json', updateSupplierSchema),
  supplierController.update,
);

// DELETE /v1/suppliers/:id - Archive supplier
supplierRoutesV1.delete('/:id', zValidator('param', supplierParamsSchema), supplierController.archive);

export { supplierRoutesV1 };
