import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { MODIFIER_SELECTION_VALUES, type ModifierSelection } from '@/constants/enums';

import { applyNotDeleted, baseSchemaOptions, softDeleteFields, type SoftDelete } from './shared';

export interface IModifierOption {
  _id: Types.ObjectId;
  name: string;
  priceMinor: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface IModifierGroup extends SoftDelete {
  restaurantId: Types.ObjectId;
  name: string;
  selectionType: ModifierSelection;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  options: IModifierOption[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ModifierGroupDocument = HydratedDocument<IModifierGroup>;

const modifierOptionSchema = new Schema<IModifierOption>({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  priceMinor: { type: Number, required: true, default: 0 },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
});

const modifierGroupSchema = new Schema<IModifierGroup>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    selectionType: { type: String, enum: MODIFIER_SELECTION_VALUES, default: 'single' },
    minSelect: { type: Number, default: 0 },
    maxSelect: { type: Number, default: 1 },
    isRequired: { type: Boolean, default: false },
    options: { type: [modifierOptionSchema], default: [] },
    isActive: { type: Boolean, default: true },
    ...softDeleteFields,
  },
  baseSchemaOptions,
);

applyNotDeleted(modifierGroupSchema);

export const ModifierGroup: Model<IModifierGroup> =
  mongoose.models.ModifierGroup ??
  mongoose.model<IModifierGroup>('ModifierGroup', modifierGroupSchema);
