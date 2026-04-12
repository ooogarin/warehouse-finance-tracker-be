import { commitTransaction, rollbackTransaction, startTransaction } from '@/core/db/client';
import { internalError, isAppError, notFoundError, validationError } from '@/core/errors/app-error';
import * as merchantRepository from '@/modules/merchants/merchant.repository';
import { generateUUID } from '@/shared/utils/crypto.util';
import * as cashLogRepository from './cash-log.repository';
import type { ReservedSQL } from '@/core/db/client';
import type {
  CashListMap,
  CashLogMap,
  CashLogRow,
  CreateCashInRequest,
  CreateCashOutRequest,
  GetCashLogRequest,
  ListCashLogsRequest,
  RecordDebtPaymentOutflowRequest,
  RecordOpeningBalanceInflowRequest,
  RecordPurchasePaymentOutflowRequest,
} from './cash-log.type';

// Get cash management list and summary
export const list = async ({ merchantId, search, flow_type, category, date_from, date_to }: ListCashLogsRequest): Promise<CashListMap> => {
  try {
    const [summary, transactions] = await Promise.all([
      cashLogRepository.getSummaryByMerchantId(merchantId),
      cashLogRepository.getAllByMerchantId({
        merchantId,
        search,
        flowType: flow_type,
        category,
        dateFrom: date_from,
        dateTo: date_to,
      }),
    ]);

    return {
      summary,
      transactions: transactions.map(toCashLogMap),
    };
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to list cash transactions');
  }
};

// Get cash transaction detail
export const getDetail = async ({ merchantId, cashLogId }: GetCashLogRequest): Promise<CashLogMap> => {
  try {
    const cashLog = await cashLogRepository.getOneByIdAndMerchantId(cashLogId, merchantId);
    if (!cashLog) {
      throw notFoundError('Cash transaction not found');
    }

    return toCashLogMap(cashLog);
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to get cash transaction detail');
  }
};

// Create manual cash in transaction
export const createCashIn = async (merchantId: string, userId: string, data: CreateCashInRequest): Promise<CashLogMap> => {
  let connection: ReservedSQL | null = null;

  try {
    connection = await startTransaction();

    const balanceAfter = await merchantRepository.increaseCashBalanceById(connection, merchantId, data.amount);
    const cashLogId = generateUUID();

    await cashLogRepository.insert(connection, {
      id: cashLogId,
      merchant_id: merchantId,
      flow_type: 'in',
      cash_log_date: data.cash_log_date,
      amount: data.amount,
      category: data.category,
      description: data.description ?? null,
      balance_after: balanceAfter,
      created_by: userId,
    });

    await commitTransaction(connection);

    const created = await cashLogRepository.getOneByIdAndMerchantId(cashLogId, merchantId);
    if (!created) {
      throw notFoundError('Cash transaction not found');
    }

    return toCashLogMap(created);
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to create cash in transaction');
  }
};

// Create manual cash out transaction
export const createCashOut = async (merchantId: string, userId: string, data: CreateCashOutRequest): Promise<CashLogMap> => {
  let connection: ReservedSQL | null = null;

  try {
    connection = await startTransaction();

    const balanceAfter = await merchantRepository.decreaseCashBalanceById(connection, merchantId, data.amount);
    if (balanceAfter === null) {
      throw validationError('Insufficient merchant cash balance');
    }

    const cashLogId = generateUUID();

    await cashLogRepository.insert(connection, {
      id: cashLogId,
      merchant_id: merchantId,
      flow_type: 'out',
      cash_log_date: data.cash_log_date,
      amount: data.amount,
      category: data.category,
      description: data.description ?? null,
      balance_after: balanceAfter,
      created_by: userId,
    });

    await commitTransaction(connection);

    const created = await cashLogRepository.getOneByIdAndMerchantId(cashLogId, merchantId);
    if (!created) {
      throw notFoundError('Cash transaction not found');
    }

    return toCashLogMap(created);
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to create cash out transaction');
  }
};

// Record opening balance cash log after merchant creation
export const recordOpeningBalanceInflow = async ({
  db,
  merchantId,
  cashLogDate,
  amount,
  description,
  balanceAfter,
  createdBy,
}: RecordOpeningBalanceInflowRequest): Promise<void> => {
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
}: RecordPurchasePaymentOutflowRequest): Promise<number> => {
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

// Apply debt payment cash outflow and return latest balance
export const recordDebtPaymentOutflow = async ({
  db,
  merchantId,
  debtPaymentId,
  cashLogDate,
  amount,
  description,
  createdBy,
}: RecordDebtPaymentOutflowRequest): Promise<number> => {
  const balanceAfter = await merchantRepository.decreaseCashBalanceById(db, merchantId, amount);
  if (balanceAfter === null) {
    throw validationError('Insufficient merchant cash balance for debt payment');
  }

  await cashLogRepository.insert(db, {
    id: crypto.randomUUID(),
    merchant_id: merchantId,
    flow_type: 'out',
    cash_log_date: cashLogDate,
    amount,
    category: 'debt_payment_out',
    description,
    balance_after: balanceAfter,
    reference_id: debtPaymentId,
    reference_type: 'debt_payment',
    created_by: createdBy,
  });

  return balanceAfter;
};

const toCashLogMap = (cashLog: CashLogRow): CashLogMap => {
  return {
    id: cashLog.id,
    cash_log_date: cashLog.cash_log_date,
    flow_type: cashLog.flow_type,
    category: cashLog.category,
    amount: cashLog.amount,
    balance_after: cashLog.balance_after,
    description: cashLog.description,
    reference_id: cashLog.reference_id,
    reference_type: cashLog.reference_type,
    created_by: cashLog.created_by,
    created_by_name: cashLog.created_by_name,
    created_at: cashLog.created_at,
  };
};
