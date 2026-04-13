import { z } from 'zod';

export const dashboardPeriodSchema = z.enum(['daily', 'weekly', 'monthly']);

export const dashboardQuerySchema = z.object({
  period: dashboardPeriodSchema.default('daily'),
});
