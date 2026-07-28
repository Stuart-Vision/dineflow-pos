import mongoose from 'mongoose';

import {
  INVENTORY_TRANSACTION_TYPE,
  PURCHASE_ORDER_STATUS,
  PURCHASE_PAYMENT_STATUS,
  type PurchaseOrderStatus,
} from '@/constants/enums';
import { ConflictError, NotFoundError } from '@/lib/api/errors';
import type { SessionUser } from '@/lib/auth/session';
import { Ingredient } from '@/models/Ingredient';
import { InventoryTransaction } from '@/models/InventoryTransaction';
import { Purchase } from '@/models/Purchase';
import { PurchaseOrder, type PurchaseOrderDocument } from '@/models/PurchaseOrder';
import { Supplier } from '@/models/Supplier';
import type { CreatePurchaseOrderInput, ReceivePurchaseOrderInput } from '@/validators/operations';

export interface PurchaseOrderRow {
  id: string;
  poNumber: string;
  supplierName: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  itemCount: number;
  totalMinor: number;
  expectedDeliveryDate: string | null;
  receivedAt: string | null;
  createdAt: string;
  items: Array<{
    ingredientId: string;
    ingredientName: string;
    quantityOrdered: number;
    quantityReceived: number;
    unit: string;
    unitCostMinor: number;
  }>;
}

export async function listPurchaseOrders(branchId: string): Promise<PurchaseOrderRow[]> {
  const orders = await PurchaseOrder.find({ branchId }).sort({ createdAt: -1 }).limit(100).lean();

  const supplierIds = [...new Set(orders.map((o) => String(o.supplierId)))];
  const ingredientIds = [...new Set(orders.flatMap((o) => o.items.map((i) => String(i.ingredientId))))];

  const [suppliers, ingredients] = await Promise.all([
    Supplier.find({ _id: { $in: supplierIds } }).select('name').lean(),
    Ingredient.find({ _id: { $in: ingredientIds } }).select('name').lean(),
  ]);

  const supplierNameById = new Map(suppliers.map((s) => [String(s._id), s.name]));
  const ingredientNameById = new Map(ingredients.map((i) => [String(i._id), i.name]));

  return orders.map((order) => ({
    id: String(order._id),
    poNumber: order.poNumber,
    supplierId: String(order.supplierId),
    supplierName: supplierNameById.get(String(order.supplierId)) ?? 'Unknown supplier',
    status: order.status,
    itemCount: order.items.length,
    totalMinor: order.totalMinor,
    expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString() : null,
    receivedAt: order.receivedAt ? new Date(order.receivedAt).toISOString() : null,
    createdAt: new Date(order.createdAt).toISOString(),
    items: order.items.map((item) => ({
      ingredientId: String(item.ingredientId),
      ingredientName: ingredientNameById.get(String(item.ingredientId)) ?? 'Unknown ingredient',
      quantityOrdered: item.quantityOrdered,
      quantityReceived: item.quantityReceived,
      unit: item.unit,
      unitCostMinor: item.unitCostMinor,
    })),
  }));
}

async function nextPoNumber(): Promise<string> {
  // PO numbers are global and monotonic; counting is adequate at demo volume
  // and the unique index is the real guard against a duplicate.
  const count = await PurchaseOrder.countDocuments({});
  return `PO-${String(count + 1).padStart(5, '0')}`;
}

export async function createPurchaseOrder(
  input: CreatePurchaseOrderInput,
  user: SessionUser,
  branchId: string,
): Promise<PurchaseOrderDocument> {
  const supplier = await Supplier.findById(input.supplierId);
  if (!supplier) throw new NotFoundError('Supplier');

  const subtotalMinor = input.items.reduce((sum, item) => sum + item.unitCostMinor * item.quantityOrdered, 0);

  return PurchaseOrder.create({
    restaurantId: user.restaurantId,
    branchId,
    supplierId: supplier._id,
    poNumber: await nextPoNumber(),
    status: PURCHASE_ORDER_STATUS.PENDING_APPROVAL,
    items: input.items.map((item) => ({ ...item, quantityReceived: 0 })),
    subtotalMinor,
    taxMinor: 0,
    totalMinor: subtotalMinor,
    requestedBy: user.id,
    expectedDeliveryDate: input.expectedDeliveryDate ?? null,
    notes: input.notes,
  });
}

export async function approvePurchaseOrder(
  purchaseOrderId: string,
  branchId: string,
  user: SessionUser,
): Promise<PurchaseOrderDocument> {
  const order = await PurchaseOrder.findOne({ _id: purchaseOrderId, branchId });
  if (!order) throw new NotFoundError('Purchase order');
  if (order.status !== PURCHASE_ORDER_STATUS.PENDING_APPROVAL) {
    throw new ConflictError(`Only a purchase order awaiting approval can be approved (this one is "${order.status}").`);
  }

  order.status = PURCHASE_ORDER_STATUS.APPROVED;
  order.approvedBy = new mongoose.Types.ObjectId(user.id);
  order.approvedAt = new Date();
  await order.save();
  return order;
}

export interface ReceiveResult {
  order: PurchaseOrderDocument;
  stockedLines: Array<{ ingredientName: string; quantityBase: number; unit: string }>;
}

/**
 * Receives a delivery against a purchase order. Received quantities are added
 * to branch stock and written as STOCK_IN transactions, the PO moves to
 * partially-received or received, and a supplier invoice is raised so the
 * payable shows up against the supplier balance.
 */
