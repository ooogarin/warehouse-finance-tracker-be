import { successResponse } from '@/core/http/response';
import { getBody, getParam, getQuery } from '@/shared/utils/hono.util';
import * as ingredientService from './ingredient.service';
import type { AppContext } from '@/shared/types/context.types';
import type {
  CreateIngredientRequest,
  GetIngredientRequest,
  IngredientCategory,
  ListIngredientsRequest,
  UpdateIngredientRequest,
} from './ingredient.type';

// List ingredients
// GET /v1/ingredients
export const list = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const query = getQuery<{ search?: string; category?: IngredientCategory }>(c);

  const request: ListIngredientsRequest = {
    merchantId,
    search: query.search,
    category: query.category,
  };

  const result = await ingredientService.list(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Ingredients fetched successfully',
  });
};

// Get ingredient detail
// GET /v1/ingredients/:id
export const getDetail = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const param = getParam<{ id: string }>(c);

  const request: GetIngredientRequest = {
    merchantId,
    ingredientId: param.id,
  };

  const result = await ingredientService.getDetail(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Ingredient detail fetched successfully',
  });
};

// Create ingredient
// POST /v1/ingredients
export const create = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const data = getBody<CreateIngredientRequest>(c);

  const result = await ingredientService.create(merchantId, data);

  return successResponse({
    context: c,
    data: result,
    message: 'Ingredient created successfully',
    statusCode: 201,
  });
};

// Update ingredient
// PATCH /v1/ingredients/:id
export const update = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const param = getParam<{ id: string }>(c);
  const data = getBody<UpdateIngredientRequest>(c);

  const request: GetIngredientRequest = {
    merchantId,
    ingredientId: param.id,
  };

  const result = await ingredientService.update(request, data);

  return successResponse({
    context: c,
    data: result,
    message: 'Ingredient updated successfully',
  });
};

// Activate ingredient
// PATCH /v1/ingredients/:id/activate
export const activate = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const param = getParam<{ id: string }>(c);

  const request: GetIngredientRequest = {
    merchantId,
    ingredientId: param.id,
  };

  const result = await ingredientService.activate(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Ingredient activated successfully',
  });
};

// Deactivate ingredient
// PATCH /v1/ingredients/:id/deactivate
export const deactivate = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const param = getParam<{ id: string }>(c);

  const request: GetIngredientRequest = {
    merchantId,
    ingredientId: param.id,
  };

  const result = await ingredientService.deactivate(request);

  return successResponse({
    context: c,
    data: result,
    message: 'Ingredient deactivated successfully',
  });
};

// Delete ingredient
// DELETE /v1/ingredients/:id
export const remove = async (c: AppContext) => {
  const merchantId = c.get('merchantId');
  const param = getParam<{ id: string }>(c);

  const request: GetIngredientRequest = {
    merchantId,
    ingredientId: param.id,
  };

  await ingredientService.remove(request);

  return successResponse({
    context: c,
    data: null,
    message: 'Ingredient deleted successfully',
  });
};
