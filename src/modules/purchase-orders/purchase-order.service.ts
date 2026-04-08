import { commitTransaction, rollbackTransaction, startTransaction } from '@/core/db/client';
import { internalError, isAppError, notFoundError, validationError } from '@/core/errors/app-error';
import * as cashService from '@/modules/cash/cash.service';
import * as debtService from '@/modules/debts/debt.service';
import * as ingredientRepository from '@/modules/ingredients/ingredient.repository';
import * as ingredientUnitRepository from '@/modules/ingredients/ingredient-units/ingredient-unit.repository';
import * as ingredientBatchRepository from '@/modules/inventory/ingredient-batches/ingredient-batch.repository';
import * as stockLogRepository from '@/modules/inventory/stock-logs/stock-log.repository';
import * as supplierRepository from '@/modules/suppliers/supplier.repository';
import { APP_ERROR_MESSAGES } from '@/shared/constants/messages.constant';
import { generateUUID } from '@/shared/utils/crypto.util';
import * as purchaseOrderRepository from './purchase-order.repository';
import * as purchaseOrderItemRepository from './purchase-order-items/purchase-order-item.repository';
import type {
  CreatePurchaseOrderRequest,
  GetPurchaseOrderRequest,
  ListPurchaseOrdersRequest,
  PurchaseOrderCreateMap,
  PurchaseOrderDetailMap,
  PurchaseOrderListMap,
  PurchaseOrderListRow,
  PurchaseOrderPaymentStatus,
} from './purchase-order.type';

const MONEY_EPSILON = 1e-6;

// Get purchase order list
export const list = async ({
  merchantId,
  search,
  supplier_id,
  date_from,
  date_to,
}: ListPurchaseOrdersRequest): Promise<PurchaseOrderListMap[]> => {
  try {
    const rows = await purchaseOrderRepository.listByMerchantId({
      merchantId,
      search,
      supplierId: supplier_id,
      dateFrom: date_from,
      dateTo: date_to,
    });

    return rows.map(toPurchaseOrderListMap);
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to fetch purchase orders');
  }
};

// Get purchase order detail
export const getDetail = async ({ merchantId, purchaseOrderId }: GetPurchaseOrderRequest): Promise<PurchaseOrderDetailMap> => {
  try {
    const header = await purchaseOrderRepository.getHeaderByIdAndMerchantId(purchaseOrderId, merchantId);
    if (!header) {
      throw notFoundError(APP_ERROR_MESSAGES.NOT_FOUND);
    }

    const items = await purchaseOrderItemRepository.getAllByPurchaseOrderId(purchaseOrderId);
    const supplierDebt = await debtService.getSupplierDebtByPurchaseOrderId(purchaseOrderId);
    const debtPayments = supplierDebt ? await debtService.getPaymentHistoryByDebtId(supplierDebt.id) : [];

    const paymentStatus = derivePaymentStatus({
      debt_amount: header.debt_amount,
      debt_status: supplierDebt?.status,
      debt_paid_amount: supplierDebt?.paid_amount,
    });

    return {
      id: header.id,
      purchase_date: header.purchase_date,
      supplier_id: header.supplier_id,
      supplier_name: header.supplier_name,
      invoice_number: header.invoice_number,
      total_amount: header.total_amount,
      paid_cash: header.paid_cash,
      paid_owner: header.paid_owner,
      debt_amount: header.debt_amount,
      payment_status: paymentStatus,
      notes: header.notes,
      created_at: header.created_at,
      items: items.map((item) => ({
        id: item.id,
        ingredient_id: item.ingredient_id,
        ingredient_name: item.ingredient_name,
        ingredient_unit_id: item.ingredient_unit_id,
        unit_name: item.unit_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      })),
      debt_payments: debtPayments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        reference_number: payment.reference_number,
        notes: payment.notes,
        created_at: payment.created_at,
      })),
    };
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw internalError('Failed to fetch purchase order detail');
  }
};

