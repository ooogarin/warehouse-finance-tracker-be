import { sql } from '@/core/db/client';
import type { StockListByMerchantIdOptions, StockRow, StockSummaryRow } from './stock.type';

// Get stock summary for active ingredients in one merchant
export const getSummaryByMerchantId = async (merchantId: string): Promise<StockSummaryRow> => {
  const [result] = await sql<StockSummaryRow[]>`
    SELECT
      COUNT(*)::integer AS total_ingredients,
      COUNT(*) FILTER (WHERE i.stock_quantity > i.min_stock)::integer AS normal,
      COUNT(*) FILTER (WHERE i.stock_quantity > 0 AND i.stock_quantity <= i.min_stock)::integer AS low,
      COUNT(*) FILTER (WHERE i.stock_quantity = 0)::integer AS out
    FROM ingredients i
    WHERE i.merchant_id = ${merchantId}
      AND i.is_active = true
  `;

  return result ?? { total_ingredients: 0, normal: 0, low: 0, out: 0 };
};

// Get stock list for active ingredients in one merchant
export const getAllByMerchantId = async ({ merchantId, search, category, status }: StockListByMerchantIdOptions): Promise<StockRow[]> => {
  const searchPattern = search?.trim() ? `%${search.trim()}%` : null;

  return await sql<StockRow[]>`
    SELECT
      i.id AS ingredient_id,
      i.merchant_id,
      i.name,
      i.category,
      i.base_unit,
      i.stock_quantity::double precision AS stock_quantity,
      i.min_stock::double precision AS min_stock,
      COALESCE(batch_summary.inventory_value, 0)::double precision AS inventory_value,
      CASE
        WHEN i.stock_quantity = 0 THEN 'out'
        WHEN i.stock_quantity <= i.min_stock THEN 'low'
        ELSE 'normal'
      END AS status,
      log_summary.last_updated_at::text AS last_updated_at
    FROM ingredients i
    LEFT JOIN LATERAL (
      SELECT SUM(ib.qty_remaining * ib.cost_per_unit) AS inventory_value
      FROM ingredient_batches ib
      WHERE ib.ingredient_id = i.id
        AND ib.deleted_at IS NULL
        AND ib.qty_remaining > 0
    ) batch_summary ON TRUE
    LEFT JOIN LATERAL (
      SELECT MAX(sl.created_at) AS last_updated_at
      FROM stock_logs sl
      WHERE sl.ingredient_id = i.id
    ) log_summary ON TRUE
    WHERE i.merchant_id = ${merchantId}
      AND i.is_active = true
      AND (
        ${searchPattern}::text IS NULL
        OR i.name ILIKE ${searchPattern}
      )
      AND (
        ${category ?? null}::ingredient_category IS NULL
        OR i.category = ${category ?? null}
      )
      AND (
        ${status ?? null}::text IS NULL
        OR (
          ${status ?? null}::text = 'out'
          AND i.stock_quantity = 0
        )
        OR (
          ${status ?? null}::text = 'low'
          AND i.stock_quantity > 0
          AND i.stock_quantity <= i.min_stock
        )
        OR (
          ${status ?? null}::text = 'normal'
          AND i.stock_quantity > i.min_stock
        )
      )
    ORDER BY
      CASE
        WHEN i.stock_quantity = 0 THEN 1
        WHEN i.stock_quantity <= i.min_stock THEN 2
        ELSE 3
      END ASC,
      i.name ASC
  `;
};

// Get stock row for one ingredient in one merchant
export const getOneByIngredientIdAndMerchantId = async (ingredientId: string, merchantId: string): Promise<StockRow | null> => {
  const rows = await sql<StockRow[]>`
    SELECT
      i.id AS ingredient_id,
      i.merchant_id,
      i.name,
      i.category,
      i.base_unit,
      i.stock_quantity::double precision AS stock_quantity,
      i.min_stock::double precision AS min_stock,
      COALESCE(batch_summary.inventory_value, 0)::double precision AS inventory_value,
      CASE
        WHEN i.stock_quantity = 0 THEN 'out'
        WHEN i.stock_quantity <= i.min_stock THEN 'low'
        ELSE 'normal'
      END AS status,
      log_summary.last_updated_at::text AS last_updated_at
    FROM ingredients i
    LEFT JOIN LATERAL (
      SELECT SUM(ib.qty_remaining * ib.cost_per_unit) AS inventory_value
      FROM ingredient_batches ib
      WHERE ib.ingredient_id = i.id
        AND ib.deleted_at IS NULL
        AND ib.qty_remaining > 0
    ) batch_summary ON TRUE
    LEFT JOIN LATERAL (
      SELECT MAX(sl.created_at) AS last_updated_at
      FROM stock_logs sl
      WHERE sl.ingredient_id = i.id
    ) log_summary ON TRUE
    WHERE i.id = ${ingredientId}
      AND i.merchant_id = ${merchantId}
      AND i.is_active = true
    LIMIT 1
  `;

  return rows[0] ?? null;
};
