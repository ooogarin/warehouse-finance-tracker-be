import type { IngredientCategory } from '@/modules/ingredients/ingredient.type';

// ----------------------------------------------------------------------------------------------------
// Repository payloads
// ----------------------------------------------------------------------------------------------------

export type StockUsageItemInsertPayload = {
  id: string;
  stock_usage_id: string;
  ingredient_id: string;
  quantity: number;
  ingredient_unit_id: string;
  unit_price: number;
  notes?: string | null;
};

// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

export type StockUsageItemRow = {
  id: string;
  stock_usage_id: string;
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
