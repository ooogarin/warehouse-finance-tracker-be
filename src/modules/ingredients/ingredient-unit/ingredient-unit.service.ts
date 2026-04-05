import { commitTransaction, rollbackTransaction, startTransaction } from '@/core/db/client';
import { conflictError, internalError, isAppError, notFoundError, validationError } from '@/core/errors/app-error';
import { APP_ERROR_MESSAGES } from '@/shared/constants/messages.constant';
import { generateUUID } from '@/shared/utils/crypto.util';
import * as ingredientRepository from '../ingredient.repository';
import * as ingredientUnitRepository from './ingredient-unit.repository';
import type { ReservedSQL } from '@/core/db/client';
import type {
  CreateIngredientUnitRequest,
  IngredientUnitMap,
  IngredientUnitRow,
  ManageIngredientUnitRequest,
  UpdateIngredientUnitRequest,
} from './ingredient-unit.type';

// Create ingredient unit
export const create = async (
  { merchantId, ingredientId }: Pick<ManageIngredientUnitRequest, 'merchantId' | 'ingredientId'>,
  data: CreateIngredientUnitRequest,
): Promise<IngredientUnitMap> => {
  let connection: ReservedSQL | null = null;

  try {
    const ingredient = await ingredientRepository.getOneByIdAndMerchantId(ingredientId, merchantId);
    if (!ingredient) {
      throw notFoundError(APP_ERROR_MESSAGES.NOT_FOUND);
    }

    connection = await startTransaction();

    if (data.is_default) {
      await ingredientUnitRepository.clearDefaultUnitsByIngredientId(connection, ingredientId);
    }

    const created = await ingredientUnitRepository.insert(connection, {
      id: generateUUID(),
      ingredient_id: ingredientId,
      unit_name: data.unit_name,
      conversion_factor: toDecimalString(data.conversion_factor),
      is_default: data.is_default ?? false,
      description: data.description ?? null,
      is_active: true,
    });

    await commitTransaction(connection);

    return toIngredientUnitMap(created);
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }

    if (isDuplicateIngredientUnitName(error)) {
      throw conflictError('Unit with this name already exists');
    }

    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to create ingredient unit');
  }
};

// Update ingredient unit
export const update = async ({ merchantId, ingredientId, unitId }: ManageIngredientUnitRequest, data: UpdateIngredientUnitRequest): Promise<IngredientUnitMap> => {
  let connection: ReservedSQL | null = null;

  try {
    const ingredient = await ingredientRepository.getOneByIdAndMerchantId(ingredientId, merchantId);
    if (!ingredient) {
      throw notFoundError(APP_ERROR_MESSAGES.NOT_FOUND);
    }

    const existingUnit = await ingredientUnitRepository.getOneByIdAndIngredientId(unitId, ingredientId);
    if (!existingUnit) {
      throw notFoundError(APP_ERROR_MESSAGES.NOT_FOUND);
    }

    connection = await startTransaction();

    if (data.is_default) {
      await ingredientUnitRepository.clearDefaultUnitsByIngredientId(connection, ingredientId);
    }

    const updated = await ingredientUnitRepository.updateByIdAndIngredientId(connection, unitId, ingredientId, {
      unit_name: data.unit_name,
      conversion_factor: data.conversion_factor !== undefined ? toDecimalString(data.conversion_factor) : undefined,
      is_default: data.is_default,
      description: data.description ?? null,
      is_active: data.is_active,
    });

    if (!updated) {
      throw notFoundError(APP_ERROR_MESSAGES.NOT_FOUND);
    }

    await commitTransaction(connection);

    return toIngredientUnitMap(updated);
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }

    if (isDuplicateIngredientUnitName(error)) {
      throw conflictError('Unit with this name already exists');
    }

    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to update ingredient unit');
  }
};

// Delete ingredient unit (hard delete)
export const remove = async ({ merchantId, ingredientId, unitId }: ManageIngredientUnitRequest): Promise<void> => {
  let connection: ReservedSQL | null = null;

  try {
    const ingredient = await ingredientRepository.getOneByIdAndMerchantId(ingredientId, merchantId);
    if (!ingredient) {
      throw notFoundError(APP_ERROR_MESSAGES.NOT_FOUND);
    }

    const unit = await ingredientUnitRepository.getOneByIdAndIngredientId(unitId, ingredientId);
    if (!unit) {
      throw notFoundError(APP_ERROR_MESSAGES.NOT_FOUND);
    }

    if (Number(unit.conversion_factor) === 1) {
      throw validationError('Base unit cannot be deleted');
    }

    connection = await startTransaction();

    const deleted = await ingredientUnitRepository.deleteByIdAndIngredientId(connection, unitId, ingredientId);
    if (!deleted) {
      throw notFoundError(APP_ERROR_MESSAGES.NOT_FOUND);
    }

    await commitTransaction(connection);
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }

    if (isForeignKeyReferenceViolation(error)) {
      throw conflictError('Unit cannot be deleted because it is already used in transactions');
    }

    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to delete ingredient unit');
  }
};

const toIngredientUnitMap = (unit: IngredientUnitRow): IngredientUnitMap => {
  return {
    id: unit.id,
    unit_name: unit.unit_name,
    conversion_factor: unit.conversion_factor,
    is_default: unit.is_default,
    description: unit.description,
    is_active: unit.is_active,
  };
};

const toDecimalString = (value: number): string => {
  return value.toFixed(3);
};

const isDuplicateIngredientUnitName = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const dbError = error as {
    code?: string;
    constraint?: string;
    detail?: string;
    message?: string;
  };

  const text = [dbError.constraint, dbError.detail, dbError.message].filter(Boolean).join(' ').toLowerCase();

  if (dbError.code !== '23505') {
    return false;
  }

  return text.includes('unique_ingredient_unit') || text.includes('idx_ingredient_units_merchant_name_unique');
};

const isForeignKeyReferenceViolation = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const dbError = error as { code?: string };
  return dbError.code === '23503';
};
