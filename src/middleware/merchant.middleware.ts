import { createMiddleware } from 'hono/factory';
import { sql } from '@/config/database.config';
import { createLogger } from '@/config/logger.config';
import { ERROR_MESSAGES } from '@/constants/messages.constant';
import type { MerchantDbModel, UserMerchantDbModel } from '@/types/auth.types';
import type { AppEnv } from '@/types/context.types';
import { forbiddenError, notFoundError } from '@/utils/errors.util';

const logger = createLogger({ module: 'merchant-middleware' });

/**
 * Merchant context middleware
 * Loads merchant from X-Merchant-ID header and validates user membership
 *
 * Required headers:
 * - X-Merchant-ID: Merchant UUID
 * - Authorization: Bearer <JWT>
 *
 * Usage:
 * ```typescript
 * app.use("/api/v1/*", authMiddleware, merchantMiddleware);
 * ```
 */
export const merchantMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const userId = c.get('userId');
  const merchantId = c.req.header('X-Merchant-ID');

  if (!merchantId) {
    logger.warn({ userId, path: c.req.path }, 'Missing X-Merchant-ID header');
    throw forbiddenError('X-Merchant-ID header is required');
  }

  try {
    // Check if merchant exists and user is a member
    const userMerchant = await sql<(UserMerchantDbModel & MerchantDbModel)[]>`
      SELECT 
        um.id as um_id,
        um.user_id,
        um.merchant_id,
        um.role,
        um.joined_at,
        m.id,
        m.name,
        m.type,
        m.address,
        m.phone,
        m.email,
        m.logo_url,
        m.settings,
        m.created_at,
        m.updated_at,
        m.deleted_at
      FROM user_merchants um
      JOIN merchants m ON um.merchant_id = m.id
      WHERE um.user_id = ${userId}
        AND um.merchant_id = ${merchantId}
        AND m.deleted_at IS NULL
      LIMIT 1
    `;

    if (userMerchant.length === 0) {
      logger.warn({ userId, merchantId }, 'User is not a member of merchant');
      throw forbiddenError(ERROR_MESSAGES.NOT_MERCHANT_MEMBER);
    }

    const record = userMerchant[0];

    // Set merchant context
    c.set('merchantId', record.merchant_id);
    c.set('merchant', {
      id: record.merchant_id,
      name: record.name,
      user_role: record.role,
    });

    logger.debug({ userId, merchantId, role: record.role }, 'Merchant context loaded');

    await next();
  } catch (error) {
    // Re-throw AppErrors
    if (error instanceof Error && 'code' in error) {
      throw error;
    }

    logger.error({ error, userId, merchantId }, 'Error loading merchant context');
    throw notFoundError(ERROR_MESSAGES.MERCHANT_NOT_FOUND);
  }
});

// Optional merchant middleware
// Sets merchant context if provided and valid, but doesn't require it
export const optionalMerchantMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const userId = c.get('userId');
  const merchantId = c.req.header('X-Merchant-ID');

  if (!merchantId || !userId) {
    // No merchant context, proceed anyway
    await next();
    return;
  }

  try {
    const userMerchant = await sql<(UserMerchantDbModel & MerchantDbModel)[]>`
      SELECT 
        um.merchant_id,
        um.role,
        m.name
      FROM user_merchants um
      JOIN merchants m ON um.merchant_id = m.id
      WHERE um.user_id = ${userId}
        AND um.merchant_id = ${merchantId}
        AND m.deleted_at IS NULL
      LIMIT 1
    `;

    if (userMerchant.length > 0) {
      const record = userMerchant[0];
      c.set('merchantId', record.merchant_id);
      c.set('merchant', {
        id: record.merchant_id,
        name: record.name,
        user_role: record.role,
      });
    }
  } catch (error) {
    // Silently ignore errors for optional middleware
    logger.debug({ error }, 'Optional merchant context failed');
  }

  await next();
});
