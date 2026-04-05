// ----------------------------------------------------------------------------------------------------
// Repository payloads
// ----------------------------------------------------------------------------------------------------

export type SupplierInsertPayload = {
  id: string;
  merchant_id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
};

export type SupplierUpdatePayload = {
  name?: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
};

// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

export interface SupplierRow {
  id: string;
  merchant_id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SupplierListRow extends SupplierRow {
  last_order_date: string | null;
}

export interface SupplierPurchaseHistoryRow {
  id: string;
  purchase_date: string;
  invoice_number: string;
  total_amount: string;
  debt_amount: string;
}

// ----------------------------------------------------------------------------------------------------
// Request contracts
// ----------------------------------------------------------------------------------------------------

export type ListSuppliersRequest = {
  merchantId: string;
  search?: string;
};

export type GetSupplierRequest = {
  merchantId: string;
  supplierId: string;
};

export type CreateSupplierRequest = {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
};

export type UpdateSupplierRequest = {
  name?: string;
  phone?: string;
  address?: string;
  notes?: string;
};

// ----------------------------------------------------------------------------------------------------
// Service operations
// ----------------------------------------------------------------------------------------------------

export type SupplierMap = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  last_order_date: string | null;
  created_at: string;
};

export type SupplierPurchaseHistoryMap = {
  id: string;
  purchase_date: string;
  invoice_number: string;
  total_amount: string;
  payment_status: 'Lunas' | 'Belum Lunas';
};

export type SupplierDetailMap = {
  supplier: SupplierMap;
  purchase_orders: SupplierPurchaseHistoryMap[];
};
