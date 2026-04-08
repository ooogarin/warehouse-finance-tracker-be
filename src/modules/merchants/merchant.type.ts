import type { UserRole } from '@/shared/constants/roles.constant';

// ----------------------------------------------------------------------------------------------------
// Request contracts
// ----------------------------------------------------------------------------------------------------

export type ListAccessibleMerchantsRequest = {
  userId: string;
};

export type GetCurrentMerchantRequest = {
  userId: string;
  merchantId: string;
};

// ----------------------------------------------------------------------------------------------------
// Service operations
// ----------------------------------------------------------------------------------------------------

export type MerchantType = 'restaurant' | 'cafe' | 'catering' | 'other';

export type MerchantMap = {
  id: string;
  name: string;
  type: MerchantType;
  address: string | null;
  phone: string | null;
  cash_balance: string;
};

export type MerchantAccessMap = MerchantMap & {
  user_role: UserRole;
};

// ----------------------------------------------------------------------------------------------------
// Repository payloads
// ----------------------------------------------------------------------------------------------------

export type MerchantInsertPayload = {
  id: string;
  name: string;
  type: MerchantType;
  address?: string | null;
  phone?: string | null;
  cash_balance: string;
};

export type UserMerchantInsertPayload = {
  id: string;
  user_id: string;
  merchant_id: string;
};

// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

export interface MerchantAccessRow {
  id: string;
  name: string;
  type: MerchantType;
  address: string | null;
  phone: string | null;
  cash_balance: string;
  user_role: UserRole;
}

export interface UserMerchantRow {
  id: string;
  user_id: string;
  merchant_id: string;
}
