import { internalError, isAppError, notFoundError } from '@/core/errors/app-error';
import * as merchantRepository from './merchant.repository';
import type {
  GetCurrentMerchantRequest,
  ListAccessibleMerchantsRequest,
  MerchantAccessMap,
  MerchantAccessRow,
  MerchantMap,
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
