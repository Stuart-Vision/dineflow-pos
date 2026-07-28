import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { UNIT_VALUES, type Unit } from '@/constants/enums';

import { applyNotDeleted, baseSchemaOptions, softDeleteFields, type SoftDelete } from './shared';

export interface IIngredient extends SoftDelete {
  restaurantId: Types.ObjectId;
  branchId: Types.ObjectId;
  name: string;
  sku: string;
  category: string;
  purchaseUnit: Unit;
  consumptionUnit: Unit;
  /** Cost of one purchase unit, in minor currency units, at last delivery. */
  costPerPurchaseUnitMinor: number;
  /** Current stock, expressed in the ingredient's base consumption unit. */
  currentStockBase: number;
  reorderLevelBase: number;
  reorderQuantityBase: number;
  expiryTrackingEnabled: boolean;
  primarySupplierId: Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type IngredientDocument = HydratedDocument<IIngredient>;

const ingredientSchema = new Schema<IIngredient>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    sku: { type: String, required: true, trim: true, uppercase: true },
    category: { type: String, default: 'general', trim: true },
    purchaseUnit: { type: String, enum: UNIT_VALUES, required: true },
    consumptionUnit: { type: String, enum: UNIT_VALUES, required: true },
    costPerPurchaseUnitMinor: { type: Number, required: true, min: 0, default: 0 },
    currentStockBase: { type: Number, required: true, default: 0 },
    reorderLevelBase: { type: Number, required: true, default: 0 },
    reorderQuantityBase: { type: Number, required: true, default: 0 },
    expiryTrackingEnabled: { type: Boolean, default: false },
    primarySupplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', default: null },
    isActive: { type: Boolean, default: true },
    ...softDeleteFields,
  },
  baseSchemaOptions,
);

ingredientSchema.index({ branchId: 1, sku: 1 }, { unique: true });
ingredientSchema.index({ branchId: 1, currentStockBase: 1, reorderLevelBase: 1 });
applyNotDeleted(ingredientSchema);

export const Ingredient: Model<IIngredient> =
  mongoose.models.Ingredient ?? mongoose.model<IIngredient>('Ingredient', ingredientSchema);
