import { sql } from '@/core/db/client';
import type { ReservedSQL } from '@/core/db/client';
import type { CashLogInsertPayload } from './cash.type';

// Insert opening balance cash log
export const insertOpeningBalanceLog = async (db: ReservedSQL, payload: CashLogInsertPayload): Promise<void> => {
  const allowedColumns = ['id', 'merchant_id', 'flow_type', 'cash_log_date', 'amount', 'category', 'description', 'balance_after', 'created_by'] as const;

  await db`
    INSERT INTO cash_logs ${sql(payload, ...allowedColumns)}
  `;
};
