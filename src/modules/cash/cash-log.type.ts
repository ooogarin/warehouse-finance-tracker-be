import type { z } from 'zod';
import type { ReservedSQL } from '@/core/db/client';
import type { cashListQuerySchema, cashParamsSchema, createCashInSchema, createCashOutSchema } from './cash.schema';

export type CashFlowType = 'in' | 'out';

export type CashCategory =
  | 'sales_revenue'
  | 'capital_injection'
  | 'debt_repayment_in'
  | 'other_in'
  | 'purchase_payment'
  | 'debt_payment_out'
  | 'owner_withdrawal'
  | 'salary'
  | 'utilities'
  | 'rent'
  | 'maintenance'
  | 'other_out';

export type CashReferenceType = 'purchase_order' | 'debt_payment';

// ----------------------------------------------------------------------------------------------------
// Request contracts
// ----------------------------------------------------------------------------------------------------

export type CashListQuery = z.infer<typeof cashListQuerySchema>;

export type CashParams = z.infer<typeof cashParamsSchema>;

export type CreateCashInRequest = z.infer<typeof createCashInSchema>;

export type CreateCashOutRequest = z.infer<typeof createCashOutSchema>;

export type ListCashLogsRequest = CashListQuery & {
  merchantId: string;
};

export type GetCashLogRequest = {
  merchantId: string;
  cashLogId: string;
};

// ----------------------------------------------------------------------------------------------------
// Service operations
// ----------------------------------------------------------------------------------------------------

export type RecordOpeningBalanceInflowRequest = {
  db: ReservedSQL;
  merchantId: string;
  cashLogDate: string;
  amount: string | number;
  description: string;
  balanceAfter: string | number;
  createdBy: string;
};

export type RecordPurchasePaymentOutflowRequest = {
  db: ReservedSQL;
  merchantId: string;
  purchaseOrderId: string;
  cashLogDate: string;
  amount: number;
  description: string;
  createdBy: string;
};

export type RecordDebtPaymentOutflowRequest = {
  db: ReservedSQL;
  merchantId: string;
  debtPaymentId: string;
  cashLogDate: string;
  amount: number;
  description: string;
  createdBy: string;
};

export type CashSummaryMap = {
  current_balance: number;
  total_in_today: number;
  total_out_today: number;
};

export type CashLogMap = {
  id: string;
  cash_log_date: string;
  flow_type: CashFlowType;
  category: CashCategory;
  amount: number;
  balance_after: number | null;
  description: string | null;
  reference_id: string | null;
  reference_type: CashReferenceType | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
};

export type CashListMap = {
  summary: CashSummaryMap;
  transactions: CashLogMap[];
};

// ----------------------------------------------------------------------------------------------------
// Repository payloads
// ----------------------------------------------------------------------------------------------------

export type CashLogInsertPayload = {
  id: string;
  merchant_id: string;
  flow_type: CashFlowType;
  cash_log_date: string;
  amount: string | number;
  category: CashCategory;
  description?: string | null;
  balance_after: string | number;
  reference_id?: string;
  reference_type?: CashReferenceType;
  created_by: string;
};

export type CashLogListByMerchantIdOptions = {
  merchantId: string;
  search?: string;
  flowType?: CashFlowType;
  category?: CashCategory;
  dateFrom?: string;
  dateTo?: string;
};

// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

export type CashLogRow = {
  id: string;
  merchant_id: string;
  flow_type: CashFlowType;
  cash_log_date: string;
  amount: number;
  category: CashCategory;
  description: string | null;
  balance_after: number | null;
  reference_id: string | null;
  reference_type: CashReferenceType | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
};

export type CashSummaryRow = {
  current_balance: number;
  total_in_today: number;
  total_out_today: number;
};
