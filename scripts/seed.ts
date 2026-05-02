#!/usr/bin/env bun
/**
 * Database Seeder
 *
 * Usage:
 *   bun run db:seed                 # Seed baseline user, merchant, and user_merchants data
 *   bun run db:seed --reset         # Reset and reseed
 *   bun run db:seed --reset-only    # Reset data only
 */

import { SQL, password } from 'bun';

// Database URL from environment
const DATABASE_URL = `postgres://${process.env.DATABASE_USER || 'postgres'}:${process.env.DATABASE_PASSWORD || 'postgres'}@${process.env.DATABASE_HOST || 'localhost'}:${process.env.DATABASE_PORT || '5432'}/${process.env.DATABASE_NAME || 'warehouse'}`;

// Simple logger
const logger = {
  info: (message: string) => console.log(`[${new Date().toISOString()}] [seed] ${message}`),
  warn: (message: string) => console.warn(`[${new Date().toISOString()}] [seed] WARN: ${message}`),
  error: (message: string) => console.error(`[${new Date().toISOString()}] [seed] ERROR: ${message}`),
};

const hashPassword = async (plainPassword: string): Promise<string> => {
  return await password.hash(plainPassword, { algorithm: 'bcrypt', cost: 10 });
};

const BASELINE_USER = {
  name: 'John Owner',
  email: 'owner@example.com',
  password: 'password123',
  role: 'owner',
  phone: '081234567890',
} as const;

const BASELINE_MERCHANT = {
  name: 'Warung Sederhana',
  type: 'restaurant',
  address: 'Jl. Makan No. 123, Jakarta',
  phone: '081234567891',
  cash_balance: 1000000,
  subscription_plan: 'basic',
  subscription_status: 'trialing',
  subscription_started_at: '2026-05-02T00:00:00.000Z',
  subscription_expires_at: '2026-06-02T00:00:00.000Z',
  subscription_notes: 'Baseline seeded merchant',
} as const;

const seed = async (sql: SQL): Promise<void> => {
  logger.info('Starting database seeding...');

  try {
    // User
    const hashedPassword = await hashPassword(BASELINE_USER.password);

    const existingUser = await sql<{ id: string }[]>`
      SELECT id FROM users WHERE email = ${BASELINE_USER.email} AND deleted_at IS NULL
    `;

    let userId: string;

    if (existingUser.length > 0) {
      userId = existingUser[0].id;
      await sql`
        UPDATE users
        SET
          name = ${BASELINE_USER.name},
          password = ${hashedPassword},
          role = ${BASELINE_USER.role},
          phone = ${BASELINE_USER.phone},
          updated_at = CURRENT_TIMESTAMP,
          deleted_at = NULL
        WHERE id = ${userId}
      `;
      logger.info(`User refreshed: ${BASELINE_USER.email} / ${BASELINE_USER.password}`);
    } else {
      const inserted = await sql<{ id: string }[]>`
        INSERT INTO users (id, name, email, password, role, phone)
        VALUES (
          ${crypto.randomUUID()},
          ${BASELINE_USER.name},
          ${BASELINE_USER.email},
          ${hashedPassword},
          ${BASELINE_USER.role},
          ${BASELINE_USER.phone}
        )
        RETURNING id
      `;
      userId = inserted[0].id;
      logger.info(`User created: ${BASELINE_USER.email} / ${BASELINE_USER.password}`);
    }

    // Merchant (idempotent by name)
    const existingMerchant = await sql<{ id: string }[]>`
      SELECT id
      FROM merchants
      WHERE name = ${BASELINE_MERCHANT.name}
        AND deleted_at IS NULL
      LIMIT 1
    `;

    let resolvedMerchantId: string;

    if (existingMerchant.length > 0) {
      resolvedMerchantId = existingMerchant[0].id;
      await sql`
        UPDATE merchants
        SET
          type = ${BASELINE_MERCHANT.type},
          address = ${BASELINE_MERCHANT.address},
          phone = ${BASELINE_MERCHANT.phone},
          cash_balance = ${BASELINE_MERCHANT.cash_balance},
          subscription_plan = ${BASELINE_MERCHANT.subscription_plan},
          subscription_status = ${BASELINE_MERCHANT.subscription_status},
          subscription_started_at = ${BASELINE_MERCHANT.subscription_started_at},
          subscription_expires_at = ${BASELINE_MERCHANT.subscription_expires_at},
          subscription_notes = ${BASELINE_MERCHANT.subscription_notes},
          updated_at = CURRENT_TIMESTAMP,
          deleted_at = NULL
        WHERE id = ${resolvedMerchantId}
      `;
      logger.info(`Merchant refreshed: ${BASELINE_MERCHANT.name}`);
    } else {
      const insertedMerchant = await sql<{ id: string }[]>`
        INSERT INTO merchants (
          id,
          name,
          type,
          address,
          phone,
          cash_balance,
          subscription_plan,
          subscription_status,
          subscription_started_at,
          subscription_expires_at,
          subscription_notes
        )
        VALUES (
          ${crypto.randomUUID()},
          ${BASELINE_MERCHANT.name},
          ${BASELINE_MERCHANT.type},
          ${BASELINE_MERCHANT.address},
          ${BASELINE_MERCHANT.phone},
          ${BASELINE_MERCHANT.cash_balance},
          ${BASELINE_MERCHANT.subscription_plan},
          ${BASELINE_MERCHANT.subscription_status},
          ${BASELINE_MERCHANT.subscription_started_at},
          ${BASELINE_MERCHANT.subscription_expires_at},
          ${BASELINE_MERCHANT.subscription_notes}
        )
        RETURNING id
      `;

      resolvedMerchantId = insertedMerchant[0].id;
      logger.info(`Merchant created: ${BASELINE_MERCHANT.name}`);
    }

    logger.info(`Merchant ready: ${BASELINE_MERCHANT.name}`);

    // User - Merchant Junction
    if (userId && resolvedMerchantId) {
      await sql`
        INSERT INTO user_merchants (id, user_id, merchant_id)
        VALUES (
          ${crypto.randomUUID()},
          ${userId},
          ${resolvedMerchantId}
        )
        ON CONFLICT (user_id, merchant_id) DO NOTHING
      `;
      logger.info('User linked to merchant');
    }

    logger.info('✨ Database seeding completed successfully!');
  } catch (error) {
    logger.error(`Seeding failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

const reset = async (sql: SQL): Promise<void> => {
  logger.warn('Resetting data...');

  const tables = [
    'debt_payments',
    'debts',
    'cash_logs',
    'stock_logs',
    'stock_adjustment_items',
    'stock_adjustments',
    'stock_usage_items',
    'stock_usages',
    'purchase_order_items',
    'purchase_orders',
    'ingredient_batches',
    'ingredient_units',
    'ingredients',
    'suppliers',
    'user_merchants',
    'merchants',
    'users',
  ];

  for (const table of tables) {
    await sql.unsafe(`TRUNCATE TABLE ${table} CASCADE`);
    logger.info(`Truncated: ${table}`);
  }

  logger.info('Data reset complete');
};

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);

  const sql = new SQL({ url: DATABASE_URL });

  try {
    await sql`SELECT 1`;
  } catch (error) {
    logger.error(`Failed to connect: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  try {
    if (args.includes('--reset')) {
      await reset(sql);
      await seed(sql);
    } else if (args.includes('--reset-only')) {
      await reset(sql);
    } else {
      await seed(sql);
    }
  } catch (error) {
    logger.error(`Seed script failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  } finally {
    await sql.close();
  }
};

main();
