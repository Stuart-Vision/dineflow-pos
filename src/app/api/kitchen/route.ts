import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { getKitchenBoard, resolveKitchenBranchIds } from '@/services/kitchen-service';

export const GET = defineRoute({ permissions: [PERMISSIONS.KITCHEN_VIEW] }, async ({ user, branchId }) => {
  const branchIds = await resolveKitchenBranchIds(user.restaurantId, user.branchIds, branchId);
  const board = await getKitchenBoard(branchIds);
  return ok(board);
});
