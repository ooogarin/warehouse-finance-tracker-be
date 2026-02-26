/**
 * Migration 012: Create cash_logs Table
 */

import type { SQL } from 'bun';

export const up = async (transaction: SQL): Promise<void> => {
  await transaction`
    CREATE TABLE cash_logs (
      id UUID PRIMARY KEY,
      merchant_id UUID NOT NULL,
      flow_type cash_log_flow_type NOT NULL,
      amount DECIMAL(15,3) NOT NULL,
      category cash_log_category NOT NULL,
      reference_id UUID,
      description TEXT,
      balance_after DECIMAL(15,3),
      created_by UUID,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT check_amount_positive CHECK (amount > 0),
      CONSTRAINT fk_cash_logs_merchant_id FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE RESTRICT,
      CONSTRAINT fk_cash_logs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `;

  await transaction`CREATE INDEX idx_cash_logs_merchant ON cash_logs(merchant_id, created_at DESC)`;
  await transaction`CREATE INDEX idx_cash_logs_category ON cash_logs(category, created_at DESC)`;
  await transaction`CREATE INDEX idx_cash_logs_flow ON cash_logs(flow_type, created_at DESC)`;
};

export const down = async (transaction: SQL): Promise<void> => {
  await transaction`DROP INDEX IF EXISTS idx_cash_logs_flow`;
  await transaction`DROP INDEX IF EXISTS idx_cash_logs_category`;
  await transaction`DROP INDEX IF EXISTS idx_cash_logs_merchant`;
  await transaction`DROP TABLE IF EXISTS cash_logs`;
};
