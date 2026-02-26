import { createMiddleware } from 'hono/factory';
import { createLogger } from '@/config/logger.config';
import { ERROR_MESSAGES } from '@/constants/messages.constant';
import type { UserRole } from '@/constants/roles.constant';
import { hasMinimumRole } from '@/constants/roles.constant';
import type { AppEnv } from '@/types/context.types';
import { forbiddenError } from '@/utils/errors.util';

const logger = createLogger({ module: 'role-middleware' });

/**
 * Create a role-based access control middleware
 *
 * Usage:
 * ```typescript
 * // Require owner role
 * app.use("/api/v1/merchants/*", authMiddleware, merchantMiddleware, requireRole("owner"));
 *
 * // Require staff or higher
 * app.use("/api/v1/ingredients/*", authMiddleware, merchantMiddleware, requireRole("staff"));
 * ```
 */
export const requireRole = (minimumRole: UserRole) => {
  return createMiddleware<AppEnv>(async (c, next) => {
    const merchant = c.get('merchant');

    if (!merchant) {
      logger.warn({ path: c.req.path }, 'Merchant context not found for role check');
      throw forbiddenError(ERROR_MESSAGES.FORBIDDEN);
    }

    const user_role = merchant.user_role;

    if (!hasMinimumRole(user_role, minimumRole)) {
      logger.warn({ user_role, requiredRole: minimumRole, path: c.req.path }, 'Insufficient permissions');
      throw forbiddenError(ERROR_MESSAGES.FORBIDDEN);
    }

    logger.debug({ user_role, requiredRole: minimumRole, path: c.req.path }, 'Role check passed');

    await next();
  });
};

/**
 * Require owner role
 * Shorthand for requireRole("owner")
 */
export const requireOwner = requireRole('owner');

/**
 * Require staff role (staff or owner)
 * Shorthand for requireRole("staff")
 */
export const requireStaff = requireRole('staff');

/**
 * Require cashier role (any authenticated user)
 * Shorthand for requireRole("cashier")
 */
export const requireCashier = requireRole('cashier');
