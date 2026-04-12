import { successResponse } from '@/core/http/response';
import { getBody, getParam, getQuery } from '@/shared/utils/hono.util';
import * as purchaseOrderService from './purchase-order.service';
import type { AppContext } from '@/shared/types/context.types';
import type {
  CreatePurchaseOrderRequest,
  GetPurchaseOrderParams,
  GetPurchaseOrderRequest,
  ListPurchaseOrdersQuery,
  ListPurchaseOrdersRequest,
} from './purchase-order.type';

// List purchase orders
// GET /v1/purchase-orders
export const list = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const query = getQuery<ListPurchaseOrdersQuery>(c);

  const request: ListPurchaseOrdersRequest = {
    merchantId,
    search: query.search,
    supplier_id: query.supplier_id,
    date_from: query.date_from,
    date_to: query.date_to,
  };

  const result = await purchaseOrderService.list(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Purchase orders fetched successfully',
  });
};

// Get purchase order detail
// GET /v1/purchase-orders/:id
export const getDetail = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const params = getParam<GetPurchaseOrderParams>(c);

  const request: GetPurchaseOrderRequest = {
    merchantId,
    purchaseOrderId: params.id,
  };

  const result = await purchaseOrderService.getDetail(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Purchase order detail fetched successfully',
  });
};

// Create purchase order
// POST /v1/purchase-orders
export const create = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const userId = c.get('userId');
  const data = getBody<CreatePurchaseOrderRequest>(c);

  const result = await purchaseOrderService.create(merchantId, userId, data);

  return successResponse({
    context: c,
    data: result,
    message: 'Purchase order created successfully',
    statusCode: 201,
  });
};
