import type { Context } from 'hono';
import type { UserRole } from '@/shared/constants/roles.constant';

// Authenticated user information stored in context
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Merchant context information
export interface MerchantContext {
  id: string;
  name: string;
  user_role: UserRole;
}

/**
 * Hono context variables
 * These are set by middleware and accessed via c.get()
 */
export interface AppVariables {
  // Auth
  userId: string;
  user: AuthUser;
  token: string;

  // Merchant
  merchantId: string;
  merchant: MerchantContext;

  // Request metadata
  requestId: string;
  startTime: number;
}

// App environment type
// Default In/Out allows zValidator to extend with validation types
export type AppEnv = {
  Variables: AppVariables;
  // biome-ignore lint/complexity/noBannedTypes: Required by Hono's Input type
  in: {};
  // biome-ignore lint/complexity/noBannedTypes: Required by Hono's Input type
  out: {};
};

// Extended Hono context type for the application
export type AppContext = Context<AppEnv>;
