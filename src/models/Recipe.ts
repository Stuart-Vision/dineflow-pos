import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { UNIT_VALUES, type Unit } from '@/constants/enums';

import { baseSchemaOptions } from './shared';

export interface IRecipeIngredient {
  /**
   * The ingredient's SKU, not its `Ingredient` document id: a recipe is
   * defined once per restaurant, but `Ingredient` stock records are
   * per-branch, so the same recipe is resolved against a different
   * `Ingredient` document (same SKU) at each branch when an order is
   * fulfilled there.
   */
  ingredientSku: string;
  quantityBase: number;
  unit: Unit;
}

export interface IRecipe {
  restaurantId: Types.ObjectId;
  /** The menu item, or a specific portion-size variant of it. */
  menuItemId: Types.ObjectId;
  portionName: string | null;
  yieldQuantity: number;
  ingredients: IRecipeIngredient[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RecipeDocument = HydratedDocument<IRecipe>;

const recipeIngredientSchema = new Schema<IRecipeIngredient>(
  {
    ingredientSku: { type: String, required: true, uppercase: true, trim: true },
    quantityBase: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: UNIT_VALUES, required: true },
  },
  { _id: false },
);

const recipeSchema = new Schema<IRecipe>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    portionName: { type: String, default: null },
    yieldQuantity: { type: Number, default: 1, min: 1 },
    ingredients: { type: [recipeIngredientSchema], default: [] },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  baseSchemaOptions,
);

recipeSchema.index({ menuItemId: 1, portionName: 1 }, { unique: true });

export const Recipe: Model<IRecipe> =
  mongoose.models.Recipe ?? mongoose.model<IRecipe>('Recipe', recipeSchema);
