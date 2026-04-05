import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { authenticate } from '@/core/middleware/auth.middleware';
import { resolveMerchantContext } from '@/modules/merchants/merchant.middleware';
import * as ingredientUnitController from './ingredient-unit/ingredient-unit.controller';
import * as ingredientController from './ingredient.controller';
import {
  createIngredientUnitSchema,
  ingredientUnitParamsSchema,
  updateIngredientUnitSchema,
} from './ingredient-unit/ingredient-unit.schema';
import {
  createIngredientSchema,
  ingredientListQuerySchema,
  ingredientParamsSchema,
  updateIngredientSchema,
} from './ingredient.schema';
import type { AppEnv } from '@/shared/types/context.types';

const ingredientRoutesV1 = new Hono<AppEnv>();

// Apply authentication middleware to all routes
ingredientRoutesV1.use('*', authenticate);

// Resolve active merchant context for all ingredient routes
ingredientRoutesV1.use('*', resolveMerchantContext);

// GET /v1/ingredients - List ingredients
ingredientRoutesV1.get('/', zValidator('query', ingredientListQuerySchema), ingredientController.list);

// POST /v1/ingredients - Create ingredient
ingredientRoutesV1.post('/', zValidator('json', createIngredientSchema), ingredientController.create);

// GET /v1/ingredients/:id - Get ingredient detail
ingredientRoutesV1.get('/:id', zValidator('param', ingredientParamsSchema), ingredientController.getDetail);

// PATCH /v1/ingredients/:id - Update ingredient
ingredientRoutesV1.patch(
  '/:id',
  zValidator('param', ingredientParamsSchema),
  zValidator('json', updateIngredientSchema),
  ingredientController.update,
);

// PATCH /v1/ingredients/:id/activate - Activate ingredient
ingredientRoutesV1.patch('/:id/activate', zValidator('param', ingredientParamsSchema), ingredientController.activate);

// PATCH /v1/ingredients/:id/deactivate - Deactivate ingredient
ingredientRoutesV1.patch('/:id/deactivate', zValidator('param', ingredientParamsSchema), ingredientController.deactivate);

// DELETE /v1/ingredients/:id - Delete ingredient
ingredientRoutesV1.delete('/:id', zValidator('param', ingredientParamsSchema), ingredientController.remove);

// POST /v1/ingredients/:id/units - Create ingredient unit
ingredientRoutesV1.post('/:id/units', zValidator('param', ingredientParamsSchema), zValidator('json', createIngredientUnitSchema), ingredientUnitController.create);

// PATCH /v1/ingredients/:id/units/:unitId - Update ingredient unit
ingredientRoutesV1.patch(
  '/:id/units/:unitId',
  zValidator('param', ingredientUnitParamsSchema),
  zValidator('json', updateIngredientUnitSchema),
  ingredientUnitController.update,
);

// DELETE /v1/ingredients/:id/units/:unitId - Delete ingredient unit
ingredientRoutesV1.delete('/:id/units/:unitId', zValidator('param', ingredientUnitParamsSchema), ingredientUnitController.remove);

export { ingredientRoutesV1 };
