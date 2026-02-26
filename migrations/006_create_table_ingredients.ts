/**
 * Migration 006: Create ingredients Table
 */

import type { SQL } from 'bun';

export const up = async (transaction: SQL): Promise<void> => {
  await transaction`
    CREATE TABLE ingredients (
      id UUID PRIMARY KEY,
      merchant_id UUID NOT NULL,
      name VARCHAR(100) NOT NULL,
      category ingredient_category DEFAULT 'other',
      base_unit VARCHAR(20) NOT NULL,
      stock_quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
      min_stock DECIMAL(12,3) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMPTZ NULL,
      CONSTRAINT check_stock_positive CHECK (stock_quantity >= 0),
      CONSTRAINT fk_ingredients_merchants FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE RESTRICT
    )
  `;

  await transaction`
    CREATE INDEX idx_ingredients_merchant_category 
      ON ingredients(merchant_id, category) 
      WHERE deleted_at IS NULL
  `;

  await transaction`
    CREATE INDEX idx_ingredients_merchant_stock 
      ON ingredients(merchant_id, stock_quantity) 
      WHERE deleted_at IS NULL AND stock_quantity <= min_stock
  `;
};

export const down = async (transaction: SQL): Promise<void> => {
  await transaction`DROP INDEX IF EXISTS idx_ingredients_merchant_stock`;
  await transaction`DROP INDEX IF EXISTS idx_ingredients_merchant_category`;
  await transaction`DROP TABLE IF EXISTS ingredients`;
};
