import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { authenticate } from '@/core/middleware/auth.middleware';
import * as authController from './auth.controller';
import { changePasswordSchema, updateProfileSchema } from './auth.schema';
import type { AppEnv } from '@/shared/types/context.types';

const authRoutesV1 = new Hono<AppEnv>();

// Apply authentication middleware to all routes
authRoutesV1.use('*', authenticate);

// GET /v1/auth/me - Get current user profile
authRoutesV1.get('/me', authController.getMe);

// PUT /v1/auth/profile - Update user profile
authRoutesV1.put('/profile', zValidator('json', updateProfileSchema), authController.updateProfile);

// PUT /v1/auth/password - Change password
authRoutesV1.put('/password', zValidator('json', changePasswordSchema), authController.changePassword);

export { authRoutesV1 };
