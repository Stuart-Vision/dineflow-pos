import type { Allergen, KitchenStation, OrderStatus, OrderType, SpicyLevel } from '@/constants/enums';
import type { Discount, PricingModifier } from '@/lib/pricing/order-totals';

export interface ApiCategory {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
}

export interface ApiModifierOption {
  _id: string;
  name: string;
  priceMinor: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface ApiModifierGroup {
  _id: string;
  name: string;
  selectionType: 'single' | 'multiple';
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  options: ApiModifierOption[];
}

export interface ApiPortionSize {
  name: string;
  priceMinor: number;
  isDefault: boolean;
}

export interface ApiMenuItem {
  _id: string;
  categoryId: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  imageUrl: string | null;
  priceMinor: number;
  kitchenStation: KitchenStation;
  preparationTimeMinutes: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  spicyLevel: SpicyLevel;
  allergens: Allergen[];
  modifierGroupIds: string[];
  portionSizes: ApiPortionSize[];
  isCombo: boolean;
  isAvailable: boolean;
  isActive: boolean;
}

export interface ApiTable {
  _id: string;
  label: string;
  section: string;
  capacity: number;
  status: string;
  currentOrderId: string | null;
}

export interface ApiCustomer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyPointsBalance: number;
  membershipTier: string;
}

export interface ApiOrderItem {
  _id: string;
  menuItemId: string;
  name: string;
  portionName: string | null;
  sku: string;
  quantity: number;
  unitPriceMinor: number;
  modifiers: PricingModifier[];
  notes: string | null;
  discount: Discount | null;
  taxRatePercent: number;
  kitchenStation: string;
  status: string;
}

export interface ApiOrder {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  tableId: string | null;
  customerId: string | null;
  items: ApiOrderItem[];
  orderDiscount: Discount | null;
  subtotalMinor: number;
  discountTotalMinor: number;
  serviceChargeMinor: number;
  taxMinor: number;
  deliveryFeeMinor: number;
  tipMinor: number;
  roundingMinor: number;
  grandTotalMinor: number;
  paidMinor: number;
  refundedMinor: number;
  notes: string | null;
  holdReason: string | null;
  createdAt: string;
}
