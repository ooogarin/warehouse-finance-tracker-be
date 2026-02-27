import { createMiddleware } from 'hono/factory';
import type { z } from 'zod';
import { createLogger } from '@/config/logger.config';
import type { AppContext, AppEnv } from '@/types/context.types';
import { validationError } from '@/utils/errors.util';

const logger = createLogger({ module: 'validation-middleware' });

// Validation target type
type ValidationTarget = 'json' | 'query' | 'param';

// Create validation middleware
// Validates request data against a Zod schema
export const validate = <T extends z.ZodType>(schema: T, target: ValidationTarget = 'json') => {
  return createMiddleware<AppEnv>(async (c, next) => {
    let data: unknown;

    // Extract data based on target
    switch (target) {
      case 'json':
        try {
          data = await c.req.json();
        } catch {
          throw validationError('Invalid JSON body');
        }
        break;
      case 'query':
        data = Object.fromEntries(new URL(c.req.url).searchParams);
        break;
      case 'param':
        data = c.req.param();
        break;
      default:
        throw validationError('Invalid validation target');
    }

    // Validate data
    const result = schema.safeParse(data);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      logger.debug({ path: c.req.path, target, details }, 'Validation failed');

      throw validationError('Validation failed', details);
    }

    // Store validated data in context for later use
    c.set('validatedData', result.data as T);

    await next();
  });
};

// Get validated data from context
// Must be used after validate middleware
export const getValidatedData = <T>(c: AppContext): T => {
  return c.get('validatedData') as T;
};

// Extend Hono context types for validated data
declare module 'hono' {
  interface ContextVariableMap {
    validatedData: unknown;
  }
}