export async function receivePurchaseOrder(
  purchaseOrderId: string,
  branchId: string,
  input: ReceivePurchaseOrderInput,
  user: SessionUser,
): Promise<ReceiveResult> {
  const order = await PurchaseOrder.findOne({ _id: purchaseOrderId, branchId });
  if (!order) throw new NotFoundError('Purchase order');

  const receivable: PurchaseOrderStatus[] = [
    PURCHASE_ORDER_STATUS.APPROVED,
    PURCHASE_ORDER_STATUS.ORDERED,
    PURCHASE_ORDER_STATUS.PARTIALLY_RECEIVED,
  ];
  if (!receivable.includes(order.status)) {
    throw new ConflictError(`A purchase order in "${order.status}" status cannot receive stock.`);
  }

  const receivedByIngredient = new Map(input.items.map((i) => [i.ingredientId, i.quantityReceived]));
  const stockedLines: ReceiveResult['stockedLines'] = [];

  for (const line of order.items) {
    const receivedNow = receivedByIngredient.get(String(line.ingredientId)) ?? 0;
    if (receivedNow <= 0) continue;

    const outstanding = line.quantityOrdered - line.quantityReceived;
    if (receivedNow > outstanding) {
      throw new ConflictError(
        `Cannot receive ${receivedNow} when only ${outstanding} remain outstanding on this line.`,
      );
    }

    const ingredient = await Ingredient.findOne({ _id: line.ingredientId, branchId });
    if (!ingredient) continue;

    line.quantityReceived += receivedNow;
    ingredient.currentStockBase += receivedNow;
    if (line.unitCostMinor > 0) ingredient.costPerPurchaseUnitMinor = line.unitCostMinor;
    await ingredient.save();

    await InventoryTransaction.create({
      restaurantId: order.restaurantId,
      branchId: order.branchId,
      ingredientId: ingredient._id,
      type: INVENTORY_TRANSACTION_TYPE.STOCK_IN,
      quantityBase: receivedNow,
      unitCostMinor: line.unitCostMinor,
      balanceAfterBase: ingredient.currentStockBase,
      referenceType: 'purchase',
      referenceId: order._id,
      performedBy: new mongoose.Types.ObjectId(user.id),
    });

    stockedLines.push({
      ingredientName: ingredient.name,
      quantityBase: receivedNow,
      unit: ingredient.consumptionUnit,
    });
  }

  const fullyReceived = order.items.every((line) => line.quantityReceived >= line.quantityOrdered);
  order.status = fullyReceived ? PURCHASE_ORDER_STATUS.RECEIVED : PURCHASE_ORDER_STATUS.PARTIALLY_RECEIVED;
  if (fullyReceived) order.receivedAt = new Date();
  await order.save();

  const receivedValueMinor = order.items.reduce((sum, l) => sum + l.quantityReceived * l.unitCostMinor, 0);

  const existingInvoice = await Purchase.findOne({ purchaseOrderId: order._id });
  if (existingInvoice) {
    existingInvoice.amountMinor = receivedValueMinor;
    existingInvoice.paymentStatus =
      existingInvoice.amountPaidMinor >= receivedValueMinor
        ? PURCHASE_PAYMENT_STATUS.PAID
        : existingInvoice.amountPaidMinor > 0
          ? PURCHASE_PAYMENT_STATUS.PARTIAL
          : PURCHASE_PAYMENT_STATUS.UNPAID;
    await existingInvoice.save();
  } else {
    await Purchase.create({
      restaurantId: order.restaurantId,
      branchId: order.branchId,
      supplierId: order.supplierId,
      purchaseOrderId: order._id,
      invoiceNumber: `INV-${order.poNumber}`,
      invoiceDate: new Date(),
      amountMinor: receivedValueMinor,
      amountPaidMinor: 0,
      paymentStatus: PURCHASE_PAYMENT_STATUS.UNPAID,
      isReturn: false,
    });

    await Supplier.updateOne({ _id: order.supplierId }, { $inc: { outstandingBalanceMinor: receivedValueMinor } });
  }

  return { order, stockedLines };
}

export interface SupplierRow {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  categories: string[];
  paymentTermsDays: number;
  outstandingBalanceMinor: number;
  rating: number;
  purchaseOrderCount: number;
  totalPurchasedMinor: number;
  isActive: boolean;
}

export async function listSuppliers(restaurantId: string): Promise<SupplierRow[]> {
  const suppliers = await Supplier.find({ restaurantId }).sort({ name: 1 }).lean();

  const stats = await PurchaseOrder.aggregate<{ _id: mongoose.Types.ObjectId; count: number; total: number }>([
    { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId) } },
    { $group: { _id: '$supplierId', count: { $sum: 1 }, total: { $sum: '$totalMinor' } } },
  ]);
  const statsBySupplier = new Map(stats.map((s) => [String(s._id), s]));

  return suppliers.map((s) => {
    const stat = statsBySupplier.get(String(s._id));
    return {
      id: String(s._id),
      name: s.name,
      contactPerson: s.contactPerson,
      phone: s.phone,
      email: s.email,
      categories: s.categories,
      paymentTermsDays: s.paymentTermsDays,
      outstandingBalanceMinor: s.outstandingBalanceMinor,
      rating: s.rating,
      purchaseOrderCount: stat?.count ?? 0,
      totalPurchasedMinor: stat?.total ?? 0,
      isActive: s.isActive,
    };
  });
}
