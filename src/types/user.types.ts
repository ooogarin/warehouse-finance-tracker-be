import type { UserRole } from '@/constants/roles.constant';

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
