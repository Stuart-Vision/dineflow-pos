import { endOfDay, startOfDay, subDays } from 'date-fns';
import mongoose from 'mongoose';

import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { Branch } from '@/models/Branch';
import { Restaurant } from '@/models/Restaurant';
import { getDashboardData } from '@/services/dashboard-service';

export const GET = defineRoute({ permissions: [PERMISSIONS.DASHBOARD_VIEW] }, async ({ user, query }) => {
  const restaurantId = user.restaurantId
    ? new mongoose.Types.ObjectId(user.restaurantId)
    : (await Restaurant.findOne().select('_id').lean())?._id;

  if (!restaurantId) {
    return ok({
      todaySalesMinor: 0, todayOrders: 0, avgOrderValueMinor: 0, yesterdaySalesMinor: 0, salesDeltaPercent: null,
      activeTables: 0, totalTables: 0, pendingKitchenOrders: 0, lowStockCount: 0, todayExpensesMinor: 0, netProfitMinor: 0,
      paymentBreakdown: [], orderTypeBreakdown: [], salesTrend: [], revenueVsExpenses: [], topSellingItems: [],
      salesByCategory: [], peakHours: [], staffActivity: [], kitchenPerformance: [], recentOrders: [], lowStockAlerts: [], branches: [],
    });
  }

  const requestedBranchId = query.branchId;
  let branchIds: mongoose.Types.ObjectId[];

  if (requestedBranchId) {
    branchIds = [new mongoose.Types.ObjectId(requestedBranchId)];
  } else if (user.branchIds.length > 0) {
    branchIds = user.branchIds.map((id) => new mongoose.Types.ObjectId(id));
  } else {
    const allBranches = await Branch.find({ restaurantId }).select('_id').lean();
    branchIds = allBranches.map((b) => b._id);
  }

  const to = query.to ? endOfDay(query.to) : endOfDay(new Date());
  const from = query.from ? startOfDay(query.from) : startOfDay(subDays(new Date(), 29));

  const data = await getDashboardData({ restaurantId, branchIds, from, to });
  return ok(data);
});
