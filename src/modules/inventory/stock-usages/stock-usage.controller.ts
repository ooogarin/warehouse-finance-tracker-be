import { successResponse } from '@/core/http/response';
import { getBody, getParam, getQuery } from '@/shared/utils/hono.util';
import * as stockUsageService from './stock-usage.service';
import type { AppContext } from '@/shared/types/context.types';
import type {
  CreateStockUsageRequest,
  EstimateStockUsageRequest,
  GetStockUsageRequest,
  ListStockUsagesRequest,
  StockUsageListQuery,
  StockUsageParams,
} from './stock-usage.type';

// List stock usages
// GET /v1/stock/usages
export const list = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const query = getQuery<StockUsageListQuery>(c);

  const request: ListStockUsagesRequest = {
    merchantId,
    date_from: query.date_from,
    date_to: query.date_to,
  };

  const result = await stockUsageService.list(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Stock usages fetched successfully',
  });
};

// List stock wastes
// GET /v1/stock/wastes
export const listWastes = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const query = getQuery<StockUsageListQuery>(c);

  const request: ListStockUsagesRequest = {
    merchantId,
    date_from: query.date_from,
    date_to: query.date_to,
  };

  const result = await stockUsageService.listWastes(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Stock wastes fetched successfully',
  });
};

// Get stock usage detail
// GET /v1/stock/usages/:id
export const getDetail = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const params = getParam<StockUsageParams>(c);

  const request: GetStockUsageRequest = {
    merchantId,
    stockUsageId: params.id,
  };

  const result = await stockUsageService.getDetail(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Stock usage detail fetched successfully',
  });
};

// Get stock waste detail
// GET /v1/stock/wastes/:id
export const getWasteDetail = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const params = getParam<StockUsageParams>(c);

  const request: GetStockUsageRequest = {
    merchantId,
    stockUsageId: params.id,
  };

  const result = await stockUsageService.getWasteDetail(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Stock waste detail fetched successfully',
  });
};

// Create stock usage
// POST /v1/stock/usages
export const create = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const userId = c.get('userId');
  const data = getBody<CreateStockUsageRequest>(c);

  const result = await stockUsageService.create({ merchantId, userId, data });

  return successResponse({
    context: c,
    data: result,
    message: 'Stock usage created successfully',
    statusCode: 201,
  });
};

// Create stock waste
// POST /v1/stock/wastes
export const createWaste = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const userId = c.get('userId');
  const data = getBody<CreateStockUsageRequest>(c);

  const result = await stockUsageService.createWaste({ merchantId, userId, data });

  return successResponse({
    context: c,
    data: result,
    message: 'Stock waste created successfully',
    statusCode: 201,
  });
};

// Estimate stock usage COGS
// POST /v1/stock/usages/estimate
export const estimate = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const data = getBody<EstimateStockUsageRequest>(c);

  const result = await stockUsageService.estimate({ merchantId, ...data });

  return successResponse({
    context: c,
    data: result,
    message: 'Stock usage estimate calculated successfully',
  });
};

// Estimate stock waste value
// POST /v1/stock/wastes/estimate
export const estimateWaste = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const data = getBody<EstimateStockUsageRequest>(c);

  const result = await stockUsageService.estimateWaste({ merchantId, ...data });

  return successResponse({
    context: c,
    data: result,
    message: 'Stock waste estimate calculated successfully',
  });
};
