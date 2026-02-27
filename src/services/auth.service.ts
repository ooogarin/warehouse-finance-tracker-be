import { logger } from '@/config/logger.config';
import { ERROR_MESSAGES } from '@/constants/messages.constant';
import { USER_ROLES } from '@/constants/roles.constant';
import { commitTransaction, type ReservedSQL, rollbackTransaction, startTransaction } from '@/repositories/client';
import * as usersRepository from '@/repositories/users.repository';
import type { ChangePasswordInput, LoginInput, RegisterInput, UpdateProfileInput } from '@/types/auth.types';
import { generateUUID, hashPassword, verifyPassword } from '@/utils/crypto.util';
import { conflictError, internalError, notFoundError, unauthorizedError } from '@/utils/errors.util';
import { generateToken } from '@/utils/jwt.util';

// Register new user
export const register = async (data: RegisterInput) => {
  let connection: ReservedSQL | null = null;

  try {
    // Check if user already exists
    const exists = await usersRepository.existsByEmail(data.email);
    if (exists) {
      throw conflictError(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    const hashedPassword = await hashPassword(data.password);
    const userId = generateUUID();

    // Start transaction
    connection = await startTransaction();

    const payload = {
      id: userId,
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: USER_ROLES.OWNER,
      phone: data.phone,
    };

    // Insert user
    const user = await usersRepository.insert(connection, payload);

    // Commit transaction
    await commitTransaction(connection);

    logger.info({ userId: user.id }, 'User registered successfully');

    // Generate JWT token
    const accessToken = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }

    logger.error({ error, email: data.email }, 'Failed to register user');
    throw internalError('Failed to register user');
  }
};

// Login user
export const login = async (data: LoginInput) => {
  // Get user by email
  const user = await usersRepository.getOneByEmail(data.email);
  if (!user) {
    throw unauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Verify password
  const isValid = await verifyPassword(data.password, user.password);
  if (!isValid) {
    throw unauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Generate JWT token
  const accessToken = await generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  logger.info({ userId: user.id }, 'User logged in successfully');

  return {
    access_token: accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
};

// Get current user
export const getMe = async (userId: string) => {
  // Get user by ID
  const user = await usersRepository.getOneById(userId);
  if (!user) {
    throw notFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
  };
};

// Update profile
export const updateProfile = async (userId: string, data: UpdateProfileInput) => {
  let connection: ReservedSQL | null = null;

  try {
    // Start transaction
    connection = await startTransaction();

    // Update user
    const user = await usersRepository.updateById(connection, userId, {
      name: data.name,
      phone: data.phone,
    });

    // Commit transaction
    await commitTransaction(connection);

    logger.info({ userId }, 'Profile updated successfully');

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
    };
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }

    logger.error({ error, userId }, 'Failed to update profile');
    throw internalError('Failed to update profile');
  }
};

// Change password
export const changePassword = async (userId: string, data: ChangePasswordInput): Promise<void> => {
  let connection: ReservedSQL | null = null;

  try {
    // Get user by ID
    const user = await usersRepository.getOneById(userId);
    if (!user) {
      throw notFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Verify current password
    const isValid = await verifyPassword(data.current_password, user.password);
    if (!isValid) {
      throw unauthorizedError(ERROR_MESSAGES.INVALID_CURRENT_PASSWORD);
    }

    // Hash new password
    const hashedPassword = await hashPassword(data.new_password);

    // Start transaction
    connection = await startTransaction();

    // Update password
    await usersRepository.updatePasswordById(connection, userId, hashedPassword);

    // Commit transaction
    await commitTransaction(connection);

    logger.info({ userId }, 'Password changed successfully');
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }

    logger.error({ error, userId }, 'Failed to change password');
    throw internalError('Failed to change password');
  }
};
