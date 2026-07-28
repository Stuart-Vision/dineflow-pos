import { KITCHEN_STATION, SPICY_LEVEL, type Allergen, type KitchenStation } from '../../src/constants/enums';
import type { FoodImageCategory } from './images';
import type { IRecipeIngredient } from '../../src/models/Recipe';

export function usd(n: number): number {
  return Math.round(n * 100);
}

export interface CategoryDef {
  name: string;
  icon: string;
  description: string;
}

export const CATEGORY_DEFS: CategoryDef[] = [
  { name: 'Appetisers', icon: 'utensils-crossed', description: 'Small plates to start the table.' },
  { name: 'Soups', icon: 'soup', description: 'Slow-simmered soups, made fresh daily.' },
  { name: 'Salads', icon: 'salad', description: 'Crisp, dressed to order, big enough to share.' },
  { name: 'Burgers', icon: 'beef', description: 'Char-grilled patties on toasted brioche.' },
  { name: 'Sandwiches', icon: 'sandwich', description: 'Stacked, pressed and served with a side.' },
  { name: 'Pizza', icon: 'pizza', description: 'Hand-stretched dough, wood-fired daily.' },
  { name: 'Pasta', icon: 'utensils', description: 'House-made and dried pasta, tossed to order.' },
  { name: 'Rice Dishes', icon: 'wheat', description: 'Fragrant rice mains from the wok and the pot.' },
  { name: 'Curry Dishes', icon: 'flame', description: 'Slow-built curries with a side of naan or rice.' },
  { name: 'Seafood', icon: 'fish', description: 'Market-fresh fish and shellfish.' },
  { name: 'Chicken & Grill', icon: 'chef-hat', description: 'Off the grill, from wings to whole racks.' },
  { name: 'Desserts', icon: 'cake-slice', description: 'A sweet finish, made in-house.' },
  { name: 'Hot Drinks', icon: 'coffee', description: 'Espresso bar favourites.' },
  { name: 'Cold Drinks', icon: 'cup-soda', description: 'Sodas, mocktails and iced classics.' },
  { name: 'Fresh Juices', icon: 'citrus', description: 'Cold-pressed, no added sugar.' },
  { name: 'Combo Meals', icon: 'package', description: 'A main, a side and a drink, bundled and discounted.' },
];

export interface ModifierOptionDef {
  name: string;
  priceMinor: number;
  isDefault?: boolean;
}
export interface ModifierGroupDef {
  name: string;
  selectionType: 'single' | 'multiple';
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  options: ModifierOptionDef[];
}

export const MODIFIER_GROUP_DEFS: ModifierGroupDef[] = [
  {
    name: 'Burger Add-ons',
    selectionType: 'multiple',
    minSelect: 0,
    maxSelect: 5,
    isRequired: false,
    options: [
      { name: 'Extra Cheese', priceMinor: usd(1) },
      { name: 'Bacon', priceMinor: usd(1.5) },
      { name: 'Avocado', priceMinor: usd(1.5) },
      { name: 'Fried Egg', priceMinor: usd(1) },
      { name: 'Extra Patty', priceMinor: usd(2.5) },
    ],
  },
  {
    name: 'Spice Level',
    selectionType: 'single',
    minSelect: 1,
    maxSelect: 1,
    isRequired: false,
    options: [
      { name: 'Mild', priceMinor: 0, isDefault: true },
      { name: 'Medium', priceMinor: 0 },
      { name: 'Hot', priceMinor: 0 },
      { name: 'Extra Hot', priceMinor: 0 },
    ],
  },
  {
    name: 'Pizza Crust',
    selectionType: 'single',
    minSelect: 1,
    maxSelect: 1,
    isRequired: false,
    options: [
      { name: 'Classic Hand-Tossed', priceMinor: 0, isDefault: true },
      { name: 'Thin Crust', priceMinor: 0 },
      { name: 'Stuffed Crust', priceMinor: usd(2) },
    ],
  },
  {
    name: 'Extra Toppings',
    selectionType: 'multiple',
    minSelect: 0,
    maxSelect: 6,
    isRequired: false,
    options: [
      { name: 'Mushrooms', priceMinor: usd(1) },
      { name: 'Pepperoni', priceMinor: usd(1.5) },
      { name: 'Jalapeños', priceMinor: usd(0.75) },
      { name: 'Extra Mozzarella', priceMinor: usd(1.5) },
      { name: 'Olives', priceMinor: usd(1) },
    ],
  },
  {
    name: 'Sauce Choice',
    selectionType: 'single',
    minSelect: 0,
    maxSelect: 1,
    isRequired: false,
    options: [
      { name: 'BBQ', priceMinor: 0, isDefault: true },
      { name: 'Buffalo', priceMinor: 0 },
      { name: 'Garlic Herb', priceMinor: 0 },
      { name: 'Sweet Chilli', priceMinor: 0 },
    ],
  },
  {
    name: 'Drink Size',
    selectionType: 'single',
    minSelect: 1,
    maxSelect: 1,
    isRequired: true,
    options: [
      { name: 'Regular', priceMinor: 0, isDefault: true },
      { name: 'Large', priceMinor: usd(1) },
    ],
  },
  {
    name: 'Milk Choice',
    selectionType: 'single',
    minSelect: 0,
    maxSelect: 1,
    isRequired: false,
    options: [
      { name: 'Whole Milk', priceMinor: 0, isDefault: true },
      { name: 'Oat Milk', priceMinor: usd(0.6) },
      { name: 'Almond Milk', priceMinor: usd(0.6) },
    ],
  },
  {
    name: 'Salad Protein Add-on',
    selectionType: 'single',
    minSelect: 0,
    maxSelect: 1,
    isRequired: false,
    options: [
      { name: 'Grilled Chicken', priceMinor: usd(3) },
      { name: 'Grilled Shrimp', priceMinor: usd(4) },
      { name: 'Salmon', priceMinor: usd(5) },
    ],
  },
];

