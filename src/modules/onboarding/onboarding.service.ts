import { commitTransaction, rollbackTransaction, startTransaction } from '@/core/db/client';
import { conflictError, internalError, isAppError } from '@/core/errors/app-error';
import * as cashRepository from '@/modules/cash/cash.repository';
import * as merchantRepository from '@/modules/merchants/merchant.repository';
import * as supplierRepository from '@/modules/suppliers/supplier.repository';
import { APP_ERROR_MESSAGES } from '@/shared/constants/messages.constant';
import { generateUUID } from '@/shared/utils/crypto.util';
import type { ReservedSQL } from '@/core/db/client';
import type { SupplierInsertPayload } from '@/modules/suppliers/supplier.type';
import type { CompleteOnboardingRequest, GetOnboardingStatusRequest, OnboardingCompleteMap, OnboardingStatusMap } from './onboarding.type';

// Get onboarding completion status
export const getStatus = async ({ userId }: GetOnboardingStatusRequest): Promise<OnboardingStatusMap> => {
  try {
    const userMerchant = await merchantRepository.getOneUserMerchantByUserId(userId);

    return {
      has_merchant: Boolean(userMerchant),
    };
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to get onboarding status');
  }
};

// Complete onboarding in one transaction
export const complete = async ({ userId }: GetOnboardingStatusRequest, data: CompleteOnboardingRequest): Promise<OnboardingCompleteMap> => {
  let connection: ReservedSQL | null = null;

  try {
    const existing = await merchantRepository.getOneUserMerchantByUserId(userId);
    if (existing) {
      throw conflictError(APP_ERROR_MESSAGES.ONBOARDING_ALREADY_COMPLETED);
    }

    const merchantId = generateUUID();
    const userMerchantId = generateUUID();
    const openingBalance = toDecimalString(data.opening_balance);

    const suppliersPayload: SupplierInsertPayload[] = data.suppliers.map((supplier) => ({
      id: generateUUID(),
      merchant_id: merchantId,
      name: supplier.name,
      phone: supplier.phone ?? null,
      address: supplier.address ?? null,
      notes: supplier.notes ?? null,
    }));

    connection = await startTransaction();

    await merchantRepository.insertMerchant(connection, {
      id: merchantId,
      name: data.merchant.name,
      type: data.merchant.type,
      address: data.merchant.address ?? null,
      phone: data.merchant.phone ?? null,
      cash_balance: openingBalance,
    });

    await merchantRepository.insertUserMerchant(connection, {
      id: userMerchantId,
      user_id: userId,
      merchant_id: merchantId,
    });

    if (data.opening_balance > 0) {
      await cashRepository.insertOpeningBalanceLog(connection, {
        id: generateUUID(),
        merchant_id: merchantId,
        flow_type: 'in',
        cash_log_date: new Date().toISOString(),
        amount: openingBalance,
        category: 'capital_injection',
        description: 'Opening balance',
        balance_after: openingBalance,
        created_by: userId,
      });
    }

    await supplierRepository.insertMany(connection, suppliersPayload);

    await commitTransaction(connection);

    return {
      merchant: {
        id: merchantId,
        name: data.merchant.name,
        type: data.merchant.type,
        address: data.merchant.address ?? null,
        phone: data.merchant.phone ?? null,
        cash_balance: openingBalance,
      },
      opening_balance: openingBalance,
      supplier_created_count: suppliersPayload.length,
    };
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }

    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to complete onboarding');
  }
};

const toDecimalString = (value: number): string => {
  return value.toFixed(3);
};
