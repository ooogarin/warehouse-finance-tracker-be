import { z } from 'zod';

export const merchantTypeSchema = z.enum(['restaurant', 'cafe', 'catering', 'other']);

export const updateCurrentMerchantSchema = z
  .object({
    name: z.string().min(1, 'Merchant name is required').max(100, 'Merchant name must be at most 100 characters').optional(),
    type: merchantTypeSchema.optional(),
    address: z.string().max(2000, 'Address must be at most 2000 characters').nullable().optional(),
    phone: z.string().max(20, 'Phone must be at most 20 characters').nullable().optional(),
  })
  .refine((data) => data.name !== undefined || data.type !== undefined || data.address !== undefined || data.phone !== undefined, {
    message: 'At least one field must be provided',
  });
