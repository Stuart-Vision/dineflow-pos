import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import {
  CUSTOMER_SEGMENT,
  CUSTOMER_SEGMENT_VALUES,
  MEMBERSHIP_TIER,
  MEMBERSHIP_TIER_VALUES,
  type CustomerSegment,
  type MembershipTier,
} from '@/constants/enums';

import { applyNotDeleted, baseSchemaOptions, softDeleteFields, type SoftDelete } from './shared';

export interface ICustomer extends SoftDelete {
  restaurantId: Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  birthday: Date | null;
  notes: string | null;
  tags: string[];
  segment: CustomerSegment;
  membershipTier: MembershipTier;
  loyaltyPointsBalance: number;
  lifetimePoints: number;
  storeCreditMinor: number;
  totalSpentMinor: number;
  totalOrders: number;
  lastVisitAt: Date | null;
  favoriteMenuItemIds: Types.ObjectId[];
  isBlacklisted: boolean;
  blacklistReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CustomerDocument = HydratedDocument<ICustomer>;

const customerSchema = new Schema<ICustomer>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    birthday: { type: Date, default: null },
    notes: { type: String, default: null, maxlength: 500 },
    tags: { type: [String], default: [] },
    segment: { type: String, enum: CUSTOMER_SEGMENT_VALUES, default: CUSTOMER_SEGMENT.NEW },
    membershipTier: { type: String, enum: MEMBERSHIP_TIER_VALUES, default: MEMBERSHIP_TIER.BRONZE },
    loyaltyPointsBalance: { type: Number, default: 0 },
    lifetimePoints: { type: Number, default: 0 },
    storeCreditMinor: { type: Number, default: 0 },
    totalSpentMinor: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    lastVisitAt: { type: Date, default: null },
    favoriteMenuItemIds: [{ type: Schema.Types.ObjectId, ref: 'MenuItem' }],
    isBlacklisted: { type: Boolean, default: false },
    blacklistReason: { type: String, default: null },
    ...softDeleteFields,
  },
  baseSchemaOptions,
);

customerSchema.index({ restaurantId: 1, phone: 1 }, { unique: true });
customerSchema.index({ restaurantId: 1, segment: 1 });
customerSchema.index({ restaurantId: 1, name: 'text', phone: 'text', email: 'text' });
applyNotDeleted(customerSchema);

export const Customer: Model<ICustomer> =
  mongoose.models.Customer ?? mongoose.model<ICustomer>('Customer', customerSchema);
