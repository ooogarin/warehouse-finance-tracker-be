import { successResponse } from '@/core/http/response';
import { getBody } from '@/shared/utils/hono.util';
import * as authService from './auth.service';
import type { Context } from 'hono';
import type { AppEnv } from '@/shared/types/context.types';
import type { ChangePasswordRequest, CreateUserRequest, GetUserRequest, LoginUserRequest, UpdateUserRequest } from './auth.type';

// Register new user
// POST /auth/register
export const register = async (c: Context<AppEnv>) => {
  const data = getBody<CreateUserRequest>(c);

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
  const data = getBody<LoginUserRequest>(c);

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

  const request: GetUserRequest = { userId };
  const result = await authService.getMe(request);

  return successResponse({
    context: c,
    data: result,
  });
};

// Update user profile
// PUT /v1/auth/profile
export const updateProfile = async (c: Context<AppEnv>) => {
  const userId = c.get('userId');
  const data = getBody<UpdateUserRequest>(c);

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
  const data = getBody<ChangePasswordRequest>(c);

  await authService.changePassword(userId, data);

  return successResponse({
    context: c,
    data: userId,
    message: 'Password changed successfully',
  });
};
