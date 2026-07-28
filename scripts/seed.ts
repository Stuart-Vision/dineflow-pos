/**
 * Full demo-data seed for DineFlow POS.
 *
 * Usage:
 *   npm run seed          seed into whatever the DB already has
 *   npm run seed:reset    drop the database first, then seed
 *
 * Run with `tsx`, not Next.js — see loadEnvFile() below for why env vars
 * are read by hand instead of relying on Next's dev-time env loading.
 */
import fs from 'node:fs';
import path from 'node:path';

import mongoose, { type Types } from 'mongoose';

function loadEnvFile(): void {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const raw = trimmed.slice(eq + 1).trim();
    let value: string;

    if (raw.startsWith('"') || raw.startsWith("'")) {
      const quote = raw[0]!;
      const closing = raw.indexOf(quote, 1);
      value = closing === -1 ? raw.slice(1) : raw.slice(1, closing);
    } else {
      // Strip a trailing `# comment` outside of quotes.
      const hashIndex = raw.indexOf('#');
      value = (hashIndex === -1 ? raw : raw.slice(0, hashIndex)).trim();
    }

    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile();

import {
  ATTENDANCE_STATUS,
  CASH_MOVEMENT_TYPE,
  DISCOUNT_TYPE,
  EXPENSE_STATUS,
  INVENTORY_TRANSACTION_TYPE,
  LOYALTY_TRANSACTION_TYPE,
  NOTIFICATION_SEVERITY,
  NOTIFICATION_TYPE,
  ORDER_ITEM_STATUS,
  ORDER_STATUS,
  ORDER_TYPE,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  PURCHASE_ORDER_STATUS,
  PURCHASE_PAYMENT_STATUS,
  REFUND_STATUS,
  REGISTER_STATUS,
  RESERVATION_STATUS,
  SPICY_LEVEL,
  type OrderStatus,
  type OrderType,
  type PaymentMethod,
} from '../src/constants/enums';
import { DEMO_ACCOUNTS } from '../src/constants/demo-accounts';
import { ROLES } from '../src/constants/roles';
import { hashPassword } from '../src/lib/auth/password';
import { connectToDatabase, disconnectFromDatabase } from '../src/lib/db/connection';
import { calculateOrderTotals, type Discount, type PricingLineInput } from '../src/lib/pricing/order-totals';

import { AuditLog } from '../src/models/AuditLog';
import { Attendance } from '../src/models/Attendance';
import { Branch, type BranchDocument } from '../src/models/Branch';
import { CashRegister } from '../src/models/CashRegister';
import { Category } from '../src/models/Category';
import { Coupon } from '../src/models/Coupon';
import { Customer, type CustomerDocument } from '../src/models/Customer';
import { Employee } from '../src/models/Employee';
import { Expense, EXPENSE_CATEGORIES } from '../src/models/Expense';
import { Ingredient, type IngredientDocument } from '../src/models/Ingredient';
import { InventoryTransaction } from '../src/models/InventoryTransaction';
import { LoyaltyTransaction } from '../src/models/LoyaltyTransaction';
import { MenuItem, type IMenuItem, type MenuItemDocument } from '../src/models/MenuItem';
import { ModifierGroup, type ModifierGroupDocument } from '../src/models/ModifierGroup';
import { Notification } from '../src/models/Notification';
import { Order, type IOrderItem } from '../src/models/Order';
import { Payment } from '../src/models/Payment';
import { Purchase } from '../src/models/Purchase';
import { PurchaseOrder } from '../src/models/PurchaseOrder';
import type { IRecipeIngredient } from '../src/models/Recipe';
import { Recipe } from '../src/models/Recipe';
import { Refund } from '../src/models/Refund';
import { Reservation } from '../src/models/Reservation';
import { Restaurant } from '../src/models/Restaurant';
import { RestaurantSetting, type RestaurantSettingDocument } from '../src/models/RestaurantSetting';
import { Shift } from '../src/models/Shift';
import { Supplier, type SupplierDocument } from '../src/models/Supplier';
import { Table, type TableDocument } from '../src/models/Table';
import { User, type UserDocument } from '../src/models/User';

import { INGREDIENT_TEMPLATES } from './seed-data/ingredients';
import { pickImage } from './seed-data/images';
import { CATEGORY_DEFS, MENU_ITEM_DEFS, MODIFIER_GROUP_DEFS } from './seed-data/menu';
import { CUSTOMER_DEFS, EMPLOYEE_DEFS, SUPPLIER_DEFS } from './seed-data/people';
import {
  addMinutes,
  createRng,
  daysAgo,
  randomChoice,
  randomInt,
  randomWeightedChoice,
  shuffle,
  type Rng,
} from './seed-data/rng';
import { BRANCH_DEFS, RESTAURANT_DEF } from './seed-data/restaurant';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s-]/g, '')
    .trim()
    .split(/\s+/)
    .join('.');
}

// ---------------------------------------------------------------------------
// Restaurant, branches, settings
// ---------------------------------------------------------------------------

async function seedBranches(restaurantId: Types.ObjectId): Promise<BranchDocument[]> {
  const docs: BranchDocument[] = [];
  for (const def of BRANCH_DEFS) {
    const doc = await Branch.create({
      restaurantId,
      name: def.name,
      code: def.code,
      address: def.address,
      phone: def.phone,
      email: def.email,
      currency: RESTAURANT_DEF.defaultCurrency,
      timezone: RESTAURANT_DEF.timezone,
      isMain: def.isMain,
      isActive: true,
      openingHours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        day,
        open: '11:00',
        close: day === 5 || day === 6 ? '23:00' : '22:00',
        isClosed: false,
      })),
    });
    docs.push(doc);
  }
  return docs;
}

async function seedRestaurant(restaurantId: Types.ObjectId, ownerUserId: Types.ObjectId) {
  return Restaurant.create({
    _id: restaurantId,
    name: RESTAURANT_DEF.name,
    slug: RESTAURANT_DEF.slug,
    legalName: RESTAURANT_DEF.legalName,
    ownerUserId,
    defaultCurrency: RESTAURANT_DEF.defaultCurrency,
    timezone: RESTAURANT_DEF.timezone,
    isActive: true,
  });
}

async function seedSettings(restaurantId: Types.ObjectId): Promise<RestaurantSettingDocument> {
  return RestaurantSetting.create({ restaurantId, serviceChargePercent: 5, serviceChargeTaxable: false });
}

// ---------------------------------------------------------------------------
// People: users + employees
// ---------------------------------------------------------------------------

interface SeededPeople {
  userByEmail: Map<string, UserDocument>;
  usersByBranchCode: Map<string, UserDocument[]>;
  ownerUser: UserDocument;
}

async function seedPeople(restaurantId: Types.ObjectId, branches: BranchDocument[]): Promise<SeededPeople> {
  const branchByCode = new Map(branches.map((b) => [b.code, b]));
  const userByEmail = new Map<string, UserDocument>();
  const usersByBranchCode = new Map<string, UserDocument[]>();
  let ownerUser: UserDocument | null = null;
  let employeeSeq = 0;

  const addToBranchIndex = (code: string, user: UserDocument) => {
    const list = usersByBranchCode.get(code) ?? [];
    list.push(user);
    usersByBranchCode.set(code, list);
  };

  for (const def of EMPLOYEE_DEFS) {
    employeeSeq += 1;
    let userId: Types.ObjectId | null = null;

    const branchIds =
      def.branchCode === 'ALL' ? branches.map((b) => b._id) : [branchByCode.get(def.branchCode)!._id];
    const activeBranchId =
      def.branchCode === 'ALL' ? branchByCode.get('DTN')!._id : branchByCode.get(def.branchCode)!._id;

    if (def.demoEmail) {
      const demo = DEMO_ACCOUNTS.find((a) => a.email === def.demoEmail)!;
      const passwordHash = await hashPassword(demo.password);
      const user = await User.create({
        name: def.name,
        email: demo.email,
        passwordHash,
        role: demo.role,
        restaurantId,
        branchIds,
        activeBranchId,
        status: 'active',
        lastLoginAt: daysAgo(randomInt(createRng(1), 0, 3)),
      });
      userByEmail.set(demo.email, user);
      userId = user._id;
      ownerUser = demo.role === ROLES.OWNER ? user : ownerUser;
      if (def.branchCode === 'ALL') {
        for (const b of branches) addToBranchIndex(b.code, user);
      } else {
        addToBranchIndex(def.branchCode, user);
      }
    } else if (def.extraLoginRole) {
      const email = `${slugifyName(def.name)}@copperkettle.example`;
      const firstName = def.name.split(' ')[0]!;
      const passwordHash = await hashPassword(`${firstName}@123`);
      const user = await User.create({
        name: def.name,
        email,
        passwordHash,
        role: def.extraLoginRole,
        restaurantId,
        branchIds,
        activeBranchId,
        status: 'active',
      });
      userByEmail.set(email, user);
      userId = user._id;
      addToBranchIndex(def.branchCode as string, user);
    }

    const branchId = def.branchCode === 'ALL' ? branchByCode.get('DTN')!._id : branchByCode.get(def.branchCode)!._id;

    await Employee.create({
      restaurantId,
      branchId,
      userId,
      employeeCode: `EMP-${String(employeeSeq).padStart(3, '0')}`,
      name: def.name,
      jobTitle: def.jobTitle,
      department: def.department,
      phone: def.phone,
      hireDate: daysAgo(def.hireDaysAgo),
      terminationDate: null,
      employmentType: def.employmentType,
      employmentStatus: 'active',
      salaryType: def.salaryType,
      monthlySalaryMinor: def.monthlySalaryMinor,
      hourlyRateMinor: def.hourlyRateMinor,
    });
  }

  const superAdminDemo = DEMO_ACCOUNTS.find((a) => a.role === ROLES.SUPER_ADMIN)!;
  const superAdminHash = await hashPassword(superAdminDemo.password);
  const superAdminUser = await User.create({
    name: 'Alex Morgan',
    email: superAdminDemo.email,
    passwordHash: superAdminHash,
    role: ROLES.SUPER_ADMIN,
    restaurantId: null,
    branchIds: [],
    activeBranchId: null,
    status: 'active',
  });
  userByEmail.set(superAdminDemo.email, superAdminUser);

  if (!ownerUser) throw new Error('Owner demo account was not created');
  return { userByEmail, usersByBranchCode, ownerUser };
}

