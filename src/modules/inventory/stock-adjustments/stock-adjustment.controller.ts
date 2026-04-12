import { successResponse } from '@/core/http/response';
import { getBody, getParam, getQuery } from '@/shared/utils/hono.util';
import * as stockAdjustmentService from './stock-adjustment.service';
import type { AppContext } from '@/shared/types/context.types';
import type {
  CreateStockAdjustmentRequest,
  EstimateStockAdjustmentOutRequest,
  GetStockAdjustmentRequest,
  ListStockAdjustmentsRequest,
  StockAdjustmentListQuery,
  StockAdjustmentParams,
} from './stock-adjustment.type';

// List stock adjustments
// GET /v1/stock/adjustments
export const list = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const query = getQuery<StockAdjustmentListQuery>(c);

  const request: ListStockAdjustmentsRequest = {
    merchantId,
    date_from: query.date_from,
    date_to: query.date_to,
  };

  const result = await stockAdjustmentService.list(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Stock adjustments fetched successfully',
  });
};

// Get stock adjustment detail
// GET /v1/stock/adjustments/:id
export const getDetail = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const params = getParam<StockAdjustmentParams>(c);

  const request: GetStockAdjustmentRequest = {
    merchantId,
    stockAdjustmentId: params.id,
  };

  const result = await stockAdjustmentService.getDetail(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Stock adjustment detail fetched successfully',
  });
};

// Create stock adjustment
// POST /v1/stock/adjustments
export const create = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const userId = c.get('userId');
  const data = getBody<CreateStockAdjustmentRequest>(c);

  const result = await stockAdjustmentService.create({ merchantId, userId, data });

  return successResponse({
    context: c,
    data: result,
    message: 'Stock adjustment created successfully',
    statusCode: 201,
  });
};

// Estimate stock adjustment out value
// POST /v1/stock/adjustments/estimate-out
export const estimateOut = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const data = getBody<EstimateStockAdjustmentOutRequest>(c);

  const result = await stockAdjustmentService.estimateOut({ merchantId, ...data });

  return successResponse({
    context: c,
    data: result,
    message: 'Stock adjustment estimate calculated successfully',
  });
};
