/**
 * Migration 005: Create user_merchants Table
 */

import type { SQL } from 'bun';

export const up = async (transaction: SQL): Promise<void> => {
  await transaction`
    CREATE TABLE user_merchants (
      id UUID PRIMARY KEY,
      merchant_id UUID NOT NULL,
      user_id UUID NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMPTZ NULL,
      CONSTRAINT unique_user_merchant UNIQUE(user_id, merchant_id),
      CONSTRAINT fk_user_merchants_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
      CONSTRAINT fk_user_merchants_merchants FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE RESTRICT
    )
  `;

  await transaction`
    CREATE INDEX idx_user_merchants_merchant_id 
      ON user_merchants(merchant_id) 
      WHERE deleted_at IS NULL
  `;

  await transaction`
    CREATE INDEX idx_user_merchants_user_id 
      ON user_merchants(user_id) 
      WHERE deleted_at IS NULL
  `;

  await transaction`
    CREATE INDEX idx_user_merchants_merchant_user 
      ON user_merchants(merchant_id, user_id) 
      WHERE deleted_at IS NULL
  `;
};

export const down = async (transaction: SQL): Promise<void> => {
  await transaction`DROP INDEX IF EXISTS idx_user_merchants_merchant_user`;
  await transaction`DROP INDEX IF EXISTS idx_user_merchants_user_id`;
  await transaction`DROP INDEX IF EXISTS idx_user_merchants_merchant_id`;
  await transaction`DROP TABLE IF EXISTS user_merchants`;
};
