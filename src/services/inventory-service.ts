import mongoose from 'mongoose';

import {
  INVENTORY_INBOUND_TYPES,
  INVENTORY_TRANSACTION_TYPE,
  NOTIFICATION_SEVERITY,
  NOTIFICATION_TYPE,
} from '@/constants/enums';
import { ConflictError, NotFoundError } from '@/lib/api/errors';
import type { SessionUser } from '@/lib/auth/session';
import { Ingredient, type IngredientDocument } from '@/models/Ingredient';
import { InventoryTransaction } from '@/models/InventoryTransaction';
import { Notification } from '@/models/Notification';
import { Supplier } from '@/models/Supplier';
import type { PhysicalCountInput, StockMovementInput } from '@/validators/operations';

export interface IngredientRow {
  id: string;
  name: string;
  sku: string;
  category: string;
  purchaseUnit: string;
  consumptionUnit: string;
  costPerPurchaseUnitMinor: number;
  currentStockBase: number;
  reorderLevelBase: number;
  reorderQuantityBase: number;
  /** Stock valued at the last known purchase cost. */
  stockValueMinor: number;
  stockState: 'out' | 'low' | 'ok';
  supplierName: string | null;
  expiryTrackingEnabled: boolean;
  isActive: boolean;
}

export function stockStateOf(ingredient: {
  currentStockBase: number;
  reorderLevelBase: number;
}): IngredientRow['stockState'] {
  if (ingredient.currentStockBase <= 0) return 'out';
  if (ingredient.currentStockBase <= ingredient.reorderLevelBase) return 'low';
  return 'ok';
}

export async function listIngredients(branchId: string): Promise<IngredientRow[]> {
  const [ingredients, suppliers] = await Promise.all([
    Ingredient.find({ branchId }).sort({ name: 1 }).lean(),
    Supplier.find({}).select('name').lean(),
  ]);

  const supplierNameById = new Map(suppliers.map((s) => [String(s._id), s.name]));

  return ingredients.map((i) => ({
    id: String(i._id),
    name: i.name,
    sku: i.sku,
    category: i.category,
    purchaseUnit: i.purchaseUnit,
    consumptionUnit: i.consumptionUnit,
    costPerPurchaseUnitMinor: i.costPerPurchaseUnitMinor,
    currentStockBase: i.currentStockBase,
    reorderLevelBase: i.reorderLevelBase,
    reorderQuantityBase: i.reorderQuantityBase,
    // Purchase cost is per purchase unit; the stock figure is in consumption
    // units, so value is approximated against the reorder pack size the
    // supplier actually bills in.
    stockValueMinor: Math.round(
      (i.currentStockBase / Math.max(1, i.reorderQuantityBase || 1)) * i.costPerPurchaseUnitMinor,
    ),
    stockState: stockStateOf(i),
    supplierName: i.primarySupplierId ? (supplierNameById.get(String(i.primarySupplierId)) ?? null) : null,
    expiryTrackingEnabled: i.expiryTrackingEnabled,
    isActive: i.isActive,
  }));
}

export interface MovementRow {
  id: string;
  ingredientName: string;
  type: string;
  quantityBase: number;
  unit: string;
  balanceAfterBase: number;
  wastageReason: string | null;
  notes: string | null;
  performedByName: string | null;
  createdAt: string;
}

