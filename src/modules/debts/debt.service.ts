import * as debtRepository from './debt.repository';
import * as debtPaymentRepository from './debt-payments/debt-payment.repository';
import type { ReservedSQL } from '@/core/db/client';
import type { DebtInsertPayload, DebtRow } from './debt.type';
import type { DebtPaymentMap } from './debt-payments/debt-payment.type';

// Get supplier debt for one purchase order
export const getSupplierDebtByPurchaseOrderId = async (purchaseOrderId: string): Promise<DebtRow | null> => {
  return await debtRepository.getSupplierDebtByPurchaseOrderId(purchaseOrderId);
};

// Get debt payment history for one purchase order debt
export const getPaymentHistoryByDebtId = async (debtId: string): Promise<DebtPaymentMap[]> => {
  const rows = await debtPaymentRepository.getAllByDebtId(debtId);

  return rows.map((row) => ({
    id: row.id,
    amount: row.amount,
    payment_method: row.payment_method,
    reference_number: row.reference_number,
    notes: row.notes,
    created_at: row.created_at,
  }));
};

// Create debt row
export const create = async (db: ReservedSQL, payload: DebtInsertPayload): Promise<void> => {
  await debtRepository.insert(db, payload);
};
