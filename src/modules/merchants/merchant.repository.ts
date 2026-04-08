import { sql } from '@/core/db/client';
import type { ReservedSQL } from '@/core/db/client';
import type { MerchantAccessRow, MerchantInsertPayload, UserMerchantInsertPayload, UserMerchantRow } from './merchant.type';

// Get all merchants accessible by user
export const getAllAccessibleByUserId = async (userId: string): Promise<MerchantAccessRow[]> => {
  return await sql<MerchantAccessRow[]>`
    SELECT
      m.id,
      m.name,
      m.type,
      m.address,
      m.phone,
      m.cash_balance,
      u.role AS user_role
    FROM user_merchants um
    JOIN merchants m ON m.id = um.merchant_id
    JOIN users u ON u.id = um.user_id
    WHERE um.user_id = ${userId}
      AND um.deleted_at IS NULL
      AND m.deleted_at IS NULL
      AND u.deleted_at IS NULL
    ORDER BY m.name ASC
  `;
};

// Get one merchant accessible by merchant ID and user ID
export const getOneAccessibleByIdAndUserId = async (merchantId: string, userId: string): Promise<MerchantAccessRow | null> => {
  const [result] = await sql<MerchantAccessRow[]>`
    SELECT
      m.id,
      m.name,
      m.type,
      m.address,
      m.phone,
      m.cash_balance,
      u.role AS user_role
    FROM user_merchants um
    JOIN merchants m ON m.id = um.merchant_id
    JOIN users u ON u.id = um.user_id
    WHERE um.merchant_id = ${merchantId}
      AND um.user_id = ${userId}
      AND um.deleted_at IS NULL
      AND m.deleted_at IS NULL
      AND u.deleted_at IS NULL
    LIMIT 1
  `;

  return result ?? null;
};

// Get one user_merchant by user ID
export const getOneUserMerchantByUserId = async (userId: string): Promise<UserMerchantRow | null> => {
  const [result] = await sql<UserMerchantRow[]>`
    SELECT
      id,
      user_id,
      merchant_id
    FROM user_merchants
    WHERE user_id = ${userId}
      AND deleted_at IS NULL
    LIMIT 1
  `;

  return result ?? null;
};

// Insert merchant record
export const insertMerchant = async (db: ReservedSQL, payload: MerchantInsertPayload): Promise<void> => {
  const allowedColumns = ['id', 'name', 'type', 'address', 'phone', 'cash_balance'] as const;

  await db`
    INSERT INTO merchants ${sql(payload, ...allowedColumns)}
  `;
};

// Insert user_merchant record
export const insertUserMerchant = async (db: ReservedSQL, payload: UserMerchantInsertPayload): Promise<void> => {
  const allowedColumns = ['id', 'user_id', 'merchant_id'] as const;

  await db`
    INSERT INTO user_merchants ${sql(payload, ...allowedColumns)}
  `;
};

// Decrease merchant cash balance and return latest balance
export const decreaseCashBalanceById = async (db: ReservedSQL, merchantId: string, amount: number): Promise<number | null> => {
  const [result] = await db<{ cash_balance: number }[]>`
    UPDATE merchants
    SET
      cash_balance = cash_balance - ${amount},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${merchantId}
      AND cash_balance >= ${amount}
    RETURNING cash_balance::double precision AS cash_balance
  `;

  return result?.cash_balance ?? null;
};
