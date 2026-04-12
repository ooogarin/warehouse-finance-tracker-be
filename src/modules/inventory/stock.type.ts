import type { z } from 'zod';
import type { IngredientCategory } from '@/modules/ingredients/ingredient.type';
import type { stockListQuerySchema, stockLogListQuerySchema, stockParamsSchema } from './stock.schema';

export type StockStatus = 'normal' | 'low' | 'out';
export type StockLogFlowType = 'in' | 'out';
export type StockLogReferenceType = 'purchase' | 'usage' | 'waste' | 'adjustment';

// ----------------------------------------------------------------------------------------------------
// Request contracts
// ----------------------------------------------------------------------------------------------------

export type StockListQuery = z.infer<typeof stockListQuerySchema>;

export type StockParams = z.infer<typeof stockParamsSchema>;

export type StockLogListQuery = z.infer<typeof stockLogListQuerySchema>;

export type ListStockRequest = StockListQuery & {
  merchantId: string;
};

export type GetStockRequest = {
  merchantId: string;
  ingredientId: string;
};

export type ListStockLogsRequest = StockLogListQuery & GetStockRequest;

// ----------------------------------------------------------------------------------------------------
// Service operations
// ----------------------------------------------------------------------------------------------------

export type StockQuantityDisplayMap = {
  formatted: string;
  base: string;
};

export type StockSummaryMap = {
  total_ingredients: number;
  normal: number;
  low: number;
  out: number;
};

export type StockMap = {
  ingredient_id: string;
  name: string;
  category: IngredientCategory;
  base_unit: string;
  stock_quantity: number;
  stock_quantity_display: StockQuantityDisplayMap;
  min_stock: number;
  min_stock_display: StockQuantityDisplayMap;
  inventory_value: number;
  status: StockStatus;
  last_updated_at: string | null;
};

export type StockListMap = {
  summary: StockSummaryMap;
  stocks: StockMap[];
};

export type StockBatchMap = {
  id: string;
  purchase_date: string;
  qty_initial: number;
  qty_initial_display: StockQuantityDisplayMap;
  qty_remaining: number;
  qty_remaining_display: StockQuantityDisplayMap;
  cost_per_unit: number;
  batch_value: number;
};

export type StockLogMap = {
  id: string;
  created_at: string;
  flow_type: StockLogFlowType;
  reference_type: StockLogReferenceType;
  movement_label: string;
  base_unit_quantity: number;
  quantity_display: StockQuantityDisplayMap;
  base_unit_price: number;
  total_amount: number;
  balance_after: number | null;
  balance_after_display: StockQuantityDisplayMap | null;
  reference_id: string | null;
  reference_route: string | null;
  notes: string | null;
};

export type StockDetailMap = StockMap & {
  batches: StockBatchMap[];
  logs: StockLogMap[];
};

// ----------------------------------------------------------------------------------------------------
// Repository options
// ----------------------------------------------------------------------------------------------------

export type StockListByMerchantIdOptions = {
  merchantId: string;
  search?: string;
  category?: IngredientCategory;
  status?: StockStatus;
};

export type StockLogListByIngredientIdOptions = {
  ingredientId: string;
  referenceType?: StockLogReferenceType;
};

// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

export type StockRow = {
  ingredient_id: string;
  merchant_id: string;
  name: string;
  category: IngredientCategory;
  base_unit: string;
  stock_quantity: number;
  min_stock: number;
  inventory_value: number;
  status: StockStatus;
  last_updated_at: string | null;
};

export type StockSummaryRow = StockSummaryMap;
