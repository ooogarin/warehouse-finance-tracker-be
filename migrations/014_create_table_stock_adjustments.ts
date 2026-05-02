/**
 * Migration 014: Create stock_adjustments Table
 */

import type { SQL } from 'bun';

export const up = async (transaction: SQL): Promise<void> => {
  await transaction`
    CREATE TABLE stock_adjustments (
      id UUID PRIMARY KEY,
      merchant_id UUID NOT NULL,
      adjustment_date TIMESTAMPTZ NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMPTZ NULL,
      CONSTRAINT fk_stock_adjustments_merchants FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE RESTRICT
    )
  `;

  await transaction`
    CREATE INDEX idx_stock_adjustments_merchant_date
      ON stock_adjustments(merchant_id, adjustment_date DESC)
      WHERE deleted_at IS NULL
  `;
};

export const down = async (transaction: SQL): Promise<void> => {
  await transaction`DROP INDEX IF EXISTS idx_stock_adjustments_merchant_date`;
  await transaction`DROP TABLE IF EXISTS stock_adjustments`;
};
