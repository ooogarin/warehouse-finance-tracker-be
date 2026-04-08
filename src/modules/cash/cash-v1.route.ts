import { Hono } from 'hono';
import type { AppEnv } from '@/shared/types/context.types';

const cashRoutesV1 = new Hono<AppEnv>();

export { cashRoutesV1 };
