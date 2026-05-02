/**
 * Migration 003: Create merchants Table
 */

import type { SQL } from 'bun';

export const up = async (transaction: SQL): Promise<void> => {
  await transaction`
    CREATE TABLE merchants (
      id UUID PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      type merchant_type DEFAULT 'restaurant',
      address TEXT,
      phone VARCHAR(20),
      cash_balance DECIMAL(15,3) NOT NULL DEFAULT 0,
      subscription_plan merchant_subscription_plan NOT NULL DEFAULT 'basic',
      subscription_status merchant_subscription_status NOT NULL DEFAULT 'trialing',
      subscription_started_at TIMESTAMPTZ NULL,
      subscription_expires_at TIMESTAMPTZ NULL,
      subscription_notes TEXT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMPTZ NULL
    )
  `;

  await transaction`
    CREATE INDEX idx_merchants_deleted_at 
      ON merchants(deleted_at) 
      WHERE deleted_at IS NULL
  `;

  await transaction`
    CREATE INDEX idx_merchants_subscription_status
      ON merchants(subscription_status)
      WHERE deleted_at IS NULL
  `;

  await transaction`
    CREATE INDEX idx_merchants_subscription_expires_at
      ON merchants(subscription_expires_at)
      WHERE deleted_at IS NULL
  `;
};

export const down = async (transaction: SQL): Promise<void> => {
  await transaction`DROP INDEX IF EXISTS idx_merchants_subscription_expires_at`;
  await transaction`DROP INDEX IF EXISTS idx_merchants_subscription_status`;
  await transaction`DROP INDEX IF EXISTS idx_merchants_deleted_at`;
  await transaction`DROP TABLE IF EXISTS merchants`;
};
