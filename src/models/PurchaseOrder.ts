import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { PURCHASE_ORDER_STATUS, PURCHASE_ORDER_STATUS_VALUES, type PurchaseOrderStatus } from '@/constants/enums';
import { UNIT_VALUES, type Unit } from '@/constants/enums';

import { baseSchemaOptions } from './shared';

export interface IPurchaseOrderItem {
  ingredientId: Types.ObjectId;
  quantityOrdered: number;
  quantityReceived: number;
  unit: Unit;
  unitCostMinor: number;
}

export interface IPurchaseOrder {
  restaurantId: Types.ObjectId;
  branchId: Types.ObjectId;
  supplierId: Types.ObjectId;
  poNumber: string;
  status: PurchaseOrderStatus;
  items: IPurchaseOrderItem[];
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
  requestedBy: Types.ObjectId;
  approvedBy: Types.ObjectId | null;
  approvedAt: Date | null;
  expectedDeliveryDate: Date | null;
  receivedAt: Date | null;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PurchaseOrderDocument = HydratedDocument<IPurchaseOrder>;

const purchaseOrderItemSchema = new Schema<IPurchaseOrderItem>(
  {
    ingredientId: { type: Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    quantityOrdered: { type: Number, required: true, min: 0 },
    quantityReceived: { type: Number, default: 0, min: 0 },
    unit: { type: String, enum: UNIT_VALUES, required: true },
    unitCostMinor: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const purchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    poNumber: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: PURCHASE_ORDER_STATUS_VALUES,
      default: PURCHASE_ORDER_STATUS.DRAFT,
      index: true,
    },
    items: { type: [purchaseOrderItemSchema], default: [] },
    subtotalMinor: { type: Number, default: 0 },
    taxMinor: { type: Number, default: 0 },
    totalMinor: { type: Number, default: 0 },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    expectedDeliveryDate: { type: Date, default: null },
    receivedAt: { type: Date, default: null },
    notes: { type: String, maxlength: 500 },
  },
  baseSchemaOptions,
);

purchaseOrderSchema.index({ branchId: 1, createdAt: -1 });

export const PurchaseOrder: Model<IPurchaseOrder> =
  mongoose.models.PurchaseOrder ??
  mongoose.model<IPurchaseOrder>('PurchaseOrder', purchaseOrderSchema);
