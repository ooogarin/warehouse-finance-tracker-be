import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import * as authController from '@/controllers/auth.controller';
import { authenticate } from '@/middleware/auth.middleware';
import type { AppEnv } from '@/types/context.types';
import { changePasswordSchema, updateProfileSchema } from '@/validators/auth.schemas';

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
