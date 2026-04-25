import { logger } from '@/core/config/logger.config';
import { commitTransaction, rollbackTransaction, startTransaction } from '@/core/db/client';
import { internalError, isAppError, notFoundError, unauthorizedError } from '@/core/errors/app-error';
import { APP_ERROR_MESSAGES } from '@/shared/constants/messages.constant';
import { verifyPassword } from '@/shared/utils/crypto.util';
import { generateToken } from '@/shared/utils/jwt.util';
import * as authRepository from './auth.repository';
import type { ReservedSQL } from '@/core/db/client';
import type { ChangePasswordRequest, GetUserRequest, LoginUserRequest, UpdateUserRequest, UserMap, UserRow } from './auth.type';

// Login user
export const login = async (data: LoginUserRequest) => {
  try {
    const user = await authRepository.getOneByEmail(data.email);
    if (!user) {
      throw unauthorizedError(APP_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const isValid = await verifyPassword(data.password, user.password);
    if (!isValid) {
      throw unauthorizedError(APP_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const accessToken = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info({ userId: user.id }, 'User logged in successfully');

    return {
      access_token: accessToken,
      user: toUserMap(user),
    };
  } catch (error) {
    logger.error({ error, email: data.email }, 'Failed to login user');
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to login user');
  }
};

// Get current user
export const getMe = async ({ userId }: GetUserRequest): Promise<UserMap> => {
  try {
    const user = await authRepository.getOneById(userId);
    if (!user) {
      throw notFoundError(APP_ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return toUserMap(user);
  } catch (error) {
    logger.error({ error, userId }, 'Failed to fetch current user');
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to get current user');
  }
};

// Update profile
export const updateProfile = async (userId: string, data: UpdateUserRequest): Promise<UserMap> => {
  let connection: ReservedSQL | null = null;

  try {
    // Start transaction
    connection = await startTransaction();

    // Update user
    const user = await authRepository.updateById(connection, userId, {
      name: data.name,
      phone: data.phone,
    });
    if (!user) {
      throw notFoundError(APP_ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Commit transaction
    await commitTransaction(connection);

    logger.info({ userId }, 'Profile updated successfully');

    return toUserMap(user);
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }

    logger.error({ error, userId }, 'Failed to update profile');
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to update profile');
  }
};

// Change password
export const changePassword = async (userId: string, data: ChangePasswordRequest): Promise<void> => {
  let connection: ReservedSQL | null = null;

  try {
    // Get user by ID
    const user = await authRepository.getOneById(userId);
    if (!user) {
      throw notFoundError(APP_ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Verify current password
    const isValid = await verifyPassword(data.current_password, user.password);
    if (!isValid) {
      throw unauthorizedError(APP_ERROR_MESSAGES.INVALID_CURRENT_PASSWORD);
    }

    // Hash new password
    const hashedPassword = await hashPassword(data.new_password);

    // Start transaction
    connection = await startTransaction();

    // Update password
    const isUpdated = await authRepository.updatePasswordById(connection, userId, hashedPassword);
    if (!isUpdated) {
      throw notFoundError(APP_ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Commit transaction
    await commitTransaction(connection);

    logger.info({ userId }, 'Password changed successfully');
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }

    logger.error({ error, userId }, 'Failed to change password');
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to change password');
  }
};

// ====================================================================================================
// Funtions
// ====================================================================================================

// Helper function to map UserRow to UserMap
const toUserMap = (user: UserRow): UserMap => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
  };
};
