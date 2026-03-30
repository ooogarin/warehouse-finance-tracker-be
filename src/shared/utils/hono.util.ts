import type { Context } from 'hono';

// Helper to access validated request data with proper typing
export const getBody = <T>(c: Context): T => (c.req as unknown as { valid: (target: 'json') => T }).valid('json');
export const getParams = <T>(c: Context): T => (c.req as unknown as { valid: (target: 'params') => T }).valid('params');
export const getQuery = <T>(c: Context): T => (c.req as unknown as { valid: (target: 'query') => T }).valid('query');
