import { commitTransaction, rollbackTransaction, startTransaction } from '@/core/db/client';
import { conflictError, internalError, isAppError, notFoundError, validationError } from '@/core/errors/app-error';
import { hasDatabaseErrorText, isUniqueViolation } from '@/core/errors/db-error.util';
import { APP_ERROR_MESSAGES } from '@/shared/constants/messages.constant';
import { generateUUID } from '@/shared/utils/crypto.util';
import * as ingredientRepository from './ingredient.repository';
import * as ingredientUnitRepository from './ingredient-units/ingredient-unit.repository';
import type { ReservedSQL } from '@/core/db/client';
import type {
  CreateIngredientRequest,
  GetIngredientRequest,
  IngredientDetailMap,
  IngredientDetailUnitMap,
  IngredientMap,
  IngredientRow,
  ListIngredientsRequest,
  UpdateIngredientRequest,
} from './ingredient.type';

// Get ingredient list
export const list = async ({ merchantId, search, category }: ListIngredientsRequest): Promise<IngredientMap[]> => {
  try {
    const ingredients = await ingredientRepository.getAllByMerchantId(merchantId, search, category);
    return ingredients.map(toIngredientMap);
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to list ingredients');
  }
};

// Get ingredient detail
export const getDetail = async ({ merchantId, ingredientId }: GetIngredientRequest): Promise<IngredientDetailMap> => {
  try {
    const ingredient = await ingredientRepository.getOneByIdAndMerchantId(ingredientId, merchantId);
    if (!ingredient) {
      throw notFoundError(APP_ERROR_MESSAGES.NOT_FOUND);
    }

    const [isUsed, units] = await Promise.all([
      ingredientRepository.isUsedById(ingredientId),
      ingredientUnitRepository.getAllByIngredientId(ingredientId),
    ]);

    return {
      ...toIngredientMap(ingredient),
      is_used: isUsed,
      is_base_unit_editable: !isUsed,
      units: units.map(toIngredientDetailUnitMap),
    };
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to get ingredient detail');
  }
};

// Create ingredient
export const create = async (merchantId: string, data: CreateIngredientRequest): Promise<IngredientMap> => {
  let connection: ReservedSQL | null = null;

  try {
    connection = await startTransaction();

    const created = await ingredientRepository.insert(connection, {
      id: generateUUID(),
      merchant_id: merchantId,
      name: data.name,
      category: data.category,
      base_unit: data.base_unit,
      min_stock: data.min_stock ?? 0,
    });

    await ingredientUnitRepository.insert(connection, {
      id: generateUUID(),
      ingredient_id: created.id,
      unit_name: data.base_unit,
      conversion_factor: 1,
      is_default: true,
      description: 'Base unit',
      is_active: true,
    });

    await commitTransaction(connection);

    return toIngredientMap(created);
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }

    if (isDuplicateIngredientName(error)) {
      throw conflictError('Ingredient with this name already exists');
    }

    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to create ingredient');
  }
};

// Update ingredient
export const update = async ({ merchantId, ingredientId }: GetIngredientRequest, data: UpdateIngredientRequest): Promise<IngredientMap> => {
  let connection: ReservedSQL | null = null;

  try {
    const currentIngredient = await ingredientRepository.getOneByIdAndMerchantId(ingredientId, merchantId);
    if (!currentIngredient) {
      throw notFoundError(APP_ERROR_MESSAGES.NOT_FOUND);
    }

    const isUsed = await ingredientRepository.isUsedById(ingredientId);
    const isBaseUnitChanged = data.base_unit !== undefined && data.base_unit !== currentIngredient.base_unit;

    if (isBaseUnitChanged && isUsed) {
      throw validationError('Base unit cannot be changed because this ingredient is already used');
    }

    connection = await startTransaction();

    const updated = await ingredientRepository.updateByIdAndMerchantId(connection, ingredientId, merchantId, {
      name: data.name,
      category: data.category,
      base_unit: data.base_unit,
      min_stock: data.min_stock,
      is_active: data.is_active,
    });

    if (!updated) {
      throw notFoundError(APP_ERROR_MESSAGES.NOT_FOUND);
    }

    if (isBaseUnitChanged && data.base_unit) {
      await ingredientUnitRepository.syncBaseUnitAfterIngredientBaseUnitUpdate(connection, ingredientId, data.base_unit);
    }

    await commitTransaction(connection);

    return toIngredientMap(updated);
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }

    if (isDuplicateIngredientName(error)) {
      throw conflictError('Ingredient with this name already exists');
    }

    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to update ingredient');
  }
};

// Delete ingredient (hard delete)
export const remove = async ({ merchantId, ingredientId }: GetIngredientRequest): Promise<void> => {
  let connection: ReservedSQL | null = null;

  try {
    const ingredient = await ingredientRepository.getOneByIdAndMerchantId(ingredientId, merchantId);
    if (!ingredient) {
      throw notFoundError(APP_ERROR_MESSAGES.NOT_FOUND);
    }

    const isUsed = await ingredientRepository.isUsedById(ingredientId);
    if (isUsed) {
      throw conflictError('Ingredient cannot be deleted because it is already used in transactions');
    }

    connection = await startTransaction();

    await ingredientUnitRepository.deleteByIngredientId(connection, ingredientId);

    const deleted = await ingredientRepository.deleteByIdAndMerchantId(connection, ingredientId, merchantId);
    if (!deleted) {
      throw notFoundError(APP_ERROR_MESSAGES.NOT_FOUND);
    }

    await commitTransaction(connection);
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }

    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to delete ingredient');
  }
};

const toIngredientMap = (ingredient: IngredientRow): IngredientMap => {
  return {
    id: ingredient.id,
    name: ingredient.name,
    category: ingredient.category,
    base_unit: ingredient.base_unit,
    stock_quantity: ingredient.stock_quantity,
    min_stock: ingredient.min_stock,
    is_active: ingredient.is_active,
  };
};

const toIngredientDetailUnitMap = (unit: {
  id: string;
  unit_name: string;
  conversion_factor: number;
  is_default: boolean;
  description: string | null;
  is_active: boolean;
}): IngredientDetailUnitMap => {
  return {
    id: unit.id,
    unit_name: unit.unit_name,
    conversion_factor: unit.conversion_factor,
    is_default: unit.is_default,
    description: unit.description,
    is_active: unit.is_active,
  };
};

const isDuplicateIngredientName = (error: unknown): boolean => {
  if (!isUniqueViolation(error)) {
    return false;
  }

  return (
    hasDatabaseErrorText(error, ['idx_ingredients_merchant_name_unique']) ||
    (hasDatabaseErrorText(error, ['unique']) && hasDatabaseErrorText(error, ['ingredient']))
  );
};
