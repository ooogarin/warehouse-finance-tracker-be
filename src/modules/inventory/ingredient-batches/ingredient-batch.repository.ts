import { sql } from '@/core/db/client';
import type { ReservedSQL } from '@/core/db/client';
import type { IngredientBatchInsertPayload, IngredientBatchRow } from './ingredient-batch.type';

// Get active batches by ingredient, ordered for FIFO display
export const getActiveByIngredientId = async (ingredientId: string): Promise<IngredientBatchRow[]> => {
  return await sql<IngredientBatchRow[]>`
    SELECT
      id,
      ingredient_id,
      qty_initial::double precision AS qty_initial,
      qty_remaining::double precision AS qty_remaining,
      cost_per_unit::double precision AS cost_per_unit,
      purchase_date::text AS purchase_date,
      (qty_remaining * cost_per_unit)::double precision AS batch_value
    FROM ingredient_batches
    WHERE ingredient_id = ${ingredientId}
      AND deleted_at IS NULL
      AND qty_remaining > 0
    ORDER BY purchase_date ASC, created_at ASC
  `;
};

// Lock active batches by ingredient, ordered for FIFO stock mutation
export const getActiveByIngredientIdForUpdate = async (db: ReservedSQL, ingredientId: string): Promise<IngredientBatchRow[]> => {
  return await db<IngredientBatchRow[]>`
    SELECT
      id,
      ingredient_id,
      qty_initial::double precision AS qty_initial,
      qty_remaining::double precision AS qty_remaining,
      cost_per_unit::double precision AS cost_per_unit,
      purchase_date::text AS purchase_date,
      (qty_remaining * cost_per_unit)::double precision AS batch_value
    FROM ingredient_batches
    WHERE ingredient_id = ${ingredientId}
      AND deleted_at IS NULL
      AND qty_remaining > 0
    ORDER BY purchase_date ASC, created_at ASC
    FOR UPDATE
  `;
};

// Update remaining quantity for one ingredient batch
export const updateRemainingById = async (db: ReservedSQL, batchId: string, quantity: number): Promise<void> => {
  await db`
    UPDATE ingredient_batches
    SET
      qty_remaining = ${quantity},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${batchId}
      AND deleted_at IS NULL
  `;
};

// Insert ingredient batch
export const insert = async (db: ReservedSQL, payload: IngredientBatchInsertPayload): Promise<void> => {
  const allowedColumns = ['id', 'ingredient_id', 'qty_initial', 'qty_remaining', 'cost_per_unit', 'purchase_date'] as const;

  await db`
    INSERT INTO ingredient_batches ${sql(payload, ...allowedColumns)}
  `;
};