export interface MenuItemDef {
  slug: string;
  name: string;
  category: string;
  description: string;
  priceMinor: number;
  costPriceMinor: number;
  kitchenStation: KitchenStation;
  prepTimeMinutes: number;
  imageCategory: FoodImageCategory;
  imageIndex: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  spicyLevel?: (typeof SPICY_LEVEL)[keyof typeof SPICY_LEVEL];
  allergens?: Allergen[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  modifierGroups?: string[];
  portionSizes?: { name: string; priceMinor: number; costPriceMinor: number; isDefault?: boolean }[];
  isCombo?: boolean;
  recipe?: IRecipeIngredient[];
  sortOrder?: number;
}

function ing(sku: string, quantityBase: number, unit: IRecipeIngredient['unit']): IRecipeIngredient {
  return { ingredientSku: sku, quantityBase, unit };
}

export const MENU_ITEM_DEFS: MenuItemDef[] = [
  // --- Appetisers -----------------------------------------------------------
  {
    slug: 'crispy-spring-rolls', name: 'Crispy Vegetable Spring Rolls', category: 'Appetisers',
    description: 'Hand-rolled spring rolls packed with cabbage, carrot and glass noodles, served with sweet chilli sauce.',
    priceMinor: usd(7.5), costPriceMinor: usd(2.1), kitchenStation: KITCHEN_STATION.FRYER, prepTimeMinutes: 10,
    imageCategory: 'appetisers', imageIndex: 0, isVegetarian: true, isVegan: true, allergens: ['gluten'],
  },
  {
    slug: 'loaded-nachos', name: 'Loaded Nachos', category: 'Appetisers',
    description: 'Corn tortilla chips with melted cheddar, jalapeños, salsa, sour cream and guacamole.',
    priceMinor: usd(9.5), costPriceMinor: usd(2.8), kitchenStation: KITCHEN_STATION.EXPO, prepTimeMinutes: 8,
    imageCategory: 'appetisers', imageIndex: 1, isVegetarian: true, allergens: ['dairy'], isBestSeller: true,
  },
  {
    slug: 'garlic-cheese-bread', name: 'Garlic & Cheese Bread', category: 'Appetisers',
    description: 'Wood-fired flatbread brushed with garlic butter and finished with mozzarella.',
    priceMinor: usd(6.5), costPriceMinor: usd(1.6), kitchenStation: KITCHEN_STATION.PIZZA, prepTimeMinutes: 9,
    imageCategory: 'bread', imageIndex: 0, isVegetarian: true, allergens: ['gluten', 'dairy'],
    recipe: [ing('FLOUR-PIZZA', 150, 'g'), ing('BUTTER', 20, 'g'), ing('CHEESE-MOZZ', 60, 'g')],
  },
  {
    slug: 'chicken-wings-bbq', name: 'BBQ Chicken Wings', category: 'Appetisers',
    description: 'Twice-cooked wings tossed in smoky BBQ glaze, served with celery and ranch.',
    priceMinor: usd(10.5), costPriceMinor: usd(3.4), kitchenStation: KITCHEN_STATION.GRILL, prepTimeMinutes: 14,
    imageCategory: 'appetisers', imageIndex: 1, allergens: [], modifierGroups: ['Sauce Choice'],
    recipe: [ing('CHKN-THIGH', 220, 'g'), ing('SAUCE-BBQ', 30, 'ml')],
  },
  {
    slug: 'crispy-calamari', name: 'Crispy Calamari', category: 'Appetisers',
    description: 'Lightly battered calamari rings, fried to order, with lemon aioli.',
    priceMinor: usd(11), costPriceMinor: usd(3.8), kitchenStation: KITCHEN_STATION.FRYER, prepTimeMinutes: 9,
    imageCategory: 'appetisers', imageIndex: 0, allergens: ['gluten', 'shellfish'],
  },

  // --- Soups ------------------------------------------------------------------
  {
    slug: 'roasted-pumpkin-soup', name: 'Roasted Pumpkin & Ginger Soup', category: 'Soups',
    description: 'Slow-roasted pumpkin blended with ginger and coconut cream, finished with toasted seeds.',
    priceMinor: usd(6.5), costPriceMinor: usd(1.5), kitchenStation: KITCHEN_STATION.EXPO, prepTimeMinutes: 6,
    imageCategory: 'soups', imageIndex: 0, isVegetarian: true, isVegan: true,
    recipe: [ing('COCONUT-MILK', 1, 'pc'), ing('CREAM', 40, 'ml')],
  },
  {
    slug: 'creamy-tomato-basil-soup', name: 'Creamy Tomato Basil Soup', category: 'Soups',
    description: 'Vine tomatoes simmered with basil and cream, topped with a swirl and croutons.',
    priceMinor: usd(6), costPriceMinor: usd(1.3), kitchenStation: KITCHEN_STATION.EXPO, prepTimeMinutes: 6,
    imageCategory: 'soups', imageIndex: 1, isVegetarian: true, allergens: ['dairy', 'gluten'],
    recipe: [ing('TOMATO-SAUCE', 250, 'ml'), ing('CREAM', 40, 'ml')],
  },
  {
    slug: 'spicy-chicken-tom-yum', name: 'Spicy Chicken Tom Yum', category: 'Soups',
    description: 'Thai hot-and-sour broth with lemongrass, chicken, mushroom and lime.',
    priceMinor: usd(8), costPriceMinor: usd(2.4), kitchenStation: KITCHEN_STATION.WOK, prepTimeMinutes: 12,
    imageCategory: 'curry', imageIndex: 1, spicyLevel: SPICY_LEVEL.HOT, allergens: ['fish'],
    recipe: [ing('CHKN-THIGH', 120, 'g'), ing('LIME', 1, 'pc')],
  },

  // --- Salads -------------------------------------------------------------------
  {
    slug: 'caesar-salad', name: 'Classic Caesar Salad', category: 'Salads',
    description: 'Baby cos lettuce, parmesan, garlic croutons and house Caesar dressing.',
    priceMinor: usd(9.5), costPriceMinor: usd(2.6), kitchenStation: KITCHEN_STATION.SALAD, prepTimeMinutes: 7,
    imageCategory: 'salads', imageIndex: 0, allergens: ['dairy', 'gluten', 'eggs'], isBestSeller: true,
    modifierGroups: ['Salad Protein Add-on'],
    recipe: [ing('LETTUCE', 150, 'g'), ing('CHEESE-MOZZ', 20, 'g'), ing('EGG', 1, 'pc')],
  },
  {
    slug: 'avocado-quinoa-bowl', name: 'Avocado & Quinoa Bowl', category: 'Salads',
    description: 'Quinoa, chickpeas, avocado, cherry tomato and roasted sweet potato with lemon-tahini dressing.',
    priceMinor: usd(10.5), costPriceMinor: usd(3.1), kitchenStation: KITCHEN_STATION.SALAD, prepTimeMinutes: 8,
    imageCategory: 'salads', imageIndex: 1, isVegetarian: true, isVegan: true, isFeatured: true,
    recipe: [ing('AVOCADO', 1, 'pc'), ing('CHICKPEA', 1, 'pc'), ing('TOMATO', 60, 'g')],
  },
  {
    slug: 'grilled-salmon-poke-bowl', name: 'Grilled Salmon Poke Bowl', category: 'Salads',
    description: 'Seared salmon, sweetcorn, edamame, pickled red cabbage and sesame dressing over greens.',
    priceMinor: usd(13.5), costPriceMinor: usd(4.6), kitchenStation: KITCHEN_STATION.GRILL, prepTimeMinutes: 10,
    imageCategory: 'salads', imageIndex: 2, allergens: ['fish', 'soy'], isFeatured: true,
    recipe: [ing('SALMON', 140, 'g'), ing('LETTUCE', 80, 'g')],
  },
  {
    slug: 'mediterranean-wrap-plate', name: 'Mediterranean Wrap Plate', category: 'Salads',
    description: 'Falafel, hummus, pickled onion and greens wrapped and served with a side salad.',
    priceMinor: usd(9), costPriceMinor: usd(2.4), kitchenStation: KITCHEN_STATION.SALAD, prepTimeMinutes: 8,
    imageCategory: 'salads', imageIndex: 3, isVegetarian: true, allergens: ['gluten'],
    recipe: [ing('CHICKPEA', 1, 'pc'), ing('LETTUCE', 60, 'g')],
  },
  {
    slug: 'garden-harvest-salad', name: 'Garden Harvest Salad', category: 'Salads',
    description: 'A rotating mix of seasonal greens, roasted vegetables and toasted nuts.',
    priceMinor: usd(8.5), costPriceMinor: usd(2.2), kitchenStation: KITCHEN_STATION.SALAD, prepTimeMinutes: 6,
    imageCategory: 'salads', imageIndex: 4, isVegetarian: true, isVegan: true,
    recipe: [ing('LETTUCE', 120, 'g'), ing('SPINACH', 40, 'g'), ing('TOMATO', 50, 'g')],
  },

  // --- Burgers --------------------------------------------------------------------
  {
    slug: 'classic-cheeseburger', name: 'Classic Cheeseburger', category: 'Burgers',
    description: 'Char-grilled beef patty, cheddar, lettuce, tomato and house sauce on a toasted brioche bun.',
    priceMinor: usd(11.5), costPriceMinor: usd(3.4), kitchenStation: KITCHEN_STATION.GRILL, prepTimeMinutes: 11,
    imageCategory: 'burgers', imageIndex: 0, allergens: ['gluten', 'dairy'], isBestSeller: true, isFeatured: true,
    modifierGroups: ['Burger Add-ons'],
    recipe: [ing('BUN-BURGER', 1, 'pc'), ing('PATTY-BEEF', 120, 'g'), ing('CHEESE-CHDR', 1, 'pc'), ing('LETTUCE', 20, 'g'), ing('TOMATO', 20, 'g'), ing('SAUCE-MAYO', 15, 'ml')],
  },
  {
    slug: 'double-smash-burger', name: 'Double Smash Burger', category: 'Burgers',
    description: 'Two smashed beef patties, double cheddar, pickles and burger sauce.',
    priceMinor: usd(13.5), costPriceMinor: usd(4.8), kitchenStation: KITCHEN_STATION.GRILL, prepTimeMinutes: 12,
    imageCategory: 'burgers', imageIndex: 5, allergens: ['gluten', 'dairy'], isBestSeller: true,
    modifierGroups: ['Burger Add-ons'],
    recipe: [ing('BUN-BURGER', 1, 'pc'), ing('PATTY-BEEF', 220, 'g'), ing('CHEESE-CHDR', 2, 'pc'), ing('PICKLE', 15, 'g'), ing('SAUCE-MAYO', 15, 'ml')],
  },
  {
    slug: 'bacon-bbq-burger', name: 'Bacon BBQ Burger', category: 'Burgers',
    description: 'Beef patty, crispy bacon, onion rings and smoky BBQ glaze.',
    priceMinor: usd(13), costPriceMinor: usd(4.5), kitchenStation: KITCHEN_STATION.GRILL, prepTimeMinutes: 12,
    imageCategory: 'burgers', imageIndex: 2, allergens: ['gluten'],
    modifierGroups: ['Burger Add-ons'],
    recipe: [ing('BUN-BURGER', 1, 'pc'), ing('PATTY-BEEF', 120, 'g'), ing('BACON', 30, 'g'), ing('ONION', 30, 'g'), ing('SAUCE-BBQ', 20, 'ml')],
  },
  {
    slug: 'crispy-chicken-burger', name: 'Crispy Chicken Burger', category: 'Burgers',
    description: 'Buttermilk-fried chicken thigh, slaw and spiced mayo on a soft bun.',
    priceMinor: usd(11.5), costPriceMinor: usd(3.6), kitchenStation: KITCHEN_STATION.FRYER, prepTimeMinutes: 12,
    imageCategory: 'sandwiches', imageIndex: 4, allergens: ['gluten', 'eggs'],
    modifierGroups: ['Spice Level'],
    recipe: [ing('BUN-BURGER', 1, 'pc'), ing('CHKN-THIGH', 160, 'g'), ing('SAUCE-MAYO', 15, 'ml')],
  },
  {
    slug: 'mushroom-swiss-burger', name: 'Mushroom Swiss Burger', category: 'Burgers',
    description: 'Beef patty topped with sautéed mushrooms and melted Swiss-style cheese.',
    priceMinor: usd(12.5), costPriceMinor: usd(4.1), kitchenStation: KITCHEN_STATION.GRILL, prepTimeMinutes: 12,
    imageCategory: 'burgers', imageIndex: 4, allergens: ['gluten', 'dairy'],
    modifierGroups: ['Burger Add-ons'],
    recipe: [ing('BUN-BURGER', 1, 'pc'), ing('PATTY-BEEF', 120, 'g'), ing('CHEESE-CHDR', 1, 'pc')],
  },
  {
    slug: 'triple-stack-burger', name: 'Triple Stack Burger', category: 'Burgers',
    description: 'Three beef patties, three cheese layers, pickles and burger sauce. Not for the faint-hearted.',
    priceMinor: usd(16.5), costPriceMinor: usd(6.2), kitchenStation: KITCHEN_STATION.GRILL, prepTimeMinutes: 14,
    imageCategory: 'burgers', imageIndex: 6, allergens: ['gluten', 'dairy'],
    modifierGroups: ['Burger Add-ons'],
    recipe: [ing('BUN-BURGER', 1, 'pc'), ing('PATTY-BEEF', 330, 'g'), ing('CHEESE-CHDR', 3, 'pc')],
  },
  {
    slug: 'veggie-black-bean-burger', name: 'Veggie Black Bean Burger', category: 'Burgers',
    description: 'House-made black bean and corn patty with avocado and chipotle mayo.',
    priceMinor: usd(10.5), costPriceMinor: usd(2.6), kitchenStation: KITCHEN_STATION.GRILL, prepTimeMinutes: 10,
    imageCategory: 'burgers', imageIndex: 3, isVegetarian: true, allergens: ['gluten'],
    recipe: [ing('BUN-BURGER', 1, 'pc'), ing('AVOCADO', 1, 'pc'), ing('LETTUCE', 20, 'g')],
  },

  // --- Sandwiches ------------------------------------------------------------
  {
    slug: 'club-sandwich', name: 'Classic Club Sandwich', category: 'Sandwiches',
    description: 'Triple-decker with chicken, bacon, lettuce, tomato and mayo, served with fries.',
    priceMinor: usd(10.5), costPriceMinor: usd(3.2), kitchenStation: KITCHEN_STATION.EXPO, prepTimeMinutes: 9,
    imageCategory: 'sandwiches', imageIndex: 2, allergens: ['gluten', 'eggs'], isBestSeller: true,
    recipe: [ing('BREAD-SUB', 1, 'pc'), ing('CHKN-BREAST', 120, 'g'), ing('BACON', 20, 'g'), ing('LETTUCE', 20, 'g'), ing('TOMATO', 20, 'g'), ing('SAUCE-MAYO', 15, 'ml')],
  },
  {
    slug: 'italian-deli-sandwich', name: 'Italian Deli Sandwich', category: 'Sandwiches',
    description: 'Layers of cured meats, provolone, pickled peppers and Italian dressing on a fresh sub roll.',
    priceMinor: usd(10), costPriceMinor: usd(3.4), kitchenStation: KITCHEN_STATION.EXPO, prepTimeMinutes: 7,
    imageCategory: 'sandwiches', imageIndex: 3, allergens: ['gluten', 'dairy'],
    recipe: [ing('BREAD-SUB', 1, 'pc'), ing('CHEESE-CHDR', 2, 'pc'), ing('LETTUCE', 20, 'g'), ing('TOMATO', 20, 'g')],
  },
  {
    slug: 'grilled-veggie-panini', name: 'Grilled Vegetable Panini', category: 'Sandwiches',
    description: 'Courgette, pepper and red onion pressed with mozzarella and pesto.',
    priceMinor: usd(9), costPriceMinor: usd(2.3), kitchenStation: KITCHEN_STATION.EXPO, prepTimeMinutes: 8,
    imageCategory: 'sandwiches', imageIndex: 1, isVegetarian: true, allergens: ['gluten', 'dairy'],
    recipe: [ing('BREAD-SUB', 1, 'pc'), ing('CHEESE-MOZZ', 60, 'g'), ing('ONION', 30, 'g')],
  },
  {
    slug: 'philly-cheesesteak', name: 'Philly Cheesesteak', category: 'Sandwiches',
    description: 'Thin-sliced beef, sautéed onion and pepper, smothered in melted cheese.',
    priceMinor: usd(11.5), costPriceMinor: usd(4.1), kitchenStation: KITCHEN_STATION.GRILL, prepTimeMinutes: 10,
    imageCategory: 'sandwiches', imageIndex: 0, allergens: ['gluten', 'dairy'],
    recipe: [ing('BREAD-SUB', 1, 'pc'), ing('PATTY-BEEF', 150, 'g'), ing('ONION', 40, 'g'), ing('CHEESE-CHDR', 2, 'pc')],
  },
  {
    slug: 'egg-avocado-sandwich', name: 'Egg & Avocado Sandwich', category: 'Sandwiches',
    description: 'Soft scrambled egg, smashed avocado and greens on toasted sourdough.',
    priceMinor: usd(8.5), costPriceMinor: usd(2.1), kitchenStation: KITCHEN_STATION.EXPO, prepTimeMinutes: 7,
    imageCategory: 'sandwiches', imageIndex: 4, isVegetarian: true, allergens: ['gluten', 'eggs'],
    recipe: [ing('BREAD-SUB', 1, 'pc'), ing('EGG', 2, 'pc'), ing('AVOCADO', 1, 'pc')],
  },

  // --- Pizza -----------------------------------------------------------------
  {
    slug: 'margherita-pizza', name: 'Margherita Pizza', category: 'Pizza',
    description: 'San Marzano tomato, fresh mozzarella and basil on a hand-stretched base.',
    priceMinor: usd(12.5), costPriceMinor: usd(3.2), kitchenStation: KITCHEN_STATION.PIZZA, prepTimeMinutes: 13,
    imageCategory: 'pizza', imageIndex: 1, isVegetarian: true, allergens: ['gluten', 'dairy'], isBestSeller: true, isFeatured: true,
    modifierGroups: ['Pizza Crust', 'Extra Toppings'],
    portionSizes: [
      { name: '10-inch', priceMinor: usd(12.5), costPriceMinor: usd(3.2), isDefault: true },
      { name: '14-inch', priceMinor: usd(17.5), costPriceMinor: usd(4.6) },
    ],
    recipe: [ing('FLOUR-PIZZA', 220, 'g'), ing('TOMATO-SAUCE', 90, 'ml'), ing('CHEESE-MOZZ', 130, 'g')],
  },
  {
    slug: 'bbq-chicken-pizza', name: 'BBQ Chicken Pizza', category: 'Pizza',
    description: 'Smoky BBQ base, grilled chicken, red onion and mozzarella.',
    priceMinor: usd(14.5), costPriceMinor: usd(4.4), kitchenStation: KITCHEN_STATION.PIZZA, prepTimeMinutes: 14,
    imageCategory: 'pizza', imageIndex: 0, allergens: ['gluten', 'dairy'], isBestSeller: true,
    modifierGroups: ['Pizza Crust', 'Extra Toppings'],
    portionSizes: [
      { name: '10-inch', priceMinor: usd(14.5), costPriceMinor: usd(4.4), isDefault: true },
      { name: '14-inch', priceMinor: usd(19.5), costPriceMinor: usd(6.1) },
    ],
    recipe: [ing('FLOUR-PIZZA', 220, 'g'), ing('SAUCE-BBQ', 70, 'ml'), ing('CHKN-BREAST', 100, 'g'), ing('CHEESE-MOZZ', 110, 'g'), ing('ONION', 30, 'g')],
  },
  {
    slug: 'pepperoni-pizza', name: 'Classic Pepperoni Pizza', category: 'Pizza',
    description: 'Double pepperoni, mozzarella and oregano on a crisp base.',
    priceMinor: usd(13.5), costPriceMinor: usd(3.9), kitchenStation: KITCHEN_STATION.PIZZA, prepTimeMinutes: 13,
    imageCategory: 'pizza', imageIndex: 3, allergens: ['gluten', 'dairy'], isFeatured: true,
    modifierGroups: ['Pizza Crust', 'Extra Toppings'],
    recipe: [ing('FLOUR-PIZZA', 220, 'g'), ing('TOMATO-SAUCE', 90, 'ml'), ing('CHEESE-MOZZ', 130, 'g')],
  },
  {
    slug: 'four-cheese-pizza', name: 'Four Cheese Pizza', category: 'Pizza',
    description: 'Mozzarella, cheddar, parmesan and gorgonzola on a white base.',
    priceMinor: usd(14), costPriceMinor: usd(4.6), kitchenStation: KITCHEN_STATION.PIZZA, prepTimeMinutes: 13,
    imageCategory: 'pizza', imageIndex: 2, isVegetarian: true, allergens: ['gluten', 'dairy'],
    modifierGroups: ['Pizza Crust'],
    recipe: [ing('FLOUR-PIZZA', 220, 'g'), ing('CHEESE-MOZZ', 150, 'g'), ing('CHEESE-CHDR', 2, 'pc')],
  },
  {
    slug: 'veggie-supreme-pizza', name: 'Veggie Supreme Pizza', category: 'Pizza',
    description: 'Peppers, mushroom, olives, onion and sweetcorn on tomato base.',
    priceMinor: usd(13.5), costPriceMinor: usd(3.7), kitchenStation: KITCHEN_STATION.PIZZA, prepTimeMinutes: 13,
    imageCategory: 'pizza', imageIndex: 1, isVegetarian: true, allergens: ['gluten', 'dairy'],
    modifierGroups: ['Pizza Crust', 'Extra Toppings'],
    recipe: [ing('FLOUR-PIZZA', 220, 'g'), ing('TOMATO-SAUCE', 90, 'ml'), ing('CHEESE-MOZZ', 110, 'g'), ing('ONION', 30, 'g')],
  },
  {
    slug: 'spicy-diavola-pizza', name: 'Spicy Diavola Pizza', category: 'Pizza',
    description: 'Spicy salami, chilli flakes and mozzarella for those who like the heat.',
    priceMinor: usd(14.5), costPriceMinor: usd(4.3), kitchenStation: KITCHEN_STATION.PIZZA, prepTimeMinutes: 13,
    imageCategory: 'pizza', imageIndex: 3, spicyLevel: SPICY_LEVEL.HOT, allergens: ['gluten', 'dairy'],
    modifierGroups: ['Pizza Crust', 'Extra Toppings'],
    recipe: [ing('FLOUR-PIZZA', 220, 'g'), ing('TOMATO-SAUCE', 90, 'ml'), ing('CHEESE-MOZZ', 120, 'g')],
  },

  // --- Pasta -----------------------------------------------------------------
  {
    slug: 'spaghetti-carbonara', name: 'Spaghetti Carbonara', category: 'Pasta',
    description: 'Guanciale-style bacon, egg yolk, parmesan and cracked pepper — no cream.',
    priceMinor: usd(13), costPriceMinor: usd(3.6), kitchenStation: KITCHEN_STATION.EXPO, prepTimeMinutes: 12,
    imageCategory: 'pasta', imageIndex: 0, allergens: ['gluten', 'dairy', 'eggs'], isBestSeller: true,
    recipe: [ing('PASTA-SPAG', 180, 'g'), ing('BACON', 60, 'g'), ing('EGG', 2, 'pc'), ing('CHEESE-MOZZ', 30, 'g')],
  },
  {
    slug: 'penne-arrabbiata', name: 'Penne Arrabbiata', category: 'Pasta',
    description: 'Fiery tomato sauce with garlic and chilli, tossed with penne.',
    priceMinor: usd(11.5), costPriceMinor: usd(2.6), kitchenStation: KITCHEN_STATION.EXPO, prepTimeMinutes: 11,
    imageCategory: 'pasta', imageIndex: 4, isVegetarian: true, isVegan: true, spicyLevel: SPICY_LEVEL.MEDIUM, allergens: ['gluten'],
    recipe: [ing('PASTA-PENNE', 180, 'g'), ing('TOMATO-SAUCE', 150, 'ml')],
  },
  {
    slug: 'shrimp-scampi-linguine', name: 'Shrimp Scampi Linguine', category: 'Pasta',
    description: 'Garlic-butter shrimp with white wine, chilli flakes and parsley.',
    priceMinor: usd(15.5), costPriceMinor: usd(5.4), kitchenStation: KITCHEN_STATION.EXPO, prepTimeMinutes: 13,
    imageCategory: 'pasta', imageIndex: 2, allergens: ['gluten', 'shellfish'], isFeatured: true,
    recipe: [ing('PASTA-SPAG', 180, 'g'), ing('SHRIMP', 150, 'g'), ing('BUTTER', 30, 'g')],
  },
  {
    slug: 'fettuccine-alfredo', name: 'Fettuccine Alfredo', category: 'Pasta',
    description: 'Fresh fettuccine in a silky parmesan cream sauce.',
    priceMinor: usd(12.5), costPriceMinor: usd(3.4), kitchenStation: KITCHEN_STATION.EXPO, prepTimeMinutes: 11,
    imageCategory: 'pasta', imageIndex: 3, isVegetarian: true, allergens: ['gluten', 'dairy'],
    recipe: [ing('PASTA-FETT', 180, 'g'), ing('CREAM', 120, 'ml'), ing('BUTTER', 20, 'g')],
  },
  {
    slug: 'beef-bolognese', name: 'Spaghetti Bolognese', category: 'Pasta',
    description: 'Slow-cooked beef ragu simmered with tomato, carrot and red wine.',
    priceMinor: usd(13.5), costPriceMinor: usd(4.1), kitchenStation: KITCHEN_STATION.EXPO, prepTimeMinutes: 12,
    imageCategory: 'pasta', imageIndex: 1, allergens: ['gluten'], isBestSeller: true,
    recipe: [ing('PASTA-SPAG', 180, 'g'), ing('PATTY-BEEF', 150, 'g'), ing('TOMATO-SAUCE', 120, 'ml')],
  },
  {
    slug: 'pesto-genovese-pasta', name: 'Pesto Genovese Pasta', category: 'Pasta',
    description: 'Basil pesto, pine nuts and parmesan tossed through penne.',
    priceMinor: usd(12), costPriceMinor: usd(3.1), kitchenStation: KITCHEN_STATION.EXPO, prepTimeMinutes: 10,
    imageCategory: 'pasta', imageIndex: 4, isVegetarian: true, allergens: ['gluten', 'dairy', 'tree_nuts'],
    recipe: [ing('PASTA-PENNE', 180, 'g'), ing('CHEESE-MOZZ', 30, 'g')],
  },

  // --- Rice Dishes -------------------------------------------------------------
  {
    slug: 'chicken-fried-rice', name: 'Chicken Fried Rice', category: 'Rice Dishes',
    description: 'Wok-fried basmati rice with chicken, egg, spring onion and soy.',
    priceMinor: usd(11), costPriceMinor: usd(2.9), kitchenStation: KITCHEN_STATION.WOK, prepTimeMinutes: 10,
    imageCategory: 'rice', imageIndex: 0, allergens: ['soy', 'eggs'], isBestSeller: true,
    recipe: [ing('RICE-BASMATI', 220, 'g'), ing('CHKN-BREAST', 120, 'g'), ing('EGG', 1, 'pc')],
  },
  {
    slug: 'vegetable-biryani', name: 'Vegetable Biryani', category: 'Rice Dishes',
    description: 'Fragrant basmati layered with spiced vegetables, saffron and fried onion.',
    priceMinor: usd(11.5), costPriceMinor: usd(2.7), kitchenStation: KITCHEN_STATION.CURRY, prepTimeMinutes: 16,
    imageCategory: 'rice', imageIndex: 0, isVegetarian: true, isVegan: true, spicyLevel: SPICY_LEVEL.MEDIUM,
    recipe: [ing('RICE-BASMATI', 250, 'g'), ing('ONION', 40, 'g')],
  },
  {
    slug: 'shrimp-jambalaya', name: 'Shrimp Jambalaya', category: 'Rice Dishes',
    description: 'Cajun-spiced rice with shrimp, peppers and smoked sausage.',
    priceMinor: usd(14.5), costPriceMinor: usd(4.9), kitchenStation: KITCHEN_STATION.WOK, prepTimeMinutes: 15,
    imageCategory: 'rice', imageIndex: 0, spicyLevel: SPICY_LEVEL.MEDIUM, allergens: ['shellfish'],
    recipe: [ing('RICE-BASMATI', 220, 'g'), ing('SHRIMP', 130, 'g')],
  },
  {
    slug: 'chicken-teriyaki-rice-bowl', name: 'Chicken Teriyaki Rice Bowl', category: 'Rice Dishes',
    description: 'Grilled teriyaki chicken over steamed rice with sesame greens.',
    priceMinor: usd(12), costPriceMinor: usd(3.3), kitchenStation: KITCHEN_STATION.GRILL, prepTimeMinutes: 12,
    imageCategory: 'rice', imageIndex: 0, allergens: ['soy'],
    recipe: [ing('RICE-BASMATI', 220, 'g'), ing('CHKN-THIGH', 150, 'g')],
  },

  // --- Curry Dishes -----------------------------------------------------------
  {
    slug: 'butter-chicken', name: 'Butter Chicken', category: 'Curry Dishes',
    description: 'Tandoori chicken simmered in a creamy tomato and butter curry, served with naan.',
    priceMinor: usd(13.5), costPriceMinor: usd(3.9), kitchenStation: KITCHEN_STATION.CURRY, prepTimeMinutes: 14,
    imageCategory: 'curry', imageIndex: 0, spicyLevel: SPICY_LEVEL.MILD, allergens: ['dairy', 'gluten'], isBestSeller: true, isFeatured: true,
    recipe: [ing('CHKN-THIGH', 200, 'g'), ing('CURRY-PASTE', 40, 'g'), ing('CREAM', 60, 'ml'), ing('NAAN', 1, 'pc')],
  },
  {
    slug: 'lamb-rogan-josh', name: 'Lamb Rogan Josh', category: 'Curry Dishes',
    description: 'Slow-braised lamb in a Kashmiri red curry, served with basmati rice.',
    priceMinor: usd(15.5), costPriceMinor: usd(5.6), kitchenStation: KITCHEN_STATION.CURRY, prepTimeMinutes: 18,
    imageCategory: 'curry', imageIndex: 1, spicyLevel: SPICY_LEVEL.HOT, allergens: [],
    recipe: [ing('CURRY-PASTE', 50, 'g'), ing('RICE-BASMATI', 200, 'g')],
  },
  {
    slug: 'thai-green-curry', name: 'Thai Green Curry', category: 'Curry Dishes',
    description: 'Chicken and vegetables in a coconut green curry with Thai basil.',
    priceMinor: usd(13), costPriceMinor: usd(3.7), kitchenStation: KITCHEN_STATION.WOK, prepTimeMinutes: 14,
    imageCategory: 'curry', imageIndex: 1, spicyLevel: SPICY_LEVEL.HOT, allergens: ['fish'],
    recipe: [ing('CHKN-BREAST', 180, 'g'), ing('COCONUT-MILK', 1, 'pc'), ing('CURRY-PASTE', 30, 'g'), ing('RICE-BASMATI', 200, 'g')],
  },
  {
    slug: 'chickpea-chana-masala', name: 'Chana Masala', category: 'Curry Dishes',
    description: 'Chickpeas simmered in a spiced onion-tomato curry, served with naan.',
    priceMinor: usd(10.5), costPriceMinor: usd(2.3), kitchenStation: KITCHEN_STATION.CURRY, prepTimeMinutes: 12,
    imageCategory: 'curry', imageIndex: 0, isVegetarian: true, isVegan: true, spicyLevel: SPICY_LEVEL.MEDIUM,
    recipe: [ing('CHICKPEA', 2, 'pc'), ing('ONION', 50, 'g'), ing('NAAN', 1, 'pc')],
  },

  // --- Seafood ------------------------------------------------------------------
  {
    slug: 'grilled-salmon-fillet', name: 'Grilled Salmon Fillet', category: 'Seafood',
    description: 'Pan-seared salmon on herbed crushed potato with a citrus butter sauce.',
    priceMinor: usd(18.5), costPriceMinor: usd(6.8), kitchenStation: KITCHEN_STATION.GRILL, prepTimeMinutes: 15,
    imageCategory: 'seafood', imageIndex: 0, allergens: ['fish', 'dairy'], isFeatured: true, isBestSeller: true,
    recipe: [ing('SALMON', 200, 'g'), ing('BUTTER', 20, 'g')],
  },
  {
    slug: 'garlic-butter-shrimp', name: 'Garlic Butter Shrimp Skillet', category: 'Seafood',
    description: 'Sizzling shrimp in garlic butter with charred lemon, served with crusty bread.',
    priceMinor: usd(16), costPriceMinor: usd(5.9), kitchenStation: KITCHEN_STATION.GRILL, prepTimeMinutes: 11,
    imageCategory: 'seafood', imageIndex: 1, allergens: ['shellfish', 'dairy'],
    recipe: [ing('SHRIMP', 200, 'g'), ing('BUTTER', 30, 'g'), ing('BREAD-SUB', 1, 'pc')],
  },
  {
    slug: 'fish-and-chips', name: 'Beer-Battered Fish & Chips', category: 'Seafood',
    description: 'Crispy battered fish fillet with hand-cut chips and mushy peas.',
    priceMinor: usd(14.5), costPriceMinor: usd(4.7), kitchenStation: KITCHEN_STATION.FRYER, prepTimeMinutes: 13,
    imageCategory: 'seafood', imageIndex: 0, allergens: ['gluten', 'fish'],
    recipe: [ing('SALMON', 180, 'g')],
  },
  {
    slug: 'seafood-paella', name: 'Seafood Paella', category: 'Seafood',
    description: 'Saffron rice with shrimp, mussels and calamari, cooked to order (serves 2).',
    priceMinor: usd(24), costPriceMinor: usd(9.2), kitchenStation: KITCHEN_STATION.WOK, prepTimeMinutes: 22,
    imageCategory: 'seafood', imageIndex: 1, allergens: ['shellfish'],
    recipe: [ing('RICE-BASMATI', 260, 'g'), ing('SHRIMP', 180, 'g')],
  },

  // --- Chicken & Grill -----------------------------------------------------
  {
    slug: 'peri-peri-half-chicken', name: 'Peri-Peri Half Chicken', category: 'Chicken & Grill',
    description: 'Flame-grilled half chicken basted in peri-peri, served with fries and slaw.',
    priceMinor: usd(15.5), costPriceMinor: usd(5.1), kitchenStation: KITCHEN_STATION.GRILL, prepTimeMinutes: 20,
    imageCategory: 'chickenGrill', imageIndex: 0, spicyLevel: SPICY_LEVEL.HOT, isBestSeller: true,
    modifierGroups: ['Spice Level'],
    recipe: [ing('CHKN-BREAST', 400, 'g')],
  },
  {
    slug: 'smoky-bbq-ribs', name: 'Smoky BBQ Baby Back Ribs', category: 'Chicken & Grill',
    description: 'Slow-cooked pork ribs glazed in smoky BBQ sauce, fall-off-the-bone tender.',
    priceMinor: usd(19.5), costPriceMinor: usd(7.4), kitchenStation: KITCHEN_STATION.GRILL, prepTimeMinutes: 25,
    imageCategory: 'chickenGrill', imageIndex: 1, isFeatured: true,
    recipe: [ing('RIBS-PORK', 450, 'g'), ing('SAUCE-BBQ', 60, 'ml')],
  },
  {
    slug: 'grilled-chicken-platter', name: 'Grilled Chicken Platter', category: 'Chicken & Grill',
    description: 'Herb-marinated grilled chicken breast with roasted vegetables and garlic sauce.',
    priceMinor: usd(13.5), costPriceMinor: usd(4.1), kitchenStation: KITCHEN_STATION.GRILL, prepTimeMinutes: 15,
    imageCategory: 'chickenGrill', imageIndex: 0,
    recipe: [ing('CHKN-BREAST', 220, 'g')],
  },
  {
    slug: 'buffalo-chicken-tenders', name: 'Buffalo Chicken Tenders', category: 'Chicken & Grill',
    description: 'Crispy chicken tenders tossed in buffalo sauce with ranch dip.',
    priceMinor: usd(11.5), costPriceMinor: usd(3.4), kitchenStation: KITCHEN_STATION.FRYER, prepTimeMinutes: 11,
    imageCategory: 'chickenGrill', imageIndex: 1, spicyLevel: SPICY_LEVEL.MEDIUM,
    modifierGroups: ['Sauce Choice'],
    recipe: [ing('CHKN-BREAST', 200, 'g')],
  },
  {
    slug: 'mixed-grill-platter', name: 'Mixed Grill Platter', category: 'Chicken & Grill',
    description: 'Chicken skewers, beef patty and grilled sausage with rice and salad — built for sharing.',
    priceMinor: usd(21.5), costPriceMinor: usd(8.3), kitchenStation: KITCHEN_STATION.GRILL, prepTimeMinutes: 20,
    imageCategory: 'chickenGrill', imageIndex: 0, isFeatured: true,
    recipe: [ing('CHKN-THIGH', 200, 'g'), ing('PATTY-BEEF', 150, 'g'), ing('RICE-BASMATI', 150, 'g')],
  },

  // --- Desserts --------------------------------------------------------------
  {
    slug: 'raspberry-cream-cake', name: 'Raspberry Cream Cake', category: 'Desserts',
    description: 'Layered vanilla sponge with fresh raspberries and light cream.',
    priceMinor: usd(7.5), costPriceMinor: usd(1.8), kitchenStation: KITCHEN_STATION.DESSERT, prepTimeMinutes: 5,
    imageCategory: 'desserts', imageIndex: 1, isVegetarian: true, allergens: ['gluten', 'dairy', 'eggs'], isBestSeller: true,
    recipe: [ing('FLOUR-CAKE', 100, 'g'), ing('CREAM', 60, 'ml'), ing('STRAWBERRY', 40, 'g')],
  },
  {
    slug: 'belgian-chocolate-brownie', name: 'Belgian Chocolate Brownie', category: 'Desserts',
    description: 'Warm dark chocolate brownie with vanilla ice cream and chocolate sauce.',
    priceMinor: usd(7), costPriceMinor: usd(1.6), kitchenStation: KITCHEN_STATION.DESSERT, prepTimeMinutes: 6,
    imageCategory: 'desserts', imageIndex: 1, isVegetarian: true, allergens: ['gluten', 'dairy', 'eggs'], isFeatured: true,
    recipe: [ing('CHOCOLATE', 60, 'g'), ing('FLOUR-CAKE', 80, 'g'), ing('BUTTER', 40, 'g')],
  },
  {
    slug: 'classic-cheesecake', name: 'New York Baked Cheesecake', category: 'Desserts',
    description: 'Dense baked cheesecake on a biscuit base with a berry compote.',
    priceMinor: usd(7.5), costPriceMinor: usd(2.1), kitchenStation: KITCHEN_STATION.DESSERT, prepTimeMinutes: 5,
    imageCategory: 'desserts', imageIndex: 1, isVegetarian: true, allergens: ['gluten', 'dairy', 'eggs'],
    recipe: [ing('CREAM', 80, 'ml'), ing('STRAWBERRY', 30, 'g')],
  },
  {
    slug: 'crepes-suzette', name: 'Crêpes Suzette', category: 'Desserts',
    description: 'Thin crêpes folded in orange-caramel sauce, finished tableside style.',
    priceMinor: usd(8.5), costPriceMinor: usd(2.2), kitchenStation: KITCHEN_STATION.DESSERT, prepTimeMinutes: 8,
    imageCategory: 'desserts', imageIndex: 0, isVegetarian: true, allergens: ['gluten', 'dairy', 'eggs'],
    recipe: [ing('FLOUR-CAKE', 90, 'g'), ing('ORANGE', 80, 'g'), ing('BUTTER', 20, 'g')],
  },
  {
    slug: 'buttermilk-pancake-stack', name: 'Buttermilk Pancake Stack', category: 'Desserts',
    description: 'Fluffy stacked pancakes with maple syrup and butter.',
    priceMinor: usd(7.5), costPriceMinor: usd(1.7), kitchenStation: KITCHEN_STATION.DESSERT, prepTimeMinutes: 9,
    imageCategory: 'desserts', imageIndex: 2, isVegetarian: true, allergens: ['gluten', 'dairy', 'eggs'],
    recipe: [ing('FLOUR-CAKE', 100, 'g'), ing('MILK', 80, 'ml'), ing('EGG', 1, 'pc'), ing('BUTTER', 15, 'g')],
  },
  {
    slug: 'seasonal-fruit-tart', name: 'Seasonal Fruit Tart', category: 'Desserts',
    description: 'Buttery pastry shell with vanilla custard and glazed seasonal fruit.',
    priceMinor: usd(7), costPriceMinor: usd(1.9), kitchenStation: KITCHEN_STATION.DESSERT, prepTimeMinutes: 5,
    imageCategory: 'desserts', imageIndex: 1, isVegetarian: true, allergens: ['gluten', 'dairy', 'eggs'],
    recipe: [ing('FLOUR-CAKE', 90, 'g'), ing('STRAWBERRY', 30, 'g'), ing('CREAM', 40, 'ml')],
  },

  // --- Hot Drinks --------------------------------------------------------------
  {
    slug: 'espresso', name: 'Espresso', category: 'Hot Drinks',
    description: 'A tight double shot, rich crema.',
    priceMinor: usd(3), costPriceMinor: usd(0.5), kitchenStation: KITCHEN_STATION.BARISTA, prepTimeMinutes: 3,
    imageCategory: 'hotDrinks', imageIndex: 2, isVegetarian: true, isVegan: true,
    recipe: [ing('COFFEE-BEAN', 18, 'g')],
  },
  {
    slug: 'cappuccino', name: 'Cappuccino', category: 'Hot Drinks',
    description: 'Espresso with steamed milk and a deep layer of microfoam.',
    priceMinor: usd(4), costPriceMinor: usd(0.8), kitchenStation: KITCHEN_STATION.BARISTA, prepTimeMinutes: 4,
    imageCategory: 'hotDrinks', imageIndex: 0, isVegetarian: true, allergens: ['dairy'], isBestSeller: true,
    modifierGroups: ['Milk Choice', 'Drink Size'],
    recipe: [ing('COFFEE-BEAN', 18, 'g'), ing('MILK', 150, 'ml')],
  },
  {
    slug: 'caffe-latte', name: 'Café Latte', category: 'Hot Drinks',
    description: 'Smooth espresso with steamed milk and a light layer of foam.',
    priceMinor: usd(4.2), costPriceMinor: usd(0.9), kitchenStation: KITCHEN_STATION.BARISTA, prepTimeMinutes: 4,
    imageCategory: 'hotDrinks', imageIndex: 1, isVegetarian: true, allergens: ['dairy'],
    modifierGroups: ['Milk Choice', 'Drink Size'],
    recipe: [ing('COFFEE-BEAN', 18, 'g'), ing('MILK', 180, 'ml')],
  },
  {
    slug: 'masala-chai', name: 'Masala Chai', category: 'Hot Drinks',
    description: 'Black tea simmered with milk and warming spices.',
    priceMinor: usd(3.5), costPriceMinor: usd(0.6), kitchenStation: KITCHEN_STATION.BARISTA, prepTimeMinutes: 5,
    imageCategory: 'hotDrinks', imageIndex: 2, isVegetarian: true, allergens: ['dairy'],
    recipe: [ing('MILK', 150, 'ml')],
  },

  // --- Cold Drinks ---------------------------------------------------------
  {
    slug: 'classic-lemonade', name: 'Classic Lemonade', category: 'Cold Drinks',
    description: 'Fresh-squeezed lemon over ice with a hint of mint.',
    priceMinor: usd(4), costPriceMinor: usd(0.6), kitchenStation: KITCHEN_STATION.BAR, prepTimeMinutes: 3,
    imageCategory: 'coldDrinks', imageIndex: 0, isVegetarian: true, isVegan: true,
    modifierGroups: ['Drink Size'],
    recipe: [ing('LIME', 2, 'pc'), ing('MINT', 1, 'pc')],
  },
  {
    slug: 'strawberry-mojito-mocktail', name: 'Strawberry Mojito Mocktail', category: 'Cold Drinks',
    description: 'Muddled strawberry, lime and mint, topped with soda.',
    priceMinor: usd(5.5), costPriceMinor: usd(1.1), kitchenStation: KITCHEN_STATION.BAR, prepTimeMinutes: 4,
    imageCategory: 'coldDrinks', imageIndex: 1, isVegetarian: true, isVegan: true, isFeatured: true,
    recipe: [ing('STRAWBERRY', 60, 'g'), ing('LIME', 1, 'pc'), ing('MINT', 1, 'pc'), ing('SODA-SYRUP', 40, 'ml')],
  },
  {
    slug: 'classic-cola', name: 'Fountain Cola', category: 'Cold Drinks',
    description: 'Ice-cold cola, served in a tall glass.',
    priceMinor: usd(3), costPriceMinor: usd(0.4), kitchenStation: KITCHEN_STATION.BAR, prepTimeMinutes: 1,
    imageCategory: 'coldDrinks', imageIndex: 0,
    modifierGroups: ['Drink Size'],
    recipe: [ing('SODA-SYRUP', 60, 'ml'), ing('PKG-CUP', 1, 'pc')],
  },
  {
    slug: 'iced-caramel-macchiato', name: 'Iced Caramel Macchiato', category: 'Cold Drinks',
    description: 'Espresso layered over cold milk and caramel, served over ice.',
    priceMinor: usd(4.8), costPriceMinor: usd(1.0), kitchenStation: KITCHEN_STATION.BARISTA, prepTimeMinutes: 4,
    imageCategory: 'coldDrinks', imageIndex: 1, allergens: ['dairy'],
    recipe: [ing('COFFEE-BEAN', 18, 'g'), ing('MILK', 150, 'ml')],
  },

  // --- Fresh Juices ------------------------------------------------------------
  {
    slug: 'green-detox-juice', name: 'Green Detox Juice', category: 'Fresh Juices',
    description: 'Spinach, apple, cucumber, kiwi and mint, cold-pressed.',
    priceMinor: usd(5.5), costPriceMinor: usd(1.4), kitchenStation: KITCHEN_STATION.BAR, prepTimeMinutes: 4,
    imageCategory: 'freshJuices', imageIndex: 0, isVegetarian: true, isVegan: true, isFeatured: true,
    recipe: [ing('SPINACH', 60, 'g'), ing('KIWI', 2, 'pc'), ing('MINT', 1, 'pc')],
  },
  {
    slug: 'fresh-orange-juice', name: 'Fresh Orange Juice', category: 'Fresh Juices',
    description: 'Squeezed to order, no added sugar.',
    priceMinor: usd(4.5), costPriceMinor: usd(1.0), kitchenStation: KITCHEN_STATION.BAR, prepTimeMinutes: 3,
    imageCategory: 'freshJuices', imageIndex: 0, isVegetarian: true, isVegan: true, isBestSeller: true,
    recipe: [ing('ORANGE', 350, 'g')],
  },
  {
    slug: 'watermelon-mint-cooler', name: 'Watermelon Mint Cooler', category: 'Fresh Juices',
    description: 'Chilled watermelon juice with a hint of lime and mint.',
    priceMinor: usd(5), costPriceMinor: usd(1.1), kitchenStation: KITCHEN_STATION.BAR, prepTimeMinutes: 3,
    imageCategory: 'freshJuices', imageIndex: 0, isVegetarian: true, isVegan: true,
    recipe: [ing('LIME', 1, 'pc'), ing('MINT', 1, 'pc')],
  },

  // --- Combo Meals ---------------------------------------------------------
  {
    slug: 'classic-burger-combo', name: 'Classic Burger Combo', category: 'Combo Meals',
    description: 'Classic Cheeseburger, regular fries and a fountain drink, at a bundled price.',
    priceMinor: usd(15.5), costPriceMinor: usd(4.6), kitchenStation: KITCHEN_STATION.GRILL, prepTimeMinutes: 12,
    imageCategory: 'comboMeals', imageIndex: 0, isBestSeller: true,
    isCombo: true,
  },
  {
    slug: 'pizza-night-combo', name: 'Pizza Night Combo', category: 'Combo Meals',
    description: '10-inch Margherita Pizza, garlic bread and two soft drinks.',
    priceMinor: usd(22.5), costPriceMinor: usd(7.1), kitchenStation: KITCHEN_STATION.PIZZA, prepTimeMinutes: 15,
    imageCategory: 'comboMeals', imageIndex: 1, isFeatured: true,
    isCombo: true,
  },
  {
    slug: 'family-feast-combo', name: 'Family Feast Combo', category: 'Combo Meals',
    description: 'Peri-Peri Half Chicken, BBQ ribs, two sides and a 1.5L soft drink — serves 3–4.',
    priceMinor: usd(42), costPriceMinor: usd(15.8), kitchenStation: KITCHEN_STATION.GRILL, prepTimeMinutes: 22,
    imageCategory: 'comboMeals', imageIndex: 0, isFeatured: true,
    isCombo: true,
  },
];
