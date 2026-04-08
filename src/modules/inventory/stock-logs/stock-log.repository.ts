import { sql } from '@/core/db/client';
import type { ReservedSQL } from '@/core/db/client';
import type { StockLogInsertPayload } from './stock-log.type';

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
