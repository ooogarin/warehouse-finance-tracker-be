// App error messages (keep this intentionally small)
export const APP_ERROR_MESSAGES = {
  UNKNOWN_ERROR: 'An error occurred. Please try again',
  INVALID_REQUEST: 'Invalid request',
  UNAUTHORIZED: 'Please login first',
  FORBIDDEN: 'You do not have access',
  INVALID_TOKEN: 'Invalid token',
  TOKEN_EXPIRED: 'Token expired',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  INVALID_CURRENT_PASSWORD: 'Current password is incorrect',
  USER_NOT_FOUND: 'User not found',
} as const;
