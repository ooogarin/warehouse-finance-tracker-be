import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import * as authController from '@/controllers/auth.controller';
import type { AppEnv } from '@/types/context.types';
import { loginSchema, registerSchema } from '@/validators/auth.schemas';

const authRoutes = new Hono<AppEnv>();

// POST /auth/register - Register new user
authRoutes.post('/register', zValidator('json', registerSchema), authController.register);

// POST /auth/login - Login user
authRoutes.post('/login', zValidator('json', loginSchema), authController.login);

export { authRoutes };
