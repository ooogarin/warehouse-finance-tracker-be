import type { z } from 'zod';
import type { CashCategory } from '@/modules/cash/cash-log.type';
import type { DebtCreditorType, DebtStatus } from '@/modules/debts/debt.type';
import type { IngredientCategory } from '@/modules/ingredients/ingredient.type';
import type { dashboardQuerySchema } from './dashboard.schema';

export type DashboardPeriod = 'daily' | 'weekly' | 'monthly';

// ----------------------------------------------------------------------------------------------------
// Request contracts
// ----------------------------------------------------------------------------------------------------

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

export type GetDashboardRequest = DashboardQuery & {
  merchantId: string;
};

// ----------------------------------------------------------------------------------------------------
// Service operations
// ----------------------------------------------------------------------------------------------------

export type DashboardCashMap = {
  current_balance: number;
  total_in: number;
  total_out: number;
  net: number;
  previous_total_in: number;
  previous_total_out: number;
  in_change_percent: number | null;
  out_change_percent: number | null;
};

export type DashboardExpenseCategoryMap = {
  category: CashCategory;
  total: number;
  percentage: number;
};

export type DashboardStockAlertItemMap = {
  ingredient_id: string;
  name: string;
  category: IngredientCategory;
  base_unit: string;
  stock_quantity: number;
  min_stock: number;
};

export type DashboardStockAlertsMap = {
  out_count: number;
  low_count: number;
  out_items: DashboardStockAlertItemMap[];
  low_items: DashboardStockAlertItemMap[];
};

export type DashboardTopWasteMap = {
  ingredient_id: string;
  ingredient_name: string;
  ingredient_category: IngredientCategory;
  total_quantity: number;
  unit_name: string;
  total_value: number;
};

export type DashboardDebtAlertItemMap = {
  id: string;
  creditor_type: DebtCreditorType;
  creditor_name: string | null;
  supplier_id: string | null;
  supplier_name: string | null;
  remaining_amount: number;
  status: DebtStatus;
  due_date: string;
};

export type DashboardDebtAlertsMap = {
  overdue_count: number;
  due_soon_count: number;
  overdue_items: DashboardDebtAlertItemMap[];
  due_soon_items: DashboardDebtAlertItemMap[];
};

export type DashboardMap = {
  period: DashboardPeriod;
  cash: DashboardCashMap;
  expense_breakdown: {
    top_categories: DashboardExpenseCategoryMap[];
    categories: DashboardExpenseCategoryMap[];
  };
  stock_alerts: DashboardStockAlertsMap;
  top_waste_this_month: DashboardTopWasteMap[];
  debt_alerts: DashboardDebtAlertsMap;
};

// ----------------------------------------------------------------------------------------------------
// Repository options
// ----------------------------------------------------------------------------------------------------

export type DashboardPeriodByMerchantIdOptions = {
  merchantId: string;
  period: DashboardPeriod;
};

export type DashboardByMerchantIdOptions = {
  merchantId: string;
};

// ----------------------------------------------------------------------------------------------------
// Repository responses
// ----------------------------------------------------------------------------------------------------

export type DashboardCashSummaryRow = {
  current_balance: number;
  total_in: number;
  total_out: number;
  previous_total_in: number;
  previous_total_out: number;
};

export type DashboardExpenseCategoryRow = {
  category: CashCategory;
  total: number;
};

export type DashboardStockAlertRow = DashboardStockAlertItemMap & {
  status: 'out' | 'low';
};

export type DashboardTopWasteRow = DashboardTopWasteMap;

export type DashboardDebtAlertRow = DashboardDebtAlertItemMap & {
  alert_type: 'overdue' | 'due_soon';
};
