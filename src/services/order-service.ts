import mongoose, { type Types } from 'mongoose';

import {
  INVENTORY_TRANSACTION_TYPE,
  LOYALTY_TRANSACTION_TYPE,
  NOTIFICATION_SEVERITY,
  NOTIFICATION_TYPE,
  ORDER_ITEM_STATUS,
  ORDER_STATUS,
  ORDER_STATUS_TRANSITIONS,
  ORDER_TYPE,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  REFUND_STATUS,
  TABLE_STATUS,
  type OrderStatus,
} from '@/constants/enums';
import { PERMISSIONS } from '@/constants/permissions';
import {
  ConflictError,
  ForbiddenError,
  InvalidTransitionError,
  NotFoundError,
  PaymentError,
  ValidationError,
} from '@/lib/api/errors';
import type { SessionUser } from '@/lib/auth/session';
import { formatMoney } from '@/lib/money';
import { calculateOrderTotals, paymentSummary, type Discount, type PricingLineInput } from '@/lib/pricing/order-totals';
import { Branch } from '@/models/Branch';
import { Customer } from '@/models/Customer';
import { Ingredient, type IngredientDocument } from '@/models/Ingredient';
import { InventoryTransaction } from '@/models/InventoryTransaction';
import { LoyaltyTransaction } from '@/models/LoyaltyTransaction';
import { MenuItem } from '@/models/MenuItem';
import { Notification } from '@/models/Notification';
import { Order, type IOrderItem, type OrderDocument } from '@/models/Order';
import { Payment, type PaymentDocument } from '@/models/Payment';
import { Recipe } from '@/models/Recipe';
import { Refund } from '@/models/Refund';
import { RestaurantSetting } from '@/models/RestaurantSetting';
import { Table } from '@/models/Table';
import type { CartLineInput, CreatePaymentInput, RefundPaymentInput } from '@/validators/order';

export function assertTransition(current: OrderStatus, next: OrderStatus): void {
  const allowed = ORDER_STATUS_TRANSITIONS[current];
  if (!allowed.includes(next)) throw new InvalidTransitionError(current, next);
}

interface CartContext {
  branchId: Types.ObjectId;
  restaurantId: Types.ObjectId;
  orderType: string;
  orderDiscount?: Discount | null;
}

async function priceCart(cart: CartLineInput[], ctx: CartContext) {
  const menuItemIds = [...new Set(cart.map((line) => line.menuItemId))];
  const menuItems = await MenuItem.find({ _id: { $in: menuItemIds }, restaurantId: ctx.restaurantId, isActive: true });
  const menuItemById = new Map(menuItems.map((m) => [String(m._id), m]));

  const settings = await RestaurantSetting.findOne({ restaurantId: ctx.restaurantId });
  if (!settings) throw new NotFoundError('Restaurant settings');
  const defaultTaxRate = settings.taxes.find((t) => t.isDefault)?.ratePercent ?? settings.taxes[0]?.ratePercent ?? 0;

  const resolved = cart.map((line) => {
    const menuItem = menuItemById.get(line.menuItemId);
    if (!menuItem) throw new NotFoundError(`Menu item ${line.menuItemId}`);

    let unitPriceMinor = menuItem.priceMinor;
    if (line.portionName) {
      const portion = menuItem.portionSizes.find((p) => p.name === line.portionName);
      if (!portion) throw new ValidationError(`"${line.portionName}" is not a valid size for ${menuItem.name}.`);
      unitPriceMinor = portion.priceMinor;
    }

    return { line, menuItem, unitPriceMinor };
  });

  const pricingLines: PricingLineInput[] = resolved.map(({ line, unitPriceMinor }, index) => ({
    id: String(index),
    name: undefined,
    unitPriceMinor,
    quantity: line.quantity,
    modifiers: line.modifiers,
    discount: line.discount ?? null,
    taxRatePercent: defaultTaxRate,
  }));

  const totals = calculateOrderTotals(pricingLines, {
    taxMode: settings.taxMode,
    serviceChargePercent: ctx.orderType === ORDER_TYPE.DINE_IN ? settings.serviceChargePercent : 0,
    serviceChargeTaxable: settings.serviceChargeTaxable,
    serviceChargeTaxRatePercent: defaultTaxRate,
    orderDiscount: ctx.orderDiscount ?? null,
    deliveryFeeMinor: ctx.orderType === ORDER_TYPE.DELIVERY ? 350 : 0,
    cashRoundingIncrementMinor: settings.cashRoundingIncrementMinor,
  });

  const items: IOrderItem[] = resolved.map(({ line, menuItem, unitPriceMinor }, index) => {
    const priced = totals.lines[index]!;
    return {
      _id: new mongoose.Types.ObjectId(),
      menuItemId: menuItem._id,
      name: menuItem.name,
      portionName: line.portionName ?? null,
      sku: menuItem.sku,
      quantity: line.quantity,
      unitPriceMinor,
      modifiers: line.modifiers,
      notes: line.notes ?? null,
      discount: line.discount ?? null,
      taxRatePercent: priced.taxRatePercent,
      kitchenStation: menuItem.kitchenStation,
      status: ORDER_ITEM_STATUS.PENDING,
      cancelReason: null,
      sentToKitchenAt: null,
      readyAt: null,
      servedAt: null,
    };
  });

  return { items, totals, settings };
}

