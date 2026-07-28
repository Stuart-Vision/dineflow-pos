import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { ALLERGENS, KITCHEN_STATION_VALUES, SPICY_LEVEL, type Allergen, type KitchenStation } from '@/constants/enums';

import { applyNotDeleted, baseSchemaOptions, softDeleteFields, type SoftDelete } from './shared';

export interface IPortionSize {
  name: string;
  priceMinor: number;
  costPriceMinor: number;
  isDefault: boolean;
}

export interface IComboComponent {
  menuItemId: Types.ObjectId;
  quantity: number;
}

export interface IAvailabilityWindow {
  daysOfWeek: number[];
  startTime: string | null;
  endTime: string | null;
}

export interface IMenuItem extends SoftDelete {
  restaurantId: Types.ObjectId;
  categoryId: Types.ObjectId;
  name: string;
  slug: string;
  sku: string;
  description: string;
  imageUrl: string | null;
  costPriceMinor: number;
  priceMinor: number;
  taxRatePercentOverride: number | null;
  kitchenStation: KitchenStation;
  preparationTimeMinutes: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  spicyLevel: (typeof SPICY_LEVEL)[keyof typeof SPICY_LEVEL];
  allergens: Allergen[];
  modifierGroupIds: Types.ObjectId[];
  portionSizes: IPortionSize[];
  isCombo: boolean;
  comboItems: IComboComponent[];
  availability: IAvailabilityWindow;
  stockTrackingEnabled: boolean;
  isActive: boolean;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type MenuItemDocument = HydratedDocument<IMenuItem>;

const portionSizeSchema = new Schema<IPortionSize>(
  {
    name: { type: String, required: true },
    priceMinor: { type: Number, required: true },
    costPriceMinor: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false },
);

const comboComponentSchema = new Schema<IComboComponent>(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false },
);

const availabilitySchema = new Schema<IAvailabilityWindow>(
  {
    daysOfWeek: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] },
    startTime: { type: String, default: null },
    endTime: { type: String, default: null },
  },
  { _id: false },
);

const menuItemSchema = new Schema<IMenuItem>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    imageUrl: { type: String, default: null },
    costPriceMinor: { type: Number, required: true, min: 0, default: 0 },
    priceMinor: { type: Number, required: true, min: 0 },
    taxRatePercentOverride: { type: Number, default: null },
    kitchenStation: { type: String, enum: KITCHEN_STATION_VALUES, required: true },
    preparationTimeMinutes: { type: Number, default: 10, min: 0 },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isVegetarian: { type: Boolean, default: false },
    isVegan: { type: Boolean, default: false },
    spicyLevel: { type: Number, enum: Object.values(SPICY_LEVEL), default: SPICY_LEVEL.NONE },
    allergens: { type: [String], enum: ALLERGENS, default: [] },
    modifierGroupIds: [{ type: Schema.Types.ObjectId, ref: 'ModifierGroup' }],
    portionSizes: { type: [portionSizeSchema], default: [] },
    isCombo: { type: Boolean, default: false },
    comboItems: { type: [comboComponentSchema], default: [] },
    availability: { type: availabilitySchema, default: () => ({}) },
    stockTrackingEnabled: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    ...softDeleteFields,
  },
  baseSchemaOptions,
);

menuItemSchema.index({ restaurantId: 1, slug: 1 }, { unique: true });
menuItemSchema.index({ restaurantId: 1, categoryId: 1, isActive: 1 });
menuItemSchema.index({ restaurantId: 1, name: 'text', description: 'text' });

applyNotDeleted(menuItemSchema);

export const MenuItem: Model<IMenuItem> =
  mongoose.models.MenuItem ?? mongoose.model<IMenuItem>('MenuItem', menuItemSchema);
