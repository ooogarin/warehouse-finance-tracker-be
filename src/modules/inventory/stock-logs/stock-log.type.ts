// ----------------------------------------------------------------------------------------------------
// Repository payloads
// ----------------------------------------------------------------------------------------------------

export type StockLogInsertPayload = {
  id: string;
  ingredient_id: string;
  flow_type: 'in';
  base_unit_quantity: number;
  base_unit_price: number;
  notes?: string | null;
  balance_after: number;
  reference_id: string;
  reference_type: 'purchase';
  created_by: string;
};