function applyTotalsToOrder(order: OrderDocument, totals: ReturnType<typeof calculateOrderTotals>): void {
  order.subtotalMinor = totals.subtotalMinor;
  order.discountTotalMinor = totals.discountTotalMinor;
  order.serviceChargeMinor = totals.serviceChargeMinor;
  order.taxMinor = totals.taxMinor;
  order.deliveryFeeMinor = totals.deliveryFeeMinor;
  order.tipMinor = totals.tipMinor;
  order.roundingMinor = totals.roundingMinor;
  order.grandTotalMinor = totals.grandTotalMinor;
}

async function nextOrderNumber(restaurantId: Types.ObjectId, branchCode: string): Promise<string> {
  const settings = await RestaurantSetting.findOneAndUpdate(
    { restaurantId },
    { $inc: { nextOrderSequence: 1 } },
    { new: false },
  );
  if (!settings) throw new NotFoundError('Restaurant settings');
  return `${settings.orderNumberPrefix}${branchCode}-${String(settings.nextOrderSequence).padStart(5, '0')}`;
}

export interface CreateOrderArgs {
  type: string;
  tableId?: string | null;
  customerId?: string | null;
  items: CartLineInput[];
  orderDiscount?: Discount | null;
  notes?: string | null;
  delivery?: { address: string; phone: string; instructions?: string };
  submit: boolean;
}

export async function createOrder(input: CreateOrderArgs, user: SessionUser, branchId: string): Promise<OrderDocument> {
  if (!user.restaurantId) throw new ValidationError('Only staff assigned to a restaurant can create orders.');
  const restaurantId = new mongoose.Types.ObjectId(user.restaurantId);
  const branchObjectId = new mongoose.Types.ObjectId(branchId);

  const branch = await Branch.findOne({ _id: branchObjectId, restaurantId });
  if (!branch) throw new NotFoundError('Branch');

  if (input.type === ORDER_TYPE.DINE_IN && !input.tableId) {
    throw new ValidationError('Select a table for a dine-in order.');
  }
  if (input.type === ORDER_TYPE.DELIVERY && !input.delivery) {
    throw new ValidationError('Delivery address and phone are required for a delivery order.');
  }

  let table = null;
  if (input.tableId) {
    table = await Table.findOne({ _id: input.tableId, branchId: branchObjectId });
    if (!table) throw new NotFoundError('Table');
  }

  const { items, totals, settings } = await priceCart(input.items, {
    branchId: branchObjectId,
    restaurantId,
    orderType: input.type,
    orderDiscount: input.orderDiscount,
  });

  const orderNumber = await nextOrderNumber(restaurantId, branch.code);
  const now = new Date();
  const status = input.submit ? ORDER_STATUS.SUBMITTED : ORDER_STATUS.DRAFT;

  if (input.submit) {
    for (const item of items) item.sentToKitchenAt = now;
  }

  const order = new Order({
    restaurantId,
    branchId: branchObjectId,
    orderNumber,
    type: input.type,
    status,
    tableId: table?._id ?? null,
    customerId: input.customerId ?? null,
    waiterId: user.role === 'waiter' ? user.id : null,
    cashierId: user.id,
    items,
    orderDiscount: input.orderDiscount ?? null,
    serviceChargePercent: input.type === ORDER_TYPE.DINE_IN ? settings.serviceChargePercent : 0,
    taxMode: settings.taxMode,
    notes: input.notes ?? null,
    delivery: input.delivery
      ? { address: input.delivery.address, phone: input.delivery.phone, instructions: input.delivery.instructions, feeMinor: totals.deliveryFeeMinor, driverId: null, estimatedDeliveryAt: null, status: 'pending' }
      : null,
    submittedAt: input.submit ? now : null,
  });
  applyTotalsToOrder(order, totals);
  await order.save();

  if (table) {
    table.status = TABLE_STATUS.OCCUPIED;
    table.currentOrderId = order._id;
    if (input.customerId) table.currentCustomerId = new mongoose.Types.ObjectId(input.customerId);
    await table.save();
  }

  if (input.submit) {
    await Notification.create({
      restaurantId,
      branchId: branchObjectId,
      userId: null,
      type: NOTIFICATION_TYPE.ORDER_NEW,
      severity: NOTIFICATION_SEVERITY.INFO,
      title: `New order ${order.orderNumber}`,
      message: `${items.length} item${items.length === 1 ? '' : 's'} sent to the kitchen.`,
      link: '/kitchen',
      relatedEntityType: 'Order',
      relatedEntityId: order._id,
      isRead: false,
      readAt: null,
    });
  }

  return order;
}

