import { sql } from '@/core/db/client';
import type { ReservedSQL } from '@/core/db/client';
import type { DebtInsertPayload, DebtRow } from './debt.type';

// Get supplier debt by purchase order ID
export const getSupplierDebtByPurchaseOrderId = async (purchaseOrderId: string): Promise<DebtRow | null> => {
  const [result] = await sql<DebtRow[]>`
    SELECT
      id,
      creditor_type,
      total_amount::double precision AS total_amount,
      paid_amount::double precision AS paid_amount,
      status
    FROM debts
    WHERE purchase_order_id = ${purchaseOrderId}
      AND creditor_type = 'supplier'
      AND deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
  `;

  return result ?? null;
};

// Insert debt row
export const insert = async (db: ReservedSQL, payload: DebtInsertPayload): Promise<void> => {
  const allowedColumns = [
    'id',
    'merchant_id',
    'supplier_id',
    'creditor_name',
    'creditor_type',
    'purchase_order_id',
    'total_amount',
    'debt_date',
    'description',
  ] as const;

  await db`
    INSERT INTO debts ${sql(payload, ...allowedColumns)}
  `;
};
