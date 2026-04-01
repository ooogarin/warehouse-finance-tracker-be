/**
 * Migration 011: Create stock_usages Table
 */

import type { SQL } from 'bun';

export const up = async (transaction: SQL): Promise<void> => {
  await transaction`
    CREATE TABLE stock_usages (
      id UUID PRIMARY KEY,
      merchant_id UUID NOT NULL,
      usage_date TIMESTAMPTZ NOT NULL,
      type stock_usage_type NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMPTZ NULL,
      CONSTRAINT fk_stock_usages_merchants FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE RESTRICT
    )
  `;

  await transaction`
    CREATE INDEX idx_stock_usages_merchant_date
      ON stock_usages(merchant_id, usage_date DESC)
      WHERE deleted_at IS NULL
  `;
};

export const down = async (transaction: SQL): Promise<void> => {
  await transaction`DROP INDEX IF EXISTS idx_stock_usages_merchant_date`;
  await transaction`DROP TABLE IF EXISTS stock_usages`;
};