async function loadOrder(orderId: string, branchId?: string | null): Promise<OrderDocument> {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError('Order');
  if (branchId && String(order.branchId) !== branchId) throw new NotFoundError('Order');
  return order;
}

export async function updateOrderItems(
  orderId: string,
  input: { items: CartLineInput[]; orderDiscount?: Discount | null; notes?: string | null; tableId?: string | null; customerId?: string | null },
  branchId: string,
): Promise<OrderDocument> {
  const order = await loadOrder(orderId, branchId);
  if (order.status !== ORDER_STATUS.DRAFT && order.status !== ORDER_STATUS.HELD) {
    throw new ConflictError('Only draft or held orders can be edited.');
  }

  const { items, totals } = await priceCart(input.items, {
    branchId: order.branchId,
    restaurantId: order.restaurantId,
    orderType: order.type,
    orderDiscount: input.orderDiscount,
  });

  order.items = items;
  order.orderDiscount = input.orderDiscount ?? null;
  if (input.notes !== undefined) order.notes = input.notes;
  if (input.tableId !== undefined) order.tableId = input.tableId ? new mongoose.Types.ObjectId(input.tableId) : null;
  if (input.customerId !== undefined) order.customerId = input.customerId ? new mongoose.Types.ObjectId(input.customerId) : null;
  applyTotalsToOrder(order, totals);
  await order.save();
  return order;
}

export async function holdOrder(orderId: string, branchId: string, reason?: string): Promise<OrderDocument> {
  const order = await loadOrder(orderId, branchId);
  assertTransition(order.status, ORDER_STATUS.HELD);
  order.status = ORDER_STATUS.HELD;
  order.holdReason = reason ?? null;
  await order.save();
  return order;
}

export interface StockShortage {
  ingredientName: string;
  requiredBase: number;
  availableBase: number;
  unit: string;
}

export async function checkStockAvailability(order: OrderDocument): Promise<StockShortage[]> {
  const requiredBySku = new Map<string, number>();
  for (const item of order.items) {
    if (item.status === ORDER_ITEM_STATUS.CANCELLED) continue;
    const recipe = await Recipe.findOne({ menuItemId: item.menuItemId, portionName: item.portionName ?? null });
    if (!recipe) continue;
    for (const line of recipe.ingredients) {
      requiredBySku.set(line.ingredientSku, (requiredBySku.get(line.ingredientSku) ?? 0) + line.quantityBase * item.quantity);
    }
  }

  if (requiredBySku.size === 0) return [];

  const ingredients = await Ingredient.find({ branchId: order.branchId, sku: { $in: [...requiredBySku.keys()] } });
  const shortages: StockShortage[] = [];
  for (const ingredient of ingredients) {
    const required = requiredBySku.get(ingredient.sku) ?? 0;
    if (ingredient.currentStockBase < required) {
      shortages.push({
        ingredientName: ingredient.name,
        requiredBase: required,
        availableBase: ingredient.currentStockBase,
        unit: ingredient.consumptionUnit,
      });
    }
  }
  return shortages;
}

