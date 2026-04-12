import type { z } from 'zod';
import type { GetIngredientRequest } from '../ingredient.type';
import type { createIngredientUnitSchema, ingredientUnitParamsSchema, updateIngredientUnitSchema } from './ingredient-unit.schema';

// ----------------------------------------------------------------------------------------------------
// Request contracts
// ----------------------------------------------------------------------------------------------------

export type ManageIngredientUnitParams = z.infer<typeof ingredientUnitParamsSchema>;

export type CreateIngredientUnitRequest = z.infer<typeof createIngredientUnitSchema>;

export type UpdateIngredientUnitRequest = z.infer<typeof updateIngredientUnitSchema>;

export type ManageIngredientUnitRequest = GetIngredientRequest & {
  unitId: string;
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
