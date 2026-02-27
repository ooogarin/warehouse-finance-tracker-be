import { sign, verify } from 'hono/jwt';
import { env } from '@/config/env.config';
import type { JwtPayload } from '@/types/auth.types';

// Generate JWT token
export const generateToken = async (payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 24 * 60 * 60; // 24 hours

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
