import { z } from 'zod';
import { merchantTypeSchema } from '@/modules/merchants/merchant.schema';

export const internalMerchantSubscriptionPlanSchema = z.enum(['basic', 'plus', 'pro']);
export const internalMerchantSubscriptionStatusSchema = z.enum(['trialing', 'active', 'past_due', 'expired', 'suspended']);

export const internalMerchantParamsSchema = z.object({
  id: z.string().uuid('Merchant ID must be a valid UUID'),
});

export const createInternalMerchantSchema = z.object({
  name: z.string().min(1, 'Merchant name is required').max(100, 'Merchant name must be at most 100 characters'),
  type: merchantTypeSchema.default('restaurant'),
  address: z.string().max(2000, 'Address must be at most 2000 characters').nullable().optional(),
  phone: z.string().max(20, 'Phone must be at most 20 characters').nullable().optional(),
  subscription_plan: internalMerchantSubscriptionPlanSchema.default('basic'),
  subscription_status: internalMerchantSubscriptionStatusSchema.default('trialing'),
  subscription_started_at: z.string().datetime('subscription_started_at must be an ISO datetime').nullable().optional(),
  subscription_expires_at: z.string().datetime('subscription_expires_at must be an ISO datetime').nullable().optional(),
  subscription_notes: z.string().max(2000, 'Subscription notes must be at most 2000 characters').nullable().optional(),
});

export const updateInternalMerchantSchema = z
  .object({
    name: z.string().min(1, 'Merchant name is required').max(100, 'Merchant name must be at most 100 characters').optional(),
    type: merchantTypeSchema.optional(),
    address: z.string().max(2000, 'Address must be at most 2000 characters').nullable().optional(),
    phone: z.string().max(20, 'Phone must be at most 20 characters').nullable().optional(),
  })
  .refine((data) => data.name !== undefined || data.type !== undefined || data.address !== undefined || data.phone !== undefined, {
    message: 'At least one field must be provided',
  });

export const updateInternalMerchantSubscriptionSchema = z
  .object({
    subscription_plan: internalMerchantSubscriptionPlanSchema.optional(),
    subscription_status: internalMerchantSubscriptionStatusSchema.optional(),
    subscription_started_at: z.string().datetime('subscription_started_at must be an ISO datetime').nullable().optional(),
    subscription_expires_at: z.string().datetime('subscription_expires_at must be an ISO datetime').nullable().optional(),
    subscription_notes: z.string().max(2000, 'Subscription notes must be at most 2000 characters').nullable().optional(),
  })
  .refine(
    (data) =>
      data.subscription_plan !== undefined ||
      data.subscription_status !== undefined ||
      data.subscription_started_at !== undefined ||
      data.subscription_expires_at !== undefined ||
      data.subscription_notes !== undefined,
    {
      message: 'At least one field must be provided',
    },
  );
