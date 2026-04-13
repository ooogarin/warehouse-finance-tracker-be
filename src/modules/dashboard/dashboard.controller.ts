import { successResponse } from '@/core/http/response';
import { getQuery } from '@/shared/utils/hono.util';
import * as dashboardService from './dashboard.service';
import type { AppContext } from '@/shared/types/context.types';
import type { DashboardQuery, GetDashboardRequest } from './dashboard.type';

// Get dashboard aggregate data
// GET /v1/dashboard
export const getDashboard = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const query = getQuery<DashboardQuery>(c);

  const request: GetDashboardRequest = {
    merchantId,
    period: query.period,
  };

  const result = await dashboardService.getDashboard(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Dashboard data fetched successfully',
  });
};
