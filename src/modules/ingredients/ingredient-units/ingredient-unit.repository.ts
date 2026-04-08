import { sql } from '@/core/db/client';
import type { ReservedSQL } from '@/core/db/client';
import type { IngredientUnitInsertPayload, IngredientUnitRow, IngredientUnitUpdatePayload } from './ingredient-unit.type';

// Set all units as non-default for one ingredient
export const clearDefaultUnitsByIngredientId = async (db: ReservedSQL, ingredientId: string): Promise<void> => {
  await db`
    UPDATE ingredient_units
    SET
      is_default = false,
      updated_at = CURRENT_TIMESTAMP
    WHERE ingredient_id = ${ingredientId}
  `;
};

// Get one unit by ID and ingredient
export const getOneByIdAndIngredientId = async (unitId: string, ingredientId: string): Promise<IngredientUnitRow | null> => {
  const [result] = await sql<IngredientUnitRow[]>`
    SELECT
      id,
      ingredient_id,
      unit_name,
      conversion_factor::double precision AS conversion_factor,
      is_default,
      description,
      is_active,
      created_at,
      updated_at
    FROM ingredient_units
    WHERE id = ${unitId}
      AND ingredient_id = ${ingredientId}
    LIMIT 1
  `;

  return result ?? null;
};

// Get all units by ingredient
export const getAllByIngredientId = async (ingredientId: string): Promise<IngredientUnitRow[]> => {
  return await sql<IngredientUnitRow[]>`
    SELECT
      id,
      ingredient_id,
      unit_name,
      conversion_factor::double precision AS conversion_factor,
      is_default,
      description,
      is_active,
      created_at,
      updated_at
    FROM ingredient_units
    WHERE ingredient_id = ${ingredientId}
    ORDER BY
      conversion_factor ASC,
      unit_name ASC
  `;
};

// Insert one ingredient unit
export const insert = async (db: ReservedSQL, payload: IngredientUnitInsertPayload): Promise<IngredientUnitRow> => {
  const allowedColumns = ['id', 'ingredient_id', 'unit_name', 'conversion_factor', 'is_default', 'description', 'is_active'] as const;

  const [result] = await db<IngredientUnitRow[]>`
    INSERT INTO ingredient_units ${sql(payload, ...allowedColumns)}
    RETURNING
      id,
      ingredient_id,
      unit_name,
      conversion_factor::double precision AS conversion_factor,
      is_default,
      description,
      is_active,
      created_at,
      updated_at
  `;

  if (!result) {
    throw new Error('Ingredient unit insert failed');
  }

  return result;
};

// Update one ingredient unit
export const updateByIdAndIngredientId = async (
  db: ReservedSQL,
  unitId: string,
  ingredientId: string,
  payload: IngredientUnitUpdatePayload,
): Promise<IngredientUnitRow | null> => {
  const allowedColumns = ['unit_name', 'conversion_factor', 'is_default', 'description', 'is_active'] as const;

  const [result] = await db<IngredientUnitRow[]>`
    UPDATE ingredient_units
    SET
      ${sql(payload, ...allowedColumns)},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${unitId}
      AND ingredient_id = ${ingredientId}
    RETURNING
      id,
      ingredient_id,
      unit_name,
      conversion_factor::double precision AS conversion_factor,
      is_default,
      description,
      is_active,
      created_at,
      updated_at
  `;

  return result ?? null;
};

// Delete one ingredient unit
export const deleteByIdAndIngredientId = async (db: ReservedSQL, unitId: string, ingredientId: string): Promise<boolean> => {
  const [result] = await db<{ id: string }[]>`
    DELETE FROM ingredient_units
    WHERE id = ${unitId}
      AND ingredient_id = ${ingredientId}
    RETURNING id
  `;

  return Boolean(result);
};

// Set base unit as default after default unit deletion
export const setBaseUnitAsDefaultByIngredientId = async (db: ReservedSQL, ingredientId: string): Promise<void> => {
  await db`
    UPDATE ingredient_units
    SET
      is_default = true,
      updated_at = CURRENT_TIMESTAMP
    WHERE ingredient_id = ${ingredientId}
      AND conversion_factor = 1
  `;
};

// Keep ingredient unit records consistent after base unit changes
export const syncBaseUnitAfterIngredientBaseUnitUpdate = async (db: ReservedSQL, ingredientId: string, baseUnit: string): Promise<void> => {
  await db`
    DELETE FROM ingredient_units
    WHERE ingredient_id = ${ingredientId}
      AND conversion_factor <> 1
  `;

  await db`
    UPDATE ingredient_units
    SET
      unit_name = ${baseUnit},
      is_default = true,
      is_active = true,
      updated_at = CURRENT_TIMESTAMP
    WHERE ingredient_id = ${ingredientId}
      AND conversion_factor = 1
  `;
};

// Delete all units by ingredient
export const deleteByIngredientId = async (db: ReservedSQL, ingredientId: string): Promise<void> => {
  await db`
    DELETE FROM ingredient_units
    WHERE ingredient_id = ${ingredientId}
  `;
};
