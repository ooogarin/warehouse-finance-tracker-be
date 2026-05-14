import { sql } from '@/core/db/client';
import type { ReservedSQL } from '@/core/db/client';
import type { UserInsertPayload, UserRow, UserUpdatePayload } from './auth.type';

// Get user by ID
export const getOneById = async (id: string): Promise<UserRow | null> => {
  const [result] = await sql<UserRow[]>`
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
export const getOneByEmail = async (email: string): Promise<UserRow | null> => {
  const [result] = await sql<UserRow[]>`
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

// Check whether email already exists
export const existsByEmail = async (email: string): Promise<boolean> => {
  const [result] = await sql<{ id: string }[]>`
    SELECT id
    FROM users
    WHERE email = ${email}
      AND deleted_at IS NULL
    LIMIT 1
  `;

  return Boolean(result);
};

// Insert one user
export const insert = async (connection: ReservedSQL, payload: UserInsertPayload): Promise<UserRow> => {
  const allowedColumns = ['id', 'name', 'email', 'password', 'role', 'phone'] as const;

  const [result] = await connection<UserRow[]>`
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
    throw new Error('User insert failed');
  }

  return result;
};

// Update user by ID
export const updateById = async (connection: ReservedSQL, id: string, payload: UserUpdatePayload): Promise<UserRow | null> => {
  const allowedColumns = ['name', 'phone'] as const;

  const [result] = await connection<UserRow[]>`
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

  return result ?? null;
};

// Update password
export const updatePasswordById = async (connection: ReservedSQL, id: string, password: string): Promise<boolean> => {
  const [result] = await connection<{ id: string }[]>`
    UPDATE users
    SET
      password = ${password},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
      AND deleted_at IS NULL
    RETURNING id
  `;

  return Boolean(result);
};
