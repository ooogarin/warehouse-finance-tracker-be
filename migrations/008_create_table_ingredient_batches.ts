/**
 * Migration 008: Create ingredient_batches Table
 */

import type { SQL } from 'bun';

export const up = async (transaction: SQL): Promise<void> => {
  await transaction`
    CREATE TABLE ingredient_batches (
      id UUID PRIMARY KEY,
      ingredient_id UUID NOT NULL,
      qty_initial DECIMAL(12,3) NOT NULL,
      qty_remaining DECIMAL(12,3) NOT NULL,
      cost_per_unit DECIMAL(12,3) NOT NULL,
      purchase_date TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMPTZ NULL,
      CONSTRAINT check_qty_positive CHECK (qty_initial > 0),
      CONSTRAINT check_qty_remaining_positive CHECK (qty_remaining >= 0),
      CONSTRAINT check_cost_per_unit_positive CHECK (cost_per_unit > 0),
      CONSTRAINT fk_ingredient_batches_ingredients FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT
    )
  `;

  await transaction`
    CREATE INDEX idx_ingredient_batches_fifo 
      ON ingredient_batches(ingredient_id, purchase_date) 
      WHERE deleted_at IS NULL AND qty_remaining > 0
  `;
};

export const down = async (transaction: SQL): Promise<void> => {
  await transaction`DROP INDEX IF EXISTS idx_ingredient_batches_fifo`;
  await transaction`DROP TABLE IF EXISTS ingredient_batches`;
};
