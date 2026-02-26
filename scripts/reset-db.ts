#!/usr/bin/env bun
/**
 * Database Reset Script
 *
 * WARNING: This will delete ALL data from the database!
 * Only for development use.
 *
 * Usage:
 *   bun run db:reset
 */

import { SQL } from 'bun';

// Database URL from environment
const DATABASE_URL = `postgres://${process.env.DATABASE_USER || 'postgres'}:${process.env.DATABASE_PASSWORD || 'postgres'}@${process.env.DATABASE_HOST || 'localhost'}:${process.env.DATABASE_PORT || '5432'}/${process.env.DATABASE_NAME || 'warehouse'}`;

// Simple logger
const logger = {
  info: (message: string) => console.log(`[${new Date().toISOString()}] [reset-db] ${message}`),
  error: (message: string) => console.error(`[${new Date().toISOString()}] [reset-db] ERROR: ${message}`),
  warn: (message: string) => console.warn(`[${new Date().toISOString()}] [reset-db] WARN: ${message}`),
};

const resetDatabase = async (): Promise<void> => {
  logger.warn('⚠️  WARNING: This will delete ALL data from the database!');

  if (process.env.NODE_ENV === 'production') {
    logger.error('❌ Cannot reset database in production!');
    process.exit(1);
  }

  const sql = new SQL({ url: DATABASE_URL });

  try {
    // Test connection
    await sql`SELECT 1`;
    logger.info('Connected to database');
  } catch (error) {
    logger.error(`Failed to connect: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  logger.info('Starting database reset...');

  try {
    // Drop all tables
    const tables = [
      'debt_payments',
      'debts',
      'cash_logs',
      'stock_logs',
      'purchase_items',
      'purchase_orders',
      'ingredient_batches',
      'ingredient_units',
      'ingredients',
      'suppliers',
      'user_merchants',
      'merchants',
      'users',
      '_migrations',
    ];

    for (const table of tables) {
      await sql.unsafe(`DROP TABLE IF EXISTS ${table} CASCADE`);
      logger.info(`Dropped table: ${table}`);
    }

    // Drop custom types
    const types = [
      'debt_payment_method',
      'debt_status',
      'debt_creditor_type',
      'cash_log_category',
      'cash_log_flow_type',
      'stock_log_reference_type',
      'stock_log_movement_type',
      'ingredient_category',
      'merchant_type',
      'user_role',
    ];

    for (const type of types) {
      await sql.unsafe(`DROP TYPE IF EXISTS ${type} CASCADE`);
      logger.info(`Dropped type: ${type}`);
    }

    logger.info('✅ Database reset complete');
    logger.info("Run 'bun run migrate' to recreate tables");
  } catch (error) {
    logger.error(`Reset failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  } finally {
    await sql.close();
  }
};

resetDatabase();
