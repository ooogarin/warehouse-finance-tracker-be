import type { StockLogFlowType, StockLogListByIngredientIdOptions, StockLogReferenceType } from '../stock.type';

// ----------------------------------------------------------------------------------------------------
// Repository payloads
// ----------------------------------------------------------------------------------------------------

export type StockLogInsertPayload = {
  id: string;
  ingredient_id: string;
  flow_type: StockLogFlowType;
  base_unit_quantity: number;
  base_unit_price: number;
  notes?: string | null;
  balance_after: number;
  reference_id: string;
  reference_type: StockLogReferenceType;
  created_by: string;
};

export type StockLogListOptions = StockLogListByIngredientIdOptions;

// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

export type StockLogRow = {
  id: string;
  ingredient_id: string;
  flow_type: StockLogFlowType;
  base_unit_quantity: number;
  base_unit_price: number;
  total_amount: number;
  notes: string | null;
  balance_after: number | null;
  reference_id: string | null;
  reference_type: StockLogReferenceType;
  created_by: string | null;
  created_at: string;
};
