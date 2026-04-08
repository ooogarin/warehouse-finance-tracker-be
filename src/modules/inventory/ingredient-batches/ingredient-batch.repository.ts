import { sql } from '@/core/db/client';
import type { ReservedSQL } from '@/core/db/client';
import type { IngredientBatchInsertPayload } from './ingredient-batch.type';

// Insert ingredient batch
export const insert = async (db: ReservedSQL, payload: IngredientBatchInsertPayload): Promise<void> => {
  const allowedColumns = ['id', 'ingredient_id', 'qty_initial', 'qty_remaining', 'cost_per_unit', 'purchase_date'] as const;

  await db`
    INSERT INTO ingredient_batches ${sql(payload, ...allowedColumns)}
  `;
};
