import { z } from 'zod';

export const stockStatusSchema = z.enum(['normal', 'low', 'out']);
export const stockReferenceTypeSchema = z.enum(['purchase', 'usage', 'waste', 'adjustment']);

export const stockParamsSchema = z.object({
  ingredientId: z.string().uuid('Ingredient ID must be a valid UUID'),
});

export const stockListQuerySchema = z.object({
  search: z.string().max(100).optional(),
  category: z.enum(['vegetables', 'meat', 'seafood', 'spices', 'grains', 'oil', 'liquid', 'flour', 'other']).optional(),
  status: stockStatusSchema.optional(),
});

export const stockLogListQuerySchema = z.object({
  reference_type: stockReferenceTypeSchema.optional(),
});
