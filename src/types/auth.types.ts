import type { UserRole } from '@/constants/roles.constant';
import type { BaseEntity } from './common.types';

// User entity from database
export interface UserDbModel extends BaseEntity {
  email: string;
  password: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
}

// User without sensitive fields for API response
export type UserApiReadResponse = Omit<UserDbModel, 'password'>;

// User with their merchant memberships for API response
export interface UserApiReadResponseWithMerchants extends UserApiReadResponse {
  merchants: {
    id: string;
    name: string;
    role: UserRole;
  }[];
}

// Merchant entity from database
export interface MerchantDbModel extends BaseEntity {
  name: string;
  type: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  cash_balance: number;
  settings: Record<string, unknown> | null;
}

// User-Merchant junction entity from database
export interface UserMerchantDbModel extends BaseEntity {
  user_id: string;
  merchant_id: string;
  role: UserRole;
  joined_at: string;
}

// User-Merchant with joined data for internal use
export interface UserMerchantDbModelWithDetails extends UserMerchantDbModel {
  merchant: MerchantDbModel;
  user: UserApiReadResponse;
}

// API registration request body
export interface AuthApiRegisterRequestBody {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

// API login request body
export interface AuthApiLoginRequestBody {
  email: string;
  password: string;
}

// Token pair returned in API responses
export interface AuthApiTokenPairResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
}

// API login response
export interface AuthApiLoginResponse {
  user: UserApiReadResponse;
  tokens: AuthApiTokenPairResponse;
}

// API password change request body
export interface AuthApiPasswordChangeRequestBody {
  current_password: string;
  new_password: string;
}

// API password reset request body
export interface AuthApiPasswordResetRequestBody {
  email: string;
}

// API password reset confirmation request body
export interface AuthApiPasswordResetConfirmationRequestBody {
  token: string;
  new_password: string;
}

// API profile update request body
export interface UserApiUpdateRequestBody {
  name?: string;
  phone?: string;
  avatar_url?: string;
}

// Refresh token entity from database
export interface RefreshTokenDbModel extends BaseEntity {
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
  replaced_by_token: string | null;
  ip_address: string | null;
  user_agent: string | null;
}
