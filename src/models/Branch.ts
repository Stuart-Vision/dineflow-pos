import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { DEFAULT_CURRENCY } from '@/lib/money';

import { applyNotDeleted, baseSchemaOptions, softDeleteFields, type SoftDelete } from './shared';

export interface IBranchAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
}

export interface IBranchHours {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  open: string;
  close: string;
  isClosed: boolean;
}

export interface IBranch extends SoftDelete {
  restaurantId: Types.ObjectId;
  name: string;
  code: string;
  address: IBranchAddress;
  phone: string;
  email?: string;
  currency: string;
  timezone: string;
  taxRegistrationNumber?: string;
  openingHours: IBranchHours[];
  isMain: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type BranchDocument = HydratedDocument<IBranch>;

const addressSchema = new Schema<IBranchAddress>(
  {
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    country: { type: String, required: true, trim: true },
    postalCode: { type: String, trim: true },
  },
  { _id: false },
);

const hoursSchema = new Schema<IBranchHours>(
  {
    day: { type: Number, min: 0, max: 6, required: true },
    open: { type: String, required: true },
    close: { type: String, required: true },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false },
);

const branchSchema = new Schema<IBranch>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 12 },
    address: { type: addressSchema, required: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    currency: { type: String, default: DEFAULT_CURRENCY },
    timezone: { type: String, default: 'UTC' },
    taxRegistrationNumber: { type: String, trim: true },
    openingHours: { type: [hoursSchema], default: [] },
    isMain: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    ...softDeleteFields,
  },
  baseSchemaOptions,
);

branchSchema.index({ restaurantId: 1, code: 1 }, { unique: true });
applyNotDeleted(branchSchema);

export const Branch: Model<IBranch> =
  mongoose.models.Branch ?? mongoose.model<IBranch>('Branch', branchSchema);
