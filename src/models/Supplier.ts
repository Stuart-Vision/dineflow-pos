import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { applyNotDeleted, baseSchemaOptions, softDeleteFields, type SoftDelete } from './shared';

export interface ISupplier extends SoftDelete {
  restaurantId: Types.ObjectId;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  categories: string[];
  paymentTermsDays: number;
  outstandingBalanceMinor: number;
  rating: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type SupplierDocument = HydratedDocument<ISupplier>;

const supplierSchema = new Schema<ISupplier>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    contactPerson: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    categories: { type: [String], default: [] },
    paymentTermsDays: { type: Number, default: 15 },
    outstandingBalanceMinor: { type: Number, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 4 },
    notes: { type: String, maxlength: 500 },
    isActive: { type: Boolean, default: true },
    ...softDeleteFields,
  },
  baseSchemaOptions,
);

supplierSchema.index({ restaurantId: 1, name: 1 });
applyNotDeleted(supplierSchema);

export const Supplier: Model<ISupplier> =
  mongoose.models.Supplier ?? mongoose.model<ISupplier>('Supplier', supplierSchema);
