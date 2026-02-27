import type { UserDbInsertPayload, UserDbRow, UserDbUpdatePayload } from '@/types/user.types';
import { type ReservedSQL, sql } from './client';

// Get user by ID
export const getOneById = async (id: string): Promise<UserDbRow | null> => {
  const [result] = await sql<UserDbRow[]>`
    SELECT
      id,
      name,
      email,
      password,
      role,
      phone,
      created_at,
      updated_at,
      deleted_at
    FROM users
    WHERE id = ${id}
      AND deleted_at IS NULL
    LIMIT 1
  `;

  return result ?? null;
};

// Get user by email
export const getOneByEmail = async (email: string): Promise<UserDbRow | null> => {
  const [result] = await sql<UserDbRow[]>`
    SELECT
      id,
      name,
      email,
      password,
      role,
      phone,
      created_at,
      updated_at,
      deleted_at
    FROM users
    WHERE email = ${email}
      AND deleted_at IS NULL
    LIMIT 1
  `;

  return result ?? null;
};

// Check if email exists
export const existsByEmail = async (email: string): Promise<boolean> => {
  const [result] = await sql<{ count: number }[]>`
    SELECT
      COUNT(*) as count
    FROM users
    WHERE email = ${email}
      AND deleted_at IS NULL
    LIMIT 1
  `;

  return result.count > 0;
};

// Insert new user
export const insert = async (connection: ReservedSQL, payload: UserDbInsertPayload): Promise<UserDbRow> => {
  const allowedColumns = ['id', 'name', 'email', 'password', 'role', 'phone'] as const;

  const [result] = await connection<UserDbRow[]>`
    INSERT INTO users ${sql(payload, ...allowedColumns)}
    RETURNING
      id,
      name,
      email,
      password,
      role,
      phone,
      created_at,
      updated_at,
      deleted_at
  `;

  if (!result) {
    throw new Error('Insert failed: no row returned');
  }

  return result;
};

// Update user by ID
export const updateById = async (connection: ReservedSQL, id: string, payload: UserDbUpdatePayload): Promise<UserDbRow> => {
  const allowedColumns = ['name', 'phone'] as const;

  const [result] = await connection<UserDbRow[]>`
    UPDATE users
    SET
      ${sql(payload, ...allowedColumns)},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
      AND deleted_at IS NULL
    RETURNING
      id,
      name,
      email,
      password,
      role,
      phone,
      created_at,
      updated_at,
      deleted_at
  `;

  if (!result) {
    throw new Error('Update failed: user not found or already deleted');
  }

  return result;
};

// Update password
export const updatePasswordById = async (connection: ReservedSQL, id: string, password: string): Promise<void> => {
  const [result] = await connection<{ id: string }[]>`
    UPDATE users
    SET
      password = ${password},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
      AND deleted_at IS NULL
    RETURNING id
  `;

  if (!result) {
    throw new Error('Update password failed: user not found or already deleted');
  }
};

// Soft delete user
export const softDeleteById = async (connection: ReservedSQL, id: string): Promise<void> => {
  const [result] = await connection<{ id: string }[]>`
    UPDATE users
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
      AND deleted_at IS NULL
    RETURNING id
  `;

  if (!result) {
    throw new Error('Soft delete failed: user not found or already deleted');
  }
};
