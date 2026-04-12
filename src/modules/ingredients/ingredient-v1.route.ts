import { Hono } from 'hono';
import { appValidator } from '@/core/http/validator';
import { authenticate } from '@/core/middleware/auth.middleware';
import { resolveMerchantContext } from '@/modules/merchants/merchant.middleware';
import * as ingredientController from './ingredient.controller';
import { createIngredientSchema, ingredientListQuerySchema, ingredientParamsSchema, updateIngredientSchema } from './ingredient.schema';
import * as ingredientUnitController from './ingredient-units/ingredient-unit.controller';
import {
  createIngredientUnitSchema,
  ingredientUnitParamsSchema,
  updateIngredientUnitSchema,
} from './ingredient-units/ingredient-unit.schema';
import type { AppEnv } from '@/shared/types/context.types';

const ingredientRoutesV1 = new Hono<AppEnv>();

// Apply authentication middleware to all routes
ingredientRoutesV1.use('*', authenticate);

// Resolve active merchant context for all ingredient routes
ingredientRoutesV1.use('*', resolveMerchantContext);

// GET /v1/ingredients - List ingredients
ingredientRoutesV1.get('/', appValidator('query', ingredientListQuerySchema), ingredientController.list);

// POST /v1/ingredients - Create ingredient
ingredientRoutesV1.post('/', appValidator('json', createIngredientSchema), ingredientController.create);

// GET /v1/ingredients/:id - Get ingredient detail
ingredientRoutesV1.get('/:id', appValidator('param', ingredientParamsSchema), ingredientController.getDetail);

// PATCH /v1/ingredients/:id - Update ingredient
ingredientRoutesV1.patch(
  '/:id',
  appValidator('param', ingredientParamsSchema),
  appValidator('json', updateIngredientSchema),
  ingredientController.update,
);

// DELETE /v1/ingredients/:id - Delete ingredient
ingredientRoutesV1.delete('/:id', appValidator('param', ingredientParamsSchema), ingredientController.remove);

// POST /v1/ingredients/:id/units - Create ingredient unit
ingredientRoutesV1.post(
  '/:id/units',
  appValidator('param', ingredientParamsSchema),
  appValidator('json', createIngredientUnitSchema),
  ingredientUnitController.create,
);

// PATCH /v1/ingredients/:id/units/:unitId - Update ingredient unit
ingredientRoutesV1.patch(
  '/:id/units/:unitId',
  appValidator('param', ingredientUnitParamsSchema),
  appValidator('json', updateIngredientUnitSchema),
  ingredientUnitController.update,
);

// DELETE /v1/ingredients/:id/units/:unitId - Delete ingredient unit
ingredientRoutesV1.delete('/:id/units/:unitId', appValidator('param', ingredientUnitParamsSchema), ingredientUnitController.remove);

export { ingredientRoutesV1 };
