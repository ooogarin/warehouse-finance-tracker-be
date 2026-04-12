import type { ReservedSQL } from '@/core/db/client';

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

// ----------------------------------------------------------------------------------------------------
// Repository payloads
// ----------------------------------------------------------------------------------------------------

export type CashLogInsertPayload = {
  id: string;
  merchant_id: string;
  flow_type: 'in' | 'out';
  cash_log_date: string;
  amount: string | number;
  category: 'capital_injection' | 'purchase_payment';
  description: string;
  balance_after: string | number;
  reference_id?: string;
  reference_type?: 'purchase_order' | 'debt_payment';
  created_by: string;
};
