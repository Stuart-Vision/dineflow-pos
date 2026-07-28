import mongoose from 'mongoose';

import {
  CUSTOMER_SEGMENT,
  LOYALTY_TRANSACTION_TYPE,
  MEMBERSHIP_TIER,
  MEMBERSHIP_TIER_RULES,
  type CustomerSegment,
  type MembershipTier,
} from '@/constants/enums';
import { NotFoundError } from '@/lib/api/errors';
import type { SessionUser } from '@/lib/auth/session';
import { Customer, type CustomerDocument } from '@/models/Customer';
import { LoyaltyTransaction } from '@/models/LoyaltyTransaction';
import { Order } from '@/models/Order';

export interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email?: string;
  segment: CustomerSegment;
  membershipTier: MembershipTier;
  loyaltyPointsBalance: number;
  lifetimePoints: number;
  totalSpentMinor: number;
  totalOrders: number;
  avgOrderValueMinor: number;
  lastVisitAt: string | null;
  birthday: string | null;
  tags: string[];
  isBlacklisted: boolean;
  notes: string | null;
}

function toRow(customer: {
  _id: unknown;
  name: string;
  phone: string;
  email?: string;
  segment: CustomerSegment;
  membershipTier: MembershipTier;
  loyaltyPointsBalance: number;
  lifetimePoints: number;
  totalSpentMinor: number;
  totalOrders: number;
  lastVisitAt?: Date | null;
  birthday?: Date | null;
  tags: string[];
  isBlacklisted: boolean;
  notes?: string | null;
}): CustomerRow {
  return {
    id: String(customer._id),
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    segment: customer.segment,
    membershipTier: customer.membershipTier,
    loyaltyPointsBalance: customer.loyaltyPointsBalance,
    lifetimePoints: customer.lifetimePoints,
    totalSpentMinor: customer.totalSpentMinor,
    totalOrders: customer.totalOrders,
    avgOrderValueMinor: customer.totalOrders > 0 ? Math.round(customer.totalSpentMinor / customer.totalOrders) : 0,
    lastVisitAt: customer.lastVisitAt ? new Date(customer.lastVisitAt).toISOString() : null,
    birthday: customer.birthday ? new Date(customer.birthday).toISOString() : null,
    tags: customer.tags,
    isBlacklisted: customer.isBlacklisted,
    notes: customer.notes ?? null,
  };
}

export async function listCustomers(restaurantId: string): Promise<CustomerRow[]> {
  const customers = await Customer.find({ restaurantId }).sort({ totalSpentMinor: -1 }).lean();
  return customers.map(toRow);
}

/**
 * Recomputes the tier from lifetime points and the segment from recency and
 * spend, so the CRM view reflects behaviour rather than whatever was set when
 * the record was created.
 */
export function deriveTierAndSegment(customer: {
  lifetimePoints: number;
  totalSpentMinor: number;
  totalOrders: number;
  lastVisitAt?: Date | null;
}): { tier: MembershipTier; segment: CustomerSegment } {
  const tier = ([MEMBERSHIP_TIER.PLATINUM, MEMBERSHIP_TIER.GOLD, MEMBERSHIP_TIER.SILVER, MEMBERSHIP_TIER.BRONZE] as MembershipTier[]).find(
    (candidate) => customer.lifetimePoints >= MEMBERSHIP_TIER_RULES[candidate].minLifetimePoints,
  ) ?? MEMBERSHIP_TIER.BRONZE;

  const daysSinceVisit = customer.lastVisitAt
    ? Math.floor((Date.now() - new Date(customer.lastVisitAt).getTime()) / 86_400_000)
    : Number.POSITIVE_INFINITY;

  let segment: CustomerSegment;
  if (customer.totalOrders === 0) segment = CUSTOMER_SEGMENT.NEW;
  else if (daysSinceVisit > 60) segment = CUSTOMER_SEGMENT.INACTIVE;
  else if (customer.totalSpentMinor >= 50_000) segment = CUSTOMER_SEGMENT.HIGH_SPENDER;
  else if (customer.totalOrders >= 8) segment = CUSTOMER_SEGMENT.VIP;
  else if (customer.totalOrders >= 3) segment = CUSTOMER_SEGMENT.REGULAR;
  else segment = CUSTOMER_SEGMENT.NEW;

  return { tier, segment };
}

export interface CustomerDetail extends CustomerRow {
  favouriteItems: Array<{ name: string; quantity: number }>;
  recentOrders: Array<{ orderNumber: string; grandTotalMinor: number; createdAt: string; status: string }>;
  loyaltyHistory: Array<{ type: string; points: number; description: string; createdAt: string }>;
}

