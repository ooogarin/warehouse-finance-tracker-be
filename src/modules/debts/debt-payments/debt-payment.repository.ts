import { sql } from '@/core/db/client';
import type { DebtPaymentRow } from './debt-payment.type';

// Get debt payment history for one debt
export const getAllByDebtId = async (debtId: string): Promise<DebtPaymentRow[]> => {
  return await sql<DebtPaymentRow[]>`
    SELECT
      id,
      amount::double precision AS amount,
      payment_method,
      reference_number,
      notes,
      created_at::text AS created_at
    FROM debt_payments
    WHERE debt_id = ${debtId}
    ORDER BY created_at DESC
  `;
};
