import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { LOYALTY_TRANSACTION_TYPE_VALUES, type LoyaltyTransactionType } from '@/constants/enums';

import { baseSchemaOptions } from './shared';

export interface ILoyaltyTransaction {
  restaurantId: Types.ObjectId;
  customerId: Types.ObjectId;
  type: LoyaltyTransactionType;
  points: number;
  orderId: Types.ObjectId | null;
  description: string;
  expiresAt: Date | null;
  performedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export type LoyaltyTransactionDocument = HydratedDocument<ILoyaltyTransaction>;

const loyaltyTransactionSchema = new Schema<ILoyaltyTransaction>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    type: { type: String, enum: LOYALTY_TRANSACTION_TYPE_VALUES, required: true },
    points: { type: Number, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    description: { type: String, required: true, maxlength: 300 },
    expiresAt: { type: Date, default: null },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  baseSchemaOptions,
);

loyaltyTransactionSchema.index({ customerId: 1, createdAt: -1 });

export const LoyaltyTransaction: Model<ILoyaltyTransaction> =
  mongoose.models.LoyaltyTransaction ??
  mongoose.model<ILoyaltyTransaction>('LoyaltyTransaction', loyaltyTransactionSchema);
