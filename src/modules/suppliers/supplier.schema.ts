import { z } from 'zod';

export const supplierParamsSchema = z.object({
  id: z.string().uuid('Supplier ID must be a valid UUID'),
});

export const supplierListQuerySchema = z.object({
  search: z.string().max(100).optional(),
});

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(100, 'Supplier name must be at most 100 characters'),
  phone: z.string().max(20, 'Phone must be at most 20 characters').nullable().optional(),
  address: z.string().max(2000, 'Address must be at most 2000 characters').nullable().optional(),
  notes: z.string().max(2000, 'Notes must be at most 2000 characters').nullable().optional(),
});

export const updateSupplierSchema = z
  .object({
    name: z.string().min(1, 'Supplier name is required').max(100, 'Supplier name must be at most 100 characters').optional(),
    phone: z.string().max(20, 'Phone must be at most 20 characters').nullable().optional(),
    address: z.string().max(2000, 'Address must be at most 2000 characters').nullable().optional(),
    notes: z.string().max(2000, 'Notes must be at most 2000 characters').nullable().optional(),
  })
  .refine((data) => data.name !== undefined || data.phone !== undefined || data.address !== undefined || data.notes !== undefined, {
    message: 'At least one field must be provided',
  });
