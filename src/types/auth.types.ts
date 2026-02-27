import type { z } from 'zod';
import type { UserRole } from '@/constants/roles.constant';
import type { changePasswordSchema, loginSchema, registerSchema, updateProfileSchema } from '@/validators/auth.schemas';

// Input Types (inferred from Zod schemas)
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  type?: 'access';
  iat: number;
  exp: number;
}
