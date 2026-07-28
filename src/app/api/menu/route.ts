import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { Category } from '@/models/Category';
import { MenuItem } from '@/models/MenuItem';
import { ModifierGroup } from '@/models/ModifierGroup';
import { RestaurantSetting } from '@/models/RestaurantSetting';

export const GET = defineRoute({ permissions: [PERMISSIONS.MENU_VIEW] }, async ({ user }) => {
  const restaurantId = user.restaurantId;
  const [categories, items, modifierGroups, settings] = await Promise.all([
    Category.find({ restaurantId, isActive: true }).sort({ sortOrder: 1 }).lean(),
    MenuItem.find({ restaurantId, isActive: true }).sort({ sortOrder: 1 }).lean(),
    ModifierGroup.find({ restaurantId, isActive: true }).lean(),
    RestaurantSetting.findOne({ restaurantId }).lean(),
  ]);

  const defaultTaxRatePercent = settings?.taxes.find((t) => t.isDefault)?.ratePercent ?? settings?.taxes[0]?.ratePercent ?? 0;

  return ok({
    categories,
    items,
    modifierGroups,
    pricing: {
      taxMode: settings?.taxMode ?? 'exclusive',
      taxRatePercent: defaultTaxRatePercent,
      serviceChargePercent: settings?.serviceChargePercent ?? 0,
      serviceChargeTaxable: settings?.serviceChargeTaxable ?? false,
      cashRoundingIncrementMinor: settings?.cashRoundingIncrementMinor ?? 1,
    },
  });
});
