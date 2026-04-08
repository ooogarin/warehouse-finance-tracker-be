import type { z } from 'zod';
import type { onboardingCompleteSchema } from './onboarding.schema';

// ----------------------------------------------------------------------------------------------------
// Request contracts
// ----------------------------------------------------------------------------------------------------

export type GetOnboardingStatusRequest = {
  userId: string;
};

export type CompleteOnboardingRequest = z.infer<typeof onboardingCompleteSchema>;

// ----------------------------------------------------------------------------------------------------
// Service operations
// ----------------------------------------------------------------------------------------------------

export type OnboardingStatusMap = {
  has_merchant: boolean;
};

export type OnboardingCompleteMap = {
  merchant: {
    id: string;
    name: string;
    type: 'restaurant' | 'cafe' | 'catering' | 'other';
    address: string | null;
    phone: string | null;
    cash_balance: string;
  };
  opening_balance: string;
  supplier_created_count: number;
};