// Create purchase order and process all side effects in one transaction
export const create = async (merchantId: string, userId: string, data: CreatePurchaseOrderRequest): Promise<PurchaseOrderCreateMap> => {
  let connection: Awaited<ReturnType<typeof startTransaction>> | null = null;

  try {
    if (data.items.length === 0) {
      throw validationError('At least one item is required');
    }

    const { paid_cash, paid_owner, debt_amount } = data.payment;
    const totalAmount = sumTotalAmount(data.items);
    validatePaymentSplit({ totalAmount, paidCash: paid_cash, paidOwner: paid_owner, debtAmount: debt_amount });

    if (debt_amount > 0 && !data.supplier_id) {
      throw validationError('Supplier is required when debt_amount is greater than 0');
    }

    if (data.supplier_id) {
      const supplier = await supplierRepository.getOneByIdAndMerchantId(data.supplier_id, merchantId);
      if (!supplier) {
        throw notFoundError('Supplier not found');
      }
    }

    const itemContexts = new Map<string, IngredientOperationalContext>();
    for (const item of data.items) {
      const context = await getIngredientOperationalContext(item.ingredient_id, item.ingredient_unit_id, merchantId);
      if (!context.ingredient_is_active) {
        throw validationError(`Ingredient "${context.ingredient_name}" is inactive`);
      }
      if (!context.unit_is_active) {
        throw validationError(`Unit "${context.ingredient_unit_name}" is inactive`);
      }
      if (context.unit_conversion_factor <= 0) {
        throw validationError(`Invalid conversion factor for unit "${context.ingredient_unit_name}"`);
      }
      itemContexts.set(`${item.ingredient_id}:${item.ingredient_unit_id}`, context);
    }

    const invoiceNumber = data.invoice_number?.trim()
      ? data.invoice_number.trim()
      : await generateInvoiceNumber(merchantId, data.purchase_date);

    const purchaseOrderId = generateUUID();
    connection = await startTransaction();

    await purchaseOrderRepository.insert(connection, {
      id: purchaseOrderId,
      merchant_id: merchantId,
      purchase_date: data.purchase_date,
      supplier_id: data.supplier_id ?? null,
      invoice_number: invoiceNumber,
      total_amount: totalAmount,
      paid_cash,
      paid_owner,
      debt_amount,
      notes: data.notes ?? null,
    });

    for (const item of data.items) {
      const context = itemContexts.get(`${item.ingredient_id}:${item.ingredient_unit_id}`);
      if (!context) {
        throw validationError('Ingredient unit context is missing');
      }

      const baseUnitQuantity = item.quantity * context.unit_conversion_factor;
      const baseUnitPrice = context.unit_conversion_factor > 0 ? item.unit_price / context.unit_conversion_factor : 0;

      await purchaseOrderItemRepository.insert(connection, {
        id: generateUUID(),
        purchase_order_id: purchaseOrderId,
        ingredient_id: item.ingredient_id,
        ingredient_unit_id: item.ingredient_unit_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        notes: item.notes ?? null,
      });

      const stockBalanceAfter = await ingredientRepository.increaseStockQuantityById(connection, item.ingredient_id, baseUnitQuantity);

      if (baseUnitPrice > 0) {
        await ingredientBatchRepository.insert(connection, {
          id: generateUUID(),
          ingredient_id: item.ingredient_id,
          qty_initial: baseUnitQuantity,
          qty_remaining: baseUnitQuantity,
          cost_per_unit: baseUnitPrice,
          purchase_date: data.purchase_date,
        });
      }

      await stockLogRepository.insert(connection, {
        id: generateUUID(),
        ingredient_id: item.ingredient_id,
        flow_type: 'in',
        base_unit_quantity: baseUnitQuantity,
        base_unit_price: baseUnitPrice,
        notes: 'Stock in from purchase order',
        balance_after: stockBalanceAfter,
        reference_id: purchaseOrderId,
        reference_type: 'purchase',
        created_by: userId,
      });
    }

    if (paid_cash > 0) {
      await cashService.recordPurchasePaymentOutflow({
        db: connection,
        merchantId,
        purchaseOrderId,
        cashLogDate: data.purchase_date,
        amount: paid_cash,
        description: `Purchase payment for ${invoiceNumber}`,
        createdBy: userId,
      });
    }

    if (paid_owner > 0) {
      await debtService.create(connection, {
        id: generateUUID(),
        merchant_id: merchantId,
        supplier_id: null,
        creditor_name: null,
        creditor_type: 'owner',
        purchase_order_id: purchaseOrderId,
        total_amount: paid_owner,
        debt_date: data.purchase_date,
        description: `Owner advance for purchase order ${invoiceNumber}`,
      });
    }

    if (debt_amount > 0 && data.supplier_id) {
      await debtService.create(connection, {
        id: generateUUID(),
        merchant_id: merchantId,
        supplier_id: data.supplier_id,
        creditor_name: null,
        creditor_type: 'supplier',
        purchase_order_id: purchaseOrderId,
        total_amount: debt_amount,
        debt_date: data.purchase_date,
        description: `Supplier debt for purchase order ${invoiceNumber}`,
      });
    }

    await commitTransaction(connection);

    return {
      id: purchaseOrderId,
      invoice_number: invoiceNumber,
      total_amount: totalAmount,
    };
  } catch (error) {
    if (connection) {
      await rollbackTransaction(connection);
    }

    if (isAppError(error)) {
      throw error;
    }

    throw internalError('Failed to create purchase order');
  }
};

