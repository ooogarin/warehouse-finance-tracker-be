import { z } from 'zod';

export const reportPeriodSchema = z.enum(['daily', 'weekly', 'monthly', 'custom']);
export const reportStockReferenceTypeSchema = z.enum(['purchase', 'usage', 'waste', 'adjustment']);

const reportBaseQuerySchema = z
  .object({
    period: reportPeriodSchema.default('monthly'),
    date: z.string().date('date must use YYYY-MM-DD format').optional(),
    date_from: z.string().date('date_from must use YYYY-MM-DD format').optional(),
    date_to: z.string().date('date_to must use YYYY-MM-DD format').optional(),
    page: z.coerce.number().int().min(1, 'page must be at least 1').default(1),
    limit: z.coerce.number().int().min(1, 'limit must be at least 1').max(100, 'limit must be at most 100').default(20),
  })
  .refine(
    (data) => {
      if (data.period !== 'custom') {
        return true;
      }
      return Boolean(data.date_from && data.date_to);
    },
    {
      message: 'date_from and date_to are required when period is custom',
      path: ['date_from'],
    },
  )
  .refine(
    (data) => {
      if (!data.date_from || !data.date_to) {
        return true;
      }
      return new Date(data.date_from).getTime() <= new Date(data.date_to).getTime();
    },
    {
      message: 'date_from must be less than or equal to date_to',
      path: ['date_from'],
    },
  );

export const reportFinancialQuerySchema = reportBaseQuerySchema;

export const reportStockQuerySchema = reportBaseQuerySchema.extend({
  reference_type: reportStockReferenceTypeSchema.optional(),
  ingredient_id: z.string().uuid('ingredient_id must be a valid UUID').optional(),
});

export const reportSupplierQuerySchema = reportBaseQuerySchema.extend({
  supplier_id: z.string().uuid('supplier_id must be a valid UUID').optional(),
});
