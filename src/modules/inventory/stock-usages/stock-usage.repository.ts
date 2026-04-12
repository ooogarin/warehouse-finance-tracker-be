import { sql } from '@/core/db/client';
import type { ReservedSQL } from '@/core/db/client';
import type {
  StockUsageHeaderByIdAndMerchantIdOptions,
  StockUsageHeaderRow,
  StockUsageInsertPayload,
  StockUsageListByMerchantIdOptions,
  StockUsageListRow,
} from './stock-usage.type';

// Get stock usage list by merchant
export const getAllByMerchantId = async ({
  merchantId,
  type,
  dateFrom,
  dateTo,
}: StockUsageListByMerchantIdOptions): Promise<StockUsageListRow[]> => {
  return await sql<StockUsageListRow[]>`
    SELECT
      su.id,
      su.merchant_id,
      su.usage_date::text AS usage_date,
      su.type,
      su.notes,
      COUNT(sui.id)::integer AS item_count,
      COALESCE(SUM(sui.subtotal), 0)::double precision AS total_cogs,
      su.created_at::text AS created_at
    FROM stock_usages su
    LEFT JOIN stock_usage_items sui ON sui.stock_usage_id = su.id
      AND sui.deleted_at IS NULL
    WHERE su.merchant_id = ${merchantId}
      AND su.type = ${type}
      AND su.deleted_at IS NULL
      AND (
        ${dateFrom ?? null}::date IS NULL
        OR su.usage_date >= ${dateFrom ?? null}::date
      )
      AND (
        ${dateTo ?? null}::date IS NULL
        OR su.usage_date < (${dateTo ?? null}::date + INTERVAL '1 day')
      )
    GROUP BY su.id
    ORDER BY su.usage_date DESC, su.created_at DESC
  `;
};

// Get one stock usage header by ID and merchant
export const getHeaderByIdAndMerchantId = async ({
  stockUsageId,
  merchantId,
  type,
}: StockUsageHeaderByIdAndMerchantIdOptions): Promise<StockUsageHeaderRow | null> => {
  const [result] = await sql<StockUsageHeaderRow[]>`
    SELECT
      su.id,
      su.merchant_id,
      su.usage_date::text AS usage_date,
      su.type,
      su.notes,
      COALESCE(SUM(sui.subtotal), 0)::double precision AS total_cogs,
      su.created_at::text AS created_at
    FROM stock_usages su
    LEFT JOIN stock_usage_items sui ON sui.stock_usage_id = su.id
      AND sui.deleted_at IS NULL
    WHERE su.id = ${stockUsageId}
      AND su.merchant_id = ${merchantId}
      AND su.type = ${type}
      AND su.deleted_at IS NULL
    GROUP BY su.id
    LIMIT 1
  `;

  return result ?? null;
};

// Insert stock usage header
export const insert = async (db: ReservedSQL, payload: StockUsageInsertPayload): Promise<void> => {
  const allowedColumns = ['id', 'merchant_id', 'usage_date', 'type', 'notes'] as const;

  await db`
    INSERT INTO stock_usages ${sql(payload, ...allowedColumns)}
  `;
};
