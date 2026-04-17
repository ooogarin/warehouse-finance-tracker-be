import { internalError, isAppError } from '@/core/errors/app-error';
import * as ingredientUnitRepository from '@/modules/ingredients/ingredient-units/ingredient-unit.repository';
import * as reportRepository from './report.repository';
import type { IngredientUnitRow } from '@/modules/ingredients/ingredient-units/ingredient-unit.type';
import type { PaginationMeta } from '@/shared/types/common.types';
import type {
  FinancialReportCashSummaryMap,
  FinancialReportCashSummaryRow,
  FinancialReportCategoryMap,
  FinancialReportCategoryRow,
  FinancialReportMap,
  GetFinancialReportRequest,
  GetStockReportRequest,
  GetSupplierReportRequest,
  ReportDateRangeMap,
  ReportQuantityDisplayMap,
  StockReportMap,
  StockReportUsageIngredientMap,
  StockReportUsageIngredientRow,
  SupplierReportMap,
} from './report.type';

// Get financial report aggregate data
export const getFinancialReport = async (request: GetFinancialReportRequest): Promise<FinancialReportMap> => {
  try {
    const [dateRange, cashSummary, categoryRows, transactions, totalTransactions] = await Promise.all([
      reportRepository.getDateRange(toPeriodOptions(request)),
      reportRepository.getFinancialCashSummary(toFinancialOptions(request)),
      reportRepository.getFinancialCategoryBreakdown(toFinancialOptions(request)),
      reportRepository.getFinancialTransactions(toFinancialOptions(request)),
      reportRepository.countFinancialTransactions(toFinancialOptions(request)),
    ]);

    const expenseRows = categoryRows.filter((row) => row.flow_type === 'out');
    const incomeRows = categoryRows.filter((row) => row.flow_type === 'in');

    return {
      date_range: toDateRangeMap(request, dateRange),
      cash_summary: toFinancialCashSummaryMap(cashSummary),
      expense_breakdown: toCategoryMaps(expenseRows),
      income_breakdown: toCategoryMaps(incomeRows),
      transactions: {
        pagination: toPaginationMeta(request.page, request.limit, totalTransactions),
        data: transactions,
      },
    };
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to get financial report');
  }
};

// Get stock report aggregate data
export const getStockReport = async (request: GetStockReportRequest): Promise<StockReportMap> => {
  try {
    const [dateRange, summary, wasteRows, usageRows, movements, totalMovements] = await Promise.all([
      reportRepository.getDateRange(toPeriodOptions(request)),
      reportRepository.getStockSummary(toStockOptions(request)),
      reportRepository.getStockUsageByType({ ...toStockOptions(request), type: 'waste' }),
      reportRepository.getStockUsageByType({ ...toStockOptions(request), type: 'usage' }),
      reportRepository.getStockMovements(toStockOptions(request)),
      reportRepository.countStockMovements(toStockOptions(request)),
    ]);
    const [wasteData, usageData] = await Promise.all([toStockUsageMaps(wasteRows), toStockUsageMaps(usageRows)]);

    return {
      date_range: toDateRangeMap(request, dateRange),
      stock_summary: summary,
      top_waste: {
        total_value: sumUsageValue(wasteData),
        data: wasteData,
      },
      usage: {
        total_value: sumUsageValue(usageData),
        data: usageData,
      },
      movements: {
        pagination: toPaginationMeta(request.page, request.limit, totalMovements),
        data: movements,
      },
    };
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to get stock report');
  }
};

// Get supplier performance report aggregate data
export const getSupplierReport = async (request: GetSupplierReportRequest): Promise<SupplierReportMap> => {
  try {
    const [dateRange, supplierSummary, purchaseOrders, totalPurchaseOrders, debtPayments] = await Promise.all([
      reportRepository.getDateRange(toPeriodOptions(request)),
      reportRepository.getSupplierSummary(toSupplierOptions(request)),
      reportRepository.getSupplierPurchaseOrders(toSupplierOptions(request)),
      reportRepository.countSupplierPurchaseOrders(toSupplierOptions(request)),
      reportRepository.getSupplierDebtPayments(toSupplierOptions(request)),
    ]);

    return {
      date_range: toDateRangeMap(request, dateRange),
      supplier_summary: supplierSummary,
      purchase_orders: {
        pagination: toPaginationMeta(request.page, request.limit, totalPurchaseOrders),
        data: purchaseOrders,
      },
      debt_payments: debtPayments,
    };
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to get supplier report');
  }
};

