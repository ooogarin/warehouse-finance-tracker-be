import { sql } from '@/core/db/client';
import type {
  FinancialReportCashSummaryRow,
  FinancialReportCategoryRow,
  FinancialReportListOptions,
  FinancialReportTransactionRow,
  ReportCountRow,
  ReportDateRangeRow,
  ReportPeriodOptions,
  StockReportListOptions,
  StockReportMovementRow,
  StockReportSummaryRow,
  StockReportUsageIngredientRow,
  SupplierReportDebtPaymentRow,
  SupplierReportListOptions,
  SupplierReportPurchaseOrderRow,
  SupplierReportSummaryItemRow,
} from './report.type';

// Resolve selected and previous date range for reports
export const getDateRange = async ({ period, date, dateFrom, dateTo }: ReportPeriodOptions): Promise<ReportDateRangeRow> => {
  const [result] = await sql<ReportDateRangeRow[]>`
    WITH current_bounds AS (
      SELECT
        CASE
          WHEN ${period} = 'custom' THEN ${dateFrom ?? null}::date::timestamptz
          WHEN ${period} = 'daily' THEN COALESCE(${date ?? null}::date, CURRENT_DATE)::timestamptz
          WHEN ${period} = 'weekly' THEN date_trunc('week', COALESCE(${date ?? null}::date, CURRENT_DATE))::timestamptz
          ELSE date_trunc('month', COALESCE(${date ?? null}::date, CURRENT_DATE))::timestamptz
        END AS current_start,
        CASE
          WHEN ${period} = 'custom' THEN (${dateTo ?? null}::date + INTERVAL '1 day')::timestamptz
          WHEN ${period} = 'daily' THEN (COALESCE(${date ?? null}::date, CURRENT_DATE) + INTERVAL '1 day')::timestamptz
          WHEN ${period} = 'weekly' THEN (date_trunc('week', COALESCE(${date ?? null}::date, CURRENT_DATE)) + INTERVAL '1 week')::timestamptz
          ELSE (date_trunc('month', COALESCE(${date ?? null}::date, CURRENT_DATE)) + INTERVAL '1 month')::timestamptz
        END AS current_end
    )
    SELECT
      current_start::text,
      current_end::text,
      (current_start - (current_end - current_start))::text AS previous_start,
      current_start::text AS previous_end
    FROM current_bounds
  `;

  if (!result) {
    throw new Error('Failed to resolve report date range');
  }

  return result;
};

// Get cash summary for selected and previous report period
export const getFinancialCashSummary = async (options: FinancialReportListOptions): Promise<FinancialReportCashSummaryRow> => {
  const [result] = await sql<FinancialReportCashSummaryRow[]>`
    WITH bounds AS (${reportBoundsSql(options)})
    SELECT
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
    FROM bounds
    LEFT JOIN cash_logs cl ON cl.merchant_id = ${options.merchantId}
  `;

  return result ?? { total_in: 0, total_out: 0, previous_total_in: 0, previous_total_out: 0 };
};

// Get income and expense breakdown for selected report period
export const getFinancialCategoryBreakdown = async (options: FinancialReportListOptions): Promise<FinancialReportCategoryRow[]> => {
  return await sql<FinancialReportCategoryRow[]>`
    WITH bounds AS (${reportBoundsSql(options)})
    SELECT
      cl.category,
      cl.flow_type,
      SUM(cl.amount)::double precision AS total
    FROM cash_logs cl
    CROSS JOIN bounds
    WHERE cl.merchant_id = ${options.merchantId}
      AND cl.cash_log_date >= bounds.current_start
      AND cl.cash_log_date < bounds.current_end
    GROUP BY cl.category, cl.flow_type
    ORDER BY cl.flow_type ASC, total DESC, cl.category ASC
  `;
};

