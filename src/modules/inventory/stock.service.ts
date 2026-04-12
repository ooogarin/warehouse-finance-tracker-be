import { internalError, isAppError, notFoundError } from '@/core/errors/app-error';
import * as ingredientUnitRepository from '@/modules/ingredients/ingredient-units/ingredient-unit.repository';
import * as ingredientBatchRepository from './ingredient-batches/ingredient-batch.repository';
import * as stockRepository from './stock.repository';
import * as stockLogRepository from './stock-logs/stock-log.repository';
import type { IngredientUnitRow } from '@/modules/ingredients/ingredient-units/ingredient-unit.type';
import type { IngredientBatchRow } from './ingredient-batches/ingredient-batch.type';
import type {
  GetStockRequest,
  ListStockLogsRequest,
  ListStockRequest,
  StockBatchMap,
  StockDetailMap,
  StockListMap,
  StockLogMap,
  StockMap,
  StockQuantityDisplayMap,
  StockRow,
} from './stock.type';
import type { StockLogRow } from './stock-logs/stock-log.type';

// Get stock list
export const list = async ({ merchantId, search, category, status }: ListStockRequest): Promise<StockListMap> => {
  try {
    const [summary, stocks] = await Promise.all([
      stockRepository.getSummaryByMerchantId(merchantId),
      stockRepository.getAllByMerchantId({ merchantId, search, category, status }),
    ]);

    return {
      summary,
      stocks: await Promise.all(stocks.map(toStockMap)),
    };
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to list stock');
  }
};

// Get stock detail
export const getDetail = async ({ merchantId, ingredientId }: GetStockRequest): Promise<StockDetailMap> => {
  try {
    const stock = await stockRepository.getOneByIngredientIdAndMerchantId(ingredientId, merchantId);
    if (!stock) {
      throw notFoundError('Ingredient stock not found');
    }

    const [units, batches, logs] = await Promise.all([
      getActiveUnitsByIngredientId(ingredientId),
      ingredientBatchRepository.getActiveByIngredientId(ingredientId),
      stockLogRepository.getAllByIngredientId({ ingredientId }),
    ]);

    const stockMap = toStockMapWithUnits(stock, units);

    return {
      ...stockMap,
      batches: batches.map((batch) => toStockBatchMap(batch, stock.base_unit, units)),
      logs: logs.map((log) => toStockLogMap(log, stock.base_unit, units)),
    };
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to get stock detail');
  }
};

// Get stock movement logs
export const listLogs = async ({ merchantId, ingredientId, reference_type }: ListStockLogsRequest): Promise<StockLogMap[]> => {
  try {
    const stock = await stockRepository.getOneByIngredientIdAndMerchantId(ingredientId, merchantId);
    if (!stock) {
      throw notFoundError('Ingredient stock not found');
    }

    const [units, logs] = await Promise.all([
      getActiveUnitsByIngredientId(ingredientId),
      stockLogRepository.getAllByIngredientId({ ingredientId, referenceType: reference_type }),
    ]);

    return logs.map((log) => toStockLogMap(log, stock.base_unit, units));
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to list stock logs');
  }
};

const toStockMap = async (stock: StockRow): Promise<StockMap> => {
  const units = await getActiveUnitsByIngredientId(stock.ingredient_id);
  return toStockMapWithUnits(stock, units);
};

const toStockMapWithUnits = (stock: StockRow, units: IngredientUnitRow[]): StockMap => {
  return {
    ingredient_id: stock.ingredient_id,
    name: stock.name,
    category: stock.category,
    base_unit: stock.base_unit,
    stock_quantity: stock.stock_quantity,
    stock_quantity_display: formatQuantity(stock.stock_quantity, stock.base_unit, units),
    min_stock: stock.min_stock,
    min_stock_display: formatQuantity(stock.min_stock, stock.base_unit, units),
    inventory_value: stock.inventory_value,
    status: stock.status,
    last_updated_at: stock.last_updated_at,
  };
};