// ---------------------------------------------------------------------------
// Menu: categories, modifier groups, items, recipes
// ---------------------------------------------------------------------------

async function seedCategories(restaurantId: Types.ObjectId): Promise<Map<string, Types.ObjectId>> {
  const map = new Map<string, Types.ObjectId>();
  for (const [i, def] of CATEGORY_DEFS.entries()) {
    const doc = await Category.create({
      restaurantId,
      name: def.name,
      slug: slugify(def.name),
      description: def.description,
      icon: def.icon,
      sortOrder: i,
      isActive: true,
    });
    map.set(def.name, doc._id);
  }
  return map;
}

async function seedModifierGroups(restaurantId: Types.ObjectId): Promise<Map<string, ModifierGroupDocument>> {
  const map = new Map<string, ModifierGroupDocument>();
  for (const def of MODIFIER_GROUP_DEFS) {
    const doc = await ModifierGroup.create({
      restaurantId,
      name: def.name,
      selectionType: def.selectionType,
      minSelect: def.minSelect,
      maxSelect: def.maxSelect,
      isRequired: def.isRequired,
      options: def.options.map((o, i) => ({
        name: o.name,
        priceMinor: o.priceMinor,
        isDefault: o.isDefault ?? false,
        isActive: true,
        sortOrder: i,
      })),
      isActive: true,
    });
    map.set(def.name, doc);
  }
  return map;
}

async function seedMenuItems(
  restaurantId: Types.ObjectId,
  categories: Map<string, Types.ObjectId>,
  modifierGroups: Map<string, ModifierGroupDocument>,
): Promise<Map<string, MenuItemDocument>> {
  const map = new Map<string, MenuItemDocument>();

  for (const [i, def] of MENU_ITEM_DEFS.entries()) {
    const categoryId = categories.get(def.category);
    if (!categoryId) throw new Error(`Unknown category "${def.category}" for menu item "${def.slug}"`);

    const modifierGroupIds = (def.modifierGroups ?? []).map((name) => {
      const group = modifierGroups.get(name);
      if (!group) throw new Error(`Unknown modifier group "${name}" referenced by "${def.slug}"`);
      return group._id;
    });

    const payload: Partial<IMenuItem> = {
      restaurantId,
      categoryId,
      name: def.name,
      slug: def.slug,
      sku: def.slug.toUpperCase().replace(/-/g, '_').slice(0, 24),
      description: def.description,
      imageUrl: pickImage(def.imageCategory, def.imageIndex),
      costPriceMinor: def.costPriceMinor,
      priceMinor: def.priceMinor,
      taxRatePercentOverride: null,
      kitchenStation: def.kitchenStation,
      preparationTimeMinutes: def.prepTimeMinutes,
      isFeatured: def.isFeatured ?? false,
      isBestSeller: def.isBestSeller ?? false,
      isVegetarian: def.isVegetarian ?? false,
      isVegan: def.isVegan ?? false,
      spicyLevel: def.spicyLevel ?? SPICY_LEVEL.NONE,
      allergens: def.allergens ?? [],
      modifierGroupIds,
      portionSizes: (def.portionSizes ?? []).map((p) => ({ ...p, isDefault: p.isDefault ?? false })),
      isCombo: def.isCombo ?? false,
      comboItems: [],
      stockTrackingEnabled: Boolean(def.recipe && def.recipe.length > 0),
      isActive: true,
      isAvailable: true,
      sortOrder: i,
    };

    const doc = await MenuItem.create(payload);
    map.set(def.slug, doc);
  }

  const comboLinks: Record<string, string[]> = {
    'classic-burger-combo': ['classic-cheeseburger'],
    'pizza-night-combo': ['margherita-pizza', 'garlic-cheese-bread'],
    'family-feast-combo': ['peri-peri-half-chicken', 'smoky-bbq-ribs'],
  };
  for (const [comboSlug, itemSlugs] of Object.entries(comboLinks)) {
    const combo = map.get(comboSlug);
    if (!combo) continue;
    combo.comboItems = itemSlugs.map((slug) => ({ menuItemId: map.get(slug)!._id, quantity: 1 }));
    await combo.save();
  }

  return map;
}

async function seedRecipes(restaurantId: Types.ObjectId, menuItems: Map<string, MenuItemDocument>): Promise<void> {
  for (const def of MENU_ITEM_DEFS) {
    if (!def.recipe || def.recipe.length === 0) continue;
    const menuItem = menuItems.get(def.slug);
    if (!menuItem) continue;
    await Recipe.create({
      restaurantId,
      menuItemId: menuItem._id,
      portionName: null,
      yieldQuantity: 1,
      ingredients: def.recipe,
    });
  }
}

// ---------------------------------------------------------------------------
// Suppliers, ingredients, tables, customers
// ---------------------------------------------------------------------------

async function seedSuppliers(restaurantId: Types.ObjectId): Promise<SupplierDocument[]> {
  const docs: SupplierDocument[] = [];
  for (const def of SUPPLIER_DEFS) {
    docs.push(
      await Supplier.create({
        restaurantId,
        name: def.name,
        contactPerson: def.contactPerson,
        phone: def.phone,
        email: def.email,
        categories: def.categories,
        paymentTermsDays: def.paymentTermsDays,
        outstandingBalanceMinor: 0,
        rating: 4,
        isActive: true,
      }),
    );
  }
  return docs;
}

async function seedIngredients(
  restaurantId: Types.ObjectId,
  branches: BranchDocument[],
  suppliers: SupplierDocument[],
  ownerUserId: Types.ObjectId,
  rng: Rng,
): Promise<Map<string, Map<string, IngredientDocument>>> {
  const byBranch = new Map<string, Map<string, IngredientDocument>>();

  for (const [branchIndex, branch] of branches.entries()) {
    const skuMap = new Map<string, IngredientDocument>();

    for (const [idx, tpl] of INGREDIENT_TEMPLATES.entries()) {
      const supplier = suppliers.find((s) => s.categories.includes(tpl.category)) ?? suppliers[0]!;
      const isLow = (idx + branchIndex) % 7 === 0;
      const stock = isLow
        ? Math.max(0, Math.round(tpl.reorderLevelBase * (0.3 + rng() * 0.5)))
        : Math.round(tpl.openingStockBase * (0.85 + rng() * 0.3));

      const doc = await Ingredient.create({
        restaurantId,
        branchId: branch._id,
        name: tpl.name,
        sku: tpl.sku,
        category: tpl.category,
        purchaseUnit: tpl.purchaseUnit,
        consumptionUnit: tpl.consumptionUnit,
        costPerPurchaseUnitMinor: tpl.costPerPurchaseUnitMinor,
        currentStockBase: stock,
        reorderLevelBase: tpl.reorderLevelBase,
        reorderQuantityBase: tpl.reorderQuantityBase,
        expiryTrackingEnabled: tpl.expiryTrackingEnabled,
        primarySupplierId: supplier._id,
        isActive: true,
      });

      await InventoryTransaction.create({
        restaurantId,
        branchId: branch._id,
        ingredientId: doc._id,
        type: INVENTORY_TRANSACTION_TYPE.OPENING_BALANCE,
        quantityBase: stock,
        unitCostMinor: tpl.costPerPurchaseUnitMinor,
        balanceAfterBase: stock,
        referenceType: null,
        referenceId: null,
        performedBy: ownerUserId,
      });

      skuMap.set(tpl.sku, doc);
    }

    byBranch.set(branch.code, skuMap);
  }

  return byBranch;
}

