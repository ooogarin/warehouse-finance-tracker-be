import { z } from 'zod';

const creditorTypeSchema = z.enum(['supplier', 'owner', 'other']);
const debtStatusSchema = z.enum(['unpaid', 'partial', 'paid', 'overdue']);
const debtPaymentMethodSchema = z.enum(['cash', 'transfer', 'other']);

export const debtParamsSchema = z.object({
  id: z.string().uuid('Debt ID must be a valid UUID'),
});

export const debtListQuerySchema = z.object({
  creditor_type: creditorTypeSchema.optional(),
  supplier_id: z.string().uuid('Supplier ID must be a valid UUID').optional(),
  status: debtStatusSchema.optional(),
});

export const createDebtSchema = z
  .object({
    creditor_type: creditorTypeSchema,
    supplier_id: z.string().uuid('Supplier ID must be a valid UUID').nullable().optional(),
    creditor_name: z
      .string()
      .trim()
      .min(1, 'Creditor name is required')
      .max(100, 'Creditor name must be at most 100 characters')
      .nullable()
      .optional(),
    total_amount: z.number().gt(0, 'Total amount must be greater than 0'),
    debt_date: z.string().date('debt_date must use YYYY-MM-DD format'),
    due_date: z.string().date('due_date must use YYYY-MM-DD format').optional(),
    description: z.string().max(2000, 'Description must be at most 2000 characters').optional(),
  })
  .refine((data) => data.creditor_type !== 'supplier' || (data.supplier_id !== undefined && data.supplier_id !== null), {
    message: 'supplier_id is required when creditor_type is supplier',
    path: ['supplier_id'],
  })
  .refine((data) => data.creditor_type === 'supplier' || data.supplier_id === undefined || data.supplier_id === null, {
    message: 'supplier_id must be empty when creditor_type is not supplier',
    path: ['supplier_id'],
  })
  .refine((data) => data.creditor_type === 'supplier' || (data.creditor_name !== undefined && data.creditor_name !== null), {
    message: 'creditor_name is required when creditor_type is not supplier',
    path: ['creditor_name'],
  })
  .refine(
    (data) => {
      if (!data.due_date) {
        return true;
      }
      return new Date(data.due_date).getTime() >= new Date(data.debt_date).getTime();
    },
    {
      message: 'due_date must be greater than or equal to debt_date',
      path: ['due_date'],
    },
  );

export const createDebtPaymentSchema = z.object({
  amount: z.number().gt(0, 'Amount must be greater than 0'),
  payment_method: debtPaymentMethodSchema,
  reference_number: z.string().max(50, 'Reference number must be at most 50 characters').optional(),
  notes: z.string().max(2000, 'Notes must be at most 2000 characters').optional(),
});