export async function listMovements(branchId: string, limit = 100): Promise<MovementRow[]> {
  const transactions = await InventoryTransaction.find({ branchId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate<{ ingredientId: { name: string; consumptionUnit: string } }>('ingredientId', 'name consumptionUnit')
    .populate<{ performedBy: { name: string } }>('performedBy', 'name')
    .lean();

  return transactions.map((t) => ({
    id: String(t._id),
    ingredientName: t.ingredientId?.name ?? 'Unknown ingredient',
    type: t.type,
    quantityBase: t.quantityBase,
    unit: t.ingredientId?.consumptionUnit ?? '',
    balanceAfterBase: t.balanceAfterBase,
    wastageReason: t.wastageReason,
    notes: t.notes,
    performedByName: t.performedBy?.name ?? null,
    createdAt: new Date(t.createdAt).toISOString(),
  }));
}

async function raiseStockNotificationIfNeeded(ingredient: IngredientDocument): Promise<void> {
  if (ingredient.currentStockBase > ingredient.reorderLevelBase) return;

  await Notification.create({
    restaurantId: ingredient.restaurantId,
    branchId: ingredient.branchId,
    userId: null,
    type: ingredient.currentStockBase <= 0 ? NOTIFICATION_TYPE.STOCK_OUT : NOTIFICATION_TYPE.STOCK_LOW,
    severity: ingredient.currentStockBase <= 0 ? NOTIFICATION_SEVERITY.CRITICAL : NOTIFICATION_SEVERITY.WARNING,
    title: ingredient.currentStockBase <= 0 ? `${ingredient.name} is out of stock` : `${ingredient.name} is running low`,
    message: `${ingredient.currentStockBase} ${ingredient.consumptionUnit} remaining (reorder level ${ingredient.reorderLevelBase}).`,
    link: '/inventory',
    relatedEntityType: 'Ingredient',
    relatedEntityId: ingredient._id,
    isRead: false,
    readAt: null,
  });
}

export async function recordStockMovement(
  branchId: string,
  input: StockMovementInput,
  user: SessionUser,
): Promise<IngredientDocument> {
  const ingredient = await Ingredient.findOne({ _id: input.ingredientId, branchId });
  if (!ingredient) throw new NotFoundError('Ingredient');

  const isInbound = (INVENTORY_INBOUND_TYPES as readonly string[]).includes(input.type);

  if (!isInbound && input.quantityBase > ingredient.currentStockBase) {
    throw new ConflictError(
      `Only ${ingredient.currentStockBase} ${ingredient.consumptionUnit} of ${ingredient.name} is on hand — cannot remove ${input.quantityBase}.`,
    );
  }

  ingredient.currentStockBase = isInbound
    ? ingredient.currentStockBase + input.quantityBase
    : Math.max(0, ingredient.currentStockBase - input.quantityBase);

  if (isInbound && input.unitCostMinor > 0) {
    // Keep valuation current with the most recent price actually paid.
    ingredient.costPerPurchaseUnitMinor = input.unitCostMinor;
  }
  await ingredient.save();

  await InventoryTransaction.create({
    restaurantId: ingredient.restaurantId,
    branchId: ingredient.branchId,
    ingredientId: ingredient._id,
    type: input.type,
    quantityBase: input.quantityBase,
    unitCostMinor: input.unitCostMinor,
    balanceAfterBase: ingredient.currentStockBase,
    referenceType: 'adjustment',
    referenceId: null,
    batchNumber: input.batchNumber ?? null,
    expiryDate: input.expiryDate ?? null,
    wastageReason: input.type === INVENTORY_TRANSACTION_TYPE.WASTAGE ? (input.wastageReason ?? 'other') : null,
    notes: input.notes ?? null,
    performedBy: new mongoose.Types.ObjectId(user.id),
  });

  await raiseStockNotificationIfNeeded(ingredient);
  return ingredient;
}

export interface PhysicalCountResult {
  ingredientName: string;
  expectedBase: number;
  countedBase: number;
  varianceBase: number;
}

/**
 * Reconciles book stock against a physical count. The variance is written as
 * a PHYSICAL_COUNT transaction so the movement history explains the jump
 * rather than the balance silently changing.
 */
export async function recordPhysicalCount(
  branchId: string,
  input: PhysicalCountInput,
  user: SessionUser,
): Promise<PhysicalCountResult> {
  const ingredient = await Ingredient.findOne({ _id: input.ingredientId, branchId });
  if (!ingredient) throw new NotFoundError('Ingredient');

  const expectedBase = ingredient.currentStockBase;
  const varianceBase = input.countedQuantityBase - expectedBase;

  ingredient.currentStockBase = input.countedQuantityBase;
  await ingredient.save();

  await InventoryTransaction.create({
    restaurantId: ingredient.restaurantId,
    branchId: ingredient.branchId,
    ingredientId: ingredient._id,
    type: INVENTORY_TRANSACTION_TYPE.PHYSICAL_COUNT,
    quantityBase: Math.abs(varianceBase),
    unitCostMinor: ingredient.costPerPurchaseUnitMinor,
    balanceAfterBase: ingredient.currentStockBase,
    referenceType: 'physical_count',
    referenceId: null,
    notes:
      input.notes ??
      `Counted ${input.countedQuantityBase} vs expected ${expectedBase} (variance ${varianceBase >= 0 ? '+' : ''}${varianceBase}).`,
    performedBy: new mongoose.Types.ObjectId(user.id),
  });

  await raiseStockNotificationIfNeeded(ingredient);

  return { ingredientName: ingredient.name, expectedBase, countedBase: input.countedQuantityBase, varianceBase };
}

export interface InventorySummary {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValueMinor: number;
  wastageThisMonthMinor: number;
}

/**
 * Derives the summary tiles from rows the caller already has, so a page that
 * renders both the table and the tiles pays for the ingredient/supplier join
 * once rather than twice.
 */
export async function getInventorySummary(branchId: string, rows: IngredientRow[]): Promise<InventorySummary> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [wastage] = await InventoryTransaction.aggregate<{ total: number }>([
    {
      $match: {
        branchId: new mongoose.Types.ObjectId(branchId),
        type: INVENTORY_TRANSACTION_TYPE.WASTAGE,
        createdAt: { $gte: monthStart },
      },
    },
    { $group: { _id: null, total: { $sum: { $multiply: ['$quantityBase', '$unitCostMinor'] } } } },
  ]);

  return {
    totalItems: rows.length,
    lowStockCount: rows.filter((r) => r.stockState === 'low').length,
    outOfStockCount: rows.filter((r) => r.stockState === 'out').length,
    totalValueMinor: rows.reduce((sum, r) => sum + r.stockValueMinor, 0),
    // Wastage cost is per-consumption-unit here, scaled down from pack cost.
    wastageThisMonthMinor: Math.round((wastage?.total ?? 0) / 1000),
  };
}
