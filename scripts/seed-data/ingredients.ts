import { UNIT, type Unit } from '../../src/constants/enums';

export interface IngredientTemplate {
  sku: string;
  name: string;
  category: string;
  purchaseUnit: Unit;
  consumptionUnit: Unit;
  /** Minor currency units per one purchase unit. */
  costPerPurchaseUnitMinor: number;
  reorderLevelBase: number;
  reorderQuantityBase: number;
  expiryTrackingEnabled: boolean;
  /** Opening stock, in the consumption unit, when a branch is seeded. */
  openingStockBase: number;
}

export const INGREDIENT_TEMPLATES: IngredientTemplate[] = [
  { sku: 'BUN-BURGER', name: 'Burger Bun', category: 'Bakery', purchaseUnit: UNIT.DOZEN, consumptionUnit: UNIT.PIECE, costPerPurchaseUnitMinor: 360, reorderLevelBase: 40, reorderQuantityBase: 120, expiryTrackingEnabled: true, openingStockBase: 96 },
  { sku: 'BREAD-SUB', name: 'Sub Roll', category: 'Bakery', purchaseUnit: UNIT.DOZEN, consumptionUnit: UNIT.PIECE, costPerPurchaseUnitMinor: 480, reorderLevelBase: 24, reorderQuantityBase: 60, expiryTrackingEnabled: true, openingStockBase: 48 },
  { sku: 'NAAN', name: 'Naan Bread', category: 'Bakery', purchaseUnit: UNIT.DOZEN, consumptionUnit: UNIT.PIECE, costPerPurchaseUnitMinor: 420, reorderLevelBase: 24, reorderQuantityBase: 60, expiryTrackingEnabled: true, openingStockBase: 60 },
  { sku: 'PATTY-BEEF', name: 'Beef Patty (120g)', category: 'Meat', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 900, reorderLevelBase: 3000, reorderQuantityBase: 10000, expiryTrackingEnabled: true, openingStockBase: 9600 },
  { sku: 'CHKN-BREAST', name: 'Chicken Breast', category: 'Meat', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 700, reorderLevelBase: 3000, reorderQuantityBase: 10000, expiryTrackingEnabled: true, openingStockBase: 8000 },
  { sku: 'CHKN-THIGH', name: 'Chicken Thigh (boneless)', category: 'Meat', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 550, reorderLevelBase: 2000, reorderQuantityBase: 8000, expiryTrackingEnabled: true, openingStockBase: 6000 },
  { sku: 'RIBS-PORK', name: 'Pork Ribs', category: 'Meat', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 1100, reorderLevelBase: 2000, reorderQuantityBase: 6000, expiryTrackingEnabled: true, openingStockBase: 5000 },
  { sku: 'BACON', name: 'Bacon Strips', category: 'Meat', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 1400, reorderLevelBase: 1000, reorderQuantityBase: 4000, expiryTrackingEnabled: true, openingStockBase: 3000 },
  { sku: 'SHRIMP', name: 'Shrimp (peeled)', category: 'Seafood', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 1800, reorderLevelBase: 1500, reorderQuantityBase: 5000, expiryTrackingEnabled: true, openingStockBase: 4000 },
  { sku: 'SALMON', name: 'Salmon Fillet', category: 'Seafood', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 2400, reorderLevelBase: 1500, reorderQuantityBase: 5000, expiryTrackingEnabled: true, openingStockBase: 4000 },
  { sku: 'CHEESE-CHDR', name: 'Cheddar Cheese Slice', category: 'Dairy', purchaseUnit: UNIT.PIECE, consumptionUnit: UNIT.PIECE, costPerPurchaseUnitMinor: 40, reorderLevelBase: 80, reorderQuantityBase: 240, expiryTrackingEnabled: true, openingStockBase: 240 },
  { sku: 'CHEESE-MOZZ', name: 'Mozzarella Cheese', category: 'Dairy', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 850, reorderLevelBase: 2000, reorderQuantityBase: 6000, expiryTrackingEnabled: true, openingStockBase: 6000 },
  { sku: 'CREAM', name: 'Heavy Cream', category: 'Dairy', purchaseUnit: UNIT.LITRE, consumptionUnit: UNIT.MILLILITRE, costPerPurchaseUnitMinor: 600, reorderLevelBase: 2000, reorderQuantityBase: 6000, expiryTrackingEnabled: true, openingStockBase: 6000 },
  { sku: 'BUTTER', name: 'Butter', category: 'Dairy', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 900, reorderLevelBase: 1000, reorderQuantityBase: 4000, expiryTrackingEnabled: true, openingStockBase: 3000 },
  { sku: 'MILK', name: 'Whole Milk', category: 'Dairy', purchaseUnit: UNIT.LITRE, consumptionUnit: UNIT.MILLILITRE, costPerPurchaseUnitMinor: 180, reorderLevelBase: 3000, reorderQuantityBase: 10000, expiryTrackingEnabled: true, openingStockBase: 8000 },
  { sku: 'EGG', name: 'Eggs', category: 'Dairy', purchaseUnit: UNIT.DOZEN, consumptionUnit: UNIT.PIECE, costPerPurchaseUnitMinor: 350, reorderLevelBase: 48, reorderQuantityBase: 120, expiryTrackingEnabled: true, openingStockBase: 120 },
  { sku: 'LETTUCE', name: 'Iceberg Lettuce', category: 'Produce', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 250, reorderLevelBase: 2000, reorderQuantityBase: 6000, expiryTrackingEnabled: true, openingStockBase: 5000 },
  { sku: 'TOMATO', name: 'Tomato', category: 'Produce', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 300, reorderLevelBase: 2000, reorderQuantityBase: 6000, expiryTrackingEnabled: true, openingStockBase: 5000 },
  { sku: 'ONION', name: 'Red Onion', category: 'Produce', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 200, reorderLevelBase: 2000, reorderQuantityBase: 6000, expiryTrackingEnabled: false, openingStockBase: 6000 },
  { sku: 'PICKLE', name: 'Pickles', category: 'Produce', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 400, reorderLevelBase: 800, reorderQuantityBase: 3000, expiryTrackingEnabled: true, openingStockBase: 2500 },
  { sku: 'SPINACH', name: 'Baby Spinach', category: 'Produce', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 400, reorderLevelBase: 1000, reorderQuantityBase: 3000, expiryTrackingEnabled: true, openingStockBase: 2500 },
  { sku: 'AVOCADO', name: 'Avocado', category: 'Produce', purchaseUnit: UNIT.PIECE, consumptionUnit: UNIT.PIECE, costPerPurchaseUnitMinor: 90, reorderLevelBase: 20, reorderQuantityBase: 80, expiryTrackingEnabled: true, openingStockBase: 60 },
  { sku: 'LIME', name: 'Lime', category: 'Produce', purchaseUnit: UNIT.PIECE, consumptionUnit: UNIT.PIECE, costPerPurchaseUnitMinor: 15, reorderLevelBase: 40, reorderQuantityBase: 150, expiryTrackingEnabled: true, openingStockBase: 100 },
  { sku: 'STRAWBERRY', name: 'Strawberries', category: 'Produce', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 700, reorderLevelBase: 1000, reorderQuantityBase: 3000, expiryTrackingEnabled: true, openingStockBase: 2000 },
  { sku: 'ORANGE', name: 'Orange', category: 'Produce', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 250, reorderLevelBase: 2000, reorderQuantityBase: 6000, expiryTrackingEnabled: true, openingStockBase: 4000 },
  { sku: 'MINT', name: 'Fresh Mint', category: 'Produce', purchaseUnit: UNIT.PACK, consumptionUnit: UNIT.PIECE, costPerPurchaseUnitMinor: 150, reorderLevelBase: 10, reorderQuantityBase: 40, expiryTrackingEnabled: true, openingStockBase: 30 },
  { sku: 'KIWI', name: 'Kiwi Fruit', category: 'Produce', purchaseUnit: UNIT.PIECE, consumptionUnit: UNIT.PIECE, costPerPurchaseUnitMinor: 40, reorderLevelBase: 20, reorderQuantityBase: 80, expiryTrackingEnabled: true, openingStockBase: 60 },
  { sku: 'SAUCE-MAYO', name: 'Mayonnaise', category: 'Condiment', purchaseUnit: UNIT.LITRE, consumptionUnit: UNIT.MILLILITRE, costPerPurchaseUnitMinor: 700, reorderLevelBase: 1000, reorderQuantityBase: 4000, expiryTrackingEnabled: true, openingStockBase: 3000 },
  { sku: 'SAUCE-KETCH', name: 'Ketchup', category: 'Condiment', purchaseUnit: UNIT.LITRE, consumptionUnit: UNIT.MILLILITRE, costPerPurchaseUnitMinor: 500, reorderLevelBase: 1000, reorderQuantityBase: 4000, expiryTrackingEnabled: false, openingStockBase: 3000 },
  { sku: 'SAUCE-BBQ', name: 'BBQ Sauce', category: 'Condiment', purchaseUnit: UNIT.LITRE, consumptionUnit: UNIT.MILLILITRE, costPerPurchaseUnitMinor: 650, reorderLevelBase: 800, reorderQuantityBase: 3000, expiryTrackingEnabled: false, openingStockBase: 2500 },
  { sku: 'TOMATO-SAUCE', name: 'Pizza Tomato Sauce', category: 'Condiment', purchaseUnit: UNIT.LITRE, consumptionUnit: UNIT.MILLILITRE, costPerPurchaseUnitMinor: 350, reorderLevelBase: 1500, reorderQuantityBase: 5000, expiryTrackingEnabled: true, openingStockBase: 4000 },
  { sku: 'CURRY-PASTE', name: 'Curry Paste', category: 'Condiment', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 900, reorderLevelBase: 1000, reorderQuantityBase: 3000, expiryTrackingEnabled: true, openingStockBase: 2500 },
  { sku: 'COCONUT-MILK', name: 'Coconut Milk', category: 'Pantry', purchaseUnit: UNIT.CAN, consumptionUnit: UNIT.PIECE, costPerPurchaseUnitMinor: 180, reorderLevelBase: 20, reorderQuantityBase: 80, expiryTrackingEnabled: false, openingStockBase: 60 },
  { sku: 'CHICKPEA', name: 'Chickpeas (canned)', category: 'Pantry', purchaseUnit: UNIT.CAN, consumptionUnit: UNIT.PIECE, costPerPurchaseUnitMinor: 110, reorderLevelBase: 20, reorderQuantityBase: 80, expiryTrackingEnabled: false, openingStockBase: 60 },
  { sku: 'FLOUR-PIZZA', name: 'Pizza Dough Flour', category: 'Pantry', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 180, reorderLevelBase: 5000, reorderQuantityBase: 15000, expiryTrackingEnabled: false, openingStockBase: 12000 },
  { sku: 'PASTA-SPAG', name: 'Spaghetti', category: 'Pantry', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 220, reorderLevelBase: 4000, reorderQuantityBase: 12000, expiryTrackingEnabled: false, openingStockBase: 10000 },
  { sku: 'PASTA-PENNE', name: 'Penne Pasta', category: 'Pantry', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 220, reorderLevelBase: 4000, reorderQuantityBase: 12000, expiryTrackingEnabled: false, openingStockBase: 10000 },
  { sku: 'PASTA-FETT', name: 'Fettuccine', category: 'Pantry', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 230, reorderLevelBase: 3000, reorderQuantityBase: 10000, expiryTrackingEnabled: false, openingStockBase: 8000 },
  { sku: 'RICE-BASMATI', name: 'Basmati Rice', category: 'Pantry', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 260, reorderLevelBase: 5000, reorderQuantityBase: 20000, expiryTrackingEnabled: false, openingStockBase: 15000 },
  { sku: 'CHOCOLATE', name: 'Dark Chocolate', category: 'Pantry', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 1200, reorderLevelBase: 1000, reorderQuantityBase: 3000, expiryTrackingEnabled: false, openingStockBase: 2500 },
  { sku: 'FLOUR-CAKE', name: 'Cake Flour', category: 'Pantry', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 160, reorderLevelBase: 2000, reorderQuantityBase: 6000, expiryTrackingEnabled: false, openingStockBase: 5000 },
  { sku: 'COFFEE-BEAN', name: 'Coffee Beans', category: 'Beverage', purchaseUnit: UNIT.KILOGRAM, consumptionUnit: UNIT.GRAM, costPerPurchaseUnitMinor: 1600, reorderLevelBase: 2000, reorderQuantityBase: 6000, expiryTrackingEnabled: true, openingStockBase: 5000 },
  { sku: 'SODA-SYRUP', name: 'Soda Syrup', category: 'Beverage', purchaseUnit: UNIT.LITRE, consumptionUnit: UNIT.MILLILITRE, costPerPurchaseUnitMinor: 850, reorderLevelBase: 2000, reorderQuantityBase: 6000, expiryTrackingEnabled: false, openingStockBase: 5000 },
  { sku: 'PKG-BOX', name: 'Takeaway Box', category: 'Packaging', purchaseUnit: UNIT.PIECE, consumptionUnit: UNIT.PIECE, costPerPurchaseUnitMinor: 18, reorderLevelBase: 200, reorderQuantityBase: 1000, expiryTrackingEnabled: false, openingStockBase: 800 },
  { sku: 'PKG-CUP', name: 'Drink Cup', category: 'Packaging', purchaseUnit: UNIT.PIECE, consumptionUnit: UNIT.PIECE, costPerPurchaseUnitMinor: 12, reorderLevelBase: 200, reorderQuantityBase: 1000, expiryTrackingEnabled: false, openingStockBase: 800 },
];
