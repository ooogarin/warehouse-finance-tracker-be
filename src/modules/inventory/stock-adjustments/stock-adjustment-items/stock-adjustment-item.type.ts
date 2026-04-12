import type { IngredientCategory } from '@/modules/ingredients/ingredient.type';
import type { StockAdjustmentFlowType } from '../stock-adjustment.type';

// ----------------------------------------------------------------------------------------------------
// Repository payloads
// ----------------------------------------------------------------------------------------------------

export type StockAdjustmentItemInsertPayload = {
  id: string;
  stock_adjustment_id: string;
  flow_type: StockAdjustmentFlowType;
  ingredient_id: string;
  quantity: number;
  ingredient_unit_id: string;
  unit_price: number;
  notes?: string | null;
};

// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

export type StockAdjustmentItemRow = {
  id: string;
  stock_adjustment_id: string;
  flow_type: StockAdjustmentFlowType;
  ingredient_id: string;
  ingredient_name: string;
  ingredient_category: IngredientCategory;
  ingredient_unit_id: string;
  unit_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes: string | null;
  created_at: string;
};