export async function submitOrder(orderId: string, branchId: string): Promise<{ order: OrderDocument; warnings: StockShortage[] }> {
  const order = await loadOrder(orderId, branchId);
  assertTransition(order.status, ORDER_STATUS.SUBMITTED);
  const now = new Date();
  order.status = ORDER_STATUS.SUBMITTED;
  order.submittedAt = now;
  for (const item of order.items) if (!item.sentToKitchenAt) item.sentToKitchenAt = now;
  await order.save();

  const warnings = await checkStockAvailability(order);

  await Notification.create({
    restaurantId: order.restaurantId,
    branchId: order.branchId,
    userId: null,
    type: NOTIFICATION_TYPE.ORDER_NEW,
    severity: NOTIFICATION_SEVERITY.INFO,
    title: `New order ${order.orderNumber}`,
    message: `${order.items.length} item${order.items.length === 1 ? '' : 's'} sent to the kitchen.`,
    link: '/kitchen',
    relatedEntityType: 'Order',
    relatedEntityId: order._id,
    isRead: false,
    readAt: null,
  });

  return { order, warnings };
}

async function freeTableIfIdle(order: OrderDocument): Promise<void> {
  if (!order.tableId) return;
  const table = await Table.findOne({ _id: order.tableId, currentOrderId: order._id });
  if (!table) return;
  table.status = TABLE_STATUS.AVAILABLE;
  table.currentOrderId = null;
  table.currentCustomerId = null;
  await table.save();
}

export async function cancelOrder(orderId: string, branchId: string, reason: string): Promise<OrderDocument> {
  const order = await loadOrder(orderId, branchId);
  assertTransition(order.status, ORDER_STATUS.CANCELLED);
  order.status = ORDER_STATUS.CANCELLED;
  order.cancelReason = reason;
  order.cancelledAt = new Date();
  for (const item of order.items) item.status = ORDER_ITEM_STATUS.CANCELLED;
  await order.save();
  await freeTableIfIdle(order);
  return order;
}

export async function voidOrder(orderId: string, branchId: string, reason: string): Promise<OrderDocument> {
  const order = await loadOrder(orderId, branchId);
  assertTransition(order.status, ORDER_STATUS.VOIDED);
  order.status = ORDER_STATUS.VOIDED;
  order.voidReason = reason;
  await order.save();
  await freeTableIfIdle(order);
  return order;
}

export async function acceptOrderInKitchen(orderId: string, branchId: string): Promise<OrderDocument> {
  const order = await loadOrder(orderId, branchId);
  assertTransition(order.status, ORDER_STATUS.KITCHEN_ACCEPTED);
  order.status = ORDER_STATUS.KITCHEN_ACCEPTED;
  order.kitchenAcceptedAt = new Date();
  await order.save();
  return order;
}

export async function startPreparingOrder(orderId: string, branchId: string): Promise<OrderDocument> {
  const order = await loadOrder(orderId, branchId);
  assertTransition(order.status, ORDER_STATUS.PREPARING);
  order.status = ORDER_STATUS.PREPARING;
  order.preparingAt = new Date();
  for (const item of order.items) {
    if (item.status === ORDER_ITEM_STATUS.PENDING) item.status = ORDER_ITEM_STATUS.PREPARING;
  }
  await order.save();
  return order;
}

export async function markItemReady(orderId: string, itemId: string, branchId: string): Promise<OrderDocument> {
  const order = await loadOrder(orderId, branchId);
  const item = order.items.find((i) => String(i._id) === itemId);
  if (!item) throw new NotFoundError('Order item');
  item.status = ORDER_ITEM_STATUS.READY;
  item.readyAt = new Date();

  const allReady = order.items.every((i) => i.status === ORDER_ITEM_STATUS.READY || i.status === ORDER_ITEM_STATUS.CANCELLED);
  if (allReady && ORDER_STATUS_TRANSITIONS[order.status].includes(ORDER_STATUS.READY)) {
    order.status = ORDER_STATUS.READY;
    order.readyAt = new Date();
    await Notification.create({
      restaurantId: order.restaurantId,
      branchId: order.branchId,
      userId: order.waiterId,
      type: NOTIFICATION_TYPE.ORDER_READY,
      severity: NOTIFICATION_SEVERITY.SUCCESS,
      title: `Order ${order.orderNumber} is ready`,
      message: 'All items are ready to serve.',
      link: '/kitchen',
      relatedEntityType: 'Order',
      relatedEntityId: order._id,
      isRead: false,
      readAt: null,
    });
  }
  await order.save();
  return order;
}

