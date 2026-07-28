import { endOfDay, startOfDay, subDays } from 'date-fns';
import type { Types } from 'mongoose';

import { ORDER_STATUS, PAYMENT_STATUS, REVENUE_ORDER_STATUSES } from '@/constants/enums';
import { Branch } from '@/models/Branch';
import { Expense } from '@/models/Expense';
import { Ingredient } from '@/models/Ingredient';
import { Order } from '@/models/Order';
import { Payment } from '@/models/Payment';
import { Table } from '@/models/Table';

export interface DashboardScope {
  restaurantId: Types.ObjectId;
  branchIds: Types.ObjectId[];
  from: Date;
  to: Date;
}

const PENDING_KITCHEN_STATUSES = [ORDER_STATUS.SUBMITTED, ORDER_STATUS.KITCHEN_ACCEPTED, ORDER_STATUS.PREPARING];

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function fillDailySeries(
  range: { from: Date; to: Date },
  points: Map<string, { revenueMinor: number; orders: number }>,
): Array<{ date: string; revenueMinor: number; orders: number }> {
  const result: Array<{ date: string; revenueMinor: number; orders: number }> = [];
  const cursor = new Date(range.from);
  while (cursor <= range.to) {
    const key = dayKey(cursor);
    const point = points.get(key);
    result.push({ date: key, revenueMinor: point?.revenueMinor ?? 0, orders: point?.orders ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

async function getTodayKpis(restaurantId: Types.ObjectId, branchIds: Types.ObjectId[]) {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const yesterdayStart = startOfDay(subDays(new Date(), 1));
  const yesterdayEnd = endOfDay(subDays(new Date(), 1));

  const revenueMatch = (from: Date, to: Date) => ({
    restaurantId,
    branchId: { $in: branchIds },
    status: { $in: REVENUE_ORDER_STATUSES },
    createdAt: { $gte: from, $lte: to },
  });

  const [[todayAgg], [yesterdayAgg], activeTables, totalTables, pendingKitchenOrders, lowStockCount, expenseAgg, paymentAgg, orderTypeAgg] =
    await Promise.all([
      Order.aggregate([
        { $match: revenueMatch(todayStart, todayEnd) },
        { $group: { _id: null, salesMinor: { $sum: '$grandTotalMinor' }, orders: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: revenueMatch(yesterdayStart, yesterdayEnd) },
        { $group: { _id: null, salesMinor: { $sum: '$grandTotalMinor' }, orders: { $sum: 1 } } },
      ]),
      Table.countDocuments({ branchId: { $in: branchIds }, status: { $ne: 'available' } }),
      Table.countDocuments({ branchId: { $in: branchIds } }),
      Order.countDocuments({ restaurantId, branchId: { $in: branchIds }, status: { $in: PENDING_KITCHEN_STATUSES } }),
      Ingredient.countDocuments({
        branchId: { $in: branchIds },
        isActive: true,
        $expr: { $lte: ['$currentStockBase', '$reorderLevelBase'] },
      }),
      Expense.aggregate([
        { $match: { restaurantId, branchId: { $in: branchIds }, expenseDate: { $gte: todayStart, $lte: todayEnd }, status: { $ne: 'rejected' } } },
        { $group: { _id: null, total: { $sum: '$amountMinor' } } },
      ]),
      Payment.aggregate([
        { $match: { restaurantId, branchId: { $in: branchIds }, status: PAYMENT_STATUS.COMPLETED, createdAt: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: '$method', amountMinor: { $sum: '$amountMinor' } } },
      ]),
      Order.aggregate([
        { $match: revenueMatch(todayStart, todayEnd) },
        { $group: { _id: '$type', amountMinor: { $sum: '$grandTotalMinor' }, count: { $sum: 1 } } },
      ]),
    ]);

  const todaySalesMinor = todayAgg?.salesMinor ?? 0;
  const todayOrders = todayAgg?.orders ?? 0;
  const yesterdaySalesMinor = yesterdayAgg?.salesMinor ?? 0;
  const todayExpensesMinor = expenseAgg[0]?.total ?? 0;

  return {
    todaySalesMinor,
    todayOrders,
    avgOrderValueMinor: todayOrders > 0 ? Math.round(todaySalesMinor / todayOrders) : 0,
    yesterdaySalesMinor,
    salesDeltaPercent:
      yesterdaySalesMinor > 0 ? Math.round(((todaySalesMinor - yesterdaySalesMinor) / yesterdaySalesMinor) * 100) : null,
    activeTables,
    totalTables,
    pendingKitchenOrders,
    lowStockCount,
    todayExpensesMinor,
    netProfitMinor: todaySalesMinor - todayExpensesMinor,
    paymentBreakdown: paymentAgg.map((p) => ({ method: p._id as string, amountMinor: p.amountMinor as number })),
    orderTypeBreakdown: orderTypeAgg.map((o) => ({ type: o._id as string, amountMinor: o.amountMinor as number, count: o.count as number })),
  };
}

async function getSalesTrendAndExpenses(restaurantId: Types.ObjectId, branchIds: Types.ObjectId[], from: Date, to: Date) {
  const [salesRows, expenseRows] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          restaurantId,
          branchId: { $in: branchIds },
          status: { $in: REVENUE_ORDER_STATUSES },
          createdAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenueMinor: { $sum: '$grandTotalMinor' },
          orders: { $sum: 1 },
        },
      },
    ]),
    Expense.aggregate([
      { $match: { restaurantId, branchId: { $in: branchIds }, expenseDate: { $gte: from, $lte: to }, status: { $ne: 'rejected' } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$expenseDate' } }, expenseMinor: { $sum: '$amountMinor' } } },
    ]),
  ]);

  const salesMap = new Map(salesRows.map((r) => [r._id as string, { revenueMinor: r.revenueMinor as number, orders: r.orders as number }]));
  const expenseMap = new Map(expenseRows.map((r) => [r._id as string, r.expenseMinor as number]));

  const salesTrend = fillDailySeries({ from, to }, salesMap);
  const revenueVsExpenses = salesTrend.map((point) => ({
    date: point.date,
    revenueMinor: point.revenueMinor,
    expenseMinor: expenseMap.get(point.date) ?? 0,
  }));

  return { salesTrend, revenueVsExpenses };
}

async function getTopSellingAndCategories(restaurantId: Types.ObjectId, branchIds: Types.ObjectId[], from: Date, to: Date) {
  const baseMatch = {
    restaurantId,
    branchId: { $in: branchIds },
    status: { $in: REVENUE_ORDER_STATUSES },
    createdAt: { $gte: from, $lte: to },
  };

  const [topItems, byCategory] = await Promise.all([
    Order.aggregate([
      { $match: baseMatch },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          quantity: { $sum: '$items.quantity' },
          revenueMinor: { $sum: { $multiply: ['$items.unitPriceMinor', '$items.quantity'] } },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 8 },
    ]),
    Order.aggregate([
      { $match: baseMatch },
      { $unwind: '$items' },
      { $lookup: { from: 'menuitems', localField: 'items.menuItemId', foreignField: '_id', as: 'menuItem' } },
      { $unwind: '$menuItem' },
      { $lookup: { from: 'categories', localField: 'menuItem.categoryId', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category.name',
          revenueMinor: { $sum: { $multiply: ['$items.unitPriceMinor', '$items.quantity'] } },
        },
      },
      { $sort: { revenueMinor: -1 } },
      { $limit: 8 },
    ]),
  ]);

  return {
    topSellingItems: topItems.map((r) => ({ name: r._id as string, quantity: r.quantity as number, revenueMinor: r.revenueMinor as number })),
    salesByCategory: byCategory.map((r) => ({ category: r._id as string, revenueMinor: r.revenueMinor as number })),
  };
}

