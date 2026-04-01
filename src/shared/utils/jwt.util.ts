import { sign, verify } from 'hono/jwt';
import { env } from '@/core/config/env.config';
import type { JwtPayload } from '@/modules/auth/auth.type';

// Generate JWT token
export const generateToken = async (payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + env.JWT_EXPIRY;

  const jwtPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp,
  };

  const token = await sign(jwtPayload as unknown as Record<string, unknown>, env.JWT_SECRET, 'HS256');

  return token;
};

// Verify JWT token
export const verifyToken = async (token: string): Promise<JwtPayload> => {
  return (await verify(token, env.JWT_SECRET, 'HS256')) as unknown as JwtPayload;
};