export async function markOrderReady(orderId: string, branchId: string): Promise<OrderDocument> {
  const order = await loadOrder(orderId, branchId);
  assertTransition(order.status, ORDER_STATUS.READY);
  order.status = ORDER_STATUS.READY;
  order.readyAt = new Date();
  for (const item of order.items) {
    if (item.status !== ORDER_ITEM_STATUS.CANCELLED) item.status = ORDER_ITEM_STATUS.READY;
  }
  await order.save();
  return order;
}

export async function markOrderServed(orderId: string, branchId: string): Promise<OrderDocument> {
  const order = await loadOrder(orderId, branchId);
  assertTransition(order.status, ORDER_STATUS.SERVED);
  order.status = ORDER_STATUS.SERVED;
  order.servedAt = new Date();
  for (const item of order.items) {
    if (item.status !== ORDER_ITEM_STATUS.CANCELLED) item.status = ORDER_ITEM_STATUS.SERVED;
  }
  await order.save();
  return order;
}

export async function transferOrderTable(orderId: string, branchId: string, newTableId: string): Promise<OrderDocument> {
  const order = await loadOrder(orderId, branchId);
  if (order.type !== ORDER_TYPE.DINE_IN) throw new ValidationError('Only dine-in orders have a table to transfer.');

  const newTable = await Table.findOne({ _id: newTableId, branchId: order.branchId });
  if (!newTable) throw new NotFoundError('Table');
  if (newTable.status !== TABLE_STATUS.AVAILABLE) throw new ConflictError('The destination table is not available.');

  await freeTableIfIdle(order);
  order.tableId = newTable._id;
  await order.save();

  newTable.status = TABLE_STATUS.OCCUPIED;
  newTable.currentOrderId = order._id;
  newTable.currentCustomerId = order.customerId;
  await newTable.save();

  return order;
}

async function deductInventoryForOrder(order: OrderDocument, performedBy: Types.ObjectId): Promise<void> {
  for (const item of order.items) {
    if (item.status === ORDER_ITEM_STATUS.CANCELLED) continue;
    const recipe = await Recipe.findOne({ menuItemId: item.menuItemId, portionName: item.portionName ?? null });
    if (!recipe) continue;

    for (const line of recipe.ingredients) {
      const ingredient: IngredientDocument | null = await Ingredient.findOne({ branchId: order.branchId, sku: line.ingredientSku });
      if (!ingredient) continue;

      const consumed = line.quantityBase * item.quantity;
      ingredient.currentStockBase = Math.max(0, ingredient.currentStockBase - consumed);
      await ingredient.save();

      await InventoryTransaction.create({
        restaurantId: order.restaurantId,
        branchId: order.branchId,
        ingredientId: ingredient._id,
        type: INVENTORY_TRANSACTION_TYPE.SALE_DEDUCTION,
        quantityBase: consumed,
        unitCostMinor: ingredient.costPerPurchaseUnitMinor,
        balanceAfterBase: ingredient.currentStockBase,
        referenceType: 'order',
        referenceId: order._id,
        performedBy,
      });

      if (ingredient.currentStockBase <= ingredient.reorderLevelBase) {
        await Notification.create({
          restaurantId: order.restaurantId,
          branchId: order.branchId,
          userId: null,
          type: ingredient.currentStockBase === 0 ? NOTIFICATION_TYPE.STOCK_OUT : NOTIFICATION_TYPE.STOCK_LOW,
          severity: ingredient.currentStockBase === 0 ? NOTIFICATION_SEVERITY.CRITICAL : NOTIFICATION_SEVERITY.WARNING,
          title: ingredient.currentStockBase === 0 ? `${ingredient.name} is out of stock` : `${ingredient.name} is running low`,
          message: `${ingredient.currentStockBase} ${ingredient.consumptionUnit} remaining (reorder level ${ingredient.reorderLevelBase}).`,
          link: '/inventory',
          relatedEntityType: 'Ingredient',
          relatedEntityId: ingredient._id,
          isRead: false,
          readAt: null,
        });
      }
    }
  }
}

