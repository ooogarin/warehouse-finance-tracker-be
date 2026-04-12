import { z } from 'zod';

export const stockUsageParamsSchema = z.object({
  id: z.string().uuid('Stock usage ID must be a valid UUID'),
});

export const stockUsageListQuerySchema = z
  .object({
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

export const createStockUsageSchema = z.object({
  usage_date: z.string().datetime('usage_date must be an ISO datetime'),
  notes: z.string().max(2000, 'Notes must be at most 2000 characters').optional(),
  items: z
    .array(
      z.object({
        ingredient_id: z.string().uuid('Ingredient ID must be a valid UUID'),
        ingredient_unit_id: z.string().uuid('Ingredient unit ID must be a valid UUID'),
        quantity: z.number().gt(0, 'Quantity must be greater than 0'),
        notes: z.string().max(2000, 'Notes must be at most 2000 characters').optional(),
      }),
    )
    .min(1, 'At least one item is required'),
});

export const estimateStockUsageSchema = z.object({
  ingredient_id: z.string().uuid('Ingredient ID must be a valid UUID'),
  ingredient_unit_id: z.string().uuid('Ingredient unit ID must be a valid UUID'),
  quantity: z.number().gt(0, 'Quantity must be greater than 0'),
});
