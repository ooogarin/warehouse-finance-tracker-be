import type { z } from 'zod';
import type { createDebtPaymentSchema, createDebtSchema, debtListQuerySchema, debtParamsSchema } from './debt.schema';
import type { DebtPaymentMap } from './debt-payments/debt-payment.type';

export type DebtCreditorType = 'owner' | 'supplier' | 'other';
export type DebtStatus = 'unpaid' | 'partial' | 'paid';

// ----------------------------------------------------------------------------------------------------
// Request contracts
// ----------------------------------------------------------------------------------------------------

export type DebtListQuery = z.infer<typeof debtListQuerySchema>;

export type DebtParams = z.infer<typeof debtParamsSchema>;

export type CreateDebtRequest = z.infer<typeof createDebtSchema>;

export type CreateDebtPaymentRequest = z.infer<typeof createDebtPaymentSchema>;

export type ListDebtsRequest = DebtListQuery & {
  merchantId: string;
};

export type GetDebtRequest = {
  merchantId: string;
  debtId: string;
};

// ----------------------------------------------------------------------------------------------------
// Service operations
// ----------------------------------------------------------------------------------------------------

export type DebtMap = {
  id: string;
  creditor_type: DebtCreditorType;
  creditor_name: string | null;
  supplier_id: string | null;
  supplier_name: string | null;
  purchase_order_id: string | null;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: DebtStatus;
  is_overdue: boolean;
  debt_date: string;
  due_date: string | null;
  paid_date: string | null;
  description: string | null;
  created_at: string;
};

export type DebtSummaryMap = {
  total_active_debt: number;
  supplier_debt: number;
  owner_debt: number;
  overdue_count: number;
};

export type DebtListMap = {
  summary: DebtSummaryMap;
  debts: DebtMap[];
};

export type DebtDetailMap = DebtMap & {
  payments: DebtPaymentMap[];
};

// ----------------------------------------------------------------------------------------------------
// Repository payloads
// ----------------------------------------------------------------------------------------------------

export type DebtInsertPayload = {
  id: string;
  merchant_id: string;
  supplier_id?: string | null;
  creditor_name?: string | null;
  creditor_type: DebtCreditorType;
  purchase_order_id?: string | null;
  total_amount: number;
  debt_date: string;
  due_date?: string | null;
  description?: string | null;
};

export type DebtListByMerchantIdOptions = {
  merchantId: string;
  creditorType?: DebtCreditorType;
  supplierId?: string;
  status?: DebtStatus | 'overdue';
};

// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

export interface DebtRow {
  id: string;
  merchant_id?: string;
  creditor_type: DebtCreditorType;
  creditor_name: string | null;
  supplier_id: string | null;
  supplier_name: string | null;
  purchase_order_id: string | null;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: DebtStatus;
  debt_date: string;
  due_date: string | null;
  paid_date: string | null;
  description: string | null;
  created_at: string;
}

export type DebtSummaryRow = DebtSummaryMap;

export type DebtUpdatePaymentPayload = {
  paid_amount: number;
  status: DebtStatus;
  paid_date: string | null;
};
