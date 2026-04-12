import { sql } from '@/core/db/client';
import type { ReservedSQL } from '@/core/db/client';
import type { DebtPaymentInsertPayload, DebtPaymentRow } from './debt-payment.type';

// Get debt payment history for one debt
export const getAllByDebtId = async (debtId: string): Promise<DebtPaymentRow[]> => {
  return await sql<DebtPaymentRow[]>`
    SELECT
      debt_payments.id,
      debt_payments.amount::double precision AS amount,
      debt_payments.payment_method,
      debt_payments.reference_number,
      debt_payments.notes,
      debt_payments.created_by,
      u.name AS created_by_name,
      debt_payments.created_at::text AS created_at
    FROM debt_payments
    LEFT JOIN users u ON u.id = debt_payments.created_by
    WHERE debt_id = ${debtId}
    ORDER BY debt_payments.created_at DESC
  `;
};

// Insert one debt payment
export const insert = async (db: ReservedSQL, payload: DebtPaymentInsertPayload): Promise<DebtPaymentRow> => {
  const allowedColumns = ['id', 'debt_id', 'amount', 'payment_method', 'reference_number', 'notes', 'created_by'] as const;

  const [result] = await db<DebtPaymentRow[]>`
    INSERT INTO debt_payments ${sql(payload, ...allowedColumns)}
    RETURNING
      id,
      amount::double precision AS amount,
      payment_method,
      reference_number,
      notes,
      created_by,
      NULL::text AS created_by_name,
      created_at::text AS created_at
  `;

  if (!result) {
    throw new Error('Debt payment insert failed');
  }

  return result;
};
