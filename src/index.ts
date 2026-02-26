import { Hono } from 'hono';
import { compress } from 'hono/compress';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { sql, testConnection } from './config/database.config';
import { env, isDevelopment } from './config/env.config';
import { createLogger } from './config/logger.config';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware';
import { requestLogger } from './middleware/logger.middleware';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import type { AppEnv } from './types/context.types';

// Import routes (will be implemented in later phases)
// import { publicRoutes } from "./routes/public";
// import { v1Routes } from "./routes/v1";
// import { internalRoutes } from "./routes/internal";

const logger = createLogger({ module: 'server' });

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
        version: '1.0.0',
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
  // app.route("/auth", publicRoutes);

  // API v1 routes (auth required)
  // app.route("/v1", v1Routes);

  // Internal routes (health, metrics)
  // app.route("/internal", internalRoutes);

  // ==========================================
  // Root endpoint
  // ==========================================
  app.get('/', (c) => {
    return c.json({
      name: 'Warehouse & Finance Tracker API',
      version: '1.0.0',
      description: 'Warehouse & Finance Management API',
      documentation: '/docs',
      health: '/health',
    });
  });

  // ==========================================
  // Error Handling
  // ==========================================
  app.notFound(notFoundHandler);
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
      await sql.end();

      logger.info('Server shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
};

// Start the server
startServer();

// Export for testing
export { createApp };
