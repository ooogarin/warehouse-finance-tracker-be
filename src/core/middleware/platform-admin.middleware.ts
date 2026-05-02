import { createMiddleware } from 'hono/factory';
import { createLogger } from '@/core/config/logger.config';
import { forbiddenError } from '@/core/errors/app-error';
import * as platformAdminRepository from '@/modules/platform-admins/platform-admin.repository';
import { APP_ERROR_MESSAGES } from '@/shared/constants/messages.constant';
import type { AppEnv } from '@/shared/types/context.types';

const logger = createLogger({ module: 'platform-admin-middleware' });

// Require platform admin access for internal platform routes
export const requirePlatformAdmin = createMiddleware<AppEnv>(async (c, next) => {
  const userId = c.get('userId');
  const platformAdmin = await platformAdminRepository.getOneByUserId(userId);

  if (!platformAdmin) {
    logger.warn({ userId, path: c.req.path }, 'Platform admin access denied');
    throw forbiddenError(APP_ERROR_MESSAGES.FORBIDDEN);
  }

  c.set('platformAdmin', {
    user_id: platformAdmin.user_id,
  });

  await next();
});
