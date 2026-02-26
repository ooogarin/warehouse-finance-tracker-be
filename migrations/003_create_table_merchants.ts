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
};

export const down = async (transaction: SQL): Promise<void> => {
  await transaction`DROP INDEX IF EXISTS idx_merchants_deleted_at`;
  await transaction`DROP TABLE IF EXISTS merchants`;
};