async function accrueLoyalty(order: OrderDocument): Promise<void> {
  if (!order.customerId) return;
  const customer = await Customer.findById(order.customerId);
  if (!customer || customer.isBlacklisted) return;

  const pointsEarned = Math.floor(order.grandTotalMinor / 100);
  customer.loyaltyPointsBalance += pointsEarned;
  customer.lifetimePoints += pointsEarned;
  customer.totalSpentMinor += order.grandTotalMinor;
  customer.totalOrders += 1;
  customer.lastVisitAt = new Date();
  await customer.save();

  if (pointsEarned > 0) {
    await LoyaltyTransaction.create({
      restaurantId: order.restaurantId,
      customerId: customer._id,
      type: LOYALTY_TRANSACTION_TYPE.EARNED,
      points: pointsEarned,
      orderId: order._id,
      description: `Points earned on order ${order.orderNumber}`,
      expiresAt: null,
      performedBy: null,
    });
  }
}

export interface AddPaymentResult {
  order: OrderDocument;
  payment: PaymentDocument;
  changeDueMinor: number;
}

/**
 * Route from each payable status to PAID through the state machine. A counter
 * sale settled straight off the POS is still `submitted`, and the machine has
 * no `submitted -> paid` edge — it must pass through `ready` — so the walk is
 * spelled out here rather than jumping, and every hop is still asserted.
 */
const SETTLE_PATHS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [ORDER_STATUS.SUBMITTED]: [ORDER_STATUS.READY, ORDER_STATUS.PAID],
  [ORDER_STATUS.KITCHEN_ACCEPTED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.PAID],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY, ORDER_STATUS.PAID],
  [ORDER_STATUS.READY]: [ORDER_STATUS.PAID],
  [ORDER_STATUS.SERVED]: [ORDER_STATUS.PAID],
};

function settleOrderStatus(order: OrderDocument): void {
  const now = new Date();
  const path = SETTLE_PATHS[order.status];
  if (!path) throw new ConflictError(`An order in "${order.status}" status cannot be settled.`);

  for (const next of path) {
    assertTransition(order.status, next);
    order.status = next;
    if (next === ORDER_STATUS.PREPARING && !order.preparingAt) order.preparingAt = now;
    if (next === ORDER_STATUS.READY && !order.readyAt) order.readyAt = now;
    if (next === ORDER_STATUS.PAID) order.paidAt = now;
  }

  for (const item of order.items) {
    if (item.status === ORDER_ITEM_STATUS.CANCELLED) continue;
    item.status = ORDER_ITEM_STATUS.SERVED;
    if (!item.readyAt) item.readyAt = now;
    if (!item.servedAt) item.servedAt = now;
  }
  if (!order.servedAt) order.servedAt = now;

  assertTransition(order.status, ORDER_STATUS.COMPLETED);
  order.status = ORDER_STATUS.COMPLETED;
  order.completedAt = now;
}

