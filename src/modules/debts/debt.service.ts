import { commitTransaction, rollbackTransaction, startTransaction } from '@/core/db/client';
import { internalError, isAppError, notFoundError, validationError } from '@/core/errors/app-error';
import * as cashService from '@/modules/cash/cash.service';
import * as supplierRepository from '@/modules/suppliers/supplier.repository';
import { generateUUID } from '@/shared/utils/crypto.util';
import * as debtRepository from './debt.repository';
import * as debtPaymentRepository from './debt-payments/debt-payment.repository';
import type { ReservedSQL } from '@/core/db/client';
import type {
  CreateDebtPaymentRequest,
  CreateDebtRequest,
  DebtDetailMap,
  DebtInsertPayload,
  DebtListMap,
  DebtMap,
  DebtRow,
  DebtStatus,
  GetDebtRequest,
  ListDebtsRequest,
} from './debt.type';
import type { DebtPaymentMap } from './debt-payments/debt-payment.type';

const MONEY_EPSILON = 1e-6;

// Get debt management list and summary
export const list = async ({ merchantId, creditor_type, supplier_id, status }: ListDebtsRequest): Promise<DebtListMap> => {
  try {
    const [summary, debts] = await Promise.all([
      debtRepository.getSummaryByMerchantId(merchantId),
      debtRepository.getAllByMerchantId({
        merchantId,
        creditorType: creditor_type,
        supplierId: supplier_id,
        status,
      }),
    ]);

    return {
      summary,
      debts: debts.map(toDebtMap),
    };
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to list debts');
  }
};

// Get debt detail
export const getDetail = async ({ merchantId, debtId }: GetDebtRequest): Promise<DebtDetailMap> => {
  try {
    const debt = await debtRepository.getOneByIdAndMerchantId(debtId, merchantId);
    if (!debt) {
      throw notFoundError('Debt not found');
    }

    const payments = await getPaymentHistoryByDebtId(debtId);

    return {
      ...toDebtMap(debt),
      payments,
    };
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to get debt detail');
  }
};

// Create manual debt
export const createManual = async (merchantId: string, data: CreateDebtRequest): Promise<DebtMap> => {
  let connection: ReservedSQL | null = null;

  try {
    const creditorName = await resolveCreditorName(merchantId, data);

    connection = await startTransaction();

    const debtId = generateUUID();
    await debtRepository.insert(connection, {
      id: debtId,
      merchant_id: merchantId,
      supplier_id: data.creditor_type === 'supplier' ? data.supplier_id : null,
      creditor_name: creditorName,
      creditor_type: data.creditor_type,
      purchase_order_id: null,
      total_amount: data.total_amount,
      debt_date: data.debt_date,
      due_date: data.due_date ?? null,
      description: data.description ?? null,
    });

    await commitTransaction(connection);

    const created = await debtRepository.getOneByIdAndMerchantId(debtId, merchantId);
    if (!created) {
      throw notFoundError('Debt not found');
    }

    return toDebtMap(created);
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to create debt');
  }
};

// Create debt payment and cash outflow in one transaction
export const pay = async (
  { merchantId, debtId }: GetDebtRequest,
  userId: string,
  data: CreateDebtPaymentRequest,
): Promise<DebtDetailMap> => {
  let connection: ReservedSQL | null = null;

  try {
    const debt = await debtRepository.getOneByIdAndMerchantId(debtId, merchantId);
    if (!debt) {
      throw notFoundError('Debt not found');
    }

    if (debt.status === 'paid') {
      throw validationError('Debt is already paid');
    }

    if (data.amount - debt.remaining_amount > MONEY_EPSILON) {
      throw validationError('Payment amount exceeds remaining debt');
    }

    const nextPaidAmount = debt.paid_amount + data.amount;
    const nextStatus = deriveDebtStatus(nextPaidAmount, debt.total_amount);
    const paidDate = nextStatus === 'paid' ? new Date().toISOString().slice(0, 10) : null;
    const debtPaymentId = generateUUID();
    const paymentDate = new Date().toISOString();

    connection = await startTransaction();

    await debtPaymentRepository.insert(connection, {
      id: debtPaymentId,
      debt_id: debtId,
      amount: data.amount,
      payment_method: data.payment_method,
      reference_number: data.reference_number ?? null,
      notes: data.notes ?? null,
      created_by: userId,
    });

    await debtRepository.updatePaymentStateById(connection, debtId, nextPaidAmount, nextStatus, paidDate);

    await cashService.recordDebtPaymentOutflow({
      db: connection,
      merchantId,
      debtPaymentId,
      cashLogDate: paymentDate,
      amount: data.amount,
      description: `Debt payment for ${getCreditorDisplayName(debt)}`,
      createdBy: userId,
    });

    await commitTransaction(connection);

    return await getDetail({ merchantId, debtId });
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to create debt payment');
  }
};

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
    created_by: row.created_by,
    created_by_name: row.created_by_name,
    created_at: row.created_at,
  }));
};

// Create debt row
export const create = async (db: ReservedSQL, payload: DebtInsertPayload): Promise<void> => {
  await debtRepository.insert(db, payload);
};

const toDebtMap = (debt: DebtRow): DebtMap => {
  return {
    id: debt.id,
    creditor_type: debt.creditor_type,
    creditor_name: debt.creditor_name,
    supplier_id: debt.supplier_id,
    supplier_name: debt.supplier_name,
    purchase_order_id: debt.purchase_order_id,
    total_amount: debt.total_amount,
    paid_amount: debt.paid_amount,
    remaining_amount: debt.remaining_amount,
    status: debt.status,
    is_overdue: isDebtOverdue(debt),
    debt_date: debt.debt_date,
    due_date: debt.due_date,
    paid_date: debt.paid_date,
    description: debt.description,
    created_at: debt.created_at,
  };
};

const resolveCreditorName = async (merchantId: string, data: CreateDebtRequest): Promise<string | null> => {
  if (data.creditor_type === 'supplier' && data.supplier_id) {
    const supplier = await supplierRepository.getOneByIdAndMerchantId(data.supplier_id, merchantId);
    if (!supplier) {
      throw notFoundError('Supplier not found');
    }

    return supplier.name;
  }

  return data.creditor_name ?? null;
};

const deriveDebtStatus = (paidAmount: number, totalAmount: number): DebtStatus => {
  if (Math.abs(paidAmount - totalAmount) <= MONEY_EPSILON) {
    return 'paid';
  }

  if (paidAmount > 0) {
    return 'partial';
  }

  return 'unpaid';
};

const isDebtOverdue = (debt: DebtRow): boolean => {
  if (!debt.due_date || debt.status === 'paid') {
    return false;
  }

  return new Date(debt.due_date).getTime() < startOfToday().getTime();
};

const startOfToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getCreditorDisplayName = (debt: DebtRow): string => {
  if (debt.creditor_type === 'supplier') {
    return debt.supplier_name ?? 'supplier';
  }

  return debt.creditor_name ?? debt.creditor_type;
};
