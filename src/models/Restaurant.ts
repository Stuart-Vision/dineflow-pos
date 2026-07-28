import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { DEFAULT_CURRENCY } from '@/lib/money';

import { applyNotDeleted, baseSchemaOptions, softDeleteFields, type SoftDelete } from './shared';

export interface IRestaurant extends SoftDelete {
  name: string;
  slug: string;
  legalName?: string;
  logoUrl: string | null;
  ownerUserId: Types.ObjectId;
  defaultCurrency: string;
  timezone: string;
  dateFormat: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type RestaurantDocument = HydratedDocument<IRestaurant>;

const restaurantSchema = new Schema<IRestaurant>(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    legalName: { type: String, trim: true },
    logoUrl: { type: String, default: null },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    defaultCurrency: { type: String, default: DEFAULT_CURRENCY },
    timezone: { type: String, default: 'UTC' },
    dateFormat: { type: String, default: 'dd MMM yyyy' },
    isActive: { type: Boolean, default: true },
    ...softDeleteFields,
  },
  baseSchemaOptions,
);

applyNotDeleted(restaurantSchema);

export const Restaurant: Model<IRestaurant> =
  mongoose.models.Restaurant ?? mongoose.model<IRestaurant>('Restaurant', restaurantSchema);