async function seedTables(
  restaurantId: Types.ObjectId,
  branches: BranchDocument[],
  rng: Rng,
): Promise<Map<string, TableDocument[]>> {
  const byBranch = new Map<string, TableDocument[]>();
  const shapes = ['square', 'round', 'rectangle', 'booth'] as const;
  const perRow = 5;

  for (const def of BRANCH_DEFS) {
    const branch = branches.find((b) => b.code === def.code)!;
    const tables: TableDocument[] = [];

    for (let i = 0; i < def.tableCount; i += 1) {
      const capacity = randomChoice(rng, [2, 2, 4, 4, 4, 6, 8]);
      const doc = await Table.create({
        restaurantId,
        branchId: branch._id,
        label: `T${i + 1}`,
        section: i < def.tableCount / 2 ? 'Main Floor' : 'Patio',
        capacity,
        shape: shapes[i % shapes.length],
        status: 'available',
        positionX: 40 + (i % perRow) * 150,
        positionY: 40 + Math.floor(i / perRow) * 160,
      });
      tables.push(doc);
    }
    byBranch.set(branch.code, tables);
  }

  return byBranch;
}

function randomBirthday(rng: Rng): Date {
  return new Date(randomInt(rng, 1985, 2001), randomInt(rng, 0, 11), randomInt(rng, 1, 28));
}

async function seedCustomers(restaurantId: Types.ObjectId, rng: Rng): Promise<CustomerDocument[]> {
  const docs: CustomerDocument[] = [];
  for (const def of CUSTOMER_DEFS) {
    docs.push(
      await Customer.create({
        restaurantId,
        name: def.name,
        phone: def.phone,
        email: def.email,
        segment: def.segment,
        tags: def.tags,
        membershipTier: def.segment === 'vip' ? 'gold' : def.segment === 'high_spender' ? 'silver' : 'bronze',
        birthday: rng() > 0.4 ? randomBirthday(rng) : null,
      }),
    );
  }
  return docs;
}

// ---------------------------------------------------------------------------
// Orders, payments, refunds, inventory deduction
// ---------------------------------------------------------------------------

const HOUR_WEIGHTS = [
  { value: 8, weight: 2 }, { value: 9, weight: 3 }, { value: 10, weight: 3 }, { value: 11, weight: 5 },
  { value: 12, weight: 9 }, { value: 13, weight: 10 }, { value: 14, weight: 6 }, { value: 15, weight: 3 },
  { value: 16, weight: 3 }, { value: 17, weight: 4 }, { value: 18, weight: 8 }, { value: 19, weight: 10 },
  { value: 20, weight: 9 }, { value: 21, weight: 6 }, { value: 22, weight: 3 },
];

const ORDER_TYPE_WEIGHTS: Array<{ value: OrderType; weight: number }> = [
  { value: ORDER_TYPE.DINE_IN, weight: 60 },
  { value: ORDER_TYPE.TAKEAWAY, weight: 25 },
  { value: ORDER_TYPE.DELIVERY, weight: 15 },
];

const PAYMENT_METHOD_WEIGHTS: Array<{ value: PaymentMethod; weight: number }> = [
  { value: PAYMENT_METHOD.CASH, weight: 35 },
  { value: PAYMENT_METHOD.CARD, weight: 40 },
  { value: PAYMENT_METHOD.DIGITAL_WALLET, weight: 15 },
  { value: PAYMENT_METHOD.BANK_TRANSFER, weight: 10 },
];

interface CartLine {
  menuItem: MenuItemDocument;
  quantity: number;
  modifiers: { name: string; priceMinor: number; quantity: number }[];
  discount: Discount | null;
}

function buildCart(rng: Rng, menuItems: MenuItemDocument[], modifierGroups: Map<string, ModifierGroupDocument>): CartLine[] {
  const nonCombo = menuItems.filter((m) => !m.isCombo);
  const weighted = nonCombo.map((m) => ({ value: m, weight: m.isBestSeller ? 4 : m.isFeatured ? 2 : 1 }));
  const lineCount = randomInt(rng, 1, 5);
  const lines: CartLine[] = [];

  for (let i = 0; i < lineCount; i += 1) {
    const menuItem = randomWeightedChoice(rng, weighted);
    const modifiers: CartLine['modifiers'] = [];

    if (menuItem.modifierGroupIds.length > 0 && rng() < 0.45) {
      const group = [...modifierGroups.values()].find((g) => menuItem.modifierGroupIds.some((id) => id.equals(g._id)));
      if (group && group.options.length > 0) {
        const option = randomChoice(rng, group.options);
        if (option.priceMinor > 0) modifiers.push({ name: option.name, priceMinor: option.priceMinor, quantity: 1 });
      }
    }

    const discount: Discount | null = rng() < 0.06 ? { type: DISCOUNT_TYPE.PERCENTAGE, value: 10, reason: 'Manager comp' } : null;

    lines.push({ menuItem, quantity: randomInt(rng, 1, 3), modifiers, discount });
  }

  return lines;
}

interface OrderContext {
  restaurantId: Types.ObjectId;
  branches: BranchDocument[];
  usersByBranchCode: Map<string, UserDocument[]>;
  menuItems: MenuItemDocument[];
  modifierGroups: Map<string, ModifierGroupDocument>;
  tablesByBranch: Map<string, TableDocument[]>;
  customers: CustomerDocument[];
  taxRatePercent: number;
  orderNumberPrefix: string;
  ingredientsByBranch: Map<string, Map<string, IngredientDocument>>;
  recipeBySlug: Map<string, IRecipeIngredient[]>;
  rng: Rng;
}

interface CustomerStat {
  totalSpentMinor: number;
  totalOrders: number;
  lastVisitAt: Date;
  pointsEarned: number;
}

async function deductInventoryForOrder(
  ctx: OrderContext,
  branchCode: string,
  items: IOrderItem[],
  orderId: Types.ObjectId,
  performedBy: Types.ObjectId,
): Promise<void> {
  const ingredientMap = ctx.ingredientsByBranch.get(branchCode);
  if (!ingredientMap) return;

  for (const item of items) {
    const menuItem = ctx.menuItems.find((m) => m._id.equals(item.menuItemId));
    if (!menuItem) continue;
    const recipe = ctx.recipeBySlug.get(menuItem.slug);
    if (!recipe) continue;

    for (const line of recipe) {
      const ingredient = ingredientMap.get(line.ingredientSku);
      if (!ingredient) continue;
      const consumed = line.quantityBase * item.quantity;
      ingredient.currentStockBase = Math.max(0, ingredient.currentStockBase - consumed);
      await ingredient.save();

      await InventoryTransaction.create({
        restaurantId: ctx.restaurantId,
        branchId: ingredient.branchId,
        ingredientId: ingredient._id,
        type: INVENTORY_TRANSACTION_TYPE.SALE_DEDUCTION,
        quantityBase: consumed,
        unitCostMinor: ingredient.costPerPurchaseUnitMinor,
        balanceAfterBase: ingredient.currentStockBase,
        referenceType: 'order',
        referenceId: orderId,
        performedBy,
      });
    }
  }
}

/**
 * Single restaurant-wide counter, matching `orderService.nextOrderNumber`'s
 * semantics exactly. The seed must leave `RestaurantSetting.nextOrderSequence`
 * at the value it consumed up to, or the first order created through the UI
 * reuses a seeded number and trips the unique index.
 */
let orderSequence = 0;

function takeOrderNumber(prefix: string, branchCode: string): string {
  orderSequence += 1;
  return `${prefix}${branchCode}-${String(orderSequence).padStart(5, '0')}`;
}

