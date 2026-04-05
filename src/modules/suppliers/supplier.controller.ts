import { successResponse } from '@/core/http/response';
import { getBody, getParam, getQuery } from '@/shared/utils/hono.util';
import * as supplierService from './supplier.service';
import type { AppContext } from '@/shared/types/context.types';
import type { CreateSupplierRequest, GetSupplierRequest, ListSuppliersRequest, UpdateSupplierRequest } from './supplier.type';

// List suppliers
// GET /v1/suppliers
export const list = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const query = getQuery<{ search?: string }>(c);

  const request: ListSuppliersRequest = {
    merchantId,
    search: query.search,
  };

  const result = await supplierService.list(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Suppliers fetched successfully',
  });
};

// Get supplier detail
// GET /v1/suppliers/:id
export const getDetail = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const params = getParam<{ id: string }>(c);

  const request: GetSupplierRequest = {
    merchantId,
    supplierId: params.id,
  };

  const result = await supplierService.getDetail(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Supplier detail fetched successfully',
  });
};

// Create supplier
// POST /v1/suppliers
export const create = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const data = getBody<CreateSupplierRequest>(c);

  const result = await supplierService.create(merchantId, data);

  return successResponse({
    context: c,
    data: result,
    message: 'Supplier created successfully',
    statusCode: 201,
  });
};

// Update supplier
// PATCH /v1/suppliers/:id
export const update = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const params = getParam<{ id: string }>(c);
  const data = getBody<UpdateSupplierRequest>(c);

  const request: GetSupplierRequest = {
    merchantId,
    supplierId: params.id,
  };

  const result = await supplierService.update(request, data);

  return successResponse({
    context: c,
    data: result,
    message: 'Supplier updated successfully',
  });
};

// Archive supplier
// DELETE /v1/suppliers/:id
export const archive = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const params = getParam<{ id: string }>(c);

  const request: GetSupplierRequest = {
    merchantId,
    supplierId: params.id,
  };

  await supplierService.archive(request);

  return successResponse({
    context: c,
    data: null,
    message: 'Supplier archived successfully',
  });
};
