#!/usr/bin/env bun
/**
 * Database Seeder
 *
 * Usage:
 *   bun run seed              # Seed database with sample data
 *   bun run seed --reset      # Reset and reseed
 */

import { password, SQL } from 'bun';

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

const seed = async (sql: SQL): Promise<void> => {
  logger.info('Starting database seeding...');

  try {
    // User
    const hashedPassword = await hashPassword('password123');
    const userEmail = 'owner@example.com';

    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${userEmail} AND deleted_at IS NULL
    `;

    let userId: string;

    if (existingUser.length > 0) {
      userId = existingUser[0].id;
      logger.info(`✅ User already exists: ${userEmail}`);
    } else {
      const inserted = await sql`
        INSERT INTO users (id, name, email, password, role, phone)
        VALUES (
          ${crypto.randomUUID()},
          'John Owner',
          ${userEmail},
          ${hashedPassword},
          'owner',
          '+6281234567890'
        )
        RETURNING id
      `;
      userId = inserted[0].id;
      logger.info(`✅ User created: ${userEmail} / password123`);
    }

    // Merchant
    const merchantId = crypto.randomUUID();

    const merchantResult = await sql`
      INSERT INTO merchants (id, name, type, address, phone, cash_balance)
      VALUES (
        ${merchantId},
        'Warung Sederhana',
        'restaurant',
        'Jl. Makan No. 123, Jakarta',
        '+6281234567891',
        1000000
      )
      ON CONFLICT (id) DO NOTHING
      RETURNING id, name
    `;

    const resolvedMerchantId = merchantResult[0]?.id ?? merchantId;
    logger.info(`✅ Merchant ready: Warung Sederhana`);

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
      logger.info('✅ User linked to merchant');
    }

    // Suppliers
    const suppliers = [
      { name: 'PT Makmur Jaya', phone: '+6281234567892' },
      { name: 'Supplier Bahan Segar', phone: '+6281234567893' },
      { name: 'Distributor Minuman', phone: '+6281234567894' },
    ];

    for (const sup of suppliers) {
      await sql`
        INSERT INTO suppliers (id, merchant_id, name, phone)
        VALUES (
          ${crypto.randomUUID()},
          ${resolvedMerchantId},
          ${sup.name},
          ${sup.phone}
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }
    logger.info(`✅ ${suppliers.length} suppliers ready`);

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
    'purchase_items',
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