async function createHistoricalOrder(
  ctx: OrderContext,
  branch: BranchDocument,
  createdAt: Date,
  customerStats: Map<string, CustomerStat>,
): Promise<void> {
  const staff = ctx.usersByBranchCode.get(branch.code) ?? [];
  if (staff.length === 0) return;

  const orderType = randomWeightedChoice(ctx.rng, ORDER_TYPE_WEIGHTS);
  const cart = buildCart(ctx.rng, ctx.menuItems, ctx.modifierGroups);
  const cashier = randomChoice(ctx.rng, staff);
  const waiter = orderType === ORDER_TYPE.DINE_IN ? randomChoice(ctx.rng, staff) : null;
  const customer = ctx.rng() < 0.7 ? randomChoice(ctx.rng, ctx.customers) : null;

  const orderDiscount: Discount | null = ctx.rng() < 0.1 ? { type: DISCOUNT_TYPE.PERCENTAGE, value: 10, reason: 'Loyalty reward' } : null;
  const serviceChargePercent = orderType === ORDER_TYPE.DINE_IN ? 5 : 0;

  const pricingLines: PricingLineInput[] = cart.map((line, idx) => ({
    id: String(idx),
    name: line.menuItem.name,
    unitPriceMinor: line.menuItem.priceMinor,
    quantity: line.quantity,
    modifiers: line.modifiers,
    discount: line.discount,
    taxRatePercent: ctx.taxRatePercent,
  }));

  const totals = calculateOrderTotals(pricingLines, {
    taxMode: 'exclusive',
    serviceChargePercent,
    serviceChargeTaxable: false,
    serviceChargeTaxRatePercent: 0,
    orderDiscount,
    deliveryFeeMinor: orderType === ORDER_TYPE.DELIVERY ? 350 : 0,
    cashRoundingIncrementMinor: 1,
  });

  const outcomeRoll = ctx.rng();
  const status = outcomeRoll < 0.85 ? ORDER_STATUS.COMPLETED : outcomeRoll < 0.93 ? ORDER_STATUS.CANCELLED : outcomeRoll < 0.98 ? ORDER_STATUS.REFUNDED : ORDER_STATUS.VOIDED;

  const submittedAt = addMinutes(createdAt, 1);
  const kitchenAcceptedAt = addMinutes(submittedAt, 2);
  const preparingAt = addMinutes(kitchenAcceptedAt, 2);
  const readyAt = addMinutes(preparingAt, randomInt(ctx.rng, 8, 18));
  const servedAt = orderType === ORDER_TYPE.DINE_IN ? addMinutes(readyAt, 3) : readyAt;
  const paidAt = addMinutes(servedAt, randomInt(ctx.rng, 2, 15));

  const itemStatus = status === ORDER_STATUS.CANCELLED ? ORDER_ITEM_STATUS.CANCELLED : ORDER_ITEM_STATUS.SERVED;
  const items: IOrderItem[] = cart.map((line, idx) => {
    const priced = totals.lines[idx]!;
    return {
      _id: new mongoose.Types.ObjectId(),
      menuItemId: line.menuItem._id,
      name: line.menuItem.name,
      portionName: null,
      sku: line.menuItem.sku,
      quantity: line.quantity,
      unitPriceMinor: line.menuItem.priceMinor,
      modifiers: line.modifiers,
      notes: null,
      discount: line.discount,
      taxRatePercent: priced.taxRatePercent,
      kitchenStation: line.menuItem.kitchenStation,
      status: itemStatus,
      cancelReason: status === ORDER_STATUS.CANCELLED ? 'Order cancelled' : null,
      sentToKitchenAt: submittedAt,
      readyAt: status === ORDER_STATUS.CANCELLED ? null : readyAt,
      servedAt: status === ORDER_STATUS.CANCELLED ? null : servedAt,
    };
  });

  const table =
    orderType === ORDER_TYPE.DINE_IN
      ? randomChoice(ctx.rng, ctx.tablesByBranch.get(branch.code) ?? [{ _id: null } as unknown as TableDocument])
      : null;

  const orderNumber = takeOrderNumber(ctx.orderNumberPrefix, branch.code);

  const isPaid = status === ORDER_STATUS.COMPLETED || status === ORDER_STATUS.REFUNDED;

  const order = await Order.create({
    restaurantId: ctx.restaurantId,
    branchId: branch._id,
    orderNumber,
    type: orderType,
    status,
    tableId: table?._id ?? null,
    customerId: customer?._id ?? null,
    waiterId: waiter?._id ?? null,
    cashierId: cashier._id,
    items,
    orderDiscount,
    serviceChargePercent,
    taxMode: 'exclusive',
    subtotalMinor: totals.subtotalMinor,
    discountTotalMinor: totals.discountTotalMinor,
    serviceChargeMinor: totals.serviceChargeMinor,
    taxMinor: totals.taxMinor,
    deliveryFeeMinor: totals.deliveryFeeMinor,
    tipMinor: 0,
    roundingMinor: totals.roundingMinor,
    grandTotalMinor: totals.grandTotalMinor,
    paidMinor: isPaid ? totals.grandTotalMinor : 0,
    refundedMinor: status === ORDER_STATUS.REFUNDED ? totals.grandTotalMinor : 0,
    delivery:
      orderType === ORDER_TYPE.DELIVERY
        ? { address: '124 Elm Street, Riverside, NJ', phone: '+1 (555) 402-9988', feeMinor: totals.deliveryFeeMinor, driverId: null, estimatedDeliveryAt: addMinutes(readyAt, 25), status: 'delivered' }
        : null,
    notes: null,
    holdReason: null,
    cancelReason: status === ORDER_STATUS.CANCELLED ? 'Customer changed their mind' : null,
    voidReason: status === ORDER_STATUS.VOIDED ? 'Duplicate order entered by mistake' : null,
    submittedAt,
    kitchenAcceptedAt: status === ORDER_STATUS.CANCELLED ? null : kitchenAcceptedAt,
    preparingAt: status === ORDER_STATUS.CANCELLED ? null : preparingAt,
    readyAt: status === ORDER_STATUS.CANCELLED ? null : readyAt,
    servedAt: status === ORDER_STATUS.CANCELLED ? null : servedAt,
    paidAt: isPaid ? paidAt : null,
    completedAt: status === ORDER_STATUS.COMPLETED ? paidAt : null,
    cancelledAt: status === ORDER_STATUS.CANCELLED ? readyAt : null,
    createdAt,
  });
  order.createdAt = createdAt;
  await order.save();

  if (isPaid) {
    const splitPayment = ctx.rng() < 0.12;
    const method = randomWeightedChoice(ctx.rng, PAYMENT_METHOD_WEIGHTS);
    const firstAmount = splitPayment ? Math.round(totals.grandTotalMinor * 0.5) : totals.grandTotalMinor;

    const payment = await Payment.create({
      restaurantId: ctx.restaurantId,
      branchId: branch._id,
      orderId: order._id,
      method,
      amountMinor: firstAmount,
      tenderedMinor: method === PAYMENT_METHOD.CASH ? firstAmount + randomChoice(ctx.rng, [0, 0, 500, 1000]) : firstAmount,
      changeMinor: 0,
      status: PAYMENT_STATUS.COMPLETED,
      gateway: 'demo',
      transactionReference: `DEMO-${randomInt(ctx.rng, 100000, 999999)}`,
      cardLast4: method === PAYMENT_METHOD.CARD ? String(randomInt(ctx.rng, 1000, 9999)) : null,
      walletProvider: method === PAYMENT_METHOD.DIGITAL_WALLET ? randomChoice(ctx.rng, ['Apple Pay', 'Google Pay']) : null,
      notes: null,
      processedBy: cashier._id,
      voidedBy: null,
      voidedAt: null,
      voidReason: null,
      createdAt: paidAt,
    });
    payment.createdAt = paidAt;
    await payment.save();

    if (splitPayment) {
      await Payment.create({
        restaurantId: ctx.restaurantId,
        branchId: branch._id,
        orderId: order._id,
        method: PAYMENT_METHOD.CASH,
        amountMinor: totals.grandTotalMinor - firstAmount,
        tenderedMinor: totals.grandTotalMinor - firstAmount,
        changeMinor: 0,
        status: PAYMENT_STATUS.COMPLETED,
        gateway: 'demo',
        transactionReference: `DEMO-${randomInt(ctx.rng, 100000, 999999)}`,
        cardLast4: null,
        walletProvider: null,
        notes: 'Split payment — remainder',
        processedBy: cashier._id,
        voidedBy: null,
        voidedAt: null,
        voidReason: null,
        createdAt: paidAt,
      });
    }

    if (status === ORDER_STATUS.REFUNDED) {
      const manager = staff.find((u) => u.role === ROLES.MANAGER || u.role === ROLES.OWNER) ?? cashier;
      await Refund.create({
        restaurantId: ctx.restaurantId,
        branchId: branch._id,
        orderId: order._id,
        paymentId: payment._id,
        amountMinor: totals.grandTotalMinor,
        reason: 'Customer reported an incorrect item',
        status: REFUND_STATUS.PROCESSED,
        requestedBy: cashier._id,
        approvedBy: manager._id,
        processedAt: addMinutes(paidAt, 30),
      });
    }
  }

  if (status === ORDER_STATUS.COMPLETED) {
    await deductInventoryForOrder(ctx, branch.code, items, order._id, cashier._id);
  }

  if (customer && (status === ORDER_STATUS.COMPLETED || status === ORDER_STATUS.REFUNDED)) {
    const key = String(customer._id);
    const existing = customerStats.get(key) ?? { totalSpentMinor: 0, totalOrders: 0, lastVisitAt: createdAt, pointsEarned: 0 };
    existing.totalSpentMinor += totals.grandTotalMinor;
    existing.totalOrders += 1;
    existing.lastVisitAt = createdAt > existing.lastVisitAt ? createdAt : existing.lastVisitAt;
    existing.pointsEarned += Math.floor(totals.grandTotalMinor / 100);
    customerStats.set(key, existing);
  }
}

