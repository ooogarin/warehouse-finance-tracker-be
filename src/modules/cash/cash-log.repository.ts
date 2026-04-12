import { sql } from '@/core/db/client';
import type { ReservedSQL } from '@/core/db/client';
import type { CashLogInsertPayload, CashLogListByMerchantIdOptions, CashLogRow, CashSummaryRow } from './cash-log.type';

// Get cash summary for one merchant
export const getSummaryByMerchantId = async (merchantId: string): Promise<CashSummaryRow> => {
  const [result] = await sql<CashSummaryRow[]>`
    SELECT
      m.cash_balance::double precision AS current_balance,
      COALESCE(SUM(cl.amount) FILTER (
        WHERE cl.flow_type = 'in'
          AND cl.cash_log_date::date = CURRENT_DATE
      ), 0)::double precision AS total_in_today,
      COALESCE(SUM(cl.amount) FILTER (
        WHERE cl.flow_type = 'out'
          AND cl.cash_log_date::date = CURRENT_DATE
      ), 0)::double precision AS total_out_today
    FROM merchants m
    LEFT JOIN cash_logs cl ON cl.merchant_id = m.id
    WHERE m.id = ${merchantId}
      AND m.deleted_at IS NULL
    GROUP BY m.cash_balance
  `;

  return result ?? { current_balance: 0, total_in_today: 0, total_out_today: 0 };
};

// Get cash transaction list by merchant
export const getAllByMerchantId = async ({
  merchantId,
  search,
  flowType,
  category,
  dateFrom,
  dateTo,
}: CashLogListByMerchantIdOptions): Promise<CashLogRow[]> => {
  const searchPattern = search?.trim() ? `%${search.trim()}%` : null;

  return await sql<CashLogRow[]>`
    SELECT
      cl.id,
      cl.merchant_id,
      cl.flow_type,
      cl.cash_log_date::text AS cash_log_date,
      cl.amount::double precision AS amount,
      cl.category,
      cl.description,
      cl.balance_after::double precision AS balance_after,
      cl.reference_id,
      cl.reference_type,
      cl.created_by,
      u.name AS created_by_name,
      cl.created_at::text AS created_at
    FROM cash_logs cl
    LEFT JOIN users u ON u.id = cl.created_by
    WHERE cl.merchant_id = ${merchantId}
      AND (
        ${searchPattern}::text IS NULL
        OR COALESCE(cl.description, '') ILIKE ${searchPattern}
      )
      AND (
        ${flowType ?? null}::cash_log_flow_type IS NULL
        OR cl.flow_type = ${flowType ?? null}
      )
      AND (
        ${category ?? null}::cash_log_category IS NULL
        OR cl.category = ${category ?? null}
      )
      AND (
        ${dateFrom ?? null}::date IS NULL
        OR cl.cash_log_date::date >= ${dateFrom ?? null}::date
      )
      AND (
        ${dateTo ?? null}::date IS NULL
        OR cl.cash_log_date::date <= ${dateTo ?? null}::date
      )
    ORDER BY cl.cash_log_date DESC, cl.created_at DESC
  `;
};

// Get one cash transaction by ID and merchant
export const getOneByIdAndMerchantId = async (cashLogId: string, merchantId: string): Promise<CashLogRow | null> => {
  const [result] = await sql<CashLogRow[]>`
    SELECT
      cl.id,
      cl.merchant_id,
      cl.flow_type,
      cl.cash_log_date::text AS cash_log_date,
      cl.amount::double precision AS amount,
      cl.category,
      cl.description,
      cl.balance_after::double precision AS balance_after,
      cl.reference_id,
      cl.reference_type,
      cl.created_by,
      u.name AS created_by_name,
      cl.created_at::text AS created_at
    FROM cash_logs cl
    LEFT JOIN users u ON u.id = cl.created_by
    WHERE cl.id = ${cashLogId}
      AND cl.merchant_id = ${merchantId}
    LIMIT 1
  `;

  return result ?? null;
};

// Insert cash log
export const insert = async (db: ReservedSQL, payload: CashLogInsertPayload): Promise<void> => {
  const allowedColumns = [
    'id',
    'merchant_id',
    'flow_type',
    'cash_log_date',
    'amount',
    'category',
    'description',
    'balance_after',
    'reference_id',
    'reference_type',
    'created_by',
  ] as const;

  await db`
    INSERT INTO cash_logs ${sql(payload, ...allowedColumns)}
  `;
};
