import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { adjustLoyaltyPoints } from '@/services/crm-service';
import { adjustLoyaltySchema, type AdjustLoyaltyInput } from '@/validators/operations';

type Params = { customerId: string };

export const POST = defineRoute<AdjustLoyaltyInput, Params>(
  { permissions: [PERMISSIONS.LOYALTY_ADJUST_POINTS], bodySchema: adjustLoyaltySchema },
  async ({ params, body, user }) => {
    const customer = await adjustLoyaltyPoints(params.customerId, user.restaurantId!, body.points, body.description, user);
    return ok({ id: String(customer._id), points: customer.loyaltyPointsBalance, tier: customer.membershipTier });
  },
);
