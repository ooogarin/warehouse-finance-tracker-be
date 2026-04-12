import { Hono } from 'hono';
import { appValidator } from '@/core/http/validator';
import { authenticate } from '@/core/middleware/auth.middleware';
import { resolveMerchantContext } from '@/modules/merchants/merchant.middleware';
import * as debtController from './debt.controller';
import { createDebtPaymentSchema, createDebtSchema, debtListQuerySchema, debtParamsSchema } from './debt.schema';
import type { AppEnv } from '@/shared/types/context.types';

const debtRoutesV1 = new Hono<AppEnv>();

// Apply authentication middleware to all routes
debtRoutesV1.use('*', authenticate);

// Resolve active merchant context for all debt routes
debtRoutesV1.use('*', resolveMerchantContext);

// GET /v1/debts - List debts and summary
debtRoutesV1.get('/', appValidator('query', debtListQuerySchema), debtController.list);

// POST /v1/debts - Create manual debt
debtRoutesV1.post('/', appValidator('json', createDebtSchema), debtController.create);

// GET /v1/debts/:id - Get debt detail
debtRoutesV1.get('/:id', appValidator('param', debtParamsSchema), debtController.getDetail);

// POST /v1/debts/:id/payments - Create debt payment
debtRoutesV1.post(
  '/:id/payments',
  appValidator('param', debtParamsSchema),
  appValidator('json', createDebtPaymentSchema),
  debtController.pay,
);

export { debtRoutesV1 };
