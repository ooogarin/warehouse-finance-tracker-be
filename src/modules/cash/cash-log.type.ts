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
