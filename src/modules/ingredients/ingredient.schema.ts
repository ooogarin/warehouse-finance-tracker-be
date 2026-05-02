import { z } from 'zod';

const ingredientCategorySchema = z.enum(['vegetables', 'meat', 'seafood', 'spices', 'grains', 'oil', 'liquid', 'flour', 'other']);

export const ingredientParamsSchema = z.object({
  id: z.string().uuid('Ingredient ID must be a valid UUID'),
});

export const ingredientListQuerySchema = z.object({
  search: z.string().max(100).optional(),
  category: ingredientCategorySchema.optional(),
});

export const createIngredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required').max(100, 'Ingredient name must be at most 100 characters'),
  category: ingredientCategorySchema,
  base_unit: z.string().min(1, 'Base unit is required').max(50, 'Base unit must be at most 50 characters'),
  min_stock: z.number().min(0, 'Minimum stock must be at least 0').optional(),
});

export const updateIngredientSchema = z
  .object({
    name: z.string().min(1, 'Ingredient name is required').max(100, 'Ingredient name must be at most 100 characters').optional(),
    category: ingredientCategorySchema.optional(),
    base_unit: z.string().min(1, 'Base unit is required').max(50, 'Base unit must be at most 50 characters').optional(),
    min_stock: z.number().min(0, 'Minimum stock must be at least 0').optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  });
