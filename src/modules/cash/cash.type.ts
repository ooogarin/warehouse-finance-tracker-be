// ----------------------------------------------------------------------------------------------------
// Repository payloads
// ----------------------------------------------------------------------------------------------------

export type CashLogInsertPayload = {
  id: string;
  merchant_id: string;
  flow_type: 'in';
  cash_log_date: string;
  amount: string;
  category: 'capital_injection';
  description: string;
  balance_after: string;
  created_by: string;
};
