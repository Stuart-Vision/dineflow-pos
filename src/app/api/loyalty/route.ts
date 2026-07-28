import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { getLoyaltyOverview } from '@/services/crm-service';

export const GET = defineRoute(
  { permissions: [PERMISSIONS.LOYALTY_VIEW] },
  async ({ user }) => ok(await getLoyaltyOverview(user.restaurantId!)),
);
