import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import {
  DELIVERY_STATUS_VALUES,
  DISCOUNT_TYPE_VALUES,
  ORDER_ITEM_STATUS,
  ORDER_ITEM_STATUS_VALUES,
  ORDER_PRIORITY,
  ORDER_PRIORITY_VALUES,
  ORDER_STATUS,
  ORDER_STATUS_VALUES,
  ORDER_TYPE_VALUES,
  type DeliveryStatus,
  type DiscountType,
  type OrderItemStatus,
  type OrderPriority,
  type OrderStatus,
  type OrderType,
} from '@/constants/enums';

import { baseSchemaOptions } from './shared';

export interface IOrderItemModifier {
  name: string;
  priceMinor: number;
  quantity: number;
}

export interface IOrderItemDiscount {
  type: DiscountType;
  value: number;
  reason?: string;
}

export interface IOrderItem {
  _id: Types.ObjectId;
  menuItemId: Types.ObjectId;
  name: string;
  portionName: string | null;
  sku: string;
  quantity: number;
  unitPriceMinor: number;
  modifiers: IOrderItemModifier[];
  notes: string | null;
  discount: IOrderItemDiscount | null;
  taxRatePercent: number;
  kitchenStation: string;
  status: OrderItemStatus;
  cancelReason: string | null;
  sentToKitchenAt: Date | null;
  readyAt: Date | null;
  servedAt: Date | null;
}

export interface IOrderDiscount {
  type: DiscountType;
  value: number;
  reason?: string;
  couponCode?: string;
}

export interface IDeliveryDetails {
  address: string;
  phone: string;
  instructions?: string;
  feeMinor: number;
  driverId: Types.ObjectId | null;
  estimatedDeliveryAt: Date | null;
  status: DeliveryStatus;
}

export interface IOrder {
  restaurantId: Types.ObjectId;
  branchId: Types.ObjectId;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  priority: OrderPriority;
  tableId: Types.ObjectId | null;
  customerId: Types.ObjectId | null;
  waiterId: Types.ObjectId | null;
  cashierId: Types.ObjectId | null;
  items: IOrderItem[];

  orderDiscount: IOrderDiscount | null;
  serviceChargePercent: number;
  taxMode: 'exclusive' | 'inclusive';

  subtotalMinor: number;
  discountTotalMinor: number;
  serviceChargeMinor: number;
  taxMinor: number;
  deliveryFeeMinor: number;
  tipMinor: number;
  roundingMinor: number;
  grandTotalMinor: number;
  paidMinor: number;
  refundedMinor: number;

  delivery: IDeliveryDetails | null;

  notes: string | null;
  holdReason: string | null;
  cancelReason: string | null;
  voidReason: string | null;

  submittedAt: Date | null;
  kitchenAcceptedAt: Date | null;
  preparingAt: Date | null;
  readyAt: Date | null;
  servedAt: Date | null;
  paidAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export type OrderDocument = HydratedDocument<IOrder>;

const modifierSchema = new Schema<IOrderItemModifier>(
  {
    name: { type: String, required: true },
    priceMinor: { type: Number, required: true, default: 0 },
    quantity: { type: Number, required: true, default: 1 },
  },
  { _id: false },
);

const itemDiscountSchema = new Schema<IOrderItemDiscount>(
  {
    type: { type: String, enum: DISCOUNT_TYPE_VALUES, required: true },
    value: { type: Number, required: true },
    reason: { type: String },
  },
  { _id: false },
);

const orderItemSchema = new Schema<IOrderItem>({
  menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  portionName: { type: String, default: null },
  sku: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  unitPriceMinor: { type: Number, required: true },
  modifiers: { type: [modifierSchema], default: [] },
  notes: { type: String, default: null, maxlength: 300 },
  discount: { type: itemDiscountSchema, default: null },
  taxRatePercent: { type: Number, default: 0 },
  kitchenStation: { type: String, default: 'expo' },
  status: { type: String, enum: ORDER_ITEM_STATUS_VALUES, default: ORDER_ITEM_STATUS.PENDING },
  cancelReason: { type: String, default: null },
  sentToKitchenAt: { type: Date, default: null },
  readyAt: { type: Date, default: null },
  servedAt: { type: Date, default: null },
});

const orderDiscountSchema = new Schema<IOrderDiscount>(
  {
    type: { type: String, enum: DISCOUNT_TYPE_VALUES, required: true },
    value: { type: Number, required: true },
    reason: { type: String },
    couponCode: { type: String },
  },
  { _id: false },
);

const deliveryDetailsSchema = new Schema<IDeliveryDetails>(
  {
    address: { type: String, required: true },
    phone: { type: String, required: true },
    instructions: { type: String },
    feeMinor: { type: Number, default: 0 },
    driverId: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    estimatedDeliveryAt: { type: Date, default: null },
    status: { type: String, enum: DELIVERY_STATUS_VALUES, default: 'pending' },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    orderNumber: { type: String, required: true, unique: true },
    type: { type: String, enum: ORDER_TYPE_VALUES, required: true },
    status: { type: String, enum: ORDER_STATUS_VALUES, default: ORDER_STATUS.DRAFT, index: true },
    priority: { type: String, enum: ORDER_PRIORITY_VALUES, default: ORDER_PRIORITY.NORMAL },
    tableId: { type: Schema.Types.ObjectId, ref: 'Table', default: null },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', default: null, index: true },
    waiterId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    cashierId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    items: { type: [orderItemSchema], default: [] },

    orderDiscount: { type: orderDiscountSchema, default: null },
    serviceChargePercent: { type: Number, default: 0 },
    taxMode: { type: String, enum: ['exclusive', 'inclusive'], default: 'exclusive' },

    subtotalMinor: { type: Number, default: 0 },
    discountTotalMinor: { type: Number, default: 0 },
    serviceChargeMinor: { type: Number, default: 0 },
    taxMinor: { type: Number, default: 0 },
    deliveryFeeMinor: { type: Number, default: 0 },
    tipMinor: { type: Number, default: 0 },
    roundingMinor: { type: Number, default: 0 },
    grandTotalMinor: { type: Number, default: 0 },
    paidMinor: { type: Number, default: 0 },
    refundedMinor: { type: Number, default: 0 },

    delivery: { type: deliveryDetailsSchema, default: null },

    notes: { type: String, default: null, maxlength: 500 },
    holdReason: { type: String, default: null },
    cancelReason: { type: String, default: null },
    voidReason: { type: String, default: null },

    submittedAt: { type: Date, default: null },
    kitchenAcceptedAt: { type: Date, default: null },
    preparingAt: { type: Date, default: null },
    readyAt: { type: Date, default: null },
    servedAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  baseSchemaOptions,
);

orderSchema.index({ branchId: 1, status: 1, createdAt: -1 });
orderSchema.index({ branchId: 1, type: 1, createdAt: -1 });
orderSchema.index({ branchId: 1, tableId: 1 });
orderSchema.index({ createdAt: -1 });

export const Order: Model<IOrder> = mongoose.models.Order ?? mongoose.model<IOrder>('Order', orderSchema);
