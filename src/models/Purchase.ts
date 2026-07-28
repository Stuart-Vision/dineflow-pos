import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { PURCHASE_PAYMENT_STATUS, PURCHASE_PAYMENT_STATUS_VALUES, type PurchasePaymentStatus } from '@/constants/enums';

import { baseSchemaOptions } from './shared';

/** The supplier invoice/payment record tied to a received purchase order. */
export interface IPurchase {
  restaurantId: Types.ObjectId;
  branchId: Types.ObjectId;
  supplierId: Types.ObjectId;
  purchaseOrderId: Types.ObjectId;
  invoiceNumber: string;
  invoiceDate: Date;
  amountMinor: number;
  amountPaidMinor: number;
  paymentStatus: PurchasePaymentStatus;
  isReturn: boolean;
  attachmentUrl: string | null;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PurchaseDocument = HydratedDocument<IPurchase>;

const purchaseSchema = new Schema<IPurchase>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, required: true },
    amountMinor: { type: Number, required: true, min: 0 },
    amountPaidMinor: { type: Number, default: 0, min: 0 },
    paymentStatus: {
      type: String,
      enum: PURCHASE_PAYMENT_STATUS_VALUES,
      default: PURCHASE_PAYMENT_STATUS.UNPAID,
    },
    isReturn: { type: Boolean, default: false },
    attachmentUrl: { type: String, default: null },
    notes: { type: String, maxlength: 500 },
  },
  baseSchemaOptions,
);

purchaseSchema.index({ supplierId: 1, createdAt: -1 });

export const Purchase: Model<IPurchase> =
  mongoose.models.Purchase ?? mongoose.model<IPurchase>('Purchase', purchaseSchema);
