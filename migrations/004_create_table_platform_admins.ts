/**
 * Migration 004: Create platform_admins Table
 */

import type { SQL } from 'bun';

export const up = async (transaction: SQL): Promise<void> => {
  await transaction`
    CREATE TABLE platform_admins (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_platform_admin_user UNIQUE(user_id),
      CONSTRAINT fk_platform_admins_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  await transaction`
    CREATE INDEX idx_platform_admins_user_id
      ON platform_admins(user_id)
  `;
};

export const down = async (transaction: SQL): Promise<void> => {
  await transaction`DROP INDEX IF EXISTS idx_platform_admins_user_id`;
  await transaction`DROP TABLE IF EXISTS platform_admins`;
};