async function createLiveOrder(
  ctx: OrderContext,
  branch: BranchDocument,
  status: (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS],
  minutesAgo: number,
): Promise<void> {
  const staff = ctx.usersByBranchCode.get(branch.code) ?? [];
  if (staff.length === 0) return;

  const createdAt = addMinutes(new Date(), -minutesAgo);
  const cart = buildCart(ctx.rng, ctx.menuItems, ctx.modifierGroups);
  const cashier = randomChoice(ctx.rng, staff);
  const waiter = randomChoice(ctx.rng, staff);
  const table = randomChoice(ctx.rng, ctx.tablesByBranch.get(branch.code) ?? [{ _id: null } as unknown as TableDocument]);

  const pricingLines: PricingLineInput[] = cart.map((line, idx) => ({
    id: String(idx),
    name: line.menuItem.name,
    unitPriceMinor: line.menuItem.priceMinor,
    quantity: line.quantity,
    modifiers: line.modifiers,
    discount: line.discount,
    taxRatePercent: ctx.taxRatePercent,
  }));

  const totals = calculateOrderTotals(pricingLines, {
    taxMode: 'exclusive',
    serviceChargePercent: 5,
    serviceChargeTaxable: false,
    serviceChargeTaxRatePercent: 0,
    cashRoundingIncrementMinor: 1,
  });

  const submittedAt = addMinutes(createdAt, 1);
  const acceptedOnwards: OrderStatus[] = [ORDER_STATUS.KITCHEN_ACCEPTED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.SERVED];
  const preparingOnwards: OrderStatus[] = [ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.SERVED];
  const readyOnwards: OrderStatus[] = [ORDER_STATUS.READY, ORDER_STATUS.SERVED];
  const kitchenAcceptedAt = acceptedOnwards.includes(status) ? addMinutes(submittedAt, 2) : null;
  const preparingAt = preparingOnwards.includes(status) ? addMinutes(submittedAt, 4) : null;
  const readyAt = readyOnwards.includes(status) ? addMinutes(submittedAt, 14) : null;
  const servedAt = status === ORDER_STATUS.SERVED ? addMinutes(submittedAt, 18) : null;

  const itemStatus =
    status === ORDER_STATUS.SUBMITTED || status === ORDER_STATUS.KITCHEN_ACCEPTED
      ? ORDER_ITEM_STATUS.PENDING
      : status === ORDER_STATUS.PREPARING
        ? ORDER_ITEM_STATUS.PREPARING
        : ORDER_ITEM_STATUS.READY;

  const items: IOrderItem[] = cart.map((line, idx) => {
    const priced = totals.lines[idx]!;
    return {
      _id: new mongoose.Types.ObjectId(),
      menuItemId: line.menuItem._id,
      name: line.menuItem.name,
      portionName: null,
      sku: line.menuItem.sku,
      quantity: line.quantity,
      unitPriceMinor: line.menuItem.priceMinor,
      modifiers: line.modifiers,
      notes: null,
      discount: line.discount,
      taxRatePercent: priced.taxRatePercent,
      kitchenStation: line.menuItem.kitchenStation,
      status: itemStatus,
      cancelReason: null,
      sentToKitchenAt: submittedAt,
      readyAt,
      servedAt,
    };
  });

  await Order.create({
    restaurantId: ctx.restaurantId,
    branchId: branch._id,
    orderNumber: takeOrderNumber(ctx.orderNumberPrefix, branch.code),
    type: ORDER_TYPE.DINE_IN,
    status,
    priority: minutesAgo < 10 ? 'rush' : 'normal',
    tableId: table._id,
    customerId: null,
    waiterId: waiter._id,
    cashierId: cashier._id,
    items,
    serviceChargePercent: 5,
    taxMode: 'exclusive',
    subtotalMinor: totals.subtotalMinor,
    discountTotalMinor: totals.discountTotalMinor,
    serviceChargeMinor: totals.serviceChargeMinor,
    taxMinor: totals.taxMinor,
    deliveryFeeMinor: 0,
    tipMinor: 0,
    roundingMinor: totals.roundingMinor,
    grandTotalMinor: totals.grandTotalMinor,
    paidMinor: 0,
    refundedMinor: 0,
    submittedAt,
    kitchenAcceptedAt,
    preparingAt,
    readyAt,
    servedAt,
    createdAt,
  });
}

async function createHeldOrder(ctx: OrderContext, branch: BranchDocument, minutesAgo: number): Promise<void> {
  const staff = ctx.usersByBranchCode.get(branch.code) ?? [];
  if (staff.length === 0) return;
  const cart = buildCart(ctx.rng, ctx.menuItems, ctx.modifierGroups).slice(0, 2);
  const cashier = randomChoice(ctx.rng, staff);
  const createdAt = addMinutes(new Date(), -minutesAgo);

  const pricingLines: PricingLineInput[] = cart.map((line, idx) => ({
    id: String(idx),
    name: line.menuItem.name,
    unitPriceMinor: line.menuItem.priceMinor,
    quantity: line.quantity,
    modifiers: line.modifiers,
    taxRatePercent: ctx.taxRatePercent,
  }));
  const totals = calculateOrderTotals(pricingLines, { taxMode: 'exclusive', serviceChargePercent: 0, serviceChargeTaxable: false, serviceChargeTaxRatePercent: 0 });

  const items: IOrderItem[] = cart.map((line) => ({
    _id: new mongoose.Types.ObjectId(),
    menuItemId: line.menuItem._id,
    name: line.menuItem.name,
    portionName: null,
    sku: line.menuItem.sku,
    quantity: line.quantity,
    unitPriceMinor: line.menuItem.priceMinor,
    modifiers: line.modifiers,
    notes: null,
    discount: null,
    taxRatePercent: ctx.taxRatePercent,
    kitchenStation: line.menuItem.kitchenStation,
    status: ORDER_ITEM_STATUS.PENDING,
    cancelReason: null,
    sentToKitchenAt: null,
    readyAt: null,
    servedAt: null,
  }));

  await Order.create({
    restaurantId: ctx.restaurantId,
    branchId: branch._id,
    orderNumber: takeOrderNumber(ctx.orderNumberPrefix, branch.code),
    type: ORDER_TYPE.TAKEAWAY,
    status: ORDER_STATUS.HELD,
    tableId: null,
    customerId: null,
    waiterId: null,
    cashierId: cashier._id,
    items,
    serviceChargePercent: 0,
    taxMode: 'exclusive',
    subtotalMinor: totals.subtotalMinor,
    discountTotalMinor: totals.discountTotalMinor,
    serviceChargeMinor: 0,
    taxMinor: totals.taxMinor,
    deliveryFeeMinor: 0,
    tipMinor: 0,
    roundingMinor: totals.roundingMinor,
    grandTotalMinor: totals.grandTotalMinor,
    paidMinor: 0,
    refundedMinor: 0,
    holdReason: 'Customer stepped out to park',
    createdAt,
  });
}

