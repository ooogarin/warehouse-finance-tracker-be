import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import * as authController from './auth.controller';
import { loginSchema, registerSchema } from './auth.schema';
import type { AppEnv } from '@/shared/types/context.types';

const authRoutes = new Hono<AppEnv>();

// POST /auth/register - Register new user
authRoutes.post('/register', zValidator('json', registerSchema), authController.register);

// POST /auth/login - Login user
authRoutes.post('/login', zValidator('json', loginSchema), authController.login);

export { authRoutes };
