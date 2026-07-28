import { PERMISSIONS } from '@/constants/permissions';
import { ValidationError } from '@/lib/api/errors';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { Ingredient } from '@/models/Ingredient';
import { getInventorySummary, listIngredients, listMovements } from '@/services/inventory-service';
import { upsertIngredientSchema, type UpsertIngredientInput } from '@/validators/operations';

export const GET = defineRoute({ permissions: [PERMISSIONS.INVENTORY_VIEW] }, async ({ branchId }) => {
  if (!branchId) throw new ValidationError('Select an active branch to view inventory.');

  const [ingredients, movements] = await Promise.all([listIngredients(branchId), listMovements(branchId)]);
  const summary = await getInventorySummary(branchId, ingredients);

  return ok({ ingredients, movements, summary });
});

export const POST = defineRoute<UpsertIngredientInput>(
  { permissions: [PERMISSIONS.INVENTORY_MANAGE], bodySchema: upsertIngredientSchema },
  async ({ body, branchId, user }) => {
    if (!branchId) throw new ValidationError('Select an active branch first.');
    const ingredient = await Ingredient.create({
      restaurantId: user.restaurantId,
      branchId,
      name: body.name,
      sku: body.sku,
      category: body.category,
      purchaseUnit: body.purchaseUnit,
      consumptionUnit: body.consumptionUnit,
      costPerPurchaseUnitMinor: body.costPerPurchaseUnitMinor,
      currentStockBase: 0,
      reorderLevelBase: body.reorderLevelBase,
      reorderQuantityBase: body.reorderQuantityBase,
      expiryTrackingEnabled: body.expiryTrackingEnabled,
      primarySupplierId: body.primarySupplierId || null,
      isActive: body.isActive,
    });
    return ok(ingredient, undefined, { status: 201 });
  },
);
