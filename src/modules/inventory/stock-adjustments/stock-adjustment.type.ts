import type { z } from 'zod';
import type { ReservedSQL } from '@/core/db/client';
import type { IngredientCategory } from '@/modules/ingredients/ingredient.type';
import type { IngredientUnitRow } from '@/modules/ingredients/ingredient-units/ingredient-unit.type';
import type {
  createStockAdjustmentSchema,
  estimateStockAdjustmentOutSchema,
  stockAdjustmentListQuerySchema,
  stockAdjustmentParamsSchema,
} from './stock-adjustment.schema';

export type StockAdjustmentFlowType = 'in' | 'out';

// ----------------------------------------------------------------------------------------------------
// Request contracts
// ----------------------------------------------------------------------------------------------------

export type StockAdjustmentListQuery = z.infer<typeof stockAdjustmentListQuerySchema>;

export type StockAdjustmentParams = z.infer<typeof stockAdjustmentParamsSchema>;

export type CreateStockAdjustmentRequest = z.infer<typeof createStockAdjustmentSchema>;

export type EstimateStockAdjustmentOutRequest = z.infer<typeof estimateStockAdjustmentOutSchema>;

export type ListStockAdjustmentsRequest = StockAdjustmentListQuery & {
  merchantId: string;
};

export type GetStockAdjustmentRequest = {
  merchantId: string;
  stockAdjustmentId: string;
};

export type CreateStockAdjustmentServiceRequest = {
  merchantId: string;
  userId: string;
  data: CreateStockAdjustmentRequest;
};

export type EstimateStockAdjustmentOutServiceRequest = EstimateStockAdjustmentOutRequest & {
  merchantId: string;
};

// ----------------------------------------------------------------------------------------------------
// Service operations
// ----------------------------------------------------------------------------------------------------

export type StockAdjustmentListMap = {
  id: string;
  adjustment_date: string;
  item_count: number;
  in_item_count: number;
  out_item_count: number;
  total_in_value: number;
  total_out_value: number;
  notes: string | null;
  created_at: string;
};

export type StockAdjustmentItemMap = {
  id: string;
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
};

export type StockAdjustmentDetailMap = {
  id: string;
  adjustment_date: string;
  notes: string | null;
  item_count: number;
  in_item_count: number;
  out_item_count: number;
  total_in_value: number;
  total_out_value: number;
  created_at: string;
  items: StockAdjustmentItemMap[];
};

export type StockAdjustmentCreateMap = {
  id: string;
  adjustment_date: string;
  item_count: number;
  in_item_count: number;
  out_item_count: number;
  total_in_value: number;
  total_out_value: number;
};

export type StockAdjustmentEstimateMap = {
  ingredient_id: string;
  ingredient_unit_id: string;
  quantity: number;
  base_unit_quantity: number;
  estimated_value: number;
  weighted_unit_price: number;
};

export type IngredientAdjustmentContext = {
  ingredient_id: string;
  ingredient_name: string;
  ingredient_category: IngredientCategory;
  base_unit: string;
  stock_quantity: number;
  ingredient_is_active: boolean;
  unit: IngredientUnitRow;
};

export type BatchConsumption = {
  batch_id: string;
  quantity: number;
  cost_per_unit: number;
};

export type FifoCostEstimate = {
  base_unit_quantity: number;
  total_value: number;
  weighted_base_unit_price: number;
  consumptions: BatchConsumption[];
};

export type ProcessStockAdjustmentItemRequest = {
  db: ReservedSQL;
  stockAdjustmentId: string;
  adjustmentDate: string;
  item: CreateStockAdjustmentRequest['items'][number];
  context: IngredientAdjustmentContext;
  userId: string;
};

export type ProcessStockAdjustmentItemResult = {
  flow_type: StockAdjustmentFlowType;
  total_value: number;
};

// ----------------------------------------------------------------------------------------------------
// Repository options
// ----------------------------------------------------------------------------------------------------

export type StockAdjustmentListByMerchantIdOptions = {
  merchantId: string;
  dateFrom?: string;
  dateTo?: string;
};

export type StockAdjustmentHeaderByIdAndMerchantIdOptions = {
  stockAdjustmentId: string;
  merchantId: string;
};

// ----------------------------------------------------------------------------------------------------
// Repository payloads
// ----------------------------------------------------------------------------------------------------

export type StockAdjustmentInsertPayload = {
  id: string;
  merchant_id: string;
  adjustment_date: string;
  notes?: string | null;
};

// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

export type StockAdjustmentListRow = {
  id: string;
  merchant_id: string;
  adjustment_date: string;
  notes: string | null;
  item_count: number;
  in_item_count: number;
  out_item_count: number;
  total_in_value: number;
  total_out_value: number;
  created_at: string;
};

export type StockAdjustmentHeaderRow = StockAdjustmentListRow;
