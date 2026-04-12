import { z } from 'zod';

export const purchaseOrderParamsSchema = z.object({
  id: z.string().uuid('Purchase order ID must be a valid UUID'),
});

export const purchaseOrderListQuerySchema = z
  .object({
    search: z.string().max(100).optional(),
    supplier_id: z.string().uuid('Supplier ID must be a valid UUID').optional(),
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

export const createPurchaseOrderSchema = z.object({
  supplier_id: z.string().uuid('Supplier ID must be a valid UUID').optional(),
  purchase_date: z.string().datetime('purchase_date must be an ISO datetime'),
  invoice_number: z.string().max(50, 'Invoice number must be at most 50 characters').optional(),
  notes: z.string().max(2000, 'Notes must be at most 2000 characters').optional(),
  items: z
    .array(
      z.object({
        ingredient_id: z.string().uuid('Ingredient ID must be a valid UUID'),
        ingredient_unit_id: z.string().uuid('Ingredient unit ID must be a valid UUID'),
        quantity: z.number().gt(0, 'Quantity must be greater than 0'),
        unit_price: z.number().gt(0, 'Unit price must be greater than 0'),
        notes: z.string().max(2000, 'Item notes must be at most 2000 characters').optional(),
      }),
    )
    .min(1, 'At least one item is required'),
  payment: z.object({
    paid_cash: z.number().min(0, 'paid_cash must be at least 0'),
    paid_owner: z.number().min(0, 'paid_owner must be at least 0'),
    debt_amount: z.number().min(0, 'debt_amount must be at least 0'),
  }),
});
