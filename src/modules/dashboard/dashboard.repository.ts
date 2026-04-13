import { sql } from '@/core/db/client';
import type {
  DashboardByMerchantIdOptions,
  DashboardCashSummaryRow,
  DashboardDebtAlertRow,
  DashboardExpenseCategoryRow,
  DashboardPeriodByMerchantIdOptions,
  DashboardStockAlertRow,
  DashboardTopWasteRow,
} from './dashboard.type';

// Get cash summary for selected dashboard period and previous period
export const getCashSummaryByMerchantId = async ({
  merchantId,
  period,
}: DashboardPeriodByMerchantIdOptions): Promise<DashboardCashSummaryRow> => {
  const [result] = await sql<DashboardCashSummaryRow[]>`
    WITH bounds AS (
      SELECT
        CASE
          WHEN ${period} = 'weekly' THEN date_trunc('week', CURRENT_DATE)::timestamptz
          WHEN ${period} = 'monthly' THEN date_trunc('month', CURRENT_DATE)::timestamptz
          ELSE CURRENT_DATE::timestamptz
        END AS current_start,
        CASE
          WHEN ${period} = 'weekly' THEN (date_trunc('week', CURRENT_DATE) + INTERVAL '1 week')::timestamptz
          WHEN ${period} = 'monthly' THEN (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::timestamptz
          ELSE (CURRENT_DATE + INTERVAL '1 day')::timestamptz
        END AS current_end,
        CASE
          WHEN ${period} = 'weekly' THEN (date_trunc('week', CURRENT_DATE) - INTERVAL '1 week')::timestamptz
          WHEN ${period} = 'monthly' THEN (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::timestamptz
          ELSE (CURRENT_DATE - INTERVAL '1 day')::timestamptz
        END AS previous_start
    )
    SELECT
      m.cash_balance::double precision AS current_balance,
      COALESCE(SUM(cl.amount) FILTER (
        WHERE cl.flow_type = 'in'
          AND cl.cash_log_date >= bounds.current_start
          AND cl.cash_log_date < bounds.current_end
      ), 0)::double precision AS total_in,
      COALESCE(SUM(cl.amount) FILTER (
        WHERE cl.flow_type = 'out'
          AND cl.cash_log_date >= bounds.current_start
          AND cl.cash_log_date < bounds.current_end
      ), 0)::double precision AS total_out,
      COALESCE(SUM(cl.amount) FILTER (
        WHERE cl.flow_type = 'in'
          AND cl.cash_log_date >= bounds.previous_start
          AND cl.cash_log_date < bounds.current_start
      ), 0)::double precision AS previous_total_in,
      COALESCE(SUM(cl.amount) FILTER (
        WHERE cl.flow_type = 'out'
          AND cl.cash_log_date >= bounds.previous_start
          AND cl.cash_log_date < bounds.current_start
      ), 0)::double precision AS previous_total_out
    FROM merchants m
    CROSS JOIN bounds
    LEFT JOIN cash_logs cl ON cl.merchant_id = m.id
    WHERE m.id = ${merchantId}
      AND m.deleted_at IS NULL
    GROUP BY m.cash_balance
  `;

  return (
    result ?? {
      current_balance: 0,
      total_in: 0,
      total_out: 0,
      previous_total_in: 0,
      previous_total_out: 0,
    }
  );
};

// Get expense category breakdown for selected dashboard period
export const getExpenseBreakdownByMerchantId = async ({
  merchantId,
  period,
}: DashboardPeriodByMerchantIdOptions): Promise<DashboardExpenseCategoryRow[]> => {
  return await sql<DashboardExpenseCategoryRow[]>`
    WITH bounds AS (
      SELECT
        CASE
          WHEN ${period} = 'weekly' THEN date_trunc('week', CURRENT_DATE)::timestamptz
          WHEN ${period} = 'monthly' THEN date_trunc('month', CURRENT_DATE)::timestamptz
          ELSE CURRENT_DATE::timestamptz
        END AS current_start,
        CASE
          WHEN ${period} = 'weekly' THEN (date_trunc('week', CURRENT_DATE) + INTERVAL '1 week')::timestamptz
          WHEN ${period} = 'monthly' THEN (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::timestamptz
          ELSE (CURRENT_DATE + INTERVAL '1 day')::timestamptz
        END AS current_end
    )
    SELECT
      cl.category,
      SUM(cl.amount)::double precision AS total
    FROM cash_logs cl
    CROSS JOIN bounds
    WHERE cl.merchant_id = ${merchantId}
      AND cl.flow_type = 'out'
      AND cl.cash_log_date >= bounds.current_start
      AND cl.cash_log_date < bounds.current_end
    GROUP BY cl.category
    HAVING SUM(cl.amount) > 0
    ORDER BY total DESC, cl.category ASC
  `;
};