// Get paginated cash transactions for selected report period
export const getFinancialTransactions = async (options: FinancialReportListOptions): Promise<FinancialReportTransactionRow[]> => {
  const offset = (options.page - 1) * options.limit;

  return await sql<FinancialReportTransactionRow[]>`
    WITH bounds AS (${reportBoundsSql(options)})
    SELECT
      cl.id,
      cl.cash_log_date::text AS cash_log_date,
      cl.flow_type,
      cl.category,
      cl.amount::double precision AS amount,
      cl.balance_after::double precision AS balance_after,
      cl.description,
      cl.reference_id,
      cl.reference_type,
      cl.created_at::text AS created_at
    FROM cash_logs cl
    CROSS JOIN bounds
    WHERE cl.merchant_id = ${options.merchantId}
      AND cl.cash_log_date >= bounds.current_start
      AND cl.cash_log_date < bounds.current_end
    ORDER BY cl.cash_log_date DESC, cl.created_at DESC
    LIMIT ${options.limit}
    OFFSET ${offset}
  `;
};

// Count cash transactions for selected report period
export const countFinancialTransactions = async (options: FinancialReportListOptions): Promise<number> => {
  const [result] = await sql<ReportCountRow[]>`
    WITH bounds AS (${reportBoundsSql(options)})
    SELECT COUNT(*)::integer AS total
    FROM cash_logs cl
    CROSS JOIN bounds
    WHERE cl.merchant_id = ${options.merchantId}
      AND cl.cash_log_date >= bounds.current_start
      AND cl.cash_log_date < bounds.current_end
  `;

  return result?.total ?? 0;
};

// Get realtime stock summary for stock report
export const getStockSummary = async ({ merchantId }: StockReportListOptions): Promise<StockReportSummaryRow> => {
  const [result] = await sql<StockReportSummaryRow[]>`
    SELECT
      COUNT(i.id)::integer AS active_ingredients,
      COALESCE(SUM(batch_value.inventory_value), 0)::double precision AS inventory_value,
      COUNT(i.id) FILTER (WHERE i.stock_quantity > 0 AND i.stock_quantity <= i.min_stock)::integer AS low_stock_count,
      COUNT(i.id) FILTER (WHERE i.stock_quantity = 0)::integer AS out_stock_count
    FROM ingredients i
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(ib.qty_remaining * ib.cost_per_unit), 0) AS inventory_value
      FROM ingredient_batches ib
      WHERE ib.ingredient_id = i.id
        AND ib.deleted_at IS NULL
        AND ib.qty_remaining > 0
    ) batch_value ON true
    WHERE i.merchant_id = ${merchantId}
      AND i.is_active = true
  `;

  return result ?? { active_ingredients: 0, inventory_value: 0, low_stock_count: 0, out_stock_count: 0 };
};

// Get usage or waste aggregation by ingredient for selected report period
export const getStockUsageByType = async (
  options: StockReportListOptions & { type: 'usage' | 'waste' },
): Promise<StockReportUsageIngredientRow[]> => {
  return await sql<StockReportUsageIngredientRow[]>`
    WITH bounds AS (${reportBoundsSql(options)})
    SELECT
      i.id AS ingredient_id,
      i.name AS ingredient_name,
      i.category AS ingredient_category,
      i.base_unit,
      SUM(sui.quantity * iu.conversion_factor)::double precision AS total_quantity,
      SUM(sui.subtotal)::double precision AS total_value
    FROM stock_usages su
    INNER JOIN stock_usage_items sui ON sui.stock_usage_id = su.id
      AND sui.deleted_at IS NULL
    INNER JOIN ingredients i ON i.id = sui.ingredient_id
    INNER JOIN ingredient_units iu ON iu.id = sui.ingredient_unit_id
    CROSS JOIN bounds
    WHERE su.merchant_id = ${options.merchantId}
      AND su.type = ${options.type}
      AND su.deleted_at IS NULL
      AND su.usage_date >= bounds.current_start
      AND su.usage_date < bounds.current_end
    GROUP BY i.id, i.name, i.category, i.base_unit
    ORDER BY total_value DESC, i.name ASC
    LIMIT 10
  `;
};

