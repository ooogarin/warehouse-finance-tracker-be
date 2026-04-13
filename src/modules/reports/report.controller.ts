import { successResponse } from '@/core/http/response';
import { getQuery } from '@/shared/utils/hono.util';
import * as reportService from './report.service';
import type { AppContext } from '@/shared/types/context.types';
import type {
  GetFinancialReportRequest,
  GetStockReportRequest,
  GetSupplierReportRequest,
  ReportFinancialQuery,
  ReportStockQuery,
  ReportSupplierQuery,
} from './report.type';

// Get financial report
// GET /v1/reports/financial
export const getFinancialReport = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const query = getQuery<ReportFinancialQuery>(c);

  const request: GetFinancialReportRequest = {
    merchantId,
    ...query,
  };

  const result = await reportService.getFinancialReport(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Financial report fetched successfully',
  });
};

// Get stock report
// GET /v1/reports/stock
export const getStockReport = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const query = getQuery<ReportStockQuery>(c);

  const request: GetStockReportRequest = {
    merchantId,
    ...query,
  };

  const result = await reportService.getStockReport(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Stock report fetched successfully',
  });
};

// Get supplier performance report
// GET /v1/reports/suppliers
export const getSupplierReport = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const query = getQuery<ReportSupplierQuery>(c);

  const request: GetSupplierReportRequest = {
    merchantId,
    ...query,
  };

  const result = await reportService.getSupplierReport(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Supplier report fetched successfully',
  });
};
