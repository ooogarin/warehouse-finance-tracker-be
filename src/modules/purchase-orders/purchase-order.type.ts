import type { z } from 'zod';
import type { createPurchaseOrderSchema, purchaseOrderListQuerySchema, purchaseOrderParamsSchema } from './purchase-order.schema';
import type { PurchaseOrderItemMap, PurchaseOrderItemRow } from './purchase-order-items/purchase-order-item.type';

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

export type PurchaseOrderPaymentStatus = 'paid' | 'partial' | 'unpaid';

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

export type IngredientOperationalContext = {
  ingredient_name: string;
  ingredient_is_active: boolean;
  ingredient_unit_name: string;
  unit_is_active: boolean;
  unit_conversion_factor: number;
};

export type PurchaseOrderPaymentSplit = {
  totalAmount: number;
  paidCash: number;
  paidOwner: number;
  debtAmount: number;
};

export type PurchaseOrderPaymentStatusContext = {
  debt_amount: number;
  debt_status?: 'unpaid' | 'partial' | 'paid';
  debt_paid_amount?: number;
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

export type PurchaseOrderListByMerchantIdOptions = {
  merchantId: string;
  search?: string;
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
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