// Get paginated stock movements for selected report period
export const getStockMovements = async (options: StockReportListOptions): Promise<StockReportMovementRow[]> => {
  const offset = (options.page - 1) * options.limit;

  return await sql<StockReportMovementRow[]>`
    WITH bounds AS (${reportBoundsSql(options)})
    SELECT
      sl.id,
      sl.created_at::text AS created_at,
      i.id AS ingredient_id,
      i.name AS ingredient_name,
      i.category AS ingredient_category,
      sl.flow_type,
      sl.reference_type,
      sl.reference_id,
      sl.base_unit_quantity::double precision AS base_unit_quantity,
      i.base_unit,
      sl.base_unit_price::double precision AS base_unit_price,
      sl.total_amount::double precision AS total_amount,
      sl.balance_after::double precision AS balance_after,
      sl.notes
    FROM stock_logs sl
    INNER JOIN ingredients i ON i.id = sl.ingredient_id
    CROSS JOIN bounds
    WHERE i.merchant_id = ${options.merchantId}
      AND sl.created_at >= bounds.current_start
      AND sl.created_at < bounds.current_end
      AND (
        ${options.referenceType ?? null}::stock_log_reference_type IS NULL
        OR sl.reference_type = ${options.referenceType ?? null}
      )
      AND (
        ${options.ingredientId ?? null}::uuid IS NULL
        OR sl.ingredient_id = ${options.ingredientId ?? null}
      )
    ORDER BY sl.created_at DESC
    LIMIT ${options.limit}
    OFFSET ${offset}
  `;
};

// Count stock movements for selected report period
export const countStockMovements = async (options: StockReportListOptions): Promise<number> => {
  const [result] = await sql<ReportCountRow[]>`
    WITH bounds AS (${reportBoundsSql(options)})
    SELECT COUNT(*)::integer AS total
    FROM stock_logs sl
    INNER JOIN ingredients i ON i.id = sl.ingredient_id
    CROSS JOIN bounds
    WHERE i.merchant_id = ${options.merchantId}
      AND sl.created_at >= bounds.current_start
      AND sl.created_at < bounds.current_end
      AND (
        ${options.referenceType ?? null}::stock_log_reference_type IS NULL
        OR sl.reference_type = ${options.referenceType ?? null}
      )
      AND (
        ${options.ingredientId ?? null}::uuid IS NULL
        OR sl.ingredient_id = ${options.ingredientId ?? null}
      )
  `;

  return result?.total ?? 0;
};

// Get supplier performance summary for selected report period
export const getSupplierSummary = async (options: SupplierReportListOptions): Promise<SupplierReportSummaryItemRow[]> => {
  return await sql<SupplierReportSummaryItemRow[]>`
    WITH bounds AS (${reportBoundsSql(options)})
    SELECT
      po.supplier_id,
      COALESCE(s.name, 'No Supplier') AS supplier_name,
      COUNT(po.id)::integer AS purchase_order_count,
      SUM(po.total_amount)::double precision AS total_spend,
      SUM(po.debt_amount)::double precision AS total_debt,
      MAX(po.purchase_date)::text AS last_order_date
    FROM purchase_orders po
    LEFT JOIN suppliers s ON s.id = po.supplier_id
    CROSS JOIN bounds
    WHERE po.merchant_id = ${options.merchantId}
      AND po.deleted_at IS NULL
      AND po.purchase_date >= bounds.current_start
      AND po.purchase_date < bounds.current_end
      AND (
        ${options.supplierId ?? null}::uuid IS NULL
        OR po.supplier_id = ${options.supplierId ?? null}
      )
    GROUP BY po.supplier_id, s.name
    ORDER BY total_spend DESC, supplier_name ASC
  `;
};

// Get paginated supplier purchase orders for selected report period
export const getSupplierPurchaseOrders = async (options: SupplierReportListOptions): Promise<SupplierReportPurchaseOrderRow[]> => {
  const offset = (options.page - 1) * options.limit;

  return await sql<SupplierReportPurchaseOrderRow[]>`
    WITH bounds AS (${reportBoundsSql(options)})
    SELECT
      po.id,
      po.purchase_date::text AS purchase_date,
      po.supplier_id,
      s.name AS supplier_name,
      po.invoice_number,
      po.total_amount::double precision AS total_amount,
      po.paid_cash::double precision AS paid_cash,
      po.paid_owner::double precision AS paid_owner,
      po.debt_amount::double precision AS debt_amount,
      d.status AS debt_status
    FROM purchase_orders po
    LEFT JOIN suppliers s ON s.id = po.supplier_id
    LEFT JOIN debts d ON d.purchase_order_id = po.id
      AND d.deleted_at IS NULL
    CROSS JOIN bounds
    WHERE po.merchant_id = ${options.merchantId}
      AND po.deleted_at IS NULL
      AND po.purchase_date >= bounds.current_start
      AND po.purchase_date < bounds.current_end
      AND (
        ${options.supplierId ?? null}::uuid IS NULL
        OR po.supplier_id = ${options.supplierId ?? null}
      )
    ORDER BY po.purchase_date DESC, po.created_at DESC
    LIMIT ${options.limit}
    OFFSET ${offset}
  `;
};

