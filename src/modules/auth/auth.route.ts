import { Hono } from 'hono';
import { appValidator } from '@/core/http/validator';
import * as authController from './auth.controller';
import { loginSchema, registerSchema } from './auth.schema';
import type { AppEnv } from '@/shared/types/context.types';

const authRoutes = new Hono<AppEnv>();

// POST /auth/register - Register new user
authRoutes.post('/register', appValidator('json', registerSchema), authController.register);

// POST /auth/login - Login user
authRoutes.post('/login', appValidator('json', loginSchema), authController.login);

export { authRoutes };