export async function addPayment(orderId: string, branchId: string, input: CreatePaymentInput, user: SessionUser): Promise<AddPaymentResult> {
  const order = await loadOrder(orderId, branchId);
  const payableStatuses: OrderStatus[] = [
    ORDER_STATUS.READY,
    ORDER_STATUS.SERVED,
    ORDER_STATUS.SUBMITTED,
    ORDER_STATUS.KITCHEN_ACCEPTED,
    ORDER_STATUS.PREPARING,
  ];
  if (!payableStatuses.includes(order.status)) {
    throw new ConflictError(`An order in "${order.status}" status cannot take a new payment.`);
  }

  const summaryBefore = paymentSummary(order.grandTotalMinor, order.paidMinor, order.refundedMinor);
  if (summaryBefore.balanceDueMinor <= 0) throw new PaymentError('This order is already fully paid.');

  const isCash = input.method === PAYMENT_METHOD.CASH;
  const appliedAmount = isCash ? Math.min(input.amountMinor, summaryBefore.balanceDueMinor) : input.amountMinor;
  if (!isCash && appliedAmount > summaryBefore.balanceDueMinor) {
    throw new PaymentError(`Amount exceeds the balance due of ${formatMoney(summaryBefore.balanceDueMinor)}.`);
  }
  const tenderedMinor = isCash ? Math.max(input.tenderedMinor ?? appliedAmount, appliedAmount) : appliedAmount;
  const changeDueMinor = tenderedMinor - appliedAmount;

  const payment = await Payment.create({
    restaurantId: order.restaurantId,
    branchId: order.branchId,
    orderId: order._id,
    method: input.method,
    amountMinor: appliedAmount,
    tenderedMinor,
    changeMinor: changeDueMinor,
    status: PAYMENT_STATUS.COMPLETED,
    gateway: 'demo',
    transactionReference: `DEMO-${Math.floor(Math.random() * 900000 + 100000)}`,
    cardLast4: input.cardLast4 ?? null,
    walletProvider: input.walletProvider ?? null,
    notes: input.notes ?? null,
    processedBy: user.id,
  });

  order.paidMinor += appliedAmount;
  const summaryAfter = paymentSummary(order.grandTotalMinor, order.paidMinor, order.refundedMinor);

  if (summaryAfter.isSettled) {
    settleOrderStatus(order);
    await order.save();

    await deductInventoryForOrder(order, new mongoose.Types.ObjectId(user.id));
    await accrueLoyalty(order);
    await freeTableIfIdle(order);
  } else {
    await order.save();
  }

  return { order, payment, changeDueMinor };
}

export async function voidPayment(paymentId: string, branchId: string, reason: string, user: SessionUser): Promise<PaymentDocument> {
  const payment = await Payment.findById(paymentId);
  if (!payment || String(payment.branchId) !== branchId) throw new NotFoundError('Payment');
  if (payment.status === PAYMENT_STATUS.VOIDED) throw new ConflictError('This payment has already been voided.');

  payment.status = PAYMENT_STATUS.VOIDED;
  payment.voidedBy = new mongoose.Types.ObjectId(user.id);
  payment.voidedAt = new Date();
  payment.voidReason = reason;
  await payment.save();

  const order = await Order.findById(payment.orderId);
  if (order) {
    order.paidMinor = Math.max(0, order.paidMinor - payment.amountMinor);
    // Voiding a settling payment is an exceptional correction, not a forward
    // lifecycle step — bypass the state machine rather than force-fit it.
    if (order.status === ORDER_STATUS.COMPLETED || order.status === ORDER_STATUS.PAID) {
      order.status = ORDER_STATUS.SERVED;
    }
    await order.save();
  }

  return payment;
}

export async function refundPayment(
  paymentId: string,
  branchId: string,
  input: RefundPaymentInput,
  user: SessionUser,
): Promise<{ order: OrderDocument | null; refund: InstanceType<typeof Refund> }> {
  const payment = await Payment.findById(paymentId);
  if (!payment || String(payment.branchId) !== branchId) throw new NotFoundError('Payment');
  if (input.amountMinor > payment.amountMinor) throw new ValidationError('Refund amount cannot exceed the original payment.');

  const canApprove = user.permissions.includes(PERMISSIONS.PAYMENT_APPROVE_REFUND);

  const refund = await Refund.create({
    restaurantId: payment.restaurantId,
    branchId: payment.branchId,
    orderId: payment.orderId,
    paymentId: payment._id,
    amountMinor: input.amountMinor,
    reason: input.reason,
    status: canApprove ? REFUND_STATUS.PROCESSED : REFUND_STATUS.PENDING_APPROVAL,
    requestedBy: user.id,
    approvedBy: canApprove ? user.id : null,
    processedAt: canApprove ? new Date() : null,
  });

  let order: OrderDocument | null = null;
  if (canApprove) {
    order = await Order.findById(payment.orderId);
    if (order) {
      order.refundedMinor += input.amountMinor;
      const nextStatus = order.refundedMinor >= order.paidMinor ? ORDER_STATUS.REFUNDED : ORDER_STATUS.PARTIALLY_REFUNDED;
      if (ORDER_STATUS_TRANSITIONS[order.status]?.includes(nextStatus)) {
        assertTransition(order.status, nextStatus);
        order.status = nextStatus;
      }
      await order.save();
    }
  }

  return { order, refund };
}

export { NotFoundError, ForbiddenError };
