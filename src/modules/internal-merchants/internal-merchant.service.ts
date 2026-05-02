import { commitTransaction, rollbackTransaction, startTransaction } from '@/core/db/client';
import { internalError, isAppError, notFoundError } from '@/core/errors/app-error';
import { generateUUID } from '@/shared/utils/crypto.util';
import * as internalMerchantRepository from './internal-merchant.repository';
import type { ReservedSQL } from '@/core/db/client';
import type {
  CreateInternalMerchantRequest,
  GetInternalMerchantRequest,
  InternalMerchantMap,
  InternalMerchantRow,
  InternalMerchantSubscriptionUpdatePayload,
  InternalMerchantUpdatePayload,
  UpdateInternalMerchantServiceRequest,
  UpdateInternalMerchantSubscriptionServiceRequest,
} from './internal-merchant.type';

// List all merchants for internal platform admin
export const list = async (): Promise<InternalMerchantMap[]> => {
  try {
    const merchants = await internalMerchantRepository.getAll();
    return merchants.map(toInternalMerchantMap);
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to list internal merchants');
  }
};

// Get one merchant for internal platform admin
export const getDetail = async ({ merchantId }: GetInternalMerchantRequest): Promise<InternalMerchantMap> => {
  try {
    const merchant = await internalMerchantRepository.getOneById(merchantId);
    if (!merchant) {
      throw notFoundError('Merchant not found');
    }

    return toInternalMerchantMap(merchant);
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to get internal merchant detail');
  }
};

// Create one merchant from internal platform admin
export const create = async (data: CreateInternalMerchantRequest): Promise<InternalMerchantMap> => {
  let connection: ReservedSQL | null = null;

  try {
    connection = await startTransaction();

    const merchant = await internalMerchantRepository.insert(connection, {
      id: generateUUID(),
      name: data.name,
      type: data.type,
      address: data.address ?? null,
      phone: data.phone ?? null,
      cash_balance: '0',
      subscription_plan: data.subscription_plan,
      subscription_status: data.subscription_status,
      subscription_started_at: data.subscription_started_at ?? null,
      subscription_expires_at: data.subscription_expires_at ?? null,
      subscription_notes: data.subscription_notes ?? null,
    });

    await commitTransaction(connection);

    return toInternalMerchantMap(merchant);
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to create internal merchant');
  }
};

// Update merchant profile fields from internal platform admin
export const update = async ({ merchantId, data }: UpdateInternalMerchantServiceRequest): Promise<InternalMerchantMap> => {
  let connection: ReservedSQL | null = null;

  try {
    connection = await startTransaction();

    const payload: InternalMerchantUpdatePayload = {};
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

    const updated = await internalMerchantRepository.updateById(connection, merchantId, payload);
    if (!updated) {
      throw notFoundError('Merchant not found');
    }

    await commitTransaction(connection);

    return toInternalMerchantMap(updated);
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to update internal merchant');
  }
};

// Update merchant subscription fields from internal platform admin
export const updateSubscription = async ({
  merchantId,
  data,
}: UpdateInternalMerchantSubscriptionServiceRequest): Promise<InternalMerchantMap> => {
  let connection: ReservedSQL | null = null;

  try {
    connection = await startTransaction();

    const payload: InternalMerchantSubscriptionUpdatePayload = {};
    if (data.subscription_plan !== undefined) {
      payload.subscription_plan = data.subscription_plan;
    }
    if (data.subscription_status !== undefined) {
      payload.subscription_status = data.subscription_status;
    }
    if (data.subscription_started_at !== undefined) {
      payload.subscription_started_at = data.subscription_started_at;
    }
    if (data.subscription_expires_at !== undefined) {
      payload.subscription_expires_at = data.subscription_expires_at;
    }
    if (data.subscription_notes !== undefined) {
      payload.subscription_notes = data.subscription_notes;
    }

    const updated = await internalMerchantRepository.updateSubscriptionById(connection, merchantId, payload);
    if (!updated) {
      throw notFoundError('Merchant not found');
    }

    await commitTransaction(connection);

    return toInternalMerchantMap(updated);
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to update merchant subscription');
  }
};

const toInternalMerchantMap = (merchant: InternalMerchantRow): InternalMerchantMap => {
  return {
    id: merchant.id,
    name: merchant.name,
    type: merchant.type,
    address: merchant.address,
    phone: merchant.phone,
    cash_balance: merchant.cash_balance,
    subscription_plan: merchant.subscription_plan,
    subscription_status: merchant.subscription_status,
    subscription_started_at: merchant.subscription_started_at,
    subscription_expires_at: merchant.subscription_expires_at,
    subscription_notes: merchant.subscription_notes,
    created_at: merchant.created_at,
    updated_at: merchant.updated_at,
  };
};
