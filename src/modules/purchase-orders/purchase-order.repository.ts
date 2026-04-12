import { sql } from '@/core/db/client';
import type { ReservedSQL } from '@/core/db/client';
import type {
  PurchaseOrderHeaderRow,
  PurchaseOrderInsertPayload,
  PurchaseOrderListByMerchantIdOptions,
  PurchaseOrderListRow,
} from './purchase-order.type';

// Get purchase order list by merchant
export const listByMerchantId = async ({
  merchantId,
  search,
  supplierId,
  dateFrom,
  dateTo,
}: PurchaseOrderListByMerchantIdOptions): Promise<PurchaseOrderListRow[]> => {
  const searchPattern = search?.trim() ? `%${search.trim()}%` : null;

  return await sql<PurchaseOrderListRow[]>`
    SELECT
      po.id,
      po.purchase_date::text AS purchase_date,
      po.supplier_id,
      s.name AS supplier_name,
      po.invoice_number,
      po.total_amount::double precision AS total_amount,
      po.debt_amount::double precision AS debt_amount,
      CASE
        WHEN po.debt_amount = 0 THEN 'lunas'
        WHEN supplier_debt.status = 'paid' THEN 'lunas'
        WHEN COALESCE(supplier_debt.paid_amount, 0) > 0 THEN 'sebagian'
        ELSE 'belum_lunas'
      END AS payment_status
    FROM purchase_orders po
    LEFT JOIN suppliers s ON s.id = po.supplier_id
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
    WHERE po.merchant_id = ${merchantId}
      AND po.deleted_at IS NULL
      AND (
        ${searchPattern}::text IS NULL
        OR po.invoice_number ILIKE ${searchPattern}
        OR COALESCE(s.name, '') ILIKE ${searchPattern}
      )
      AND (
        ${supplierId ?? null}::uuid IS NULL
        OR po.supplier_id = ${supplierId ?? null}
      )
      AND (
        ${dateFrom ?? null}::date IS NULL
        OR po.purchase_date::date >= ${dateFrom ?? null}::date
      )
      AND (
        ${dateTo ?? null}::date IS NULL
        OR po.purchase_date::date <= ${dateTo ?? null}::date
      )
    ORDER BY po.purchase_date DESC, po.created_at DESC
  `;
};

// Get purchase order header by ID and merchant
export const getHeaderByIdAndMerchantId = async (purchaseOrderId: string, merchantId: string): Promise<PurchaseOrderHeaderRow | null> => {
  const [result] = await sql<PurchaseOrderHeaderRow[]>`
    SELECT
      po.id,
      po.merchant_id,
      po.purchase_date::text AS purchase_date,
      po.supplier_id,
      s.name AS supplier_name,
      po.invoice_number,
      po.total_amount::double precision AS total_amount,
      po.paid_cash::double precision AS paid_cash,
      po.paid_owner::double precision AS paid_owner,
      po.debt_amount::double precision AS debt_amount,
      po.notes,
      po.created_at::text AS created_at
    FROM purchase_orders po
    LEFT JOIN suppliers s ON s.id = po.supplier_id
    WHERE po.id = ${purchaseOrderId}
      AND po.merchant_id = ${merchantId}
      AND po.deleted_at IS NULL
    LIMIT 1
  `;

  return result ?? null;
};

// Insert one purchase order
export const insert = async (db: ReservedSQL, payload: PurchaseOrderInsertPayload): Promise<void> => {
  const allowedColumns = [
    'id',
    'merchant_id',
    'purchase_date',
    'supplier_id',
    'invoice_number',
    'total_amount',
    'paid_cash',
    'paid_owner',
    'debt_amount',
    'notes',
  ] as const;

  await db`
    INSERT INTO purchase_orders ${sql(payload, ...allowedColumns)}
  `;
};

// Get next purchase order invoice sequence for one merchant and date
export const getNextDailyInvoiceSequence = async (merchantId: string, purchaseDate: string, dateToken: string): Promise<number> => {
  const [result] = await sql<{ latest_sequence: number | null }[]>`
    SELECT
      MAX(RIGHT(invoice_number, 4)::integer) AS latest_sequence
    FROM purchase_orders
    WHERE merchant_id = ${merchantId}
      AND purchase_date::date = ${purchaseDate}::date
      AND invoice_number LIKE ${`PO-${dateToken}-%`}
      AND deleted_at IS NULL
  `;

  return (result?.latest_sequence ?? 0) + 1;
};
