import type { z } from 'zod';
import type { PurchaseOrderPaymentStatus } from '@/modules/purchase-orders/purchase-order.type';
import type { createSupplierSchema, supplierListQuerySchema, supplierParamsSchema, updateSupplierSchema } from './supplier.schema';

// ----------------------------------------------------------------------------------------------------
// Request contracts
// ----------------------------------------------------------------------------------------------------

export type ListSuppliersQuery = z.infer<typeof supplierListQuerySchema>;

export type GetSupplierParams = z.infer<typeof supplierParamsSchema>;

export type CreateSupplierRequest = z.infer<typeof createSupplierSchema>;

export type UpdateSupplierRequest = z.infer<typeof updateSupplierSchema>;

export type ListSuppliersRequest = ListSuppliersQuery & {
  merchantId: string;
};

export type GetSupplierRequest = {
  merchantId: string;
  supplierId: string;
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
  payment_status: PurchaseOrderPaymentStatus;
};

export type SupplierDetailMap = {
  supplier: SupplierMap;
  purchase_orders: SupplierPurchaseHistoryMap[];
};

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
  payment_status: PurchaseOrderPaymentStatus;
}
