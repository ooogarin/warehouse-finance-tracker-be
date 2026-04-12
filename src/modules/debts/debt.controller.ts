import { successResponse } from '@/core/http/response';
import { getBody, getParam, getQuery } from '@/shared/utils/hono.util';
import * as debtService from './debt.service';
import type { AppContext } from '@/shared/types/context.types';
import type { CreateDebtPaymentRequest, CreateDebtRequest, DebtListQuery, DebtParams, GetDebtRequest, ListDebtsRequest } from './debt.type';

// List debts
// GET /v1/debts
export const list = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const query = getQuery<DebtListQuery>(c);

  const request: ListDebtsRequest = {
    merchantId,
    creditor_type: query.creditor_type,
    supplier_id: query.supplier_id,
    status: query.status,
  };

  const result = await debtService.list(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Debts fetched successfully',
  });
};

// Get debt detail
// GET /v1/debts/:id
export const getDetail = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const params = getParam<DebtParams>(c);

  const request: GetDebtRequest = {
    merchantId,
    debtId: params.id,
  };

  const result = await debtService.getDetail(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Debt detail fetched successfully',
  });
};

// Create manual debt
// POST /v1/debts
export const create = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const data = getBody<CreateDebtRequest>(c);

  const result = await debtService.createManual(merchantId, data);

  return successResponse({
    context: c,
    data: result,
    message: 'Debt created successfully',
    statusCode: 201,
  });
};

// Create debt payment
// POST /v1/debts/:id/payments
export const pay = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const userId = c.get('userId');
  const params = getParam<DebtParams>(c);
  const data = getBody<CreateDebtPaymentRequest>(c);

  const request: GetDebtRequest = {
    merchantId,
    debtId: params.id,
  };

  const result = await debtService.pay(request, userId, data);

  return successResponse({
    context: c,
    data: result,
    message: 'Debt payment created successfully',
    statusCode: 201,
  });
};
