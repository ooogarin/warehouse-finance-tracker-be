// ----------------------------------------------------------------------------------------------------
// Repository payloads
// ----------------------------------------------------------------------------------------------------

export type IngredientBatchInsertPayload = {
  id: string;
  ingredient_id: string;
  qty_initial: number;
  qty_remaining: number;
  cost_per_unit: number;
  purchase_date: string;
};
