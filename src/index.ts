import { Hono } from 'hono';
import { compress } from 'hono/compress';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { env, isDevelopment } from '@/core/config/env.config';
import { createLogger } from '@/core/config/logger.config';
import { closeConnection, testConnection } from '@/core/db/client';
import { errorHandler, notFoundHandler } from '@/core/middleware/error-handler.middleware';
import { requestLogger } from '@/core/middleware/logger.middleware';
import { requestIdMiddleware } from '@/core/middleware/request-id.middleware';
import { authRoutes } from '@/modules/auth/auth.route';
import { authRoutesV1 } from '@/modules/auth/auth-v1.route';
import { ingredientRoutesV1 } from '@/modules/ingredients/ingredient-v1.route';
import { merchantRoutesV1 } from '@/modules/merchants/merchant-v1.route';
import { onboardingRoutesV1 } from '@/modules/onboarding/onboarding-v1.route';
import { supplierRoutesV1 } from '@/modules/suppliers/supplier-v1.route';
import type { AppEnv } from '@/shared/types/context.types';

const logger = createLogger({ module: 'server' });
const APP_INFO = {
  name: 'Warehouse & Finance Tracker API',
  version: '1.0.0',
  description: 'Warehouse & Finance Management API',
};

// Create and configure Hono application
const createApp = () => {
  const app = new Hono<AppEnv>();

  // ==========================================
  // Global Middleware
  // ==========================================

  // Request ID (must be first)
  app.use(requestIdMiddleware);

  // Security headers
  app.use(secureHeaders());

  // CORS
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(','),
      credentials: env.CORS_CREDENTIALS,
      allowHeaders: ['Content-Type', 'Authorization', 'X-Merchant-ID', 'X-Request-ID'],
      exposeHeaders: ['X-Request-ID', 'X-Response-Time'],
    }),
  );

  // Compression
  app.use(compress());

  // Request logging
  if (isDevelopment) {
    app.use(honoLogger());
  }
  app.use(requestLogger);

  // ==========================================
  // Health Check (Public)
  // ==========================================
  app.get('/health', async (c) => {
    const dbConnected = await testConnection().catch(() => false);

    return c.json(
      {
        status: dbConnected ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: APP_INFO.version,
        services: {
          database: dbConnected ? 'connected' : 'disconnected',
        },
      },
      dbConnected ? 200 : 503,
    );
  });

  // ==========================================
  // API Routes
  // ==========================================

  // Public routes (no auth required)
  app.route('/auth', authRoutes);

  // API v1 routes (auth required)
  app.route('/v1/auth', authRoutesV1);
  app.route('/v1/onboarding', onboardingRoutesV1);
  app.route('/v1/merchants', merchantRoutesV1);
  app.route('/v1/suppliers', supplierRoutesV1);
  app.route('/v1/ingredients', ingredientRoutesV1);

  // Internal routes (health, metrics)
  // app.route('/internal', internalRoutes);

  // ==========================================
  // Root endpoint
  // ==========================================
  app.get('/', (c) => {
    return c.json({
      name: APP_INFO.name,
      version: APP_INFO.version,
      description: APP_INFO.description,
      documentation: '/docs',
      health: '/health',
    });
  });

  // ==========================================
  // Error Handling
  // ==========================================
  // Endpoint not found
  app.notFound(notFoundHandler);

  // Error handler
  app.onError(errorHandler);

  return app;
};

// Start the server
const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    logger.info('Connecting to database...');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }
    logger.info('Database connected successfully');

    // Create app
    const app = createApp();

    // Start server
    const server = Bun.serve({
      fetch: app.fetch,
      port: env.PORT,
      hostname: env.HOST,
    });

    logger.info(
      {
        url: `http://${env.HOST}:${env.PORT}`,
        env: env.NODE_ENV,
      },
      'Server started',
    );

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info({ signal }, 'Shutting down server...');

      // Close server
      server.stop();

      // Close database connections
      await closeConnection();

      logger.info('Server shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.fatal({ error: error instanceof Error ? error.message : error }, 'Failed to start server');
    process.exit(1);
  }
};

// Start the server
startServer();

// Export for testing
export { createApp };
