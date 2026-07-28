import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { REFUND_STATUS, REFUND_STATUS_VALUES, type RefundStatus } from '@/constants/enums';

import { baseSchemaOptions } from './shared';

export interface IRefund {
  restaurantId: Types.ObjectId;
  branchId: Types.ObjectId;
  orderId: Types.ObjectId;
  paymentId: Types.ObjectId;
  amountMinor: number;
  reason: string;
  status: RefundStatus;
  requestedBy: Types.ObjectId;
  approvedBy: Types.ObjectId | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type RefundDocument = HydratedDocument<IRefund>;

const refundSchema = new Schema<IRefund>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    amountMinor: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, maxlength: 300 },
    status: {
      type: String,
      enum: REFUND_STATUS_VALUES,
      default: REFUND_STATUS.PENDING_APPROVAL,
      index: true,
    },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    processedAt: { type: Date, default: null },
  },
  baseSchemaOptions,
);

refundSchema.index({ branchId: 1, createdAt: -1 });

export const Refund: Model<IRefund> =
  mongoose.models.Refund ?? mongoose.model<IRefund>('Refund', refundSchema);
