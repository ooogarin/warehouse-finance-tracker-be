import type { z } from 'zod';
import type { UserRole } from '@/shared/constants/roles.constant';
import type { changePasswordSchema, loginSchema, registerSchema, updateProfileSchema } from './auth.schema';

// Input types (inferred from Zod schemas)
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// JWT payload
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  type?: 'access';
  iat: number;
  exp: number;
}

// User database model - matches users table schema
export interface UserDbRow {
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

// Database insert payload for users
export type UserDbInsertPayload = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string | null;
};

// Database update payload for users
export type UserDbUpdatePayload = {
  name?: string;
  phone?: string | null;
};