// Get active low and out stock alert items
export const getStockAlertsByMerchantId = async ({ merchantId }: DashboardByMerchantIdOptions): Promise<DashboardStockAlertRow[]> => {
  return await sql<DashboardStockAlertRow[]>`
    SELECT
      i.id AS ingredient_id,
      i.name,
      i.category,
      i.base_unit,
      i.stock_quantity::double precision AS stock_quantity,
      i.min_stock::double precision AS min_stock,
      CASE
        WHEN i.stock_quantity = 0 THEN 'out'
        ELSE 'low'
      END AS status
    FROM ingredients i
    WHERE i.merchant_id = ${merchantId}
      AND i.is_active = true
      AND i.stock_quantity <= i.min_stock
    ORDER BY
      CASE WHEN i.stock_quantity = 0 THEN 1 ELSE 2 END ASC,
      i.name ASC
  `;
};

// Get top waste ingredients for current month
export const getTopWasteThisMonthByMerchantId = async ({ merchantId }: DashboardByMerchantIdOptions): Promise<DashboardTopWasteRow[]> => {
  return await sql<DashboardTopWasteRow[]>`
    SELECT
      i.id AS ingredient_id,
      i.name AS ingredient_name,
      i.category AS ingredient_category,
      SUM(sui.quantity)::double precision AS total_quantity,
      CASE
        WHEN COUNT(DISTINCT iu.unit_name) = 1 THEN MAX(iu.unit_name)
        ELSE 'mixed'
      END AS unit_name,
      SUM(sui.subtotal)::double precision AS total_value
    FROM stock_usages su
    INNER JOIN stock_usage_items sui ON sui.stock_usage_id = su.id
      AND sui.deleted_at IS NULL
    INNER JOIN ingredients i ON i.id = sui.ingredient_id
    INNER JOIN ingredient_units iu ON iu.id = sui.ingredient_unit_id
    WHERE su.merchant_id = ${merchantId}
      AND su.type = 'waste'
      AND su.deleted_at IS NULL
      AND su.usage_date >= date_trunc('month', CURRENT_DATE)::timestamptz
      AND su.usage_date < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::timestamptz
    GROUP BY i.id, i.name, i.category
    ORDER BY total_value DESC, i.name ASC
    LIMIT 5
  `;
};

// Get overdue and due-soon debt alert items
export const getDebtAlertsByMerchantId = async ({ merchantId }: DashboardByMerchantIdOptions): Promise<DashboardDebtAlertRow[]> => {
  return await sql<DashboardDebtAlertRow[]>`
    SELECT
      d.id,
      d.creditor_type,
      d.creditor_name,
      d.supplier_id,
      s.name AS supplier_name,
      (d.total_amount - d.paid_amount)::double precision AS remaining_amount,
      d.status,
      d.due_date::text AS due_date,
      CASE
        WHEN d.due_date < CURRENT_DATE THEN 'overdue'
        ELSE 'due_soon'
      END AS alert_type
    FROM debts d
    LEFT JOIN suppliers s ON s.id = d.supplier_id
    WHERE d.merchant_id = ${merchantId}
      AND d.deleted_at IS NULL
      AND d.status IN ('unpaid', 'partial')
      AND d.due_date IS NOT NULL
      AND (
        d.due_date < CURRENT_DATE
        OR d.due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days')::date
      )
    ORDER BY
      CASE WHEN d.due_date < CURRENT_DATE THEN 1 ELSE 2 END ASC,
      d.due_date ASC,
      d.created_at DESC
  `;
};
