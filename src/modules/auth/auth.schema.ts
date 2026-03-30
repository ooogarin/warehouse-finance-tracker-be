import { z } from 'zod';

// Registration schema
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
  email: z.string().email('Invalid email format').max(100, 'Email must be at most 100 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(255, 'Password must be at most 255 characters'),
  phone: z.string().max(20, 'Phone must be at most 20 characters').optional(),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Update profile schema
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters').optional(),
  phone: z.string().max(20, 'Phone must be at most 20 characters').optional(),
});

// Change password schema
export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters').max(255, 'New password must be at most 255 characters'),
});
