/**
 * Migration 011: Create purchase_order_items Table
 */

import type { SQL } from 'bun';

export const up = async (transaction: SQL): Promise<void> => {
  await transaction`
    CREATE TABLE purchase_order_items (
      id UUID PRIMARY KEY,
      purchase_order_id UUID NOT NULL,
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
      CONSTRAINT fk_purchase_order_items_purchase_orders FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE RESTRICT,
      CONSTRAINT fk_purchase_order_items_ingredients FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT,
      CONSTRAINT fk_purchase_order_items_ingredient_units FOREIGN KEY (ingredient_unit_id) REFERENCES ingredient_units(id) ON DELETE RESTRICT
    )
  `;

  await transaction`
    CREATE INDEX idx_purchase_order_items_purchase_order_id 
      ON purchase_order_items(purchase_order_id) 
      WHERE deleted_at IS NULL
  `;

  await transaction`
    CREATE INDEX idx_purchase_order_items_ingredient_id 
      ON purchase_order_items(ingredient_id) 
      WHERE deleted_at IS NULL
  `;

  await transaction`
    CREATE INDEX idx_purchase_order_items_purchase_order_ingredient 
      ON purchase_order_items(purchase_order_id, ingredient_id) 
      WHERE deleted_at IS NULL
  `;
};

export const down = async (transaction: SQL): Promise<void> => {
  await transaction`DROP INDEX IF EXISTS idx_purchase_order_items_purchase_order_ingredient`;
  await transaction`DROP INDEX IF EXISTS idx_purchase_order_items_ingredient_id`;
  await transaction`DROP INDEX IF EXISTS idx_purchase_order_items_purchase_order_id`;
  await transaction`DROP TABLE IF EXISTS purchase_order_items`;
};
