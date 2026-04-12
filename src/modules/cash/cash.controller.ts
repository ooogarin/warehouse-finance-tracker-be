import { successResponse } from '@/core/http/response';
import { getBody, getParam, getQuery } from '@/shared/utils/hono.util';
import * as cashService from './cash.service';
import type { AppContext } from '@/shared/types/context.types';
import type {
  CashListQuery,
  CashParams,
  CreateCashInRequest,
  CreateCashOutRequest,
  GetCashLogRequest,
  ListCashLogsRequest,
} from './cash-log.type';

// List cash transactions
// GET /v1/cash
export const list = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const query = getQuery<CashListQuery>(c);

  const request: ListCashLogsRequest = {
    merchantId,
    search: query.search,
    flow_type: query.flow_type,
    category: query.category,
    date_from: query.date_from,
    date_to: query.date_to,
  };

  const result = await cashService.list(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Cash transactions fetched successfully',
  });
};

// Get cash transaction detail
// GET /v1/cash/:id
export const getDetail = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const params = getParam<CashParams>(c);

  const request: GetCashLogRequest = {
    merchantId,
    cashLogId: params.id,
  };

  const result = await cashService.getDetail(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Cash transaction detail fetched successfully',
  });
};

// Create cash in transaction
// POST /v1/cash/in
export const createCashIn = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const userId = c.get('userId');
  const data = getBody<CreateCashInRequest>(c);

  const result = await cashService.createCashIn(merchantId, userId, data);

  return successResponse({
    context: c,
    data: result,
    message: 'Cash in transaction created successfully',
    statusCode: 201,
  });
};

// Create cash out transaction
// POST /v1/cash/out
export const createCashOut = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const userId = c.get('userId');
  const data = getBody<CreateCashOutRequest>(c);

  const result = await cashService.createCashOut(merchantId, userId, data);

  return successResponse({
    context: c,
    data: result,
    message: 'Cash out transaction created successfully',
    statusCode: 201,
  });
};
