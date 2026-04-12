import { commitTransaction, rollbackTransaction, startTransaction } from '@/core/db/client';
import { internalError, isAppError, notFoundError, validationError } from '@/core/errors/app-error';
import * as ingredientRepository from '@/modules/ingredients/ingredient.repository';
import * as ingredientUnitRepository from '@/modules/ingredients/ingredient-units/ingredient-unit.repository';
import * as ingredientBatchRepository from '@/modules/inventory/ingredient-batches/ingredient-batch.repository';
import * as stockLogRepository from '@/modules/inventory/stock-logs/stock-log.repository';
import { generateUUID } from '@/shared/utils/crypto.util';
import * as stockAdjustmentRepository from './stock-adjustment.repository';
import * as stockAdjustmentItemRepository from './stock-adjustment-items/stock-adjustment-item.repository';
import type { ReservedSQL } from '@/core/db/client';
import type { IngredientBatchRow } from '@/modules/inventory/ingredient-batches/ingredient-batch.type';
import type {
  BatchConsumption,
  CreateStockAdjustmentServiceRequest,
  EstimateStockAdjustmentOutServiceRequest,
  FifoCostEstimate,
  GetStockAdjustmentRequest,
  IngredientAdjustmentContext,
  ListStockAdjustmentsRequest,
  ProcessStockAdjustmentItemRequest,
  ProcessStockAdjustmentItemResult,
  StockAdjustmentCreateMap,
  StockAdjustmentDetailMap,
  StockAdjustmentEstimateMap,
  StockAdjustmentItemMap,
  StockAdjustmentListMap,
  StockAdjustmentListRow,
} from './stock-adjustment.type';
import type { StockAdjustmentItemRow } from './stock-adjustment-items/stock-adjustment-item.type';

const QUANTITY_EPSILON = 1e-6;

// List stock adjustment records
export const list = async ({ merchantId, date_from, date_to }: ListStockAdjustmentsRequest): Promise<StockAdjustmentListMap[]> => {
  try {
    const rows = await stockAdjustmentRepository.getAllByMerchantId({
      merchantId,
      dateFrom: date_from,
      dateTo: date_to,
    });

    return rows.map(toStockAdjustmentListMap);
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to list stock adjustments');
  }
};

// Get stock adjustment detail
export const getDetail = async ({ merchantId, stockAdjustmentId }: GetStockAdjustmentRequest): Promise<StockAdjustmentDetailMap> => {
  try {
    const header = await stockAdjustmentRepository.getHeaderByIdAndMerchantId({
      stockAdjustmentId,
      merchantId,
    });
    if (!header) {
      throw notFoundError('Stock adjustment not found');
    }

    const items = await stockAdjustmentItemRepository.getAllByStockAdjustmentId(stockAdjustmentId);

    return {
      id: header.id,
      adjustment_date: header.adjustment_date,
      notes: header.notes,
      item_count: header.item_count,
      in_item_count: header.in_item_count,
      out_item_count: header.out_item_count,
      total_in_value: header.total_in_value,
      total_out_value: header.total_out_value,
      created_at: header.created_at,
      items: items.map(toStockAdjustmentItemMap),
    };
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to get stock adjustment detail');
  }
};

// Create stock adjustment and process stock mutations atomically
export const create = async ({ merchantId, userId, data }: CreateStockAdjustmentServiceRequest): Promise<StockAdjustmentCreateMap> => {
  let connection: ReservedSQL | null = null;

  try {
    if (data.items.length === 0) {
      throw validationError('At least one item is required');
    }

    const stockAdjustmentId = generateUUID();
    let inItemCount = 0;
    let outItemCount = 0;
    let totalInValue = 0;
    let totalOutValue = 0;

    connection = await startTransaction();

    await stockAdjustmentRepository.insert(connection, {
      id: stockAdjustmentId,
      merchant_id: merchantId,
      adjustment_date: data.adjustment_date,
      notes: data.notes ?? null,
    });

    for (const item of data.items) {
      const context = await getIngredientAdjustmentContextForUpdate(connection, merchantId, item.ingredient_id, item.ingredient_unit_id);
      const result = await processStockAdjustmentItem({
        db: connection,
        stockAdjustmentId,
        adjustmentDate: data.adjustment_date,
        item,
        context,
        userId,
      });

      if (result.flow_type === 'in') {
        inItemCount += 1;
        totalInValue += result.total_value;
      } else {
        outItemCount += 1;
        totalOutValue += result.total_value;
      }
    }

    await commitTransaction(connection);

    return {
      id: stockAdjustmentId,
      adjustment_date: data.adjustment_date,
      item_count: data.items.length,
      in_item_count: inItemCount,
      out_item_count: outItemCount,
      total_in_value: totalInValue,
      total_out_value: totalOutValue,
    };
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to create stock adjustment');
  }
};

