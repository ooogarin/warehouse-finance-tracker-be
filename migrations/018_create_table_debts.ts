/**
 * Migration 018: Create debts Table
 */

import type { SQL } from 'bun';

export const up = async (transaction: SQL): Promise<void> => {
  await transaction`
    CREATE TABLE debts (
      id UUID PRIMARY KEY,
      merchant_id UUID NOT NULL,
      supplier_id UUID,
      creditor_name VARCHAR(100),
      creditor_type debt_creditor_type NOT NULL,
      purchase_order_id UUID,
      total_amount DECIMAL(15,3) NOT NULL,
      paid_amount DECIMAL(15,3) NOT NULL DEFAULT 0,
      status debt_status NOT NULL DEFAULT 'unpaid',
      debt_date DATE NOT NULL,
      due_date DATE,
      paid_date DATE,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMPTZ NULL,
      CONSTRAINT check_amounts CHECK (paid_amount >= 0 AND paid_amount <= total_amount),
      CONSTRAINT fk_debts_merchant_id FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE RESTRICT,
      CONSTRAINT fk_debts_supplier_id FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
      CONSTRAINT fk_debts_purchase_order_id FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE SET NULL
    )
  `;

  await transaction`
    CREATE INDEX idx_debts_merchant_id 
      ON debts(merchant_id) 
      WHERE deleted_at IS NULL
  `;

  await transaction`
    CREATE INDEX idx_debts_status 
      ON debts(status, due_date) 
      WHERE deleted_at IS NULL
  `;

  await transaction`
    CREATE INDEX idx_debts_supplier_id 
      ON debts(supplier_id) 
      WHERE deleted_at IS NULL
  `;

  await transaction`
    CREATE INDEX idx_debts_merchant_status 
      ON debts(merchant_id, status) 
      WHERE deleted_at IS NULL
  `;
};

export const down = async (transaction: SQL): Promise<void> => {
  await transaction`DROP INDEX IF EXISTS idx_debts_merchant_status`;
  await transaction`DROP INDEX IF EXISTS idx_debts_supplier_id`;
  await transaction`DROP INDEX IF EXISTS idx_debts_status`;
  await transaction`DROP INDEX IF EXISTS idx_debts_merchant_id`;
  await transaction`DROP TABLE IF EXISTS debts`;
};
