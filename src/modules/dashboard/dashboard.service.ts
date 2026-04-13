import { internalError, isAppError } from '@/core/errors/app-error';
import * as dashboardRepository from './dashboard.repository';
import type {
  DashboardCashMap,
  DashboardDebtAlertItemMap,
  DashboardExpenseCategoryMap,
  DashboardMap,
  DashboardStockAlertItemMap,
  GetDashboardRequest,
} from './dashboard.type';

// Get dashboard aggregate data
export const getDashboard = async ({ merchantId, period }: GetDashboardRequest): Promise<DashboardMap> => {
  try {
    const [cashSummary, expenseRows, stockRows, wasteRows, debtRows] = await Promise.all([
      dashboardRepository.getCashSummaryByMerchantId({ merchantId, period }),
      dashboardRepository.getExpenseBreakdownByMerchantId({ merchantId, period }),
      dashboardRepository.getStockAlertsByMerchantId({ merchantId }),
      dashboardRepository.getTopWasteThisMonthByMerchantId({ merchantId }),
      dashboardRepository.getDebtAlertsByMerchantId({ merchantId }),
    ]);

    const cash = toDashboardCashMap(cashSummary);
    const expenseCategories = toExpenseCategoryMaps(expenseRows);
    const outStockItems = stockRows.filter((item) => item.status === 'out').map(toStockAlertItemMap);
    const lowStockItems = stockRows.filter((item) => item.status === 'low').map(toStockAlertItemMap);
    const overdueDebts = debtRows.filter((debt) => debt.alert_type === 'overdue').map(toDebtAlertItemMap);
    const dueSoonDebts = debtRows.filter((debt) => debt.alert_type === 'due_soon').map(toDebtAlertItemMap);

    return {
      period,
      cash,
      expense_breakdown: {
        top_categories: expenseCategories.slice(0, 3),
        categories: expenseCategories,
      },
      stock_alerts: {
        out_count: outStockItems.length,
        low_count: lowStockItems.length,
        out_items: outStockItems,
        low_items: lowStockItems,
      },
      top_waste_this_month: wasteRows,
      debt_alerts: {
        overdue_count: overdueDebts.length,
        due_soon_count: dueSoonDebts.length,
        overdue_items: overdueDebts,
        due_soon_items: dueSoonDebts,
      },
    };
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to get dashboard data');
  }
};

const toDashboardCashMap = (cash: {
  current_balance: number;
  total_in: number;
  total_out: number;
  previous_total_in: number;
  previous_total_out: number;
}): DashboardCashMap => {
  return {
    current_balance: cash.current_balance,
    total_in: cash.total_in,
    total_out: cash.total_out,
    net: cash.total_in - cash.total_out,
    previous_total_in: cash.previous_total_in,
    previous_total_out: cash.previous_total_out,
    in_change_percent: calculateChangePercent(cash.total_in, cash.previous_total_in),
    out_change_percent: calculateChangePercent(cash.total_out, cash.previous_total_out),
  };
};

const toExpenseCategoryMaps = (
  rows: { category: DashboardExpenseCategoryMap['category']; total: number }[],
): DashboardExpenseCategoryMap[] => {
  const totalOut = rows.reduce((sum, row) => sum + row.total, 0);

  return rows.map((row) => ({
    category: row.category,
    total: row.total,
    percentage: totalOut > 0 ? (row.total / totalOut) * 100 : 0,
  }));
};

const toStockAlertItemMap = (row: DashboardStockAlertItemMap): DashboardStockAlertItemMap => {
  return {
    ingredient_id: row.ingredient_id,
    name: row.name,
    category: row.category,
    base_unit: row.base_unit,
    stock_quantity: row.stock_quantity,
    min_stock: row.min_stock,
  };
};

const toDebtAlertItemMap = (row: DashboardDebtAlertItemMap): DashboardDebtAlertItemMap => {
  return {
    id: row.id,
    creditor_type: row.creditor_type,
    creditor_name: row.creditor_name,
    supplier_id: row.supplier_id,
    supplier_name: row.supplier_name,
    remaining_amount: row.remaining_amount,
    status: row.status,
    due_date: row.due_date,
  };
};

const calculateChangePercent = (current: number, previous: number): number | null => {
  if (previous === 0) {
    return null;
  }

  return ((current - previous) / previous) * 100;
};
