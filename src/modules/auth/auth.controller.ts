import type { Context } from 'hono';
import { successResponse } from '@/core/http/response';
import { getBody } from '@/shared/utils/hono.util';
import type { AppEnv } from '@/shared/types/context.types';
import type { ChangePasswordInput, LoginInput, RegisterInput, UpdateProfileInput } from './auth.type';
import * as authService from './auth.service';

// Register new user
// POST /auth/register
export const register = async (c: Context<AppEnv>) => {
  const data = getBody<RegisterInput>(c);

  const result = await authService.register(data);

  return successResponse({
    context: c,
    data: result,
    message: 'Registration successful',
    statusCode: 201,
  });
};

// Login user
// POST /auth/login
export const login = async (c: Context<AppEnv>) => {
  const data = getBody<LoginInput>(c);

  const result = await authService.login(data);

  return successResponse({
    context: c,
    data: result,
    message: 'Login successful',
  });
};

// Get current user profile
// GET /v1/auth/me
export const getMe = async (c: Context<AppEnv>) => {
  const userId = c.get('userId');

  const result = await authService.getMe(userId);

  return successResponse({
    context: c,
    data: result,
  });
};

// Update user profile
// PUT /v1/auth/profile
export const updateProfile = async (c: Context<AppEnv>) => {
  const userId = c.get('userId');
  const data = getBody<UpdateProfileInput>(c);

  const result = await authService.updateProfile(userId, data);

  return successResponse({
    context: c,
    data: result,
    message: 'Profile updated successfully',
  });
};

// Change password
// PUT /v1/auth/password
export const changePassword = async (c: Context<AppEnv>) => {
  const userId = c.get('userId');
  const data = getBody<ChangePasswordInput>(c);

  await authService.changePassword(userId, data);

  return successResponse({
    context: c,
    data: userId,
    message: 'Password changed successfully',
  });
};
