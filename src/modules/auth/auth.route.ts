import { Hono } from 'hono';
import { appValidator } from '@/core/http/validator';
import * as authController from './auth.controller';
import { loginSchema } from './auth.schema';
import type { AppEnv } from '@/shared/types/context.types';

const authRoutes = new Hono<AppEnv>();

// POST /auth/login - Login user
authRoutes.post('/login', appValidator('json', loginSchema), authController.login);

export { authRoutes };
