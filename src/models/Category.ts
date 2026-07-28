import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { applyNotDeleted, baseSchemaOptions, softDeleteFields, type SoftDelete } from './shared';

export interface ICategory extends SoftDelete {
  restaurantId: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  imageUrl: string | null;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CategoryDocument = HydratedDocument<ICategory>;

const categorySchema = new Schema<ICategory>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 300 },
    imageUrl: { type: String, default: null },
    icon: { type: String, default: 'utensils' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    ...softDeleteFields,
  },
  baseSchemaOptions,
);

categorySchema.index({ restaurantId: 1, slug: 1 }, { unique: true });
categorySchema.index({ restaurantId: 1, sortOrder: 1 });
applyNotDeleted(categorySchema);

export const Category: Model<ICategory> =
  mongoose.models.Category ?? mongoose.model<ICategory>('Category', categorySchema);
