'use client';

import { format, parseISO, subDays } from 'date-fns';
import {
  AlertTriangle,
  Banknote,
  ChefHat,
  Clock4,
  Download,
  LayoutGrid,
  Package,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import * as React from 'react';

import { PeakHoursChart } from '@/components/dashboard/peak-hours-chart';
import { RankedBarChart } from '@/components/dashboard/ranked-bar-chart';
import { RevenueExpenseChart } from '@/components/dashboard/revenue-expense-chart';
import { SalesTrendChart } from '@/components/dashboard/sales-trend-chart';
import { StackedBreakdownBar } from '@/components/dashboard/stacked-breakdown-bar';
import { StatTile } from '@/components/dashboard/stat-tile';
import { useSessionUser } from '@/components/providers/session-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SkeletonChart, SkeletonStatCard, SkeletonTable } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiGet } from '@/lib/api/client';
import { formatMoney } from '@/lib/money';

interface DashboardData {
  todaySalesMinor: number;
  todayOrders: number;
  avgOrderValueMinor: number;
  salesDeltaPercent: number | null;
  activeTables: number;
  totalTables: number;
  pendingKitchenOrders: number;
  lowStockCount: number;
  todayExpensesMinor: number;
  netProfitMinor: number;
  paymentBreakdown: Array<{ method: string; amountMinor: number }>;
  orderTypeBreakdown: Array<{ type: string; amountMinor: number; count: number }>;
  salesTrend: Array<{ date: string; revenueMinor: number; orders: number }>;
  revenueVsExpenses: Array<{ date: string; revenueMinor: number; expenseMinor: number }>;
  topSellingItems: Array<{ name: string; quantity: number; revenueMinor: number }>;
  salesByCategory: Array<{ category: string; revenueMinor: number }>;
  peakHours: Array<{ hour: number; orders: number }>;
  staffActivity: Array<{ name: string; role: string; ordersHandled: number; salesMinor: number }>;
  kitchenPerformance: Array<{ station: string; avgMinutes: number; tickets: number }>;
  recentOrders: Array<{ orderNumber: string; branchName: string; type: string; status: string; grandTotalMinor: number; createdAt: string }>;
  lowStockAlerts: Array<{ name: string; branchName: string; currentStockBase: number; reorderLevelBase: number; unit: string }>;
  branches: Array<{ id: string; name: string; code: string }>;
}

const RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

const ORDER_TYPE_LABELS: Record<string, string> = { dine_in: 'Dine-in', takeaway: 'Takeaway', delivery: 'Delivery' };
const PAYMENT_METHOD_LABELS: Record<string, string> = { cash: 'Cash', card: 'Card', digital_wallet: 'Digital wallet', bank_transfer: 'Bank transfer', store_credit: 'Store credit', loyalty_points: 'Loyalty points' };

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'muted'> = {
  completed: 'success',
  paid: 'success',
  served: 'info',
  ready: 'info',
  preparing: 'warning',
  kitchen_accepted: 'warning',
  submitted: 'muted',
  held: 'muted',
  draft: 'muted',
  cancelled: 'destructive',
  voided: 'destructive',
  refunded: 'warning',
  partially_refunded: 'warning',
};

function toCsv(data: DashboardData): string {
  const lines = ['Date,Revenue,Orders,Expenses'];
  for (const point of data.revenueVsExpenses) {
    lines.push(`${point.date},${(point.revenueMinor / 100).toFixed(2)},${data.salesTrend.find((s) => s.date === point.date)?.orders ?? 0},${(point.expenseMinor / 100).toFixed(2)}`);
  }
  return lines.join('\n');
}

function downloadCsv(data: DashboardData) {
  const blob = new Blob([toCsv(data)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `dineflow-sales-summary-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function DashboardClient() {
  const user = useSessionUser();
  const currency = 'USD';

  const [rangeDays, setRangeDays] = React.useState('30');
  const [branchId, setBranchId] = React.useState<string>('all');
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const to = new Date();
    const from = subDays(to, Number(rangeDays) - 1);
    const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
    if (branchId !== 'all') params.set('branchId', branchId);
    try {
      const result = await apiGet<DashboardData>(`/api/dashboard?${params.toString()}`);
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [rangeDays, branchId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const showBranchFilter = user.role === 'super_admin' || user.branchIds.length > 1;

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonChart className="rounded-xl border border-border bg-card p-5" />
          <SkeletonChart className="rounded-xl border border-border bg-card p-5" />
        </div>
        <SkeletonTable />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">
            Welcome back, {user.name.split(' ')[0]} — here&apos;s how service is going today.
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showBranchFilter && (
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger size="sm" className="w-40">
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {data.branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={rangeDays} onValueChange={setRangeDays}>
            <SelectTrigger size="sm" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => downloadCsv(data)}>
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI strip — always "today", regardless of the range filter above */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="Today's sales" value={formatMoney(data.todaySalesMinor, currency)} icon={Wallet} deltaPercent={data.salesDeltaPercent} />
        <StatTile label="Today's orders" value={String(data.todayOrders)} icon={ShoppingBag} subtitle="orders placed today" />
        <StatTile label="Average order value" value={formatMoney(data.avgOrderValueMinor, currency)} icon={ReceiptText} subtitle="per order today" />
        <StatTile
          label="Active tables"
          value={`${data.activeTables} / ${data.totalTables}`}
          icon={LayoutGrid}
          subtitle="occupied or reserved"
        />
        <StatTile
          label="Pending kitchen orders"
          value={String(data.pendingKitchenOrders)}
          icon={ChefHat}
          tone={data.pendingKitchenOrders > 5 ? 'warning' : 'default'}
          subtitle="awaiting the kitchen"
        />
        <StatTile
          label="Low-stock items"
          value={String(data.lowStockCount)}
          icon={AlertTriangle}
          tone={data.lowStockCount > 0 ? 'destructive' : 'default'}
          subtitle="at or below reorder level"
        />
        <StatTile label="Today's expenses" value={formatMoney(data.todayExpensesMinor, currency)} icon={Banknote} subtitle="logged today" />
        <StatTile
          label="Net profit (today)"
          value={formatMoney(data.netProfitMinor, currency)}
          icon={TrendingUp}
          tone={data.netProfitMinor < 0 ? 'destructive' : 'default'}
          subtitle="sales minus expenses"
        />
      </div>

      {/* Payment & order-type breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payments today</CardTitle>
            <CardDescription>How today&apos;s sales were settled.</CardDescription>
          </CardHeader>
          <CardContent>
            <StackedBreakdownBar
              segments={data.paymentBreakdown.map((p) => ({ label: PAYMENT_METHOD_LABELS[p.method] ?? p.method, value: p.amountMinor }))}
              formatter={(v) => formatMoney(v, currency)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Order types today</CardTitle>
            <CardDescription>Dine-in, takeaway and delivery split.</CardDescription>
          </CardHeader>
          <CardContent>
            <StackedBreakdownBar
              segments={data.orderTypeBreakdown.map((o) => ({ label: ORDER_TYPE_LABELS[o.type] ?? o.type, value: o.amountMinor }))}
              formatter={(v) => formatMoney(v, currency)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Trend charts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales trend</CardTitle>
            <CardDescription>Revenue by day over the selected range.</CardDescription>
          </CardHeader>
          <CardContent>
            <SalesTrendChart data={data.salesTrend} currency={currency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs expenses</CardTitle>
            <CardDescription>Daily revenue against logged expenses.</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueExpenseChart data={data.revenueVsExpenses} currency={currency} />
          </CardContent>
        </Card>
      </div>

      {/* Menu performance */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top-selling items</CardTitle>
            <CardDescription>Ranked by quantity sold in the selected range.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topSellingItems.length === 0 ? (
              <EmptyState icon={ShoppingBag} title="No sales yet" description="Orders in this range will show here once completed." />
            ) : (
              <RankedBarChart
                data={data.topSellingItems.map((i) => ({ label: i.name, value: i.quantity }))}
                valueFormatter={(v) => `${v} sold`}
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sales by category</CardTitle>
            <CardDescription>Revenue contribution by menu category.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.salesByCategory.length === 0 ? (
              <EmptyState icon={Package} title="No sales yet" description="Category revenue will show here once orders complete." />
            ) : (
              <RankedBarChart
                data={data.salesByCategory.map((c) => ({ label: c.category, value: c.revenueMinor }))}
                valueFormatter={(v) => formatMoney(v, currency)}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Operational tables */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>The latest activity across your branches.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentOrders.length === 0 ? (
              <EmptyState icon={ReceiptText} title="No orders yet" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead numeric>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentOrders.map((order) => (
                    <TableRow key={order.orderNumber}>
                      <TableCell>
                        <span className="font-medium">{order.orderNumber}</span>
                        <span className="block text-xs text-muted-foreground">{format(parseISO(order.createdAt), 'MMM d, HH:mm')}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{order.branchName}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[order.status] ?? 'muted'} size="sm">
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell numeric className="font-medium">
                        {formatMoney(order.grandTotalMinor, currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low-stock alerts</CardTitle>
            <CardDescription>Ingredients at or below their reorder level.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {data.lowStockAlerts.length === 0 ? (
              <EmptyState icon={Package} title="Stock levels look healthy" description="Nothing is below its reorder level right now." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead numeric>Stock</TableHead>
                    <TableHead numeric>Reorder at</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.lowStockAlerts.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.branchName}</TableCell>
                      <TableCell numeric>
                        <Badge variant={item.currentStockBase === 0 ? 'destructive' : 'warning'} size="sm">
                          {item.currentStockBase} {item.unit}
                        </Badge>
                      </TableCell>
                      <TableCell numeric className="text-muted-foreground">
                        {item.reorderLevelBase} {item.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Peak hours, kitchen performance, staff activity */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Peak ordering hours</CardTitle>
            <CardDescription>Orders placed by hour, selected range.</CardDescription>
          </CardHeader>
          <CardContent>
            <PeakHoursChart data={data.peakHours} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Kitchen performance</CardTitle>
            <CardDescription>Average ticket time by station.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {data.kitchenPerformance.length === 0 ? (
              <EmptyState icon={ChefHat} title="No kitchen tickets yet" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Station</TableHead>
                    <TableHead numeric>Avg. time</TableHead>
                    <TableHead numeric>Tickets</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.kitchenPerformance.map((k) => (
                    <TableRow key={k.station}>
                      <TableCell className="font-medium capitalize">{k.station}</TableCell>
                      <TableCell numeric>
                        <span className={k.avgMinutes > 15 ? 'text-warning' : 'text-foreground'}>{k.avgMinutes} min</span>
                      </TableCell>
                      <TableCell numeric className="text-muted-foreground">
                        {k.tickets}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Staff activity</CardTitle>
            <CardDescription>Top performers, selected range.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {data.staffActivity.length === 0 ? (
              <EmptyState icon={Clock4} title="No staff activity yet" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead numeric>Orders</TableHead>
                    <TableHead numeric>Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.staffActivity.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <span className="font-medium">{s.name}</span>
                        <span className="block text-xs text-muted-foreground capitalize">{s.role.replace(/_/g, ' ')}</span>
                      </TableCell>
                      <TableCell numeric>{s.ordersHandled}</TableCell>
                      <TableCell numeric className="font-medium">
                        {formatMoney(s.salesMinor, currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
