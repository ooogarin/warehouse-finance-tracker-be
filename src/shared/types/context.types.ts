import type { Context, MiddlewareHandler as HonoMiddlewareHandler } from 'hono';
import type { UserRole } from '@/shared/constants/roles.constant';
import type { UUID } from './common.types';

// Authenticated user information stored in context
export interface AuthUser {
  id: UUID;
  email: string;
  name: string;
  role: UserRole;
}

// Merchant context information
export interface MerchantContext {
  id: UUID;
  name: string;
  user_role: UserRole;
}

// Refresh token payload
export interface RefreshTokenPayload {
  userId: UUID;
  jti: UUID; // token id for revocation
  iat: number;
  exp: number;
}

/**
 * Hono context variables
 * These are set by middleware and accessed via c.get()
 */
export interface AppVariables {
  // Auth
  userId: UUID;
  user: AuthUser;
  token: string;

  // Merchant
  merchantId: UUID;
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

/**
 * Context getter types
 * Type-safe access to context variables
 */
export type GetContextVariable<K extends keyof AppVariables> = AppVariables[K];

// Middleware handler type
export type MiddlewareHandler = HonoMiddlewareHandler<AppEnv>;
