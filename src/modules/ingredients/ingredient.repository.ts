import { sql } from '@/core/db/client';
import type { ReservedSQL } from '@/core/db/client';
import type { IngredientInsertPayload, IngredientRow, IngredientUpdatePayload } from './ingredient.type';

// Get ingredient list by merchant
export const getAllByMerchantId = async (
  merchantId: string,
  search?: string,
  category?: IngredientRow['category'],
): Promise<IngredientRow[]> => {
  const searchPattern = search?.trim() ? `%${search.trim()}%` : null;

  return await sql<IngredientRow[]>`
    SELECT
      id,
      merchant_id,
      name,
      category,
      base_unit,
      stock_quantity::double precision AS stock_quantity,
      min_stock::double precision AS min_stock,
      is_active,
      created_at,
      updated_at
    FROM ingredients
    WHERE merchant_id = ${merchantId}
      AND (
        ${searchPattern}::text IS NULL
        OR name ILIKE ${searchPattern}
      )
      AND (
        ${category ?? null}::ingredient_category IS NULL
        OR category = ${category ?? null}
      )
    ORDER BY is_active DESC, name ASC
  `;
};

// Get one ingredient by ID and merchant
export const getOneByIdAndMerchantId = async (ingredientId: string, merchantId: string): Promise<IngredientRow | null> => {
  const [result] = await sql<IngredientRow[]>`
    SELECT
      id,
      merchant_id,
      name,
      category,
      base_unit,
      stock_quantity::double precision AS stock_quantity,
      min_stock::double precision AS min_stock,
      is_active,
      created_at,
      updated_at
    FROM ingredients
    WHERE id = ${ingredientId}
      AND merchant_id = ${merchantId}
    LIMIT 1
  `;

  return result ?? null;
};

// Insert one ingredient
export const insert = async (db: ReservedSQL, payload: IngredientInsertPayload): Promise<IngredientRow> => {
  const allowedColumns = ['id', 'merchant_id', 'name', 'category', 'base_unit', 'min_stock'] as const;

  const [result] = await db<IngredientRow[]>`
    INSERT INTO ingredients ${sql(payload, ...allowedColumns)}
    RETURNING
      id,
      merchant_id,
      name,
      category,
      base_unit,
      stock_quantity::double precision AS stock_quantity,
      min_stock::double precision AS min_stock,
      is_active,
      created_at,
      updated_at
  `;

  if (!result) {
    throw new Error('Ingredient insert failed');
  }

  return result;
};

// Update ingredient by ID and merchant
export const updateByIdAndMerchantId = async (
  db: ReservedSQL,
  ingredientId: string,
  merchantId: string,
  payload: IngredientUpdatePayload,
): Promise<IngredientRow | null> => {
  const allowedColumns = ['name', 'category', 'base_unit', 'min_stock', 'is_active'] as const;

  const [result] = await db<IngredientRow[]>`
    UPDATE ingredients
    SET
      ${sql(payload, ...allowedColumns)},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${ingredientId}
      AND merchant_id = ${merchantId}
    RETURNING
      id,
      merchant_id,
      name,
      category,
      base_unit,
      stock_quantity::double precision AS stock_quantity,
      min_stock::double precision AS min_stock,
      is_active,
      created_at,
      updated_at
  `;

  return result ?? null;
};

// Delete ingredient by ID and merchant
export const deleteByIdAndMerchantId = async (db: ReservedSQL, ingredientId: string, merchantId: string): Promise<boolean> => {
  const [result] = await db<{ id: string }[]>`
    DELETE FROM ingredients
    WHERE id = ${ingredientId}
      AND merchant_id = ${merchantId}
    RETURNING id
  `;

  return Boolean(result);
};

// Check whether ingredient already has usage records
export const isUsedById = async (ingredientId: string): Promise<boolean> => {
  const [result] = await sql<{ is_used: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM purchase_order_items poi WHERE poi.ingredient_id = ${ingredientId}
      UNION ALL
      SELECT 1 FROM stock_logs sl WHERE sl.ingredient_id = ${ingredientId}
      UNION ALL
      SELECT 1 FROM ingredient_batches ib WHERE ib.ingredient_id = ${ingredientId}
    ) AS is_used
  `;

  return Boolean(result?.is_used);
};
