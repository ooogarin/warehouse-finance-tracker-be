import { password } from 'bun';

// Hash password using Bun's bcrypt
export const hashPassword = async (plainPassword: string): Promise<string> => {
  return await password.hash(plainPassword, {
    algorithm: 'bcrypt',
    cost: 10,
  });
};

// Verify password
export const verifyPassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return await password.verify(plainPassword, hashedPassword);
};

// Generate UUID v4
export const generateUUID = (): string => {
  return crypto.randomUUID();
};

// Generate random string
export const generateRandomString = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate random numeric code
export const generateNumericCode = (length: number = 6): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
};