async function getPeakHoursAndStaff(restaurantId: Types.ObjectId, branchIds: Types.ObjectId[], from: Date, to: Date) {
  const baseMatch = {
    restaurantId,
    branchId: { $in: branchIds },
    status: { $in: REVENUE_ORDER_STATUSES },
    createdAt: { $gte: from, $lte: to },
  };

  const [peakHoursRaw, staffRaw, kitchenRaw] = await Promise.all([
    Order.aggregate([
      { $match: baseMatch },
      { $group: { _id: { $hour: '$createdAt' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$cashierId', ordersHandled: { $sum: 1 }, salesMinor: { $sum: '$grandTotalMinor' } } },
      { $sort: { salesMinor: -1 } },
      { $limit: 8 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', role: '$user.role', ordersHandled: 1, salesMinor: 1 } },
    ]),
    Order.aggregate([
      {
        $match: {
          ...baseMatch,
          kitchenAcceptedAt: { $ne: null },
          readyAt: { $ne: null },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.kitchenStation',
          avgMinutes: { $avg: { $divide: [{ $subtract: ['$readyAt', '$kitchenAcceptedAt'] }, 60000] } },
          tickets: { $sum: 1 },
        },
      },
      { $sort: { tickets: -1 } },
      { $limit: 8 },
    ]),
  ]);

  const hourMap = new Map(peakHoursRaw.map((r) => [r._id as number, r.orders as number]));
  const peakHours = Array.from({ length: 15 }, (_, i) => i + 8).map((hour) => ({ hour, orders: hourMap.get(hour) ?? 0 }));

  return {
    peakHours,
    staffActivity: staffRaw.map((r) => ({
      name: r.name as string,
      role: r.role as string,
      ordersHandled: r.ordersHandled as number,
      salesMinor: r.salesMinor as number,
    })),
    kitchenPerformance: kitchenRaw.map((r) => ({
      station: r._id as string,
      avgMinutes: Math.round((r.avgMinutes as number) * 10) / 10,
      tickets: r.tickets as number,
    })),
  };
}

async function getRecentOrdersAndLowStock(restaurantId: Types.ObjectId, branchIds: Types.ObjectId[]) {
  const [recentOrders, lowStockIngredients, branches] = await Promise.all([
    Order.find({ restaurantId, branchId: { $in: branchIds } })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber branchId type status grandTotalMinor createdAt customerId')
      .lean(),
    Ingredient.find({
      branchId: { $in: branchIds },
      isActive: true,
      $expr: { $lte: ['$currentStockBase', '$reorderLevelBase'] },
    })
      .sort({ currentStockBase: 1 })
      .limit(8)
      .select('name branchId currentStockBase reorderLevelBase consumptionUnit')
      .lean(),
    Branch.find({ restaurantId }).select('name code').lean(),
  ]);

  const branchNameById = new Map(branches.map((b) => [String(b._id), b.name]));

  return {
    recentOrders: recentOrders.map((o) => ({
      orderNumber: o.orderNumber,
      branchName: branchNameById.get(String(o.branchId)) ?? '—',
      type: o.type,
      status: o.status,
      grandTotalMinor: o.grandTotalMinor,
      createdAt: o.createdAt,
    })),
    lowStockAlerts: lowStockIngredients.map((i) => ({
      name: i.name,
      branchName: branchNameById.get(String(i.branchId)) ?? '—',
      currentStockBase: i.currentStockBase,
      reorderLevelBase: i.reorderLevelBase,
      unit: i.consumptionUnit,
    })),
    branches: branches.map((b) => ({ id: String(b._id), name: b.name, code: b.code })),
  };
}

export async function getDashboardData(scope: DashboardScope) {
  const [kpis, trend, catalog, activity, tables] = await Promise.all([
    getTodayKpis(scope.restaurantId, scope.branchIds),
    getSalesTrendAndExpenses(scope.restaurantId, scope.branchIds, scope.from, scope.to),
    getTopSellingAndCategories(scope.restaurantId, scope.branchIds, scope.from, scope.to),
    getPeakHoursAndStaff(scope.restaurantId, scope.branchIds, scope.from, scope.to),
    getRecentOrdersAndLowStock(scope.restaurantId, scope.branchIds),
  ]);

  return { ...kpis, ...trend, ...catalog, ...activity, ...tables };
}
