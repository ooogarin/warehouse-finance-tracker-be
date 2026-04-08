import { sql } from '@/core/db/client';
import type { ReservedSQL } from '@/core/db/client';
import type { PurchaseOrderItemInsertPayload, PurchaseOrderItemRow } from './purchase-order-item.type';

// Get purchase order items by purchase order ID
export const getAllByPurchaseOrderId = async (purchaseOrderId: string): Promise<PurchaseOrderItemRow[]> => {
  return await sql<PurchaseOrderItemRow[]>`
    SELECT
      poi.id,
      poi.purchase_order_id,
      poi.ingredient_id,
      i.name AS ingredient_name,
      poi.ingredient_unit_id,
      iu.unit_name,
      poi.quantity::double precision AS quantity,
      poi.unit_price::double precision AS unit_price,
      poi.subtotal::double precision AS subtotal
    FROM purchase_order_items poi
    JOIN ingredients i ON i.id = poi.ingredient_id
    JOIN ingredient_units iu ON iu.id = poi.ingredient_unit_id
    WHERE poi.purchase_order_id = ${purchaseOrderId}
      AND poi.deleted_at IS NULL
    ORDER BY i.name ASC, iu.conversion_factor ASC, poi.created_at ASC
  `;
};

// Insert one purchase order item
export const insert = async (db: ReservedSQL, payload: PurchaseOrderItemInsertPayload): Promise<void> => {
  const allowedColumns = ['id', 'purchase_order_id', 'ingredient_id', 'ingredient_unit_id', 'quantity', 'unit_price', 'notes'] as const;

  await db`
    INSERT INTO purchase_order_items ${sql(payload, ...allowedColumns)}
  `;
};
