import { sql } from '@/core/db/client';
import type { ReservedSQL } from '@/core/db/client';
import type { StockAdjustmentItemInsertPayload, StockAdjustmentItemRow } from './stock-adjustment-item.type';

// Get stock adjustment items by stock adjustment ID
export const getAllByStockAdjustmentId = async (stockAdjustmentId: string): Promise<StockAdjustmentItemRow[]> => {
  return await sql<StockAdjustmentItemRow[]>`
    SELECT
      sai.id,
      sai.stock_adjustment_id,
      sai.flow_type,
      sai.ingredient_id,
      i.name AS ingredient_name,
      i.category AS ingredient_category,
      sai.ingredient_unit_id,
      iu.unit_name,
      sai.quantity::double precision AS quantity,
      sai.unit_price::double precision AS unit_price,
      sai.subtotal::double precision AS subtotal,
      sai.notes,
      sai.created_at::text AS created_at
    FROM stock_adjustment_items sai
    INNER JOIN ingredients i ON i.id = sai.ingredient_id
    INNER JOIN ingredient_units iu ON iu.id = sai.ingredient_unit_id
    WHERE sai.stock_adjustment_id = ${stockAdjustmentId}
      AND sai.deleted_at IS NULL
    ORDER BY sai.created_at ASC
  `;
};

// Insert stock adjustment item
export const insert = async (db: ReservedSQL, payload: StockAdjustmentItemInsertPayload): Promise<void> => {
  const allowedColumns = [
    'id',
    'stock_adjustment_id',
    'flow_type',
    'ingredient_id',
    'quantity',
    'ingredient_unit_id',
    'unit_price',
    'notes',
  ] as const;

  await db`
    INSERT INTO stock_adjustment_items ${sql(payload, ...allowedColumns)}
  `;
};
