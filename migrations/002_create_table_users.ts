/**
 * Migration 002: Create users Table
 */

import type { SQL } from 'bun';

export const up = async (transaction: SQL): Promise<void> => {
  await transaction`
    CREATE TABLE users (
      id UUID PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      password VARCHAR(255) NOT NULL,
      role user_role NOT NULL DEFAULT 'owner',
      phone VARCHAR(20),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMPTZ NULL
    )
  `;

  await transaction`
    CREATE UNIQUE INDEX idx_users_email_unique 
      ON users(email) 
      WHERE deleted_at IS NULL
  `;

  await transaction`
    CREATE INDEX idx_users_deleted_at 
      ON users(deleted_at) 
      WHERE deleted_at IS NULL
  `;
};

export const down = async (transaction: SQL): Promise<void> => {
  await transaction`DROP INDEX IF EXISTS idx_users_deleted_at`;
  await transaction`DROP INDEX IF EXISTS idx_users_email_unique`;
  await transaction`DROP TABLE IF EXISTS users`;
};
