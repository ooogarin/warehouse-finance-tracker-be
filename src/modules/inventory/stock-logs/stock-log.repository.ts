import { sql } from '@/core/db/client';
import type { ReservedSQL } from '@/core/db/client';
import type { StockLogInsertPayload, StockLogListOptions, StockLogRow } from './stock-log.type';

// Get stock logs by ingredient
export const getAllByIngredientId = async ({ ingredientId, referenceType }: StockLogListOptions): Promise<StockLogRow[]> => {
  return await sql<StockLogRow[]>`
    SELECT
      id,
      ingredient_id,
      flow_type,
      base_unit_quantity::double precision AS base_unit_quantity,
      base_unit_price::double precision AS base_unit_price,
      total_amount::double precision AS total_amount,
      notes,
      balance_after::double precision AS balance_after,
      reference_id,
      reference_type,
      created_by,
      created_at::text AS created_at
    FROM stock_logs
    WHERE ingredient_id = ${ingredientId}
      AND (
        ${referenceType ?? null}::stock_log_reference_type IS NULL
        OR reference_type = ${referenceType ?? null}::stock_log_reference_type
      )
    ORDER BY created_at DESC
  `;
};

// Insert stock log
export const insert = async (db: ReservedSQL, payload: StockLogInsertPayload): Promise<void> => {
  const allowedColumns = [
    'id',
    'ingredient_id',
    'flow_type',
    'base_unit_quantity',
    'base_unit_price',
    'notes',
    'balance_after',
    'reference_id',
    'reference_type',
    'created_by',
  ] as const;

  await db`
    INSERT INTO stock_logs ${sql(payload, ...allowedColumns)}
  `;
};
