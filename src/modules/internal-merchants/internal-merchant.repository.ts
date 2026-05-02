import { sql } from '@/core/db/client';
import type { ReservedSQL } from '@/core/db/client';
import type {
  InternalMerchantInsertPayload,
  InternalMerchantRow,
  InternalMerchantSubscriptionUpdatePayload,
  InternalMerchantUpdatePayload,
} from './internal-merchant.type';

const baseMerchantSelection = sql`
  id,
  name,
  type,
  address,
  phone,
  cash_balance,
  subscription_plan,
  subscription_status,
  subscription_started_at::text AS subscription_started_at,
  subscription_expires_at::text AS subscription_expires_at,
  subscription_notes,
  created_at::text AS created_at,
  updated_at::text AS updated_at
`;

// Get all merchants for internal platform admin
export const getAll = async (): Promise<InternalMerchantRow[]> => {
  return await sql<InternalMerchantRow[]>`
    SELECT ${baseMerchantSelection}
    FROM merchants
    WHERE deleted_at IS NULL
    ORDER BY name ASC
  `;
};

// Get one merchant by ID for internal platform admin
export const getOneById = async (merchantId: string): Promise<InternalMerchantRow | null> => {
  const [result] = await sql<InternalMerchantRow[]>`
    SELECT ${baseMerchantSelection}
    FROM merchants
    WHERE id = ${merchantId}
      AND deleted_at IS NULL
    LIMIT 1
  `;

  return result ?? null;
};

// Insert one merchant
export const insert = async (db: ReservedSQL, payload: InternalMerchantInsertPayload): Promise<InternalMerchantRow> => {
  const allowedColumns = [
    'id',
    'name',
    'type',
    'address',
    'phone',
    'cash_balance',
    'subscription_plan',
    'subscription_status',
    'subscription_started_at',
    'subscription_expires_at',
    'subscription_notes',
  ] as const;

  const [result] = await db<InternalMerchantRow[]>`
    INSERT INTO merchants ${sql(payload, ...allowedColumns)}
    RETURNING ${baseMerchantSelection}
  `;

  if (!result) {
    throw new Error('Internal merchant insert failed');
  }

  return result;
};

// Update one merchant
export const updateById = async (
  db: ReservedSQL,
  merchantId: string,
  payload: InternalMerchantUpdatePayload,
): Promise<InternalMerchantRow | null> => {
  const allowedColumns = ['name', 'type', 'address', 'phone'] as const;

  const [result] = await db<InternalMerchantRow[]>`
    UPDATE merchants
    SET
      ${sql(payload, ...allowedColumns)},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${merchantId}
      AND deleted_at IS NULL
    RETURNING ${baseMerchantSelection}
  `;

  return result ?? null;
};

// Update merchant subscription fields
export const updateSubscriptionById = async (
  db: ReservedSQL,
  merchantId: string,
  payload: InternalMerchantSubscriptionUpdatePayload,
): Promise<InternalMerchantRow | null> => {
  const allowedColumns = [
    'subscription_plan',
    'subscription_status',
    'subscription_started_at',
    'subscription_expires_at',
    'subscription_notes',
  ] as const;

  const [result] = await db<InternalMerchantRow[]>`
    UPDATE merchants
    SET
      ${sql(payload, ...allowedColumns)},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${merchantId}
      AND deleted_at IS NULL
    RETURNING ${baseMerchantSelection}
  `;

  return result ?? null;
};
