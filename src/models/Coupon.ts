import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { COUPON_TYPE_VALUES, type CouponType } from '@/constants/enums';

import { applyNotDeleted, baseSchemaOptions, softDeleteFields, type SoftDelete } from './shared';

export interface ICoupon extends SoftDelete {
  restaurantId: Types.ObjectId;
  code: string;
  description: string;
  type: CouponType;
  value: number;
  freeMenuItemId: Types.ObjectId | null;
  minOrderAmountMinor: number;
  maxDiscountMinor: number | null;
  usageLimit: number | null;
  usageCount: number;
  perCustomerLimit: number | null;
  startsAt: Date;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CouponDocument = HydratedDocument<ICoupon>;

const couponSchema = new Schema<ICoupon>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, required: true, maxlength: 300 },
    type: { type: String, enum: COUPON_TYPE_VALUES, required: true },
    value: { type: Number, required: true, min: 0 },
    freeMenuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', default: null },
    minOrderAmountMinor: { type: Number, default: 0 },
    maxDiscountMinor: { type: Number, default: null },
    usageLimit: { type: Number, default: null },
    usageCount: { type: Number, default: 0 },
    perCustomerLimit: { type: Number, default: 1 },
    startsAt: { type: Date, default: () => new Date() },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    ...softDeleteFields,
  },
  baseSchemaOptions,
);

couponSchema.index({ restaurantId: 1, code: 1 }, { unique: true });
applyNotDeleted(couponSchema);

export const Coupon: Model<ICoupon> =
  mongoose.models.Coupon ?? mongoose.model<ICoupon>('Coupon', couponSchema);