export async function getCustomerDetail(customerId: string, restaurantId: string): Promise<CustomerDetail> {
  const customer = await Customer.findOne({ _id: customerId, restaurantId }).lean();
  if (!customer) throw new NotFoundError('Customer');

  const [favourites, recentOrders, loyaltyHistory] = await Promise.all([
    Order.aggregate<{ _id: string; quantity: number }>([
      { $match: { customerId: new mongoose.Types.ObjectId(customerId) } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', quantity: { $sum: '$items.quantity' } } },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]),
    Order.find({ customerId }).sort({ createdAt: -1 }).limit(8).select('orderNumber grandTotalMinor createdAt status').lean(),
    LoyaltyTransaction.find({ customerId }).sort({ createdAt: -1 }).limit(15).lean(),
  ]);

  return {
    ...toRow(customer),
    favouriteItems: favourites.map((f) => ({ name: f._id, quantity: f.quantity })),
    recentOrders: recentOrders.map((o) => ({
      orderNumber: o.orderNumber,
      grandTotalMinor: o.grandTotalMinor,
      createdAt: new Date(o.createdAt).toISOString(),
      status: o.status,
    })),
    loyaltyHistory: loyaltyHistory.map((l) => ({
      type: l.type,
      points: l.points,
      description: l.description,
      createdAt: new Date(l.createdAt).toISOString(),
    })),
  };
}

export async function adjustLoyaltyPoints(
  customerId: string,
  restaurantId: string,
  points: number,
  description: string,
  user: SessionUser,
): Promise<CustomerDocument> {
  const customer = await Customer.findOne({ _id: customerId, restaurantId });
  if (!customer) throw new NotFoundError('Customer');

  customer.loyaltyPointsBalance = Math.max(0, customer.loyaltyPointsBalance + points);
  // Only positive adjustments raise lifetime points; deducting must not let a
  // customer lose an already-earned tier.
  if (points > 0) customer.lifetimePoints += points;

  const { tier, segment } = deriveTierAndSegment(customer);
  customer.membershipTier = tier;
  customer.segment = segment;
  await customer.save();

  await LoyaltyTransaction.create({
    restaurantId,
    customerId: customer._id,
    type: LOYALTY_TRANSACTION_TYPE.ADJUSTED,
    points,
    orderId: null,
    description,
    expiresAt: null,
    performedBy: new mongoose.Types.ObjectId(user.id),
  });

  return customer;
}

export interface LoyaltyOverview {
  totalMembers: number;
  pointsOutstanding: number;
  pointsIssuedThisMonth: number;
  pointsRedeemedThisMonth: number;
  tierBreakdown: Array<{ tier: MembershipTier; members: number; discountPercent: number; minLifetimePoints: number }>;
  topMembers: Array<{ name: string; tier: MembershipTier; points: number; lifetimePoints: number }>;
  recentActivity: Array<{ customerName: string; type: string; points: number; description: string; createdAt: string }>;
}

export async function getLoyaltyOverview(restaurantId: string): Promise<LoyaltyOverview> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [customers, monthly, recent] = await Promise.all([
    Customer.find({ restaurantId }).select('name membershipTier loyaltyPointsBalance lifetimePoints').lean(),
    LoyaltyTransaction.aggregate<{ _id: string; total: number }>([
      { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId), createdAt: { $gte: monthStart } } },
      { $group: { _id: '$type', total: { $sum: '$points' } } },
    ]),
    LoyaltyTransaction.find({ restaurantId })
      .sort({ createdAt: -1 })
      .limit(15)
      .populate<{ customerId: { name: string } }>('customerId', 'name')
      .lean(),
  ]);

  const issuedTypes = new Set([
    LOYALTY_TRANSACTION_TYPE.EARNED,
    LOYALTY_TRANSACTION_TYPE.BONUS,
    LOYALTY_TRANSACTION_TYPE.REFERRAL,
    LOYALTY_TRANSACTION_TYPE.BIRTHDAY,
  ] as string[]);

  return {
    totalMembers: customers.length,
    pointsOutstanding: customers.reduce((sum, c) => sum + c.loyaltyPointsBalance, 0),
    pointsIssuedThisMonth: monthly.filter((m) => issuedTypes.has(m._id)).reduce((sum, m) => sum + m.total, 0),
    pointsRedeemedThisMonth: Math.abs(
      monthly.filter((m) => m._id === LOYALTY_TRANSACTION_TYPE.REDEEMED).reduce((sum, m) => sum + m.total, 0),
    ),
    tierBreakdown: (Object.keys(MEMBERSHIP_TIER_RULES) as MembershipTier[]).map((tier) => ({
      tier,
      members: customers.filter((c) => c.membershipTier === tier).length,
      discountPercent: MEMBERSHIP_TIER_RULES[tier].discountPercent,
      minLifetimePoints: MEMBERSHIP_TIER_RULES[tier].minLifetimePoints,
    })),
    topMembers: [...customers]
      .sort((a, b) => b.lifetimePoints - a.lifetimePoints)
      .slice(0, 8)
      .map((c) => ({
        name: c.name,
        tier: c.membershipTier,
        points: c.loyaltyPointsBalance,
        lifetimePoints: c.lifetimePoints,
      })),
    recentActivity: recent.map((r) => ({
      customerName: r.customerId?.name ?? 'Unknown customer',
      type: r.type,
      points: r.points,
      description: r.description,
      createdAt: new Date(r.createdAt).toISOString(),
    })),
  };
}
