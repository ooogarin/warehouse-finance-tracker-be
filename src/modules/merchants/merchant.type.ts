import type { UserRole } from '@/shared/constants/roles.constant';

// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

// Repository response / DB row
export interface MerchantAccessRow {
  id: string;
  name: string;
  type: 'restaurant' | 'cafe' | 'catering' | 'other';
  address: string | null;
  phone: string | null;
  cash_balance: string;
  user_role: UserRole;
}

// Repository response / DB row
export interface UserMerchantRow {
  id: string;
  user_id: string;
  merchant_id: string;
}

// Repository payload
export type MerchantInsertPayload = {
  id: string;
  name: string;
  type: MerchantAccessRow['type'];
  address?: string | null;
  phone?: string | null;
  cash_balance: string;
};

// Repository payload
export type UserMerchantInsertPayload = {
  id: string;
  user_id: string;
  merchant_id: string;
};

// ----------------------------------------------------------------------------------------------------
// Service requests
// ----------------------------------------------------------------------------------------------------

// Request types (from service input)
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

// Service operation map
export type MerchantMap = {
  id: string;
  name: string;
  type: MerchantAccessRow['type'];
  address: string | null;
  phone: string | null;
  cash_balance: string;
};

// Service operation map
export type MerchantAccessMap = MerchantMap & {
  user_role: UserRole;
};
