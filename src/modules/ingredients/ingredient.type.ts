import type { z } from 'zod';
import type {
  createIngredientSchema,
  ingredientListQuerySchema,
  ingredientParamsSchema,
  updateIngredientSchema,
} from './ingredient.schema';

// ----------------------------------------------------------------------------------------------------
// Request contracts
// ----------------------------------------------------------------------------------------------------

export type ListIngredientsQuery = z.infer<typeof ingredientListQuerySchema>;

export type GetIngredientParams = z.infer<typeof ingredientParamsSchema>;

export type CreateIngredientRequest = z.infer<typeof createIngredientSchema>;

export type UpdateIngredientRequest = z.infer<typeof updateIngredientSchema>;

export type IngredientCategory = 'vegetables' | 'meat' | 'seafood' | 'spices' | 'grains' | 'oil' | 'liquid' | 'flour' | 'other';

export type ListIngredientsRequest = ListIngredientsQuery & {
  merchantId: string;
};

export type GetIngredientRequest = {
  merchantId: string;
  ingredientId: string;
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
  is_active?: boolean;
};

// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

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
