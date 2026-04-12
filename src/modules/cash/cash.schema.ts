import { z } from 'zod';

const cashFlowTypeSchema = z.enum(['in', 'out']);
const cashInCategorySchema = z.enum(['sales_revenue', 'capital_injection', 'debt_repayment_in', 'other_in']);
const cashOutCategorySchema = z.enum(['owner_withdrawal', 'salary', 'utilities', 'rent', 'maintenance', 'other_out']);
const cashCategorySchema = z.enum([
  'sales_revenue',
  'capital_injection',
  'debt_repayment_in',
  'other_in',
  'purchase_payment',
  'debt_payment_out',
  'owner_withdrawal',
  'salary',
  'utilities',
  'rent',
  'maintenance',
  'other_out',
]);

export const cashParamsSchema = z.object({
  id: z.string().uuid('Cash transaction ID must be a valid UUID'),
});

export const cashListQuerySchema = z
  .object({
    search: z.string().max(100).optional(),
    flow_type: cashFlowTypeSchema.optional(),
    category: cashCategorySchema.optional(),
    date_from: z.string().date('date_from must use YYYY-MM-DD format').optional(),
    date_to: z.string().date('date_to must use YYYY-MM-DD format').optional(),
  })
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

export const createCashInSchema = z.object({
  category: cashInCategorySchema,
  amount: z.number().gt(0, 'Amount must be greater than 0'),
  cash_log_date: z.string().datetime('cash_log_date must be an ISO datetime'),
  description: z.string().max(255, 'Description must be at most 255 characters').optional(),
});

export const createCashOutSchema = z.object({
  category: cashOutCategorySchema,
  amount: z.number().gt(0, 'Amount must be greater than 0'),
  cash_log_date: z.string().datetime('cash_log_date must be an ISO datetime'),
  description: z.string().max(255, 'Description must be at most 255 characters').optional(),
});