// Estimate FIFO value for one stock adjustment out item
export const estimateOut = async ({
  merchantId,
  ingredient_id,
  ingredient_unit_id,
  quantity,
}: EstimateStockAdjustmentOutServiceRequest): Promise<StockAdjustmentEstimateMap> => {
  try {
    const context = await getIngredientAdjustmentContext(merchantId, ingredient_id, ingredient_unit_id);
    const baseUnitQuantity = quantity * context.unit.conversion_factor;

    validateIngredientAdjustmentContext(context);
    validateAvailableStock(context, baseUnitQuantity);

    const batches = await ingredientBatchRepository.getActiveByIngredientId(ingredient_id);
    const estimateResult = calculateFifoCostEstimate(batches, baseUnitQuantity, context.ingredient_name);

    return {
      ingredient_id,
      ingredient_unit_id,
      quantity,
      base_unit_quantity: baseUnitQuantity,
      estimated_value: estimateResult.total_value,
      weighted_unit_price: quantity > 0 ? estimateResult.total_value / quantity : 0,
    };
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to estimate stock adjustment');
  }
};

const processStockAdjustmentItem = async ({
  db,
  stockAdjustmentId,
  adjustmentDate,
  item,
  context,
  userId,
}: ProcessStockAdjustmentItemRequest): Promise<ProcessStockAdjustmentItemResult> => {
  validateIngredientAdjustmentContext(context);

  if (item.flow_type === 'in') {
    return await processStockAdjustmentInItem({
      db,
      stockAdjustmentId,
      adjustmentDate,
      item,
      context,
      userId,
    });
  }

  return await processStockAdjustmentOutItem({
    db,
    stockAdjustmentId,
    adjustmentDate,
    item,
    context,
    userId,
  });
};

const processStockAdjustmentInItem = async ({
  db,
  stockAdjustmentId,
  adjustmentDate,
  item,
  context,
  userId,
}: ProcessStockAdjustmentItemRequest): Promise<ProcessStockAdjustmentItemResult> => {
  if (item.flow_type !== 'in') {
    throw validationError('Stock adjustment item flow type must be in');
  }

  const baseUnitQuantity = item.quantity * context.unit.conversion_factor;
  const baseUnitPrice = item.unit_price / context.unit.conversion_factor;

  await stockAdjustmentItemRepository.insert(db, {
    id: generateUUID(),
    stock_adjustment_id: stockAdjustmentId,
    flow_type: item.flow_type,
    ingredient_id: item.ingredient_id,
    quantity: item.quantity,
    ingredient_unit_id: item.ingredient_unit_id,
    unit_price: item.unit_price,
    notes: item.notes ?? null,
  });

  await ingredientBatchRepository.insert(db, {
    id: generateUUID(),
    ingredient_id: item.ingredient_id,
    qty_initial: baseUnitQuantity,
    qty_remaining: baseUnitQuantity,
    cost_per_unit: baseUnitPrice,
    purchase_date: adjustmentDate,
  });

  const balanceAfter = await ingredientRepository.increaseStockQuantityById(db, item.ingredient_id, baseUnitQuantity);

  await stockLogRepository.insert(db, {
    id: generateUUID(),
    ingredient_id: item.ingredient_id,
    flow_type: item.flow_type,
    base_unit_quantity: baseUnitQuantity,
    base_unit_price: baseUnitPrice,
    notes: item.notes ?? 'Stock adjustment in',
    balance_after: balanceAfter,
    reference_id: stockAdjustmentId,
    reference_type: 'adjustment',
    created_by: userId,
  });

  return {
    flow_type: item.flow_type,
    total_value: item.quantity * item.unit_price,
  };
};

