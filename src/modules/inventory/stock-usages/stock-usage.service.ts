import { commitTransaction, rollbackTransaction, startTransaction } from '@/core/db/client';
import { internalError, isAppError, notFoundError, validationError } from '@/core/errors/app-error';
import * as ingredientRepository from '@/modules/ingredients/ingredient.repository';
import * as ingredientUnitRepository from '@/modules/ingredients/ingredient-units/ingredient-unit.repository';
import * as ingredientBatchRepository from '@/modules/inventory/ingredient-batches/ingredient-batch.repository';
import * as stockLogRepository from '@/modules/inventory/stock-logs/stock-log.repository';
import { generateUUID } from '@/shared/utils/crypto.util';
import * as stockUsageRepository from './stock-usage.repository';
import * as stockUsageItemRepository from './stock-usage-items/stock-usage-item.repository';
import type { ReservedSQL } from '@/core/db/client';
import type { IngredientBatchRow } from '@/modules/inventory/ingredient-batches/ingredient-batch.type';
import type {
  BatchConsumption,
  ConsumeStockForUsageItemRequest,
  CreateStockUsageServiceRequest,
  CreateStockWasteServiceRequest,
  EstimateStockUsageServiceRequest,
  EstimateStockWasteServiceRequest,
  FifoCostEstimate,
  GetStockUsageRequest,
  GetStockWasteRequest,
  IngredientUsageContext,
  ListStockUsagesRequest,
  ListStockWastesRequest,
  StockUsageCreateMap,
  StockUsageDetailMap,
  StockUsageEstimateMap,
  StockUsageItemMap,
  StockUsageItemProcessResult,
  StockUsageListMap,
  StockUsageListRow,
  StockUsageOperationConfig,
} from './stock-usage.type';
import type { StockUsageItemRow } from './stock-usage-items/stock-usage-item.type';

const QUANTITY_EPSILON = 1e-6;

const USAGE_CONFIG: StockUsageOperationConfig = {
  type: 'usage',
  notFoundMessage: 'Stock usage not found',
  listFailureMessage: 'Failed to list stock usages',
  detailFailureMessage: 'Failed to get stock usage detail',
  createFailureMessage: 'Failed to create stock usage',
  estimateFailureMessage: 'Failed to estimate stock usage',
  defaultLogNotes: 'Stock usage',
};

const WASTE_CONFIG: StockUsageOperationConfig = {
  type: 'waste',
  notFoundMessage: 'Stock waste not found',
  listFailureMessage: 'Failed to list stock wastes',
  detailFailureMessage: 'Failed to get stock waste detail',
  createFailureMessage: 'Failed to create stock waste',
  estimateFailureMessage: 'Failed to estimate stock waste',
  defaultLogNotes: 'Stock waste',
};

// List stock usage records
export const list = async ({ merchantId, date_from, date_to }: ListStockUsagesRequest): Promise<StockUsageListMap[]> => {
  return await listByType({ merchantId, date_from, date_to }, USAGE_CONFIG);
};

// List stock waste records
export const listWastes = async ({ merchantId, date_from, date_to }: ListStockWastesRequest): Promise<StockUsageListMap[]> => {
  return await listByType({ merchantId, date_from, date_to }, WASTE_CONFIG);
};

// Get stock usage detail
export const getDetail = async ({ merchantId, stockUsageId }: GetStockUsageRequest): Promise<StockUsageDetailMap> => {
  return await getDetailByType({ merchantId, stockUsageId }, USAGE_CONFIG);
};

// Get stock waste detail
export const getWasteDetail = async ({ merchantId, stockUsageId }: GetStockWasteRequest): Promise<StockUsageDetailMap> => {
  return await getDetailByType({ merchantId, stockUsageId }, WASTE_CONFIG);
};

// Create stock usage and process FIFO stock mutations atomically
export const create = async (request: CreateStockUsageServiceRequest): Promise<StockUsageCreateMap> => {
  return await createByType(request, USAGE_CONFIG);
};

// Create stock waste and process FIFO stock mutations atomically
export const createWaste = async (request: CreateStockWasteServiceRequest): Promise<StockUsageCreateMap> => {
  return await createByType(request, WASTE_CONFIG);
};

// Estimate FIFO COGS for one stock usage item
export const estimate = async (request: EstimateStockUsageServiceRequest): Promise<StockUsageEstimateMap> => {
  return await estimateByType(request, USAGE_CONFIG);
};

// Estimate FIFO COGS for one stock waste item
export const estimateWaste = async (request: EstimateStockWasteServiceRequest): Promise<StockUsageEstimateMap> => {
  return await estimateByType(request, WASTE_CONFIG);
};

const listByType = async (
  { merchantId, date_from, date_to }: ListStockUsagesRequest,
  config: StockUsageOperationConfig,
): Promise<StockUsageListMap[]> => {
  try {
    const rows = await stockUsageRepository.getAllByMerchantId({
      merchantId,
      type: config.type,
      dateFrom: date_from,
      dateTo: date_to,
    });

    return rows.map(toStockUsageListMap);
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError(config.listFailureMessage);
  }
};

