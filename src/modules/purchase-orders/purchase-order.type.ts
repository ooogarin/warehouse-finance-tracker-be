import type { z } from 'zod';
import type { PurchaseOrderItemMap, PurchaseOrderItemRow } from './purchase-order-items/purchase-order-item.type';
import type {
  createPurchaseOrderSchema,
  purchaseOrderListQuerySchema,
  purchaseOrderParamsSchema,
} from './purchase-order.schema';


// ----------------------------------------------------------------------------------------------------
// Request contracts
// ----------------------------------------------------------------------------------------------------

export type ListPurchaseOrdersQuery = z.infer<typeof purchaseOrderListQuerySchema>;

export type GetPurchaseOrderParams = z.infer<typeof purchaseOrderParamsSchema>;

export type CreatePurchaseOrderRequest = z.infer<typeof createPurchaseOrderSchema>;

export type ListPurchaseOrdersRequest = ListPurchaseOrdersQuery & {
  merchantId: string;
};

export type GetPurchaseOrderRequest = {
  merchantId: string;
  purchaseOrderId: string;
};

// ----------------------------------------------------------------------------------------------------
// Service operations
// ----------------------------------------------------------------------------------------------------

export type PurchaseOrderPaymentStatus = 'lunas' | 'sebagian' | 'belum_lunas';

export type PurchaseOrderListMap = {
  id: string;
  purchase_date: string;
  supplier_id: string | null;
  supplier_name: string | null;
  invoice_number: string;
  total_amount: number;
  debt_amount: number;
  payment_status: PurchaseOrderPaymentStatus;
};

export type PurchaseOrderDebtPaymentMap = {
  id: string;
  amount: number;
  payment_method: 'cash' | 'transfer' | 'other';
  reference_number: string | null;
  notes: string | null;
  created_at: string;
};

export type PurchaseOrderDetailMap = {
  id: string;
  purchase_date: string;
  supplier_id: string | null;
  supplier_name: string | null;
  invoice_number: string;
  total_amount: number;
  paid_cash: number;
  paid_owner: number;
  debt_amount: number;
  payment_status: PurchaseOrderPaymentStatus;
  notes: string | null;
  created_at: string;
  items: PurchaseOrderItemMap[];
  debt_payments: PurchaseOrderDebtPaymentMap[];
};

export type PurchaseOrderCreateMap = {
  id: string;
  invoice_number: string;
  total_amount: number;
};

export type PurchaseOrderDetailContext = {
  header: PurchaseOrderHeaderRow;
  items: PurchaseOrderItemRow[];
};


// ----------------------------------------------------------------------------------------------------
// Repository payloads
// ----------------------------------------------------------------------------------------------------

export type PurchaseOrderInsertPayload = {
  id: string;
  merchant_id: string;
  purchase_date: string;
  supplier_id?: string | null;
  invoice_number: string;
  total_amount: number;
  paid_cash: number;
  paid_owner: number;
  debt_amount: number;
  notes?: string | null;
};

// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

export interface PurchaseOrderListRow {
  id: string;
  purchase_date: string;
  supplier_id: string | null;
  supplier_name: string | null;
  invoice_number: string;
  total_amount: number;
  debt_amount: number;
  payment_status: PurchaseOrderPaymentStatus;
}

export interface PurchaseOrderHeaderRow {
  id: string;
  merchant_id: string;
  purchase_date: string;
  supplier_id: string | null;
  supplier_name: string | null;
  invoice_number: string;
  total_amount: number;
  paid_cash: number;
  paid_owner: number;
  debt_amount: number;
  notes: string | null;
  created_at: string;
}
