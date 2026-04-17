import { sql } from '@/core/db/client';
import type { ReservedSQL } from '@/core/db/client';
import type {
  SupplierInsertPayload,
  SupplierListRow,
  SupplierPurchaseHistoryRow,
  SupplierRow,
  SupplierUpdatePayload,
} from './supplier.type';

// Get supplier list by merchant
export const getAllByMerchantId = async (merchantId: string, search?: string): Promise<SupplierListRow[]> => {
  const searchPattern = search?.trim() ? `%${search.trim()}%` : null;

  return await sql<SupplierListRow[]>`
    SELECT
      s.id,
      s.merchant_id,
      s.name,
      s.phone,
      s.address,
      s.notes,
      s.created_at,
      s.updated_at,
      s.deleted_at,
      (
        SELECT MAX(po.purchase_date)::text
        FROM purchase_orders po
        WHERE po.supplier_id = s.id
          AND po.deleted_at IS NULL
      ) AS last_order_date
    FROM suppliers s
    WHERE s.merchant_id = ${merchantId}
      AND s.deleted_at IS NULL
      AND (
        ${searchPattern}::text IS NULL
        OR s.name ILIKE ${searchPattern}
        OR COALESCE(s.phone, '') ILIKE ${searchPattern}
      )
    ORDER BY s.name ASC
  `;
};

// Get one supplier by ID and merchant
export const getOneByIdAndMerchantId = async (supplierId: string, merchantId: string): Promise<SupplierRow | null> => {
  const [result] = await sql<SupplierRow[]>`
    SELECT
      id,
      merchant_id,
      name,
      phone,
      address,
      notes,
      created_at,
      updated_at,
      deleted_at
    FROM suppliers
    WHERE id = ${supplierId}
      AND merchant_id = ${merchantId}
      AND deleted_at IS NULL
    LIMIT 1
  `;

  return result ?? null;
};

// Get purchase history by supplier ID and merchant
export const getPurchaseHistoryBySupplierId = async (supplierId: string, merchantId: string): Promise<SupplierPurchaseHistoryRow[]> => {
  return await sql<SupplierPurchaseHistoryRow[]>`
    SELECT
      po.id,
      po.purchase_date::text AS purchase_date,
      po.invoice_number,
      po.total_amount::text AS total_amount,
      po.debt_amount::text AS debt_amount,
      CASE
        WHEN po.debt_amount = 0 THEN 'paid'
        WHEN supplier_debt.status = 'paid' THEN 'paid'
        WHEN COALESCE(supplier_debt.paid_amount, 0) > 0 THEN 'partial'
        ELSE 'unpaid'
      END AS payment_status
    FROM purchase_orders po
    LEFT JOIN LATERAL (
      SELECT
        d.status,
        d.paid_amount::double precision AS paid_amount
      FROM debts d
      WHERE d.purchase_order_id = po.id
        AND d.creditor_type = 'supplier'
        AND d.deleted_at IS NULL
      ORDER BY d.created_at DESC
      LIMIT 1
    ) supplier_debt ON TRUE
    WHERE po.supplier_id = ${supplierId}
      AND po.merchant_id = ${merchantId}
      AND po.deleted_at IS NULL
    ORDER BY po.purchase_date DESC
  `;
};

// Insert suppliers in onboarding flow
export const insertMany = async (db: ReservedSQL, payloads: SupplierInsertPayload[]): Promise<void> => {
  if (payloads.length === 0) {
    return;
  }

  const allowedColumns = ['id', 'merchant_id', 'name', 'phone', 'address', 'notes'] as const;

  for (const payload of payloads) {
    await db`
      INSERT INTO suppliers ${sql(payload, ...allowedColumns)}
    `;
  }
};

// Insert one supplier
export const insert = async (db: ReservedSQL, payload: SupplierInsertPayload): Promise<SupplierRow> => {
  const allowedColumns = ['id', 'merchant_id', 'name', 'phone', 'address', 'notes'] as const;

  const [result] = await db<SupplierRow[]>`
    INSERT INTO suppliers ${sql(payload, ...allowedColumns)}
    RETURNING
      id,
      merchant_id,
      name,
      phone,
      address,
      notes,
      created_at,
      updated_at,
      deleted_at
  `;

  if (!result) {
    throw new Error('Supplier insert failed');
  }

  return result;
};

// Update supplier by ID and merchant
export const updateByIdAndMerchantId = async (
  db: ReservedSQL,
  supplierId: string,
  merchantId: string,
  payload: SupplierUpdatePayload,
): Promise<SupplierRow | null> => {
  const allowedColumns = ['name', 'phone', 'address', 'notes'] as const;

  const [result] = await db<SupplierRow[]>`
    UPDATE suppliers
    SET
      ${sql(payload, ...allowedColumns)},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${supplierId}
      AND merchant_id = ${merchantId}
      AND deleted_at IS NULL
    RETURNING
      id,
      merchant_id,
      name,
      phone,
      address,
      notes,
      created_at,
      updated_at,
      deleted_at
  `;

  return result ?? null;
};

// Soft delete supplier by ID and merchant
export const softDeleteByIdAndMerchantId = async (db: ReservedSQL, supplierId: string, merchantId: string): Promise<boolean> => {
  const [result] = await db<{ id: string }[]>`
    UPDATE suppliers
    SET
      deleted_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${supplierId}
      AND merchant_id = ${merchantId}
      AND deleted_at IS NULL
    RETURNING id
  `;

  return Boolean(result);
};