const toStockBatchMap = (batch: IngredientBatchRow, baseUnit: string, units: IngredientUnitRow[]): StockBatchMap => {
  return {
    id: batch.id,
    purchase_date: batch.purchase_date,
    qty_initial: batch.qty_initial,
    qty_initial_display: formatQuantity(batch.qty_initial, baseUnit, units),
    qty_remaining: batch.qty_remaining,
    qty_remaining_display: formatQuantity(batch.qty_remaining, baseUnit, units),
    cost_per_unit: batch.cost_per_unit,
    batch_value: batch.batch_value,
  };
};

const toStockLogMap = (log: StockLogRow, baseUnit: string, units: IngredientUnitRow[]): StockLogMap => {
  return {
    id: log.id,
    created_at: log.created_at,
    flow_type: log.flow_type,
    reference_type: log.reference_type,
    movement_label: getMovementLabel(log),
    base_unit_quantity: log.base_unit_quantity,
    quantity_display: formatQuantity(log.base_unit_quantity, baseUnit, units),
    base_unit_price: log.base_unit_price,
    total_amount: log.total_amount,
    balance_after: log.balance_after,
    balance_after_display: log.balance_after === null ? null : formatQuantity(log.balance_after, baseUnit, units),
    reference_id: log.reference_id,
    reference_route: getReferenceRoute(log.reference_type, log.reference_id),
    notes: log.notes,
  };
};

const getActiveUnitsByIngredientId = async (ingredientId: string): Promise<IngredientUnitRow[]> => {
  const units = await ingredientUnitRepository.getAllByIngredientId(ingredientId);
  return units.filter((unit) => unit.is_active).sort((left, right) => right.conversion_factor - left.conversion_factor);
};

const formatQuantity = (quantity: number, baseUnit: string, units: IngredientUnitRow[]): StockQuantityDisplayMap => {
  const activeUnits = units.length > 0 ? units : [createBaseUnit(baseUnit)];
  const sortedUnits = [...activeUnits].sort((left, right) => right.conversion_factor - left.conversion_factor);
  let remaining = quantity;
  const parts: string[] = [];

  for (const unit of sortedUnits) {
    if (unit.conversion_factor <= 0) {
      continue;
    }

    const unitQuantity = Math.floor((remaining + Number.EPSILON) / unit.conversion_factor);
    if (unitQuantity <= 0) {
      continue;
    }

    parts.push(`${formatNumber(unitQuantity)} ${unit.unit_name}`);
    remaining -= unitQuantity * unit.conversion_factor;
  }

  if (parts.length === 0 && quantity > 0) {
    parts.push(`${formatNumber(quantity)} ${baseUnit}`);
  }

  return {
    formatted: parts.length > 0 ? parts.join(' ') : `0 ${baseUnit}`,
    base: `${formatNumber(quantity)} ${baseUnit}`,
  };
};

const createBaseUnit = (baseUnit: string): IngredientUnitRow => {
  return {
    id: 'base',
    ingredient_id: 'base',
    unit_name: baseUnit,
    conversion_factor: 1,
    is_default: true,
    description: null,
    is_active: true,
    created_at: '',
    updated_at: '',
  };
};

const formatNumber = (value: number): string => {
  return Number(value.toFixed(3)).toString();
};

const getMovementLabel = (log: StockLogRow): string => {
  if (log.flow_type === 'in' && log.reference_type === 'purchase') {
    return 'Masuk (Pembelian)';
  }

  if (log.flow_type === 'out' && log.reference_type === 'usage') {
    return 'Keluar (Penggunaan)';
  }

  if (log.flow_type === 'out' && log.reference_type === 'waste') {
    return 'Keluar (Waste)';
  }

  if (log.reference_type === 'adjustment') {
    return log.flow_type === 'in' ? 'Masuk (Adjustment)' : 'Keluar (Adjustment)';
  }

  return log.flow_type === 'in' ? 'Masuk' : 'Keluar';
};

const getReferenceRoute = (referenceType: StockLogRow['reference_type'], referenceId: string | null): string | null => {
  if (!referenceId) {
    return null;
  }

  const routeByReferenceType: Record<StockLogRow['reference_type'], string> = {
    purchase: '/purchase-orders',
    usage: '/stock/usage',
    waste: '/stock/waste',
    adjustment: '/stock/adjustment',
  };

  return `${routeByReferenceType[referenceType]}/${referenceId}`;
};