const toPeriodOptions = (request: GetFinancialReportRequest | GetStockReportRequest | GetSupplierReportRequest) => ({
  merchantId: request.merchantId,
  period: request.period,
  date: request.date,
  dateFrom: request.date_from,
  dateTo: request.date_to,
});

const toFinancialOptions = (request: GetFinancialReportRequest) => ({
  ...toPeriodOptions(request),
  page: request.page,
  limit: request.limit,
});

const toStockOptions = (request: GetStockReportRequest) => ({
  ...toPeriodOptions(request),
  page: request.page,
  limit: request.limit,
  referenceType: request.reference_type,
  ingredientId: request.ingredient_id,
});

const toSupplierOptions = (request: GetSupplierReportRequest) => ({
  ...toPeriodOptions(request),
  page: request.page,
  limit: request.limit,
  supplierId: request.supplier_id,
});

const toDateRangeMap = (
  request: GetFinancialReportRequest | GetStockReportRequest | GetSupplierReportRequest,
  row: Omit<ReportDateRangeMap, 'period'>,
): ReportDateRangeMap => ({
  period: request.period,
  current_start: row.current_start,
  current_end: row.current_end,
  previous_start: row.previous_start,
  previous_end: row.previous_end,
});

const toFinancialCashSummaryMap = (row: FinancialReportCashSummaryRow): FinancialReportCashSummaryMap => {
  const net = row.total_in - row.total_out;
  const previousNet = row.previous_total_in - row.previous_total_out;

  return {
    total_in: row.total_in,
    total_out: row.total_out,
    net,
    previous_total_in: row.previous_total_in,
    previous_total_out: row.previous_total_out,
    previous_net: previousNet,
    in_change_percent: calculateChangePercent(row.total_in, row.previous_total_in),
    out_change_percent: calculateChangePercent(row.total_out, row.previous_total_out),
    net_change_percent: calculateChangePercent(net, previousNet),
  };
};

const toCategoryMaps = (rows: FinancialReportCategoryRow[]): FinancialReportCategoryMap[] => {
  const total = rows.reduce((sum, row) => sum + row.total, 0);

  return rows.map((row) => ({
    category: row.category,
    total: row.total,
    percentage: total > 0 ? (row.total / total) * 100 : 0,
  }));
};

const toPaginationMeta = (page: number, limit: number, total: number): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    total_pages: totalPages,
    has_next_page: page < totalPages,
    has_prev_page: page > 1,
  };
};

const sumUsageValue = (rows: StockReportUsageIngredientMap[]): number => rows.reduce((sum, row) => sum + row.total_value, 0);

const toStockUsageMaps = async (rows: StockReportUsageIngredientRow[]): Promise<StockReportUsageIngredientMap[]> => {
  const unitsByIngredientId = await getActiveUnitsByIngredientIdMap(rows.map((row) => row.ingredient_id));

  return rows.map((row) => ({
    ...row,
    total_quantity_display: formatQuantity(row.total_quantity, row.base_unit, unitsByIngredientId.get(row.ingredient_id) ?? []),
  }));
};

const getActiveUnitsByIngredientIdMap = async (ingredientIds: string[]): Promise<Map<string, IngredientUnitRow[]>> => {
  const uniqueIngredientIds = [...new Set(ingredientIds)];
  const unitRows = await Promise.all(
    uniqueIngredientIds.map(async (ingredientId) => ({
      ingredientId,
      units: await ingredientUnitRepository.getAllByIngredientId(ingredientId),
    })),
  );

  return new Map(
    unitRows.map(({ ingredientId, units }) => [
      ingredientId,
      units.filter((unit) => unit.is_active).sort((left, right) => right.conversion_factor - left.conversion_factor),
    ]),
  );
};

const formatQuantity = (quantity: number, baseUnit: string, units: IngredientUnitRow[]): ReportQuantityDisplayMap => {
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

const formatNumber = (value: number): string => Number(value.toFixed(3)).toString();

const calculateChangePercent = (current: number, previous: number): number | null => {
  if (previous === 0) {
    return null;
  }

  return ((current - previous) / previous) * 100;
};