const getDetailByType = async (
  { merchantId, stockUsageId }: GetStockUsageRequest,
  config: StockUsageOperationConfig,
): Promise<StockUsageDetailMap> => {
  try {
    const header = await stockUsageRepository.getHeaderByIdAndMerchantId({
      stockUsageId,
      merchantId,
      type: config.type,
    });
    if (!header) {
      throw notFoundError(config.notFoundMessage);
    }

    const items = await stockUsageItemRepository.getAllByStockUsageId(stockUsageId);

    return {
      id: header.id,
      usage_date: header.usage_date,
      type: header.type,
      notes: header.notes,
      total_cogs: header.total_cogs,
      created_at: header.created_at,
      items: items.map(toStockUsageItemMap),
    };
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError(config.detailFailureMessage);
  }
};

const createByType = async (
  { merchantId, userId, data }: CreateStockUsageServiceRequest,
  config: StockUsageOperationConfig,
): Promise<StockUsageCreateMap> => {
  let connection: ReservedSQL | null = null;

  try {
    if (data.items.length === 0) {
      throw validationError('At least one item is required');
    }

    const stockUsageId = generateUUID();
    let totalCogs = 0;

    connection = await startTransaction();

    await stockUsageRepository.insert(connection, {
      id: stockUsageId,
      merchant_id: merchantId,
      usage_date: data.usage_date,
      type: config.type,
      notes: data.notes ?? null,
    });

    for (const item of data.items) {
      const context = await getIngredientUsageContextForUpdate(connection, merchantId, item.ingredient_id, item.ingredient_unit_id);
      const result = await consumeStockForUsageItem({
        db: connection,
        stockUsageId,
        item,
        context,
        userId,
        type: config.type,
        defaultLogNotes: config.defaultLogNotes,
      });
      totalCogs += result.total_cogs;
    }

    await commitTransaction(connection);

    return {
      id: stockUsageId,
      usage_date: data.usage_date,
      total_cogs: totalCogs,
      item_count: data.items.length,
    };
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }
    if (isAppError(error)) {
      throw error;
    }
    throw internalError(config.createFailureMessage);
  }
};

const estimateByType = async (
  { merchantId, ingredient_id, ingredient_unit_id, quantity }: EstimateStockUsageServiceRequest,
  config: StockUsageOperationConfig,
): Promise<StockUsageEstimateMap> => {
  try {
    const context = await getIngredientUsageContext(merchantId, ingredient_id, ingredient_unit_id);
    const baseUnitQuantity = quantity * context.unit.conversion_factor;

    validateRequestedStock(context, baseUnitQuantity);

    const batches = await ingredientBatchRepository.getActiveByIngredientId(ingredient_id);
    const estimateResult = calculateFifoCostEstimate(batches, baseUnitQuantity, context.ingredient_name);

    return {
      ingredient_id,
      ingredient_unit_id,
      quantity,
      base_unit_quantity: baseUnitQuantity,
      estimated_cogs: estimateResult.total_cogs,
      weighted_unit_price: quantity > 0 ? estimateResult.total_cogs / quantity : 0,
    };
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError(config.estimateFailureMessage);
  }
};

const consumeStockForUsageItem = async ({
  db,
  stockUsageId,
  item,
  context,
  userId,
  type,
  defaultLogNotes,
}: ConsumeStockForUsageItemRequest): Promise<StockUsageItemProcessResult> => {
  const baseUnitQuantity = item.quantity * context.unit.conversion_factor;
  validateRequestedStock(context, baseUnitQuantity);

  const batches = await ingredientBatchRepository.getActiveByIngredientIdForUpdate(db, item.ingredient_id);
  const estimateResult = calculateFifoCostEstimate(batches, baseUnitQuantity, context.ingredient_name);
  const weightedUnitPrice = item.quantity > 0 ? estimateResult.total_cogs / item.quantity : 0;

  await stockUsageItemRepository.insert(db, {
    id: generateUUID(),
    stock_usage_id: stockUsageId,
    ingredient_id: item.ingredient_id,
    quantity: item.quantity,
    ingredient_unit_id: item.ingredient_unit_id,
    unit_price: weightedUnitPrice,
    notes: item.notes ?? null,
  });

  for (const consumption of estimateResult.consumptions) {
    const batch = batches.find((row) => row.id === consumption.batch_id);
    if (!batch) {
      throw validationError('FIFO batch context is missing');
    }

    await ingredientBatchRepository.updateRemainingById(db, consumption.batch_id, batch.qty_remaining - consumption.quantity);
    const balanceAfter = await ingredientRepository.decreaseStockQuantityById(db, item.ingredient_id, consumption.quantity);

    await stockLogRepository.insert(db, {
      id: generateUUID(),
      ingredient_id: item.ingredient_id,
      flow_type: 'out',
      base_unit_quantity: consumption.quantity,
      base_unit_price: consumption.cost_per_unit,
      notes: item.notes ?? defaultLogNotes,
      balance_after: balanceAfter,
      reference_id: stockUsageId,
      reference_type: type,
      created_by: userId,
    });
  }

  return {
    total_cogs: estimateResult.total_cogs,
  };
};

