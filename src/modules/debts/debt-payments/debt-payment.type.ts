import type { ReservedSQL } from '@/core/db/client';

// ----------------------------------------------------------------------------------------------------
// Repository payloads
// ----------------------------------------------------------------------------------------------------

export type DebtPaymentInsertPayload = {
  id: string;
  debt_id: string;
  amount: number;
  payment_method: 'cash' | 'transfer' | 'other';
  reference_number?: string | null;
  notes?: string | null;
  created_by: string;
};

// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

export interface DebtPaymentRow {
  id: string;
  amount: number;
  payment_method: 'cash' | 'transfer' | 'other';
  reference_number: string | null;
  notes: string | null;
  created_by: string | null;
  created_by_name: string | null;
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
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
};

export type CreateDebtPaymentInternalRequest = {
  db: ReservedSQL;
  payload: DebtPaymentInsertPayload;
};
