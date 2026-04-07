import { commitTransaction, rollbackTransaction, startTransaction } from '@/core/db/client';
import { internalError, isAppError, notFoundError } from '@/core/errors/app-error';
import { APP_ERROR_MESSAGES } from '@/shared/constants/messages.constant';
import { generateUUID } from '@/shared/utils/crypto.util';
import * as supplierRepository from './supplier.repository';
import type { ReservedSQL } from '@/core/db/client';
import type {
  CreateSupplierRequest,
  GetSupplierRequest,
  ListSuppliersRequest,
  SupplierDetailMap,
  SupplierListRow,
  SupplierMap,
  SupplierPurchaseHistoryMap,
  SupplierPurchaseHistoryRow,
  SupplierRow,
  UpdateSupplierRequest,
} from './supplier.type';

// Get supplier list
export const list = async ({ merchantId, search }: ListSuppliersRequest): Promise<SupplierMap[]> => {
  try {
    const suppliers = await supplierRepository.getAllByMerchantId(merchantId, search);
    return suppliers.map(toSupplierMap);
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to list suppliers');
  }
};

// Get supplier detail with purchase history
export const getDetail = async ({ merchantId, supplierId }: GetSupplierRequest): Promise<SupplierDetailMap> => {
  try {
    const supplier = await supplierRepository.getOneByIdAndMerchantId(supplierId, merchantId);
    if (!supplier) {
      throw notFoundError(APP_ERROR_MESSAGES.NOT_FOUND);
    }

    const purchaseHistory = await supplierRepository.getPurchaseHistoryBySupplierId(supplierId, merchantId);

    return {
      supplier: toSupplierMap({ ...supplier, last_order_date: getLastOrderDate(purchaseHistory) }),
      purchase_orders: purchaseHistory.map(toSupplierPurchaseHistoryMap),
    };
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to get supplier detail');
  }
};

// Create supplier
export const create = async (merchantId: string, data: CreateSupplierRequest): Promise<SupplierMap> => {
  let connection: ReservedSQL | null = null;

  try {
    connection = await startTransaction();

    const created = await supplierRepository.insert(connection, {
      id: generateUUID(),
      merchant_id: merchantId,
      name: data.name,
      phone: data.phone ?? null,
      address: data.address ?? null,
      notes: data.notes ?? null,
    });

    await commitTransaction(connection);

    return toSupplierMap({ ...created, last_order_date: null });
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to create supplier');
  }
};

// Update supplier
export const update = async ({ merchantId, supplierId }: GetSupplierRequest, data: UpdateSupplierRequest): Promise<SupplierMap> => {
  let connection: ReservedSQL | null = null;

  try {
    connection = await startTransaction();

    const updated = await supplierRepository.updateByIdAndMerchantId(connection, supplierId, merchantId, {
      name: data.name,
      phone: data.phone ?? null,
      address: data.address ?? null,
      notes: data.notes ?? null,
    });

    if (!updated) {
      throw notFoundError(APP_ERROR_MESSAGES.NOT_FOUND);
    }

    await commitTransaction(connection);

    return toSupplierMap({ ...updated, last_order_date: null });
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to update supplier');
  }
};

// Archive supplier (soft delete)
export const archive = async ({ merchantId, supplierId }: GetSupplierRequest): Promise<void> => {
  let connection: ReservedSQL | null = null;

  try {
    connection = await startTransaction();

    const deleted = await supplierRepository.softDeleteByIdAndMerchantId(connection, supplierId, merchantId);
    if (!deleted) {
      throw notFoundError(APP_ERROR_MESSAGES.NOT_FOUND);
    }

    await commitTransaction(connection);
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to archive supplier');
  }
};

// Helper function to map Supplier row into operation map
const toSupplierMap = (supplier: SupplierListRow | (SupplierRow & { last_order_date: string | null })): SupplierMap => {
  return {
    id: supplier.id,
    name: supplier.name,
    phone: supplier.phone,
    address: supplier.address,
    notes: supplier.notes,
    last_order_date: supplier.last_order_date,
    created_at: supplier.created_at,
  };
};

// Helper function to map purchase history row into operation map
const toSupplierPurchaseHistoryMap = (purchase: SupplierPurchaseHistoryRow): SupplierPurchaseHistoryMap => {
  return {
    id: purchase.id,
    purchase_date: purchase.purchase_date,
    invoice_number: purchase.invoice_number,
    total_amount: purchase.total_amount,
    payment_status: Number(purchase.debt_amount) > 0 ? 'Belum Lunas' : 'Lunas',
  };
};

const getLastOrderDate = (purchases: SupplierPurchaseHistoryRow[]): string | null => {
  return purchases.length > 0 ? purchases[0].purchase_date : null;
};
