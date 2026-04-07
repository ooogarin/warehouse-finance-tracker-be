import { successResponse } from '@/core/http/response';
import { getBody } from '@/shared/utils/hono.util';
import * as onboardingService from './onboarding.service';
import type { AppContext } from '@/shared/types/context.types';
import type { CompleteOnboardingRequest } from './onboarding.type';

// Get onboarding status
// GET /v1/onboarding/status
export const getStatus = async (c: AppContext) => {
  const userId = c.get('userId');
  const result = await onboardingService.getStatus({ userId });

  return successResponse({
    context: c,
    data: result,
    message: 'Onboarding status fetched successfully',
  });
};

// Complete onboarding flow
// POST /v1/onboarding/complete
export const complete = async (c: AppContext) => {
  const userId = c.get('userId');
  const data = getBody<CompleteOnboardingRequest>(c);
  const result = await onboardingService.complete({ userId }, data);

  return successResponse({
    context: c,
    data: result,
    message: 'Onboarding completed successfully',
    statusCode: 201,
  });
};