async function seedOrders(ctx: OrderContext): Promise<Map<string, CustomerStat>> {
  orderSequence = 0;
  const customerStats = new Map<string, CustomerStat>();

  for (let dayOffset = 44; dayOffset >= 1; dayOffset -= 1) {
    const isWeekend = [0, 6].includes(daysAgo(dayOffset).getDay());
    for (const branch of ctx.branches) {
      const ordersToday = randomInt(ctx.rng, isWeekend ? 3 : 2, isWeekend ? 6 : 4);
      for (let i = 0; i < ordersToday; i += 1) {
        const hour = randomWeightedChoice(ctx.rng, HOUR_WEIGHTS);
        const minute = randomInt(ctx.rng, 0, 59);
        await createHistoricalOrder(ctx, branch, daysAgo(dayOffset, hour, minute), customerStats);
      }
    }
  }

  // Today: a burst of already-completed sales plus a live kitchen queue.
  for (const branch of ctx.branches) {
    for (let i = 0; i < 4; i += 1) {
      const hour = randomInt(ctx.rng, 8, new Date().getHours() > 12 ? 12 : Math.max(8, new Date().getHours() - 1));
      await createHistoricalOrder(ctx, branch, daysAgo(0, hour, randomInt(ctx.rng, 0, 59)), customerStats);
    }
  }

  const livePipeline: Array<(typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]> = [
    ORDER_STATUS.SUBMITTED,
    ORDER_STATUS.KITCHEN_ACCEPTED,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.READY,
    ORDER_STATUS.SERVED,
  ];
  for (const branch of ctx.branches) {
    for (const [i, status] of livePipeline.entries()) {
      await createLiveOrder(ctx, branch, status, randomInt(ctx.rng, 3, 8) + i * 6);
    }
    await createHeldOrder(ctx, branch, randomInt(ctx.rng, 5, 20));
  }

  return customerStats;
}

async function updateCustomerStats(customers: CustomerDocument[], stats: Map<string, CustomerStat>): Promise<void> {
  for (const customer of customers) {
    const stat = stats.get(String(customer._id));
    if (!stat) continue;
    customer.totalSpentMinor = stat.totalSpentMinor;
    customer.totalOrders = stat.totalOrders;
    customer.lastVisitAt = stat.lastVisitAt;
    customer.loyaltyPointsBalance = stat.pointsEarned;
    customer.lifetimePoints = stat.pointsEarned;
    await customer.save();
  }
}

async function seedLoyaltyTransactions(
  restaurantId: Types.ObjectId,
  customers: CustomerDocument[],
  stats: Map<string, CustomerStat>,
): Promise<void> {
  for (const customer of customers) {
    const stat = stats.get(String(customer._id));
    if (!stat || stat.pointsEarned === 0) continue;
    await LoyaltyTransaction.create({
      restaurantId,
      customerId: customer._id,
      type: LOYALTY_TRANSACTION_TYPE.EARNED,
      points: stat.pointsEarned,
      orderId: null,
      description: `Points earned across ${stat.totalOrders} order${stat.totalOrders === 1 ? '' : 's'}`,
      expiresAt: null,
      performedBy: null,
    });
    if (customer.segment === 'vip') {
      await LoyaltyTransaction.create({
        restaurantId,
        customerId: customer._id,
        type: LOYALTY_TRANSACTION_TYPE.BIRTHDAY,
        points: 100,
        orderId: null,
        description: 'Birthday bonus points',
        expiresAt: null,
        performedBy: null,
      });
      customer.loyaltyPointsBalance += 100;
      customer.lifetimePoints += 100;
      await customer.save();
    }
  }
}

// ---------------------------------------------------------------------------
// Expenses, purchasing, reservations, cash registers, notifications, audit
// ---------------------------------------------------------------------------

async function seedExpenses(restaurantId: Types.ObjectId, branches: BranchDocument[], ownerUserId: Types.ObjectId, rng: Rng): Promise<void> {
  const descriptions: Record<(typeof EXPENSE_CATEGORIES)[number], string[]> = {
    Rent: ['Monthly premises rent'],
    Electricity: ['Monthly electricity bill'],
    Water: ['Monthly water utility'],
    Gas: ['Kitchen gas supply refill'],
    Internet: ['Internet & POS network service'],
    'Staff Meals': ['Staff meal allowance'],
    'Repairs & Maintenance': ['Walk-in fridge repair', 'Grill maintenance service'],
    Cleaning: ['Deep-clean service', 'Cleaning supplies restock'],
    'Delivery Charges': ['Third-party delivery platform fees'],
    Marketing: ['Local social media ad campaign', 'Printed menu redesign'],
    Equipment: ['New POS terminal', 'Replacement fryer basket'],
    Miscellaneous: ['Uniform restock', 'Licensing renewal fee'],
  };

  for (let dayOffset = 60; dayOffset >= 1; dayOffset -= randomInt(rng, 2, 5)) {
    const branch = randomChoice(rng, branches);
    const category = randomChoice(rng, EXPENSE_CATEGORIES);
    const description = randomChoice(rng, descriptions[category]);
    const amountMinor = category === 'Rent' ? randomInt(rng, 250000, 400000) : randomInt(rng, 2500, 60000);
    const status = rng() < 0.85 ? EXPENSE_STATUS.PAID : rng() < 0.5 ? EXPENSE_STATUS.PENDING_APPROVAL : EXPENSE_STATUS.APPROVED;

    await Expense.create({
      restaurantId,
      branchId: branch._id,
      category,
      description,
      amountMinor,
      expenseDate: daysAgo(dayOffset),
      paymentMethod: randomChoice(rng, ['cash', 'card', 'bank_transfer']),
      referenceNumber: `EXP-${randomInt(rng, 10000, 99999)}`,
      recurrence: category === 'Rent' ? 'monthly' : 'none',
      status,
      requestedBy: ownerUserId,
      approvedBy: status === EXPENSE_STATUS.PENDING_APPROVAL ? null : ownerUserId,
      approvedAt: status === EXPENSE_STATUS.PENDING_APPROVAL ? null : daysAgo(dayOffset - 1),
    });
  }
}

async function seedPurchasing(
  restaurantId: Types.ObjectId,
  branches: BranchDocument[],
  suppliers: SupplierDocument[],
  ingredientsByBranch: Map<string, Map<string, IngredientDocument>>,
  ownerUserId: Types.ObjectId,
  rng: Rng,
): Promise<void> {
  let poSeq = 1;
  for (const branch of branches) {
    const ingredientMap = ingredientsByBranch.get(branch.code);
    if (!ingredientMap) continue;
    const ingredientDocs = [...ingredientMap.values()];

    for (let i = 0; i < 4; i += 1) {
      const supplier = randomChoice(rng, suppliers);
      const chosenIngredients = shuffle(rng, ingredientDocs).slice(0, randomInt(rng, 2, 4));
      const items = chosenIngredients.map((ing) => ({
        ingredientId: ing._id,
        quantityOrdered: ing.reorderQuantityBase,
        quantityReceived: 0,
        unit: ing.purchaseUnit,
        unitCostMinor: ing.costPerPurchaseUnitMinor,
      }));
      const subtotalMinor = items.reduce((sum, it) => sum + it.unitCostMinor * Math.max(1, Math.round(it.quantityOrdered / 10)), 0);
      const status = i === 0 ? PURCHASE_ORDER_STATUS.PENDING_APPROVAL : i === 1 ? PURCHASE_ORDER_STATUS.PARTIALLY_RECEIVED : PURCHASE_ORDER_STATUS.RECEIVED;
      const orderedAt = daysAgo(randomInt(rng, 5, 40));

      const po = await PurchaseOrder.create({
        restaurantId,
        branchId: branch._id,
        supplierId: supplier._id,
        poNumber: `PO-${String(poSeq).padStart(5, '0')}`,
        status,
        items: items.map((it) => ({
          ...it,
          quantityReceived: status === PURCHASE_ORDER_STATUS.RECEIVED ? it.quantityOrdered : status === PURCHASE_ORDER_STATUS.PARTIALLY_RECEIVED ? Math.round(it.quantityOrdered * 0.5) : 0,
        })),
        subtotalMinor,
        taxMinor: 0,
        totalMinor: subtotalMinor,
        requestedBy: ownerUserId,
        approvedBy: status === PURCHASE_ORDER_STATUS.PENDING_APPROVAL ? null : ownerUserId,
        approvedAt: status === PURCHASE_ORDER_STATUS.PENDING_APPROVAL ? null : orderedAt,
        expectedDeliveryDate: addMinutes(orderedAt, 60 * 24 * 3),
        receivedAt: status === PURCHASE_ORDER_STATUS.RECEIVED ? addMinutes(orderedAt, 60 * 24 * 3) : null,
      });
      poSeq += 1;

      if (status !== PURCHASE_ORDER_STATUS.PENDING_APPROVAL) {
        await Purchase.create({
          restaurantId,
          branchId: branch._id,
          supplierId: supplier._id,
          purchaseOrderId: po._id,
          invoiceNumber: `INV-SUP-${randomInt(rng, 10000, 99999)}`,
          invoiceDate: orderedAt,
          amountMinor: subtotalMinor,
          amountPaidMinor: status === PURCHASE_ORDER_STATUS.RECEIVED ? subtotalMinor : Math.round(subtotalMinor * 0.5),
          paymentStatus: status === PURCHASE_ORDER_STATUS.RECEIVED ? PURCHASE_PAYMENT_STATUS.PAID : PURCHASE_PAYMENT_STATUS.PARTIAL,
          isReturn: false,
        });

        for (const it of po.items) {
          if (it.quantityReceived <= 0) continue;
          const ingredient = ingredientMap.get(ingredientDocs.find((d) => d._id.equals(it.ingredientId))?.sku ?? '');
          if (!ingredient) continue;
          ingredient.currentStockBase += it.quantityReceived;
          await ingredient.save();
          await InventoryTransaction.create({
            restaurantId,
            branchId: branch._id,
            ingredientId: ingredient._id,
            type: INVENTORY_TRANSACTION_TYPE.STOCK_IN,
            quantityBase: it.quantityReceived,
            unitCostMinor: it.unitCostMinor,
            balanceAfterBase: ingredient.currentStockBase,
            referenceType: 'purchase',
            referenceId: po._id,
            performedBy: ownerUserId,
          });
        }
      }
    }
  }
}

