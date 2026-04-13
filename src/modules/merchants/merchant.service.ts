import { commitTransaction, rollbackTransaction, startTransaction } from '@/core/db/client';
import { internalError, isAppError, notFoundError } from '@/core/errors/app-error';
import * as merchantRepository from './merchant.repository';
import type { ReservedSQL } from '@/core/db/client';
import type {
  GetCurrentMerchantRequest,
  ListAccessibleMerchantsRequest,
  MerchantAccessMap,
  MerchantAccessRow,
  MerchantMap,
  MerchantUpdatePayload,
  UpdateCurrentMerchantServiceRequest,
} from './merchant.type';

// List merchants that user can access
export const listAccessible = async ({ userId }: ListAccessibleMerchantsRequest): Promise<MerchantAccessMap[]> => {
  try {
    const merchants = await merchantRepository.getAllAccessibleByUserId(userId);
    return merchants.map(toMerchantAccessMap);
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to list accessible merchants');
  }
};

// Get current merchant by merchant context
export const getCurrent = async ({ userId, merchantId }: GetCurrentMerchantRequest): Promise<MerchantMap> => {
  try {
    const merchant = await merchantRepository.getOneAccessibleByIdAndUserId(merchantId, userId);
    if (!merchant) {
      throw notFoundError('Merchant not found');
    }

    return toMerchantMap(merchant);
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to get current merchant');
  }
};

// Update current merchant settings
export const updateCurrent = async ({ userId, merchantId, data }: UpdateCurrentMerchantServiceRequest): Promise<MerchantMap> => {
  let connection: ReservedSQL | null = null;

  try {
    connection = await startTransaction();

    const payload: MerchantUpdatePayload = {};
    if (data.name !== undefined) {
      payload.name = data.name;
    }
    if (data.type !== undefined) {
      payload.type = data.type;
    }
    if (data.address !== undefined) {
      payload.address = data.address;
    }
    if (data.phone !== undefined) {
      payload.phone = data.phone;
    }

    const updated = await merchantRepository.updateAccessibleByIdAndUserId(connection, merchantId, userId, payload);
    if (!updated) {
      throw notFoundError('Merchant not found');
    }

    await commitTransaction(connection);

    return toMerchantMap(updated);
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to update current merchant');
  }
};

// Helper function to map MerchantAccessRow to MerchantMap
const toMerchantMap = (merchant: MerchantAccessRow): MerchantMap => {
  return {
    id: merchant.id,
    name: merchant.name,
    type: merchant.type,
    address: merchant.address,
    phone: merchant.phone,
    cash_balance: merchant.cash_balance,
  };
};

// Helper function to map MerchantAccessRow to MerchantAccessMap
const toMerchantAccessMap = (merchant: MerchantAccessRow): MerchantAccessMap => {
  return {
    ...toMerchantMap(merchant),
    user_role: merchant.user_role,
  };
};
