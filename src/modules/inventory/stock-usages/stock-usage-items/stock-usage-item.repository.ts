import { sql } from '@/core/db/client';
import type { ReservedSQL } from '@/core/db/client';
import type { StockUsageItemInsertPayload, StockUsageItemRow } from './stock-usage-item.type';

// Get stock usage items by stock usage ID
export const getAllByStockUsageId = async (stockUsageId: string): Promise<StockUsageItemRow[]> => {
  return await sql<StockUsageItemRow[]>`
    SELECT
      sui.id,
      sui.stock_usage_id,
      sui.ingredient_id,
      i.name AS ingredient_name,
      i.category AS ingredient_category,
      sui.ingredient_unit_id,
      iu.unit_name,
      sui.quantity::double precision AS quantity,
      sui.unit_price::double precision AS unit_price,
      sui.subtotal::double precision AS subtotal,
      sui.notes,
      sui.created_at::text AS created_at
    FROM stock_usage_items sui
    INNER JOIN ingredients i ON i.id = sui.ingredient_id
    INNER JOIN ingredient_units iu ON iu.id = sui.ingredient_unit_id
    WHERE sui.stock_usage_id = ${stockUsageId}
      AND sui.deleted_at IS NULL
    ORDER BY sui.created_at ASC
  `;
};

// Insert stock usage item
export const insert = async (db: ReservedSQL, payload: StockUsageItemInsertPayload): Promise<void> => {
  const allowedColumns = ['id', 'stock_usage_id', 'ingredient_id', 'quantity', 'ingredient_unit_id', 'unit_price', 'notes'] as const;

  await db`
    INSERT INTO stock_usage_items ${sql(payload, ...allowedColumns)}
  `;
};
