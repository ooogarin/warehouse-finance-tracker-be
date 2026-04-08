// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

export interface DebtPaymentRow {
  id: string;
  amount: number;
  payment_method: 'cash' | 'transfer' | 'other';
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

// ----------------------------------------------------------------------------------------------------
// Service operations
// ----------------------------------------------------------------------------------------------------

export type DebtPaymentMap = {
  id: string;
  amount: number;
  payment_method: 'cash' | 'transfer' | 'other';
  reference_number: string | null;
  notes: string | null;
  created_at: string;
};
