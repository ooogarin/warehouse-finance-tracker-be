import type { GetIngredientRequest } from '../ingredient.type';

// ----------------------------------------------------------------------------------------------------
// Repository payloads
// ----------------------------------------------------------------------------------------------------

export type IngredientUnitInsertPayload = {
  id: string;
  ingredient_id: string;
  unit_name: string;
  conversion_factor: number;
  is_default?: boolean;
  description?: string | null;
  is_active?: boolean;
};

export type IngredientUnitUpdatePayload = {
  unit_name?: string;
  conversion_factor?: number;
  is_default?: boolean;
  description?: string | null;
  is_active?: boolean;
};

// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

export interface IngredientUnitRow {
  id: string;
  ingredient_id: string;
  unit_name: string;
  conversion_factor: number;
  is_default: boolean;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------------------------------
// Request contracts
// ----------------------------------------------------------------------------------------------------

export type ManageIngredientUnitRequest = GetIngredientRequest & {
  unitId: string;
};

export type CreateIngredientUnitRequest = {
  unit_name: string;
  conversion_factor: number;
  is_default?: boolean;
  description?: string;
};

export type UpdateIngredientUnitRequest = {
  unit_name?: string;
  conversion_factor?: number;
  is_default?: boolean;
  description?: string;
  is_active?: boolean;
};

// ----------------------------------------------------------------------------------------------------
// Service operations
// ----------------------------------------------------------------------------------------------------

export type IngredientUnitMap = {
  id: string;
  unit_name: string;
  conversion_factor: number;
  is_default: boolean;
  description: string | null;
  is_active: boolean;
};