const toPurchaseOrderListMap = (row: PurchaseOrderListRow): PurchaseOrderListMap => {
  return {
    id: row.id,
    purchase_date: row.purchase_date,
    supplier_id: row.supplier_id,
    supplier_name: row.supplier_name,
    invoice_number: row.invoice_number,
    total_amount: row.total_amount,
    debt_amount: row.debt_amount,
    payment_status: row.payment_status,
  };
};

const sumTotalAmount = (items: CreatePurchaseOrderRequest['items']): number => {
  return items.reduce((total, item) => total + item.quantity * item.unit_price, 0);
};

const validatePaymentSplit = ({
  totalAmount,
  paidCash,
  paidOwner,
  debtAmount,
}: {
  totalAmount: number;
  paidCash: number;
  paidOwner: number;
  debtAmount: number;
}): void => {
  if (paidCash < 0 || paidOwner < 0 || debtAmount < 0) {
    throw validationError('Payment values must be at least 0');
  }

  const splitTotal = paidCash + paidOwner + debtAmount;
  if (Math.abs(splitTotal - totalAmount) > MONEY_EPSILON) {
    throw validationError('Total payment split must equal total purchase amount');
  }
};

const derivePaymentStatus = ({
  debt_amount,
  debt_status,
  debt_paid_amount,
}: {
  debt_amount: number;
  debt_status?: 'unpaid' | 'partial' | 'paid';
  debt_paid_amount?: number;
}): PurchaseOrderPaymentStatus => {
  if (debt_amount === 0) {
    return 'lunas';
  }

  if (debt_status === 'paid') {
    return 'lunas';
  }

  if ((debt_paid_amount ?? 0) > 0) {
    return 'sebagian';
  }

  return 'belum_lunas';
};

const generateInvoiceNumber = async (merchantId: string, purchaseDate: string): Promise<string> => {
  const date = new Date(purchaseDate);
  if (Number.isNaN(date.getTime())) {
    throw validationError('purchase_date is invalid');
  }

  const dateToken = date.toISOString().slice(0, 10).replaceAll('-', '');
  const sequence = await purchaseOrderRepository.getNextDailyInvoiceSequence(merchantId, purchaseDate, dateToken);

  return `PO-${dateToken}-${String(sequence).padStart(4, '0')}`;
};

type IngredientOperationalContext = {
  ingredient_name: string;
  ingredient_is_active: boolean;
  ingredient_unit_name: string;
  unit_is_active: boolean;
  unit_conversion_factor: number;
};

const getIngredientOperationalContext = async (
  ingredientId: string,
  ingredientUnitId: string,
  merchantId: string,
): Promise<IngredientOperationalContext> => {
  const ingredient = await ingredientRepository.getOneByIdAndMerchantId(ingredientId, merchantId);
  if (!ingredient) {
    throw validationError('Ingredient and unit combination is invalid');
  }

  const unit = await ingredientUnitRepository.getOneByIdAndIngredientId(ingredientUnitId, ingredientId);
  if (!unit) {
    throw validationError('Ingredient and unit combination is invalid');
  }

  return {
    ingredient_name: ingredient.name,
    ingredient_is_active: ingredient.is_active,
    ingredient_unit_name: unit.unit_name,
    unit_is_active: unit.is_active,
    unit_conversion_factor: unit.conversion_factor,
  };
};
