import { validationError } from '@/core/errors/app-error';
import * as merchantRepository from '@/modules/merchants/merchant.repository';
import * as cashLogRepository from './cash-log.repository';
import type { ReservedSQL } from '@/core/db/client';

// Record opening balance cash log after merchant creation
export const recordOpeningBalanceInflow = async ({
  db,
  merchantId,
  cashLogDate,
  amount,
  description,
  balanceAfter,
  createdBy,
}: {
  db: ReservedSQL;
  merchantId: string;
  cashLogDate: string;
  amount: string | number;
  description: string;
  balanceAfter: string | number;
  createdBy: string;
}): Promise<void> => {
  await cashLogRepository.insert(db, {
    id: crypto.randomUUID(),
    merchant_id: merchantId,
    flow_type: 'in',
    cash_log_date: cashLogDate,
    amount,
    category: 'capital_injection',
    description,
    balance_after: balanceAfter,
    created_by: createdBy,
  });
};

// Apply purchase payment cash outflow and return latest balance
export const recordPurchasePaymentOutflow = async ({
  db,
  merchantId,
  purchaseOrderId,
  cashLogDate,
  amount,
  description,
  createdBy,
}: {
  db: ReservedSQL;
  merchantId: string;
  purchaseOrderId: string;
  cashLogDate: string;
  amount: number;
  description: string;
  createdBy: string;
}): Promise<number> => {
  const balanceAfter = await merchantRepository.decreaseCashBalanceById(db, merchantId, amount);
  if (balanceAfter === null) {
    throw validationError('Insufficient merchant cash balance for paid_cash');
  }

  await cashLogRepository.insert(db, {
    id: crypto.randomUUID(),
    merchant_id: merchantId,
    flow_type: 'out',
    cash_log_date: cashLogDate,
    amount,
    category: 'purchase_payment',
    description,
    balance_after: balanceAfter,
    reference_id: purchaseOrderId,
    reference_type: 'purchase_order',
    created_by: createdBy,
  });

  return balanceAfter;
};
