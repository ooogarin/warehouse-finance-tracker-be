import { z } from 'zod';

export const ingredientUnitParamsSchema = z.object({
  id: z.string().uuid('Ingredient ID must be a valid UUID'),
  unitId: z.string().uuid('Unit ID must be a valid UUID'),
});

export const createIngredientUnitSchema = z.object({
  unit_name: z.string().min(1, 'Unit name is required').max(50, 'Unit name must be at most 50 characters'),
  conversion_factor: z.number().gt(0, 'Conversion factor must be greater than 0'),
  is_default: z.boolean().optional(),
  description: z.string().max(200, 'Description must be at most 200 characters').optional(),
});

export const updateIngredientUnitSchema = z
  .object({
    unit_name: z.string().min(1, 'Unit name is required').max(50, 'Unit name must be at most 50 characters').optional(),
    conversion_factor: z.number().gt(0, 'Conversion factor must be greater than 0').optional(),
    is_default: z.boolean().optional(),
    description: z.string().max(200, 'Description must be at most 200 characters').optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  });
