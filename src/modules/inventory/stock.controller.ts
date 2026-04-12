import { successResponse } from '@/core/http/response';
import { getParam, getQuery } from '@/shared/utils/hono.util';
import * as stockService from './stock.service';
import type { AppContext } from '@/shared/types/context.types';
import type { GetStockRequest, ListStockLogsRequest, ListStockRequest, StockListQuery, StockLogListQuery, StockParams } from './stock.type';

// List stock
// GET /v1/stock
export const list = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const query = getQuery<StockListQuery>(c);

  const request: ListStockRequest = {
    merchantId,
    search: query.search,
    category: query.category,
    status: query.status,
  };

  const result = await stockService.list(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Stock fetched successfully',
  });
};

// Get stock detail
// GET /v1/stock/:ingredientId
export const getDetail = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const params = getParam<StockParams>(c);

  const request: GetStockRequest = {
    merchantId,
    ingredientId: params.ingredientId,
  };

  const result = await stockService.getDetail(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Stock detail fetched successfully',
  });
};

// List stock logs
// GET /v1/stock/:ingredientId/logs
export const listLogs = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const params = getParam<StockParams>(c);
  const query = getQuery<StockLogListQuery>(c);

  const request: ListStockLogsRequest = {
    merchantId,
    ingredientId: params.ingredientId,
    reference_type: query.reference_type,
  };

  const result = await stockService.listLogs(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Stock logs fetched successfully',
  });
};
