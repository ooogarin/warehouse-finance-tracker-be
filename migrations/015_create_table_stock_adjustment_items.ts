/**
 * Migration 015: Create stock_adjustment_items Table
 */

import type { SQL } from 'bun';

export const up = async (transaction: SQL): Promise<void> => {
  await transaction`
    CREATE TABLE stock_adjustment_items (
      id UUID PRIMARY KEY,
      stock_adjustment_id UUID NOT NULL,
      flow_type stock_adjustment_flow_type NOT NULL,
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
      CONSTRAINT fk_stock_adjustment_items_stock_adjustments FOREIGN KEY (stock_adjustment_id) REFERENCES stock_adjustments(id) ON DELETE RESTRICT,
      CONSTRAINT fk_stock_adjustment_items_ingredients FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT,
      CONSTRAINT fk_stock_adjustment_items_ingredient_units FOREIGN KEY (ingredient_unit_id) REFERENCES ingredient_units(id) ON DELETE RESTRICT
    )
  `;

  await transaction`
    CREATE INDEX idx_stock_adjustment_items_stock_adjustment_id
      ON stock_adjustment_items(stock_adjustment_id)
      WHERE deleted_at IS NULL
  `;

  await transaction`
    CREATE INDEX idx_stock_adjustment_items_ingredient_id
      ON stock_adjustment_items(ingredient_id)
      WHERE deleted_at IS NULL
  `;

  await transaction`
    CREATE INDEX idx_stock_adjustment_items_stock_adjustment_ingredient
      ON stock_adjustment_items(stock_adjustment_id, ingredient_id)
      WHERE deleted_at IS NULL
  `;
};

export const down = async (transaction: SQL): Promise<void> => {
  await transaction`DROP INDEX IF EXISTS idx_stock_adjustment_items_stock_adjustment_ingredient`;
  await transaction`DROP INDEX IF EXISTS idx_stock_adjustment_items_ingredient_id`;
  await transaction`DROP INDEX IF EXISTS idx_stock_adjustment_items_stock_adjustment_id`;
  await transaction`DROP TABLE IF EXISTS stock_adjustment_items`;
};
