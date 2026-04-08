import { Hono } from 'hono';
import type { AppEnv } from '@/shared/types/context.types';

const debtRoutesV1 = new Hono<AppEnv>();

export { debtRoutesV1 };
