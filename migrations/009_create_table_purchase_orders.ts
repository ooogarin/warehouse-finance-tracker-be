/**
 * Migration 009: Create purchase_orders Table
 */

import type { SQL } from 'bun';

export const up = async (transaction: SQL): Promise<void> => {
  await transaction`
    CREATE TABLE purchase_orders (
      id UUID PRIMARY KEY,
      merchant_id UUID NOT NULL,
      supplier_id UUID,
      purchase_date TIMESTAMPTZ NOT NULL,
      invoice_number VARCHAR(50) NOT NULL,
      total_amount DECIMAL(15,3) NOT NULL,
      paid_cash DECIMAL(15,3) NOT NULL DEFAULT 0,
      paid_owner DECIMAL(15,3) NOT NULL DEFAULT 0,
      debt_amount DECIMAL(15,3) NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMPTZ NULL,
      CONSTRAINT check_payment_balance CHECK (paid_cash + paid_owner + debt_amount = total_amount),
      CONSTRAINT check_amounts_positive CHECK (paid_cash >= 0 AND paid_owner >= 0 AND debt_amount >= 0),
      CONSTRAINT fk_purchase_orders_merchants FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE RESTRICT,
      CONSTRAINT fk_purchase_orders_suppliers FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
    )
  `;

  await transaction`
    CREATE INDEX idx_purchase_orders_merchant_date 
      ON purchase_orders(merchant_id, purchase_date DESC) 
      WHERE deleted_at IS NULL
  `;

  await transaction`
    CREATE INDEX idx_purchase_orders_merchant_invoice 
      ON purchase_orders(merchant_id, invoice_number) 
      WHERE deleted_at IS NULL
  `;

  await transaction`
    CREATE INDEX idx_purchase_orders_merchant_supplier_date 
      ON purchase_orders(merchant_id, supplier_id, purchase_date DESC) 
      WHERE deleted_at IS NULL
  `;
};

export const down = async (transaction: SQL): Promise<void> => {
  await transaction`DROP INDEX IF EXISTS idx_purchase_orders_merchant_supplier_date`;
  await transaction`DROP INDEX IF EXISTS idx_purchase_orders_merchant_invoice`;
  await transaction`DROP INDEX IF EXISTS idx_purchase_orders_merchant_date`;
  await transaction`DROP TABLE IF EXISTS purchase_orders`;
};