const getIngredientUsageContext = async (merchantId: string, ingredientId: string, unitId: string): Promise<IngredientUsageContext> => {
  const ingredient = await ingredientRepository.getOneByIdAndMerchantId(ingredientId, merchantId);
  if (!ingredient) {
    throw notFoundError('Ingredient not found');
  }

  const unit = await ingredientUnitRepository.getOneByIdAndIngredientId(unitId, ingredientId);
  if (!unit) {
    throw notFoundError('Ingredient unit not found');
  }

  return {
    ingredient_id: ingredient.id,
    ingredient_name: ingredient.name,
    ingredient_category: ingredient.category,
    base_unit: ingredient.base_unit,
    stock_quantity: ingredient.stock_quantity,
    ingredient_is_active: ingredient.is_active,
    unit,
  };
};

const getIngredientUsageContextForUpdate = async (
  db: ReservedSQL,
  merchantId: string,
  ingredientId: string,
  unitId: string,
): Promise<IngredientUsageContext> => {
  const ingredient = await ingredientRepository.getOneByIdAndMerchantIdForUpdate(db, ingredientId, merchantId);
  if (!ingredient) {
    throw notFoundError('Ingredient not found');
  }

  const unit = await ingredientUnitRepository.getOneByIdAndIngredientId(unitId, ingredientId);
  if (!unit) {
    throw notFoundError('Ingredient unit not found');
  }

  return {
    ingredient_id: ingredient.id,
    ingredient_name: ingredient.name,
    ingredient_category: ingredient.category,
    base_unit: ingredient.base_unit,
    stock_quantity: ingredient.stock_quantity,
    ingredient_is_active: ingredient.is_active,
    unit,
  };
};

const validateRequestedStock = (context: IngredientUsageContext, baseUnitQuantity: number): void => {
  if (!context.ingredient_is_active) {
    throw validationError(`Ingredient "${context.ingredient_name}" is inactive`);
  }

  if (!context.unit.is_active) {
    throw validationError(`Unit "${context.unit.unit_name}" is inactive`);
  }

  if (context.unit.conversion_factor <= 0) {
    throw validationError(`Invalid conversion factor for unit "${context.unit.unit_name}"`);
  }

  if (baseUnitQuantity - context.stock_quantity > QUANTITY_EPSILON) {
    throw validationError(`Insufficient stock for ingredient "${context.ingredient_name}"`);
  }
};

const calculateFifoCostEstimate = (
  batches: IngredientBatchRow[],
  requestedBaseUnitQuantity: number,
  ingredientName: string,
): FifoCostEstimate => {
  let remainingQuantity = requestedBaseUnitQuantity;
  let totalCogs = 0;
  const consumptions: BatchConsumption[] = [];

  for (const batch of batches) {
    if (remainingQuantity <= QUANTITY_EPSILON) {
      break;
    }

    const consumedQuantity = Math.min(remainingQuantity, batch.qty_remaining);
    if (consumedQuantity <= QUANTITY_EPSILON) {
      continue;
    }

    consumptions.push({
      batch_id: batch.id,
      quantity: consumedQuantity,
      cost_per_unit: batch.cost_per_unit,
    });
    totalCogs += consumedQuantity * batch.cost_per_unit;
    remainingQuantity -= consumedQuantity;
  }

  if (remainingQuantity > QUANTITY_EPSILON) {
    throw validationError(`Insufficient FIFO batch stock for ingredient "${ingredientName}"`);
  }

  return {
    base_unit_quantity: requestedBaseUnitQuantity,
    total_cogs: totalCogs,
    weighted_base_unit_price: requestedBaseUnitQuantity > 0 ? totalCogs / requestedBaseUnitQuantity : 0,
    consumptions,
  };
};

const toStockUsageListMap = (row: StockUsageListRow): StockUsageListMap => {
  return {
    id: row.id,
    usage_date: row.usage_date,
    type: row.type,
    item_count: row.item_count,
    total_cogs: row.total_cogs,
    notes: row.notes,
    created_at: row.created_at,
  };
};

const toStockUsageItemMap = (row: StockUsageItemRow): StockUsageItemMap => {
  return {
    id: row.id,
    ingredient_id: row.ingredient_id,
    ingredient_name: row.ingredient_name,
    ingredient_category: row.ingredient_category,
    ingredient_unit_id: row.ingredient_unit_id,
    unit_name: row.unit_name,
    quantity: row.quantity,
    unit_price: row.unit_price,
    subtotal: row.subtotal,
    notes: row.notes,
  };
};
