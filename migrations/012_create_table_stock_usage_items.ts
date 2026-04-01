/**
 * Migration 012: Create stock_usage_items Table
 */

import type { SQL } from 'bun';

export const up = async (transaction: SQL): Promise<void> => {
  await transaction`
    CREATE TABLE stock_usage_items (
      id UUID PRIMARY KEY,
      stock_usage_id UUID NOT NULL,
      ingredient_id UUID NOT NULL,
      quantity DECIMAL(12,3) NOT NULL,
      ingredient_unit_id UUID NOT NULL,
      unit_price DECIMAL(15,3) NOT NULL,
      subtotal DECIMAL(15,3) GENERATED ALWAYS AS (quantity * unit_price) STORED,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMPTZ NULL,
      CONSTRAINT check_quantity_positive CHECK (quantity > 0),
      CONSTRAINT check_price_positive CHECK (unit_price >= 0),
      CONSTRAINT fk_stock_usage_items_stock_usages FOREIGN KEY (stock_usage_id) REFERENCES stock_usages(id) ON DELETE RESTRICT,
      CONSTRAINT fk_stock_usage_items_ingredients FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT,
      CONSTRAINT fk_stock_usage_items_ingredient_units FOREIGN KEY (ingredient_unit_id) REFERENCES ingredient_units(id) ON DELETE RESTRICT
    )
  `;

  await transaction`
    CREATE INDEX idx_stock_usage_items_stock_usage_id
      ON stock_usage_items(stock_usage_id)
      WHERE deleted_at IS NULL
  `;

  await transaction`
    CREATE INDEX idx_stock_usage_items_ingredient_id
      ON stock_usage_items(ingredient_id)
      WHERE deleted_at IS NULL
  `;

  await transaction`
    CREATE INDEX idx_stock_usage_items_stock_usage_ingredient
      ON stock_usage_items(stock_usage_id, ingredient_id)
      WHERE deleted_at IS NULL
  `;
};

export const down = async (transaction: SQL): Promise<void> => {
  await transaction`DROP INDEX IF EXISTS idx_stock_usage_items_stock_usage_ingredient`;
  await transaction`DROP INDEX IF EXISTS idx_stock_usage_items_ingredient_id`;
  await transaction`DROP INDEX IF EXISTS idx_stock_usage_items_stock_usage_id`;
  await transaction`DROP TABLE IF EXISTS stock_usage_items`;
};
