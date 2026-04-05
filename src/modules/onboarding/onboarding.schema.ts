import { z } from 'zod';

const merchantTypeSchema = z.enum(['restaurant', 'cafe', 'catering', 'other']);

const onboardingMerchantSchema = z.object({
  name: z.string().min(1, 'Merchant name is required').max(100, 'Merchant name must be at most 100 characters'),
  type: merchantTypeSchema,
  address: z.string().max(2000, 'Address must be at most 2000 characters').optional(),
  phone: z.string().max(20, 'Phone must be at most 20 characters').optional(),
});

const onboardingSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(100, 'Supplier name must be at most 100 characters'),
  phone: z.string().max(20, 'Phone must be at most 20 characters').optional(),
  address: z.string().max(2000, 'Address must be at most 2000 characters').optional(),
  notes: z.string().max(2000, 'Notes must be at most 2000 characters').optional(),
});

export const onboardingCompleteSchema = z.object({
  merchant: onboardingMerchantSchema,
  opening_balance: z.number().min(0, 'Opening balance must be at least 0'),
  suppliers: z.array(onboardingSupplierSchema).default([]),
});
