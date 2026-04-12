import type { z } from 'zod';
import type { ReservedSQL } from '@/core/db/client';
import type { IngredientCategory } from '@/modules/ingredients/ingredient.type';
import type { IngredientUnitRow } from '@/modules/ingredients/ingredient-units/ingredient-unit.type';
import type {
  createStockUsageSchema,
  estimateStockUsageSchema,
  stockUsageListQuerySchema,
  stockUsageParamsSchema,
} from './stock-usage.schema';

export type StockUsageType = 'usage' | 'waste';

// ----------------------------------------------------------------------------------------------------
// Request contracts
// ----------------------------------------------------------------------------------------------------

export type StockUsageListQuery = z.infer<typeof stockUsageListQuerySchema>;

export type StockUsageParams = z.infer<typeof stockUsageParamsSchema>;

export type CreateStockUsageRequest = z.infer<typeof createStockUsageSchema>;

export type EstimateStockUsageRequest = z.infer<typeof estimateStockUsageSchema>;

export type ListStockUsagesRequest = StockUsageListQuery & {
  merchantId: string;
};

export type ListStockWastesRequest = ListStockUsagesRequest;

export type GetStockUsageRequest = {
  merchantId: string;
  stockUsageId: string;
};

export type GetStockWasteRequest = GetStockUsageRequest;

export type CreateStockUsageServiceRequest = {
  merchantId: string;
  userId: string;
  data: CreateStockUsageRequest;
};

export type CreateStockWasteServiceRequest = CreateStockUsageServiceRequest;

export type EstimateStockUsageServiceRequest = EstimateStockUsageRequest & {
  merchantId: string;
};

export type EstimateStockWasteServiceRequest = EstimateStockUsageServiceRequest;

// ----------------------------------------------------------------------------------------------------
// Service operations
// ----------------------------------------------------------------------------------------------------

export type StockUsageListMap = {
  id: string;
  usage_date: string;
  type: StockUsageType;
  item_count: number;
  total_cogs: number;
  notes: string | null;
  created_at: string;
};

export type StockUsageItemMap = {
  id: string;
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

export type StockUsageDetailMap = {
  id: string;
  usage_date: string;
  type: StockUsageType;
  notes: string | null;
  total_cogs: number;
  created_at: string;
  items: StockUsageItemMap[];
};

export type StockUsageCreateMap = {
  id: string;
  usage_date: string;
  total_cogs: number;
  item_count: number;
};

export type StockUsageItemProcessResult = {
  total_cogs: number;
};

export type StockUsageEstimateMap = {
  ingredient_id: string;
  ingredient_unit_id: string;
  quantity: number;
  base_unit_quantity: number;
  estimated_cogs: number;
  weighted_unit_price: number;
};

export type StockUsageOperationConfig = {
  type: StockUsageType;
  notFoundMessage: string;
  listFailureMessage: string;
  detailFailureMessage: string;
  createFailureMessage: string;
  estimateFailureMessage: string;
  defaultLogNotes: string;
};

export type IngredientUsageContext = {
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
  total_cogs: number;
  weighted_base_unit_price: number;
  consumptions: BatchConsumption[];
};

export type ConsumeStockBatchesRequest = {
  db: ReservedSQL;
  ingredientId: string;
  requestedBaseUnitQuantity: number;
};

export type ConsumeStockForUsageItemRequest = {
  db: ReservedSQL;
  stockUsageId: string;
  item: CreateStockUsageRequest['items'][number];
  context: IngredientUsageContext;
  userId: string;
  type: StockUsageType;
  defaultLogNotes: string;
};

// ----------------------------------------------------------------------------------------------------
// Repository options
// ----------------------------------------------------------------------------------------------------

export type StockUsageListByMerchantIdOptions = {
  merchantId: string;
  type: StockUsageType;
  dateFrom?: string;
  dateTo?: string;
};

export type StockUsageHeaderByIdAndMerchantIdOptions = {
  stockUsageId: string;
  merchantId: string;
  type: StockUsageType;
};

// ----------------------------------------------------------------------------------------------------
// Repository payloads
// ----------------------------------------------------------------------------------------------------

export type StockUsageInsertPayload = {
  id: string;
  merchant_id: string;
  usage_date: string;
  type: StockUsageType;
  notes?: string | null;
};

// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

export type StockUsageListRow = {
  id: string;
  merchant_id: string;
  usage_date: string;
  type: StockUsageType;
  notes: string | null;
  item_count: number;
  total_cogs: number;
  created_at: string;
};

export type StockUsageHeaderRow = {
  id: string;
  merchant_id: string;
  usage_date: string;
  type: StockUsageType;
  notes: string | null;
  total_cogs: number;
  created_at: string;
};
