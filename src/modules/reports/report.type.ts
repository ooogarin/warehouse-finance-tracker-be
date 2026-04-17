import type { z } from 'zod';
import type { CashCategory, CashFlowType } from '@/modules/cash/cash-log.type';
import type { DebtStatus } from '@/modules/debts/debt.type';
import type { IngredientCategory } from '@/modules/ingredients/ingredient.type';
import type { StockLogFlowType, StockLogReferenceType } from '@/modules/inventory/stock.type';
import type { PaginationMeta } from '@/shared/types/common.types';
import type { reportFinancialQuerySchema, reportStockQuerySchema, reportSupplierQuerySchema } from './report.schema';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';

// ----------------------------------------------------------------------------------------------------
// Request contracts
// ----------------------------------------------------------------------------------------------------

export type ReportFinancialQuery = z.infer<typeof reportFinancialQuerySchema>;

export type ReportStockQuery = z.infer<typeof reportStockQuerySchema>;

export type ReportSupplierQuery = z.infer<typeof reportSupplierQuerySchema>;

export type GetFinancialReportRequest = ReportFinancialQuery & {
  merchantId: string;
};

export type GetStockReportRequest = ReportStockQuery & {
  merchantId: string;
};

export type GetSupplierReportRequest = ReportSupplierQuery & {
  merchantId: string;
};

// ----------------------------------------------------------------------------------------------------
// Service operations
// ----------------------------------------------------------------------------------------------------

export type ReportDateRangeMap = {
  period: ReportPeriod;
  current_start: string;
  current_end: string;
  previous_start: string;
  previous_end: string;
};

export type FinancialReportCashSummaryMap = {
  total_in: number;
  total_out: number;
  net: number;
  previous_total_in: number;
  previous_total_out: number;
  previous_net: number;
  in_change_percent: number | null;
  out_change_percent: number | null;
  net_change_percent: number | null;
};

export type FinancialReportCategoryMap = {
  category: CashCategory;
  total: number;
  percentage: number;
};

export type FinancialReportTransactionMap = {
  id: string;
  cash_log_date: string;
  flow_type: CashFlowType;
  category: CashCategory;
  amount: number;
  balance_after: number | null;
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
};

export type FinancialReportMap = {
  date_range: ReportDateRangeMap;
  cash_summary: FinancialReportCashSummaryMap;
  expense_breakdown: FinancialReportCategoryMap[];
  income_breakdown: FinancialReportCategoryMap[];
  transactions: {
    pagination: PaginationMeta;
    data: FinancialReportTransactionMap[];
  };
};

export type StockReportSummaryMap = {
  active_ingredients: number;
  inventory_value: number;
  low_stock_count: number;
  out_stock_count: number;
};

export type StockReportUsageIngredientMap = {
  ingredient_id: string;
  ingredient_name: string;
  ingredient_category: IngredientCategory;
  base_unit: string;
  total_quantity: number;
  total_quantity_display: ReportQuantityDisplayMap;
  total_value: number;
};

export type ReportQuantityDisplayMap = {
  formatted: string;
  base: string;
};

export type StockReportMovementMap = {
  id: string;
  created_at: string;
  ingredient_id: string;
  ingredient_name: string;
  ingredient_category: IngredientCategory;
  flow_type: StockLogFlowType;
  reference_type: StockLogReferenceType;
  reference_id: string | null;
  base_unit_quantity: number;
  base_unit: string;
  base_unit_price: number;
  total_amount: number;
  balance_after: number | null;
  notes: string | null;
};

export type StockReportMap = {
  date_range: ReportDateRangeMap;
  stock_summary: StockReportSummaryMap;
  top_waste: {
    total_value: number;
    data: StockReportUsageIngredientMap[];
  };
  usage: {
    total_value: number;
    data: StockReportUsageIngredientMap[];
  };
  movements: {
    pagination: PaginationMeta;
    data: StockReportMovementMap[];
  };
};

export type SupplierReportSummaryItemMap = {
  supplier_id: string | null;
  supplier_name: string;
  purchase_order_count: number;
  total_spend: number;
  total_debt: number;
  last_order_date: string | null;
};

export type SupplierReportPurchaseOrderMap = {
  id: string;
  purchase_date: string;
  supplier_id: string | null;
  supplier_name: string | null;
  invoice_number: string;
  total_amount: number;
  paid_cash: number;
  paid_owner: number;
  debt_amount: number;
  debt_status: DebtStatus | null;
};

export type SupplierReportDebtPaymentMap = {
  id: string;
  debt_id: string;
  payment_date: string;
  supplier_id: string | null;
  supplier_name: string | null;
  purchase_order_id: string | null;
  invoice_number: string | null;
  amount: number;
  payment_method: 'cash' | 'transfer' | 'other';
  reference_number: string | null;
  notes: string | null;
};

export type SupplierReportMap = {
  date_range: ReportDateRangeMap;
  supplier_summary: SupplierReportSummaryItemMap[];
  purchase_orders: {
    pagination: PaginationMeta;
    data: SupplierReportPurchaseOrderMap[];
  };
  debt_payments: SupplierReportDebtPaymentMap[];
};

// ----------------------------------------------------------------------------------------------------
// Repository options
// ----------------------------------------------------------------------------------------------------

export type ReportPeriodOptions = {
  merchantId: string;
  period: ReportPeriod;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type ReportListOptions = ReportPeriodOptions & {
  page: number;
  limit: number;
};

export type FinancialReportListOptions = ReportListOptions;

export type StockReportListOptions = ReportListOptions & {
  referenceType?: StockLogReferenceType;
  ingredientId?: string;
};

export type SupplierReportListOptions = ReportListOptions & {
  supplierId?: string;
};

// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

export type ReportDateRangeRow = {
  current_start: string;
  current_end: string;
  previous_start: string;
  previous_end: string;
};

export type FinancialReportCashSummaryRow = {
  total_in: number;
  total_out: number;
  previous_total_in: number;
  previous_total_out: number;
};

export type FinancialReportCategoryRow = {
  category: CashCategory;
  flow_type: CashFlowType;
  total: number;
};

export type FinancialReportTransactionRow = FinancialReportTransactionMap;

export type StockReportSummaryRow = StockReportSummaryMap;

export type StockReportUsageIngredientRow = {
  ingredient_id: string;
  ingredient_name: string;
  ingredient_category: IngredientCategory;
  base_unit: string;
  total_quantity: number;
  total_value: number;
};

export type StockReportMovementRow = StockReportMovementMap;

export type SupplierReportSummaryItemRow = SupplierReportSummaryItemMap;

export type SupplierReportPurchaseOrderRow = SupplierReportPurchaseOrderMap;

export type SupplierReportDebtPaymentRow = SupplierReportDebtPaymentMap;

export type ReportCountRow = {
  total: number;
};
