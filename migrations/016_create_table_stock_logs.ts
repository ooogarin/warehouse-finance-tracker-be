/**
 * Migration 016: Create stock_logs Table
 */

import type { SQL } from 'bun';

export const up = async (transaction: SQL): Promise<void> => {
  await transaction`
    CREATE TABLE stock_logs (
      id UUID PRIMARY KEY,
      ingredient_id UUID NOT NULL,
      flow_type stock_log_flow_type NOT NULL,
      base_unit_quantity DECIMAL(12,3) NOT NULL,
      base_unit_price DECIMAL(15,3) NOT NULL,
      total_amount DECIMAL(15,3) GENERATED ALWAYS AS (base_unit_quantity * base_unit_price) STORED,
      notes TEXT,
      balance_after DECIMAL(15,3),
      reference_id UUID,
      reference_type stock_log_reference_type NOT NULL,
      created_by UUID,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT check_base_unit_quantity_positive CHECK (base_unit_quantity > 0),
      CONSTRAINT fk_stock_logs_ingredients FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT,
      CONSTRAINT fk_stock_logs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `;

  await transaction`CREATE INDEX idx_stock_logs_ingredient ON stock_logs(ingredient_id, created_at DESC)`;
  await transaction`CREATE INDEX idx_stock_logs_flow_type ON stock_logs(flow_type)`;
  await transaction`CREATE INDEX idx_stock_logs_reference_type ON stock_logs(reference_type, reference_id)`;
};

export const down = async (transaction: SQL): Promise<void> => {
  await transaction`DROP INDEX IF EXISTS idx_stock_logs_reference_type`;
  await transaction`DROP INDEX IF EXISTS idx_stock_logs_flow_type`;
  await transaction`DROP INDEX IF EXISTS idx_stock_logs_ingredient`;
  await transaction`DROP TABLE IF EXISTS stock_logs`;
};
