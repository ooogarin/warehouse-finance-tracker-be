import type { z } from 'zod';
import type {
  createInternalMerchantSchema,
  internalMerchantParamsSchema,
  internalMerchantSubscriptionPlanSchema,
  internalMerchantSubscriptionStatusSchema,
  updateInternalMerchantSchema,
  updateInternalMerchantSubscriptionSchema,
} from './internal-merchant.schema';

export type InternalMerchantSubscriptionPlan = z.infer<typeof internalMerchantSubscriptionPlanSchema>;
export type InternalMerchantSubscriptionStatus = z.infer<typeof internalMerchantSubscriptionStatusSchema>;

// ----------------------------------------------------------------------------------------------------
// Request contracts
// ----------------------------------------------------------------------------------------------------

export type InternalMerchantParams = z.infer<typeof internalMerchantParamsSchema>;
export type CreateInternalMerchantRequest = z.infer<typeof createInternalMerchantSchema>;
export type UpdateInternalMerchantRequest = z.infer<typeof updateInternalMerchantSchema>;
export type UpdateInternalMerchantSubscriptionRequest = z.infer<typeof updateInternalMerchantSubscriptionSchema>;

export type GetInternalMerchantRequest = {
  merchantId: string;
};

export type UpdateInternalMerchantServiceRequest = {
  merchantId: string;
  data: UpdateInternalMerchantRequest;
};

export type UpdateInternalMerchantSubscriptionServiceRequest = {
  merchantId: string;
  data: UpdateInternalMerchantSubscriptionRequest;
};

// ----------------------------------------------------------------------------------------------------
// Service operations
// ----------------------------------------------------------------------------------------------------

export type InternalMerchantType = 'restaurant' | 'cafe' | 'catering' | 'other';

export type InternalMerchantMap = {
  id: string;
  name: string;
  type: InternalMerchantType;
  address: string | null;
  phone: string | null;
  cash_balance: string;
  subscription_plan: InternalMerchantSubscriptionPlan;
  subscription_status: InternalMerchantSubscriptionStatus;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  subscription_notes: string | null;
  created_at: string;
  updated_at: string;
};

// ----------------------------------------------------------------------------------------------------
// Repository payloads
// ----------------------------------------------------------------------------------------------------

export type InternalMerchantInsertPayload = {
  id: string;
  name: string;
  type: InternalMerchantType;
  address?: string | null;
  phone?: string | null;
  cash_balance: string;
  subscription_plan: InternalMerchantSubscriptionPlan;
  subscription_status: InternalMerchantSubscriptionStatus;
  subscription_started_at?: string | null;
  subscription_expires_at?: string | null;
  subscription_notes?: string | null;
};

export type InternalMerchantUpdatePayload = {
  name?: string;
  type?: InternalMerchantType;
  address?: string | null;
  phone?: string | null;
};

export type InternalMerchantSubscriptionUpdatePayload = {
  subscription_plan?: InternalMerchantSubscriptionPlan;
  subscription_status?: InternalMerchantSubscriptionStatus;
  subscription_started_at?: string | null;
  subscription_expires_at?: string | null;
  subscription_notes?: string | null;
};

// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

export interface InternalMerchantRow {
  id: string;
  name: string;
  type: InternalMerchantType;
  address: string | null;
  phone: string | null;
  cash_balance: string;
  subscription_plan: InternalMerchantSubscriptionPlan;
  subscription_status: InternalMerchantSubscriptionStatus;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  subscription_notes: string | null;
  created_at: string;
  updated_at: string;
}
