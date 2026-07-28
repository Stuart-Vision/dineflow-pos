import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { PAYMENT_METHOD_VALUES, PAYMENT_STATUS, PAYMENT_STATUS_VALUES, type PaymentMethod, type PaymentStatus } from '@/constants/enums';

import { baseSchemaOptions } from './shared';

export interface IPayment {
  restaurantId: Types.ObjectId;
  branchId: Types.ObjectId;
  orderId: Types.ObjectId;
  method: PaymentMethod;
  amountMinor: number;
  tenderedMinor: number;
  changeMinor: number;
  status: PaymentStatus;
  gateway: 'demo' | 'stripe';
  transactionReference: string | null;
  cardLast4: string | null;
  walletProvider: string | null;
  notes: string | null;
  processedBy: Types.ObjectId;
  voidedBy: Types.ObjectId | null;
  voidedAt: Date | null;
  voidReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentDocument = HydratedDocument<IPayment>;

const paymentSchema = new Schema<IPayment>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    method: { type: String, enum: PAYMENT_METHOD_VALUES, required: true },
    amountMinor: { type: Number, required: true, min: 0 },
    tenderedMinor: { type: Number, default: 0 },
    changeMinor: { type: Number, default: 0 },
    status: { type: String, enum: PAYMENT_STATUS_VALUES, default: PAYMENT_STATUS.COMPLETED },
    gateway: { type: String, enum: ['demo', 'stripe'], default: 'demo' },
    transactionReference: { type: String, default: null },
    cardLast4: { type: String, default: null },
    walletProvider: { type: String, default: null },
    notes: { type: String, default: null, maxlength: 300 },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    voidedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    voidedAt: { type: Date, default: null },
    voidReason: { type: String, default: null },
  },
  baseSchemaOptions,
);

paymentSchema.index({ branchId: 1, createdAt: -1 });
paymentSchema.index({ branchId: 1, method: 1, createdAt: -1 });

export const Payment: Model<IPayment> =
  mongoose.models.Payment ?? mongoose.model<IPayment>('Payment', paymentSchema);
