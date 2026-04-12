import { sql } from '@/core/db/client';
import type { ReservedSQL } from '@/core/db/client';
import type {
  StockAdjustmentHeaderByIdAndMerchantIdOptions,
  StockAdjustmentHeaderRow,
  StockAdjustmentInsertPayload,
  StockAdjustmentListByMerchantIdOptions,
  StockAdjustmentListRow,
} from './stock-adjustment.type';

// Get stock adjustment list by merchant
export const getAllByMerchantId = async ({
  merchantId,
  dateFrom,
  dateTo,
}: StockAdjustmentListByMerchantIdOptions): Promise<StockAdjustmentListRow[]> => {
  return await sql<StockAdjustmentListRow[]>`
    SELECT
      sa.id,
      sa.merchant_id,
      sa.adjustment_date::text AS adjustment_date,
      sa.notes,
      COUNT(sai.id)::integer AS item_count,
      COUNT(sai.id) FILTER (WHERE sai.flow_type = 'in')::integer AS in_item_count,
      COUNT(sai.id) FILTER (WHERE sai.flow_type = 'out')::integer AS out_item_count,
      COALESCE(SUM(sai.subtotal) FILTER (WHERE sai.flow_type = 'in'), 0)::double precision AS total_in_value,
      COALESCE(SUM(sai.subtotal) FILTER (WHERE sai.flow_type = 'out'), 0)::double precision AS total_out_value,
      sa.created_at::text AS created_at
    FROM stock_adjustments sa
    LEFT JOIN stock_adjustment_items sai ON sai.stock_adjustment_id = sa.id
      AND sai.deleted_at IS NULL
    WHERE sa.merchant_id = ${merchantId}
      AND sa.deleted_at IS NULL
      AND (
        ${dateFrom ?? null}::date IS NULL
        OR sa.adjustment_date >= ${dateFrom ?? null}::date
      )
      AND (
        ${dateTo ?? null}::date IS NULL
        OR sa.adjustment_date < (${dateTo ?? null}::date + INTERVAL '1 day')
      )
    GROUP BY sa.id
    ORDER BY sa.adjustment_date DESC, sa.created_at DESC
  `;
};

// Get one stock adjustment header by ID and merchant
export const getHeaderByIdAndMerchantId = async ({
  stockAdjustmentId,
  merchantId,
}: StockAdjustmentHeaderByIdAndMerchantIdOptions): Promise<StockAdjustmentHeaderRow | null> => {
  const [result] = await sql<StockAdjustmentHeaderRow[]>`
    SELECT
      sa.id,
      sa.merchant_id,
      sa.adjustment_date::text AS adjustment_date,
      sa.notes,
      COUNT(sai.id)::integer AS item_count,
      COUNT(sai.id) FILTER (WHERE sai.flow_type = 'in')::integer AS in_item_count,
      COUNT(sai.id) FILTER (WHERE sai.flow_type = 'out')::integer AS out_item_count,
      COALESCE(SUM(sai.subtotal) FILTER (WHERE sai.flow_type = 'in'), 0)::double precision AS total_in_value,
      COALESCE(SUM(sai.subtotal) FILTER (WHERE sai.flow_type = 'out'), 0)::double precision AS total_out_value,
      sa.created_at::text AS created_at
    FROM stock_adjustments sa
    LEFT JOIN stock_adjustment_items sai ON sai.stock_adjustment_id = sa.id
      AND sai.deleted_at IS NULL
    WHERE sa.id = ${stockAdjustmentId}
      AND sa.merchant_id = ${merchantId}
      AND sa.deleted_at IS NULL
    GROUP BY sa.id
    LIMIT 1
  `;

  return result ?? null;
};

// Insert stock adjustment header
export const insert = async (db: ReservedSQL, payload: StockAdjustmentInsertPayload): Promise<void> => {
  const allowedColumns = ['id', 'merchant_id', 'adjustment_date', 'notes'] as const;

  await db`
    INSERT INTO stock_adjustments ${sql(payload, ...allowedColumns)}
  `;
};
