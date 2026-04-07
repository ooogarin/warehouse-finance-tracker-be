import type { z } from 'zod';
import type { UserRole } from '@/shared/constants/roles.constant';
import type { changePasswordSchema, loginSchema, registerSchema, updateProfileSchema } from './auth.schema';

// Request types (from body/query/param)
export type CreateUserRequest = z.infer<typeof registerSchema>;
export type LoginUserRequest = z.infer<typeof loginSchema>;
export type UpdateUserRequest = z.infer<typeof updateProfileSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type GetUserRequest = {
  userId: string;
};

// JWT payload
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  type?: 'access';
  iat: number;
  exp: number;
}

// ----------------------------------------------------------------------------------------------------
// Database payloads and responses
// ----------------------------------------------------------------------------------------------------

// Repository response / DB row
export interface UserRow {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Repository payloads
export type UserInsertPayload = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string | null;
};

export type UserUpdatePayload = {
  name?: string;
  phone?: string | null;
};

// ----------------------------------------------------------------------------------------------------
// Service operations
// ----------------------------------------------------------------------------------------------------

// Service operation map
export type UserMap = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
};
