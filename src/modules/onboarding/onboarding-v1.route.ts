import { Hono } from 'hono';
import { appValidator } from '@/core/http/validator';
import { authenticate } from '@/core/middleware/auth.middleware';
import * as onboardingController from './onboarding.controller';
import { onboardingCompleteSchema } from './onboarding.schema';
import type { AppEnv } from '@/shared/types/context.types';

const onboardingRoutesV1 = new Hono<AppEnv>();

// Apply authentication middleware to all routes
onboardingRoutesV1.use('*', authenticate);

// GET /v1/onboarding/status - Get onboarding status
onboardingRoutesV1.get('/status', onboardingController.getStatus);

// POST /v1/onboarding/complete - Complete onboarding
onboardingRoutesV1.post('/complete', appValidator('json', onboardingCompleteSchema), onboardingController.complete);

export { onboardingRoutesV1 };
