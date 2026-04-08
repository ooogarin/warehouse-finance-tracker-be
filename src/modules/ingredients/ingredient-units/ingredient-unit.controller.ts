import { successResponse } from '@/core/http/response';
import { getBody, getParam } from '@/shared/utils/hono.util';
import * as ingredientUnitService from './ingredient-unit.service';
import type { AppContext } from '@/shared/types/context.types';
import type { CreateIngredientUnitRequest, ManageIngredientUnitRequest, UpdateIngredientUnitRequest } from './ingredient-unit.type';

// Create ingredient unit
// POST /v1/ingredients/:id/units
export const create = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const param = getParam<{ id: string }>(c);
  const data = getBody<CreateIngredientUnitRequest>(c);

  const result = await ingredientUnitService.create(
    {
      merchantId,
      ingredientId: param.id,
    },
    data,
  );

  return successResponse({
    context: c,
    data: result,
    message: 'Ingredient unit created successfully',
    statusCode: 201,
  });
};

// Update ingredient unit
// PATCH /v1/ingredients/:id/units/:unitId
export const update = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const param = getParam<{ id: string; unitId: string }>(c);
  const data = getBody<UpdateIngredientUnitRequest>(c);

  const request: ManageIngredientUnitRequest = {
    merchantId,
    ingredientId: param.id,
    unitId: param.unitId,
  };

  const result = await ingredientUnitService.update(request, data);

  return successResponse({
    context: c,
    data: result,
    message: 'Ingredient unit updated successfully',
  });
};

// Delete ingredient unit
// DELETE /v1/ingredients/:id/units/:unitId
export const remove = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const param = getParam<{ id: string; unitId: string }>(c);

  const request: ManageIngredientUnitRequest = {
    merchantId,
    ingredientId: param.id,
    unitId: param.unitId,
  };

  await ingredientUnitService.remove(request);

  return successResponse({
    context: c,
    data: null,
    message: 'Ingredient unit deleted successfully',
  });
};
