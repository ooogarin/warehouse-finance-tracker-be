// ----------------------------------------------------------------------------------------------------
// Repository payloads
// ----------------------------------------------------------------------------------------------------

export type IngredientInsertPayload = {
  id: string;
  merchant_id: string;
  name: string;
  category: IngredientCategory;
  base_unit: string;
  min_stock?: number;
};

export type IngredientUpdatePayload = {
  name?: string;
  category?: IngredientCategory;
  base_unit?: string;
  min_stock?: number;
};

// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

export type IngredientCategory = 'vegetables' | 'meat' | 'seafood' | 'spices' | 'oil' | 'grains' | 'liquid' | 'other';

export interface IngredientRow {
  id: string;
  merchant_id: string;
  name: string;
  category: IngredientCategory;
  base_unit: string;
  stock_quantity: number;
  min_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------------------------------
// Request contracts
// ----------------------------------------------------------------------------------------------------

export type ListIngredientsRequest = {
  merchantId: string;
  search?: string;
  category?: IngredientCategory;
};

export type GetIngredientRequest = {
  merchantId: string;
  ingredientId: string;
};

export type CreateIngredientRequest = {
  name: string;
  category: IngredientCategory;
  base_unit: string;
  min_stock?: number;
};

export type UpdateIngredientRequest = {
  name?: string;
  category?: IngredientCategory;
  base_unit?: string;
  min_stock?: number;
};

// ----------------------------------------------------------------------------------------------------
// Service operations
// ----------------------------------------------------------------------------------------------------

export type IngredientMap = {
  id: string;
  name: string;
  category: IngredientCategory;
  base_unit: string;
  stock_quantity: number;
  min_stock: number;
  is_active: boolean;
};

export type IngredientDetailUnitMap = {
  id: string;
  unit_name: string;
  conversion_factor: number;
  is_default: boolean;
  description: string | null;
  is_active: boolean;
};

export type IngredientDetailMap = IngredientMap & {
  is_used: boolean;
  is_base_unit_editable: boolean;
  units: IngredientDetailUnitMap[];
};