async function seedReservations(
  restaurantId: Types.ObjectId,
  branches: BranchDocument[],
  tablesByBranch: Map<string, TableDocument[]>,
  customers: CustomerDocument[],
  usersByBranchCode: Map<string, UserDocument[]>,
  rng: Rng,
): Promise<void> {
  const statuses: Array<(typeof RESERVATION_STATUS)[keyof typeof RESERVATION_STATUS]> = [
    RESERVATION_STATUS.COMPLETED,
    RESERVATION_STATUS.COMPLETED,
    RESERVATION_STATUS.NO_SHOW,
    RESERVATION_STATUS.CANCELLED,
    RESERVATION_STATUS.CONFIRMED,
    RESERVATION_STATUS.CONFIRMED,
    RESERVATION_STATUS.PENDING,
    RESERVATION_STATUS.SEATED,
  ];

  for (const branch of branches) {
    const tables = tablesByBranch.get(branch.code) ?? [];
    const staff = usersByBranchCode.get(branch.code) ?? [];
    if (tables.length === 0 || staff.length === 0) continue;

    for (let i = 0; i < 7; i += 1) {
      const dayOffset = randomInt(rng, -10, 10);
      const status = dayOffset < 0 ? randomChoice(rng, statuses.slice(0, 4)) : randomChoice(rng, statuses.slice(4));
      const customer = randomChoice(rng, customers);
      const table = randomChoice(rng, tables);
      const reservationDate = daysAgo(-dayOffset, randomInt(rng, 12, 20), randomChoice(rng, [0, 15, 30, 45]));

      await Reservation.create({
        restaurantId,
        branchId: branch._id,
        customerId: customer._id,
        guestName: customer.name,
        guestPhone: customer.phone,
        guestEmail: customer.email,
        reservationDate,
        durationMinutes: 90,
        partySize: randomInt(rng, 2, Math.max(2, table.capacity)),
        tableId: table._id,
        status,
        specialRequests: rng() < 0.2 ? 'Window seat if possible' : null,
        depositMinor: 0,
        depositPaid: false,
        confirmedAt: status === RESERVATION_STATUS.PENDING ? null : addMinutes(reservationDate, -60 * 24),
        seatedAt: status === RESERVATION_STATUS.SEATED || status === RESERVATION_STATUS.COMPLETED ? reservationDate : null,
        completedAt: status === RESERVATION_STATUS.COMPLETED ? addMinutes(reservationDate, 90) : null,
        cancelledAt: status === RESERVATION_STATUS.CANCELLED ? addMinutes(reservationDate, -120) : null,
        cancelReason: status === RESERVATION_STATUS.CANCELLED ? 'Guest requested cancellation' : null,
        createdBy: randomChoice(rng, staff)._id,
      });
    }
  }
}

async function seedCashRegisters(
  restaurantId: Types.ObjectId,
  branches: BranchDocument[],
  usersByBranchCode: Map<string, UserDocument[]>,
  rng: Rng,
): Promise<void> {
  for (const branch of branches) {
    const staff = (usersByBranchCode.get(branch.code) ?? []).filter((u) => u.role === ROLES.CASHIER || u.role === ROLES.MANAGER || u.role === ROLES.OWNER);
    if (staff.length === 0) continue;
    const cashier = staff[0]!;

    const openedYesterday = daysAgo(1, 9, 0);
    const closedYesterday = daysAgo(1, 22, 15);
    const cashSales = randomInt(rng, 40000, 120000);
    const cardSales = randomInt(rng, 60000, 180000);
    const expected = 20000 + cashSales;
    const actual = expected + randomChoice(rng, [-500, 0, 0, 300, 700]);

    await CashRegister.create({
      restaurantId,
      branchId: branch._id,
      cashierId: cashier._id,
      status: REGISTER_STATUS.RECONCILED,
      openedAt: openedYesterday,
      closedAt: closedYesterday,
      openingCashMinor: 20000,
      closingCashActualMinor: actual,
      expectedCashMinor: expected,
      cashSalesMinor: cashSales,
      cardSalesMinor: cardSales,
      digitalWalletSalesMinor: randomInt(rng, 5000, 20000),
      bankTransferSalesMinor: randomInt(rng, 0, 8000),
      refundsMinor: randomInt(rng, 0, 3000),
      paidInMinor: 0,
      paidOutMinor: randomInt(rng, 0, 4000),
      cashDifferenceMinor: actual - expected,
      cashMovements: [],
      closingNotes: 'End of day reconciliation.',
    });

    await CashRegister.create({
      restaurantId,
      branchId: branch._id,
      cashierId: cashier._id,
      status: REGISTER_STATUS.OPEN,
      openedAt: daysAgo(0, 9, 0),
      closedAt: null,
      openingCashMinor: 20000,
      closingCashActualMinor: null,
      expectedCashMinor: 20000,
      cashSalesMinor: 0,
      cardSalesMinor: 0,
      digitalWalletSalesMinor: 0,
      bankTransferSalesMinor: 0,
      refundsMinor: 0,
      paidInMinor: 0,
      paidOutMinor: 0,
      cashDifferenceMinor: null,
      cashMovements: [
        { type: CASH_MOVEMENT_TYPE.PAID_OUT, amountMinor: 1500, reason: 'Change for delivery driver float', performedBy: cashier._id, createdAt: daysAgo(0, 10, 30) },
      ],
      closingNotes: null,
    });
  }
}

/**
 * Final stock reconciliation.
 *
 * 45 ingredients x 3 branches drained by ~500 seeded orders leaves most lines
 * at zero, which reads as a broken system rather than a working restaurant.
 * This pass restocks to a realistic on-hand level and then deliberately puts a
 * small, fixed number of lines into low/out state so the dashboard's alert
 * tiles and the inventory filters all have something true to show.
 */
async function reconcileSeedStock(
  restaurantId: Types.ObjectId,
  branches: BranchDocument[],
  ingredientsByBranch: Map<string, Map<string, IngredientDocument>>,
  ownerUserId: Types.ObjectId,
  rng: Rng,
): Promise<void> {
  for (const [branchIndex, branch] of branches.entries()) {
    const ingredientMap = ingredientsByBranch.get(branch.code);
    if (!ingredientMap) continue;

    const skus = [...ingredientMap.keys()].sort();
    // Two out-of-stock and four low per branch, offset so branches differ.
    const outSkus = new Set([skus[(branchIndex * 5 + 2) % skus.length]!, skus[(branchIndex * 5 + 9) % skus.length]!]);
    const lowSkus = new Set(
      [3, 11, 17, 23].map((step) => skus[(branchIndex * 7 + step) % skus.length]!).filter((sku) => !outSkus.has(sku)),
    );

    for (const [sku, ingredient] of ingredientMap) {
      const template = INGREDIENT_TEMPLATES.find((t) => t.sku === sku);
      if (!template) continue;

      let target: number;
      if (outSkus.has(sku)) {
        target = 0;
      } else if (lowSkus.has(sku)) {
        target = Math.max(1, Math.round(template.reorderLevelBase * (0.35 + rng() * 0.45)));
      } else {
        target = Math.round(template.openingStockBase * (1.1 + rng() * 0.8));
      }

      const delta = target - ingredient.currentStockBase;
      if (delta === 0) continue;

      ingredient.currentStockBase = target;
      await ingredient.save();

      await InventoryTransaction.create({
        restaurantId,
        branchId: branch._id,
        ingredientId: ingredient._id,
        type: delta > 0 ? INVENTORY_TRANSACTION_TYPE.STOCK_IN : INVENTORY_TRANSACTION_TYPE.ADJUSTMENT,
        quantityBase: Math.abs(delta),
        unitCostMinor: template.costPerPurchaseUnitMinor,
        balanceAfterBase: target,
        referenceType: 'adjustment',
        referenceId: null,
        notes: delta > 0 ? 'Weekly delivery received' : 'Stocktake correction',
        performedBy: ownerUserId,
      });
    }
  }
}

