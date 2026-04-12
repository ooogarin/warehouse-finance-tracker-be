// ----------------------------------------------------------------------------------------------------
// Repository payloads
// ----------------------------------------------------------------------------------------------------

export type PurchaseOrderItemInsertPayload = {
  id: string;
  purchase_order_id: string;
  ingredient_id: string;
  ingredient_unit_id: string;
  quantity: number;
  unit_price: number;
  notes?: string | null;
};

// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

export interface PurchaseOrderItemRow {
  id: string;
  purchase_order_id: string;
  ingredient_id: string;
  ingredient_name: string;
  ingredient_unit_id: string;
  unit_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

// ----------------------------------------------------------------------------------------------------
// Service operations
// ----------------------------------------------------------------------------------------------------

export type PurchaseOrderItemMap = {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  ingredient_unit_id: string;
  unit_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};
