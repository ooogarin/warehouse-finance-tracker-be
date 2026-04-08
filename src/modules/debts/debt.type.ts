// ----------------------------------------------------------------------------------------------------
// Repository payloads
// ----------------------------------------------------------------------------------------------------

export type DebtInsertPayload = {
  id: string;
  merchant_id: string;
  supplier_id?: string | null;
  creditor_name?: string | null;
  creditor_type: 'owner' | 'supplier' | 'other';
  purchase_order_id: string;
  total_amount: number;
  debt_date: string;
  description?: string | null;
};

// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

export interface DebtRow {
  id: string;
  creditor_type: 'owner' | 'supplier' | 'other';
  total_amount: number;
  paid_amount: number;
  status: 'unpaid' | 'partial' | 'paid';
}
