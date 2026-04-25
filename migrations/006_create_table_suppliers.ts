/**
 * Migration 006: Create suppliers Table
 */

import type { SQL } from 'bun';

export const up = async (transaction: SQL): Promise<void> => {
  await transaction`
    CREATE TABLE suppliers (
      id UUID PRIMARY KEY,
      merchant_id UUID NOT NULL,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      address TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMPTZ NULL,
      CONSTRAINT fk_suppliers_merchants FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE RESTRICT
    )
  `;

  await transaction`
    CREATE INDEX idx_suppliers_merchant_id 
      ON suppliers(merchant_id) 
      WHERE deleted_at IS NULL
  `;
};

export const down = async (transaction: SQL): Promise<void> => {
  await transaction`DROP INDEX IF EXISTS idx_suppliers_merchant_id`;
  await transaction`DROP TABLE IF EXISTS suppliers`;
};