async function seedNotifications(
  restaurantId: Types.ObjectId,
  branches: BranchDocument[],
  ingredientsByBranch: Map<string, Map<string, IngredientDocument>>,
): Promise<void> {
  for (const branch of branches) {
    const ingredientMap = ingredientsByBranch.get(branch.code);
    if (!ingredientMap) continue;
    const lowStock = [...ingredientMap.values()].filter((ing) => ing.currentStockBase <= ing.reorderLevelBase);

    for (const ing of lowStock.slice(0, 3)) {
      await Notification.create({
        restaurantId,
        branchId: branch._id,
        userId: null,
        type: ing.currentStockBase === 0 ? NOTIFICATION_TYPE.STOCK_OUT : NOTIFICATION_TYPE.STOCK_LOW,
        severity: ing.currentStockBase === 0 ? NOTIFICATION_SEVERITY.CRITICAL : NOTIFICATION_SEVERITY.WARNING,
        title: ing.currentStockBase === 0 ? `${ing.name} is out of stock` : `${ing.name} is running low`,
        message: `${branch.name}: ${ing.currentStockBase} ${ing.consumptionUnit} remaining (reorder level ${ing.reorderLevelBase}).`,
        link: '/inventory',
        relatedEntityType: 'Ingredient',
        relatedEntityId: ing._id,
        isRead: false,
        readAt: null,
      });
    }

    await Notification.create({
      restaurantId,
      branchId: branch._id,
      userId: null,
      type: NOTIFICATION_TYPE.RESERVATION_REMINDER,
      severity: NOTIFICATION_SEVERITY.INFO,
      title: 'Upcoming reservations today',
      message: `${branch.name} has reservations booked for this evening.`,
      link: '/reservations',
      relatedEntityType: null,
      relatedEntityId: null,
      isRead: false,
      readAt: null,
    });
  }
}

async function seedAuditLogs(restaurantId: Types.ObjectId, ownerUser: UserDocument): Promise<void> {
  const entries: Array<{ action: string; description: string }> = [
    { action: 'login', description: `${ownerUser.name} signed in.` },
    { action: 'create', description: 'Seed script initialised the restaurant workspace.' },
    { action: 'update', description: 'Restaurant settings were configured (tax, service charge, receipt layout).' },
  ];
  for (const entry of entries) {
    await AuditLog.create({
      restaurantId,
      branchId: null,
      userId: ownerUser._id,
      userName: ownerUser.name,
      action: entry.action,
      entityType: 'System',
      entityId: null,
      description: entry.description,
      metadata: {},
      ipAddress: null,
      userAgent: null,
    });
  }
}

async function seedCoupons(restaurantId: Types.ObjectId): Promise<void> {
  await Coupon.create([
    {
      restaurantId,
      code: 'WELCOME10',
      description: '10% off for first-time customers',
      type: 'percentage',
      value: 10,
      minOrderAmountMinor: 1000,
      usageLimit: null,
      perCustomerLimit: 1,
      startsAt: daysAgo(60),
      expiresAt: null,
      isActive: true,
    },
    {
      restaurantId,
      code: 'FAMILY5',
      description: '$5 off Family Feast Combo orders over $35',
      type: 'fixed',
      value: 500,
      minOrderAmountMinor: 3500,
      usageLimit: 200,
      perCustomerLimit: 3,
      startsAt: daysAgo(30),
      expiresAt: null,
      isActive: true,
    },
  ]);
}

async function seedAttendanceAndShifts(
  restaurantId: Types.ObjectId,
  branches: BranchDocument[],
  rng: Rng,
): Promise<void> {
  const employees = await Employee.find({ restaurantId }).lean();
  for (const employee of employees) {
    for (let dayOffset = 13; dayOffset >= 0; dayOffset -= 1) {
      if (rng() < 0.12) continue; // occasional day off
      const date = daysAgo(dayOffset, 0, 0);
      const checkInAt = daysAgo(dayOffset, 9, randomInt(rng, 0, 20));
      const checkOutAt = daysAgo(dayOffset, 17, randomInt(rng, 0, 40));
      const status = rng() < 0.08 ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.PRESENT;
      await Attendance.create({
        restaurantId,
        branchId: employee.branchId,
        employeeId: employee._id,
        date,
        checkInAt,
        checkOutAt,
        breakMinutes: 30,
        hoursWorked: 7.5,
        status,
        notes: null,
      });
    }

    for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
      await Shift.create({
        restaurantId,
        branchId: employee.branchId,
        employeeId: employee._id,
        entryType: 'shift',
        date: daysAgo(-dayOffset, 0, 0),
        startTime: '09:00',
        endTime: '17:00',
        station: employee.department,
        shiftStatus: 'scheduled',
        leaveStatus: null,
        leaveReason: null,
        notes: null,
      });
    }
  }
  void branches;
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const reset = process.argv.includes('--reset');
  await connectToDatabase();

  if (reset) {
    console.info('Dropping existing database…');
    await mongoose.connection.dropDatabase();
  }

  console.info('Seeding DineFlow POS demo data…');
  const rng = createRng(42);

  const restaurantId = new mongoose.Types.ObjectId();
  const branches = await seedBranches(restaurantId);
  const { userByEmail, usersByBranchCode, ownerUser } = await seedPeople(restaurantId, branches);
  await seedRestaurant(restaurantId, ownerUser._id);
  const settings = await seedSettings(restaurantId);

  const categories = await seedCategories(restaurantId);
  const modifierGroups = await seedModifierGroups(restaurantId);
  const menuItemsBySlug = await seedMenuItems(restaurantId, categories, modifierGroups);
  await seedRecipes(restaurantId, menuItemsBySlug);
  const menuItems = [...menuItemsBySlug.values()];

  const suppliers = await seedSuppliers(restaurantId);
  const ingredientsByBranch = await seedIngredients(restaurantId, branches, suppliers, ownerUser._id, rng);
  const tablesByBranch = await seedTables(restaurantId, branches, rng);
  const customers = await seedCustomers(restaurantId, rng);

  const recipeBySlug = new Map(MENU_ITEM_DEFS.filter((d) => d.recipe && d.recipe.length > 0).map((d) => [d.slug, d.recipe!]));
  const defaultTaxRate = settings.taxes[0]?.ratePercent ?? 8.5;

  const orderContext: OrderContext = {
    restaurantId,
    branches,
    usersByBranchCode,
    menuItems,
    modifierGroups,
    tablesByBranch,
    customers,
    taxRatePercent: defaultTaxRate,
    orderNumberPrefix: settings.orderNumberPrefix,
    ingredientsByBranch,
    recipeBySlug,
    rng,
  };

  const customerStats = await seedOrders(orderContext);
  // Hand the counter over to the running app so the next order created through
  // the POS continues the sequence instead of colliding with a seeded number.
  settings.nextOrderSequence = orderSequence + 1;
  await settings.save();
  await updateCustomerStats(customers, customerStats);
  await seedLoyaltyTransactions(restaurantId, customers, customerStats);

  await seedExpenses(restaurantId, branches, ownerUser._id, rng);
  await seedPurchasing(restaurantId, branches, suppliers, ingredientsByBranch, ownerUser._id, rng);
  await seedReservations(restaurantId, branches, tablesByBranch, customers, usersByBranchCode, rng);
  await seedCashRegisters(restaurantId, branches, usersByBranchCode, rng);
  // Must run before notifications so the low-stock alerts match final levels.
  await reconcileSeedStock(restaurantId, branches, ingredientsByBranch, ownerUser._id, rng);
  await seedNotifications(restaurantId, branches, ingredientsByBranch);
  await seedAuditLogs(restaurantId, ownerUser);
  await seedCoupons(restaurantId);
  await seedAttendanceAndShifts(restaurantId, branches, rng);

  const orderCount = await Order.countDocuments({ restaurantId });

  console.info('\nSeed complete.');
  console.info(`  Restaurant: ${RESTAURANT_DEF.name} (${branches.length} branches)`);
  console.info(`  Menu items: ${menuItems.length}`);
  console.info(`  Customers: ${customers.length}`);
  console.info(`  Orders: ${orderCount}`);
  console.info(`  Users created: ${userByEmail.size}`);
  console.info('\nDemo logins:');
  for (const account of DEMO_ACCOUNTS) {
    console.info(`  ${account.label.padEnd(18)} ${account.email.padEnd(28)} ${account.password}`);
  }

  await disconnectFromDatabase();
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
