import { sql } from '@/core/db/client';
import type { ReservedSQL } from '@/core/db/client';
import type { DebtInsertPayload, DebtListByMerchantIdOptions, DebtRow, DebtStatus, DebtSummaryRow } from './debt.type';

// Get debt summary for one merchant
export const getSummaryByMerchantId = async (merchantId: string): Promise<DebtSummaryRow> => {
  const [result] = await sql<DebtSummaryRow[]>`
    SELECT
      COALESCE(SUM(total_amount - paid_amount) FILTER (WHERE status != 'paid'), 0)::double precision AS total_active_debt,
      COALESCE(SUM(total_amount - paid_amount) FILTER (WHERE creditor_type = 'supplier' AND status != 'paid'), 0)::double precision AS supplier_debt,
      COALESCE(SUM(total_amount - paid_amount) FILTER (WHERE creditor_type = 'owner' AND status != 'paid'), 0)::double precision AS owner_debt,
      COUNT(*) FILTER (
        WHERE due_date < CURRENT_DATE
          AND status IN ('unpaid', 'partial')
      )::integer AS overdue_count
    FROM debts
    WHERE merchant_id = ${merchantId}
      AND deleted_at IS NULL
  `;

  return result ?? { total_active_debt: 0, supplier_debt: 0, owner_debt: 0, overdue_count: 0 };
};

// Get debt list by merchant
export const getAllByMerchantId = async ({
  merchantId,
  creditorType,
  supplierId,
  status,
}: DebtListByMerchantIdOptions): Promise<DebtRow[]> => {
  const statusFilter = status === 'overdue' ? null : status;
  const overdueOnly = status === 'overdue';

  return await sql<DebtRow[]>`
    SELECT
      d.id,
      d.merchant_id,
      d.creditor_type,
      d.creditor_name,
      d.supplier_id,
      s.name AS supplier_name,
      d.purchase_order_id,
      d.total_amount::double precision AS total_amount,
      d.paid_amount::double precision AS paid_amount,
      (d.total_amount - d.paid_amount)::double precision AS remaining_amount,
      d.status,
      d.debt_date::text AS debt_date,
      d.due_date::text AS due_date,
      d.paid_date::text AS paid_date,
      d.description,
      d.created_at::text AS created_at
    FROM debts d
    LEFT JOIN suppliers s ON s.id = d.supplier_id
    WHERE d.merchant_id = ${merchantId}
      AND d.deleted_at IS NULL
      AND (
        ${creditorType ?? null}::debt_creditor_type IS NULL
        OR d.creditor_type = ${creditorType ?? null}
      )
      AND (
        ${supplierId ?? null}::uuid IS NULL
        OR d.supplier_id = ${supplierId ?? null}
      )
      AND (
        ${statusFilter ?? null}::debt_status IS NULL
        OR d.status = ${statusFilter ?? null}::debt_status
      )
      AND (
        ${overdueOnly}::boolean = false
        OR (d.due_date < CURRENT_DATE AND d.status IN ('unpaid', 'partial'))
      )
    ORDER BY
      (d.due_date < CURRENT_DATE AND d.status IN ('unpaid', 'partial')) DESC,
      d.debt_date DESC,
      d.created_at DESC
  `;
};

// Get one debt by ID and merchant
export const getOneByIdAndMerchantId = async (debtId: string, merchantId: string): Promise<DebtRow | null> => {
  const [result] = await sql<DebtRow[]>`
    SELECT
      d.id,
      d.merchant_id,
      d.creditor_type,
      d.creditor_name,
      d.supplier_id,
      s.name AS supplier_name,
      d.purchase_order_id,
      d.total_amount::double precision AS total_amount,
      d.paid_amount::double precision AS paid_amount,
      (d.total_amount - d.paid_amount)::double precision AS remaining_amount,
      d.status,
      d.debt_date::text AS debt_date,
      d.due_date::text AS due_date,
      d.paid_date::text AS paid_date,
      d.description,
      d.created_at::text AS created_at
    FROM debts d
    LEFT JOIN suppliers s ON s.id = d.supplier_id
    WHERE d.id = ${debtId}
      AND d.merchant_id = ${merchantId}
      AND d.deleted_at IS NULL
    LIMIT 1
  `;

  return result ?? null;
};

// Get supplier debt by purchase order ID
export const getSupplierDebtByPurchaseOrderId = async (purchaseOrderId: string): Promise<DebtRow | null> => {
  const [result] = await sql<DebtRow[]>`
    SELECT
      id,
      creditor_name,
      supplier_id,
      NULL::text AS supplier_name,
      purchase_order_id,
      creditor_type,
      total_amount::double precision AS total_amount,
      paid_amount::double precision AS paid_amount,
      (total_amount - paid_amount)::double precision AS remaining_amount,
      status,
      debt_date::text AS debt_date,
      due_date::text AS due_date,
      paid_date::text AS paid_date,
      description,
      created_at::text AS created_at
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
    'due_date',
    'description',
  ] as const;

  await db`
    INSERT INTO debts ${sql(payload, ...allowedColumns)}
  `;
};

// Update debt payment state and return latest debt row
export const updatePaymentStateById = async (
  db: ReservedSQL,
  debtId: string,
  paidAmount: number,
  status: DebtStatus,
  paidDate: string | null,
): Promise<void> => {
  await db`
    UPDATE debts
    SET
      paid_amount = ${paidAmount},
      status = ${status},
      paid_date = ${paidDate},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${debtId}
      AND deleted_at IS NULL
  `;
};