const processStockAdjustmentOutItem = async ({
  db,
  stockAdjustmentId,
  item,
  context,
  userId,
}: ProcessStockAdjustmentItemRequest): Promise<ProcessStockAdjustmentItemResult> => {
  if (item.flow_type !== 'out') {
    throw validationError('Stock adjustment item flow type must be out');
  }

  const baseUnitQuantity = item.quantity * context.unit.conversion_factor;
  validateAvailableStock(context, baseUnitQuantity);

  const batches = await ingredientBatchRepository.getActiveByIngredientIdForUpdate(db, item.ingredient_id);
  const estimateResult = calculateFifoCostEstimate(batches, baseUnitQuantity, context.ingredient_name);
  const weightedUnitPrice = item.quantity > 0 ? estimateResult.total_value / item.quantity : 0;

  await stockAdjustmentItemRepository.insert(db, {
    id: generateUUID(),
    stock_adjustment_id: stockAdjustmentId,
    flow_type: item.flow_type,
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
      flow_type: item.flow_type,
      base_unit_quantity: consumption.quantity,
      base_unit_price: consumption.cost_per_unit,
      notes: item.notes ?? 'Stock adjustment out',
      balance_after: balanceAfter,
      reference_id: stockAdjustmentId,
      reference_type: 'adjustment',
      created_by: userId,
    });
  }

  return {
    flow_type: item.flow_type,
    total_value: estimateResult.total_value,
  };
};

const getIngredientAdjustmentContext = async (
  merchantId: string,
  ingredientId: string,
  unitId: string,
): Promise<IngredientAdjustmentContext> => {
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

const getIngredientAdjustmentContextForUpdate = async (
  db: ReservedSQL,
  merchantId: string,
  ingredientId: string,
  unitId: string,
): Promise<IngredientAdjustmentContext> => {
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

const validateIngredientAdjustmentContext = (context: IngredientAdjustmentContext): void => {
  if (!context.ingredient_is_active) {
    throw validationError(`Ingredient "${context.ingredient_name}" is inactive`);
  }

  if (!context.unit.is_active) {
    throw validationError(`Unit "${context.unit.unit_name}" is inactive`);
  }

  if (context.unit.conversion_factor <= 0) {
    throw validationError(`Invalid conversion factor for unit "${context.unit.unit_name}"`);
  }
};

const validateAvailableStock = (context: IngredientAdjustmentContext, baseUnitQuantity: number): void => {
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
  let totalValue = 0;
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
    totalValue += consumedQuantity * batch.cost_per_unit;
    remainingQuantity -= consumedQuantity;
  }

  if (remainingQuantity > QUANTITY_EPSILON) {
    throw validationError(`Insufficient FIFO batch stock for ingredient "${ingredientName}"`);
  }

  return {
    base_unit_quantity: requestedBaseUnitQuantity,
    total_value: totalValue,
    weighted_base_unit_price: requestedBaseUnitQuantity > 0 ? totalValue / requestedBaseUnitQuantity : 0,
    consumptions,
  };
};

const toStockAdjustmentListMap = (row: StockAdjustmentListRow): StockAdjustmentListMap => {
  return {
    id: row.id,
    adjustment_date: row.adjustment_date,
    item_count: row.item_count,
    in_item_count: row.in_item_count,
    out_item_count: row.out_item_count,
    total_in_value: row.total_in_value,
    total_out_value: row.total_out_value,
    notes: row.notes,
    created_at: row.created_at,
  };
};

const toStockAdjustmentItemMap = (row: StockAdjustmentItemRow): StockAdjustmentItemMap => {
  return {
    id: row.id,
    flow_type: row.flow_type,
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
