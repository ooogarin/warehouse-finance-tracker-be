/**
 * Migration 007: Create ingredient_units Table
 */

import type { SQL } from 'bun';

export const up = async (transaction: SQL): Promise<void> => {
  await transaction`
    CREATE TABLE ingredient_units (
      id UUID PRIMARY KEY,
      ingredient_id UUID NOT NULL,
      unit_name VARCHAR(50) NOT NULL,
      conversion_factor DECIMAL(12,3) NOT NULL,
      is_default BOOLEAN DEFAULT false,
      description VARCHAR(200),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_ingredient_unit UNIQUE(ingredient_id, unit_name),
      CONSTRAINT check_conversion_positive CHECK (conversion_factor > 0),
      CONSTRAINT fk_ingredient_units_ingredients FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT
    )
  `;

  await transaction`
    CREATE UNIQUE INDEX idx_ingredient_units_merchant_name_unique
      ON ingredient_units(ingredient_id, unit_name)
  `;

  await transaction`
    CREATE INDEX idx_ingredient_units_ingredient_id 
      ON ingredient_units(ingredient_id)
  `;
};

export const down = async (transaction: SQL): Promise<void> => {
  await transaction`DROP INDEX IF EXISTS idx_ingredient_units_ingredient_id`;
  await transaction`DROP INDEX IF EXISTS idx_ingredient_units_merchant_name_unique`;
  await transaction`DROP TABLE IF EXISTS ingredient_units`;
};
