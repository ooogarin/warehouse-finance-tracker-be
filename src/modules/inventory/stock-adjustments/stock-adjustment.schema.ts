import { z } from 'zod';

export const stockAdjustmentParamsSchema = z.object({
  id: z.string().uuid('Stock adjustment ID must be a valid UUID'),
});

export const stockAdjustmentListQuerySchema = z
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

const stockAdjustmentItemBaseSchema = z.object({
  ingredient_id: z.string().uuid('Ingredient ID must be a valid UUID'),
  ingredient_unit_id: z.string().uuid('Ingredient unit ID must be a valid UUID'),
  quantity: z.number().gt(0, 'Quantity must be greater than 0'),
  notes: z.string().max(2000, 'Notes must be at most 2000 characters').optional(),
});

export const createStockAdjustmentSchema = z.object({
  adjustment_date: z.string().datetime('adjustment_date must be an ISO datetime'),
  notes: z.string().max(2000, 'Notes must be at most 2000 characters').optional(),
  items: z
    .array(
      z.discriminatedUnion('flow_type', [
        stockAdjustmentItemBaseSchema.extend({
          flow_type: z.literal('in'),
          unit_price: z.number().gt(0, 'Unit price must be greater than 0'),
        }),
        stockAdjustmentItemBaseSchema.extend({
          flow_type: z.literal('out'),
          unit_price: z.undefined().optional(),
        }),
      ]),
    )
    .min(1, 'At least one item is required'),
});

export const estimateStockAdjustmentOutSchema = z.object({
  ingredient_id: z.string().uuid('Ingredient ID must be a valid UUID'),
  ingredient_unit_id: z.string().uuid('Ingredient unit ID must be a valid UUID'),
  quantity: z.number().gt(0, 'Quantity must be greater than 0'),
});
