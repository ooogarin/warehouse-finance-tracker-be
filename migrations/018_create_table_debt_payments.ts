/**
 * Migration 018: Create debt_payments Table
 */

import type { SQL } from 'bun';

export const up = async (transaction: SQL): Promise<void> => {
  await transaction`
    CREATE TABLE debt_payments (
      id UUID PRIMARY KEY,
      debt_id UUID NOT NULL,
      amount DECIMAL(15,3) NOT NULL,
      payment_method debt_payment_method NOT NULL,
      reference_number VARCHAR(50),
      notes TEXT,
      created_by UUID,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT check_payment_positive CHECK (amount > 0),
      CONSTRAINT fk_debt_payments_debt_id FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE RESTRICT,
      CONSTRAINT fk_debt_payments_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `;

  await transaction`CREATE INDEX idx_debt_payments_debt_id ON debt_payments(debt_id, created_at DESC)`;
};

export const down = async (transaction: SQL): Promise<void> => {
  await transaction`DROP INDEX IF EXISTS idx_debt_payments_debt_id`;
  await transaction`DROP TABLE IF EXISTS debt_payments`;
};