// Count supplier purchase orders for selected report period
export const countSupplierPurchaseOrders = async (options: SupplierReportListOptions): Promise<number> => {
  const [result] = await sql<ReportCountRow[]>`
    WITH bounds AS (${reportBoundsSql(options)})
    SELECT COUNT(*)::integer AS total
    FROM purchase_orders po
    CROSS JOIN bounds
    WHERE po.merchant_id = ${options.merchantId}
      AND po.deleted_at IS NULL
      AND po.purchase_date >= bounds.current_start
      AND po.purchase_date < bounds.current_end
      AND (
        ${options.supplierId ?? null}::uuid IS NULL
        OR po.supplier_id = ${options.supplierId ?? null}
      )
  `;

  return result?.total ?? 0;
};

// Get supplier debt payment history for selected report period
export const getSupplierDebtPayments = async (options: SupplierReportListOptions): Promise<SupplierReportDebtPaymentRow[]> => {
  return await sql<SupplierReportDebtPaymentRow[]>`
    WITH bounds AS (${reportBoundsSql(options)})
    SELECT
      dp.id,
      dp.debt_id,
      dp.created_at::text AS payment_date,
      d.supplier_id,
      s.name AS supplier_name,
      d.purchase_order_id,
      po.invoice_number,
      dp.amount::double precision AS amount,
      dp.payment_method,
      dp.reference_number,
      dp.notes
    FROM debt_payments dp
    INNER JOIN debts d ON d.id = dp.debt_id
    LEFT JOIN suppliers s ON s.id = d.supplier_id
    LEFT JOIN purchase_orders po ON po.id = d.purchase_order_id
    CROSS JOIN bounds
    WHERE d.merchant_id = ${options.merchantId}
      AND d.deleted_at IS NULL
      AND dp.created_at >= bounds.current_start
      AND dp.created_at < bounds.current_end
      AND (
        ${options.supplierId ?? null}::uuid IS NULL
        OR d.supplier_id = ${options.supplierId ?? null}
      )
    ORDER BY dp.created_at DESC
    LIMIT 50
  `;
};

const reportBoundsSql = ({ period, date, dateFrom, dateTo }: ReportPeriodOptions) => sql`
  SELECT
    current_start,
    current_end,
    current_start - (current_end - current_start) AS previous_start
  FROM (
    SELECT
      CASE
        WHEN ${period} = 'custom' THEN ${dateFrom ?? null}::date::timestamptz
        WHEN ${period} = 'daily' THEN COALESCE(${date ?? null}::date, CURRENT_DATE)::timestamptz
        WHEN ${period} = 'weekly' THEN date_trunc('week', COALESCE(${date ?? null}::date, CURRENT_DATE))::timestamptz
        ELSE date_trunc('month', COALESCE(${date ?? null}::date, CURRENT_DATE))::timestamptz
      END AS current_start,
      CASE
        WHEN ${period} = 'custom' THEN (${dateTo ?? null}::date + INTERVAL '1 day')::timestamptz
        WHEN ${period} = 'daily' THEN (COALESCE(${date ?? null}::date, CURRENT_DATE) + INTERVAL '1 day')::timestamptz
        WHEN ${period} = 'weekly' THEN (date_trunc('week', COALESCE(${date ?? null}::date, CURRENT_DATE)) + INTERVAL '1 week')::timestamptz
        ELSE (date_trunc('month', COALESCE(${date ?? null}::date, CURRENT_DATE)) + INTERVAL '1 month')::timestamptz
      END AS current_end
  ) current_bounds
`;
