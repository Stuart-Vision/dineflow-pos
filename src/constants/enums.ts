/**
 * Domain enumerations shared by the Mongoose schemas, the Zod validators and
 * the UI. Keeping them in one place means a status string can never drift
 * between the database and the screen that renders it.
 */

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const ORDER_STATUS = {
  DRAFT: 'draft',
  HELD: 'held',
  SUBMITTED: 'submitted',
  KITCHEN_ACCEPTED: 'kitchen_accepted',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  PAID: 'paid',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
  VOIDED: 'voided',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
export const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS) as OrderStatus[];

/**
 * The order state machine. An order may only move to a status listed for its
 * current status; `orderStatusService.assertTransition` enforces this and the
 * transition tests exercise every edge.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, ReadonlyArray<OrderStatus>> = {
  [ORDER_STATUS.DRAFT]: [ORDER_STATUS.HELD, ORDER_STATUS.SUBMITTED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.HELD]: [ORDER_STATUS.DRAFT, ORDER_STATUS.SUBMITTED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SUBMITTED]: [
    ORDER_STATUS.KITCHEN_ACCEPTED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.VOIDED,
    // Counter sales (a drink, a packaged item) never reach the kitchen.
    ORDER_STATUS.READY,
  ],
  [ORDER_STATUS.KITCHEN_ACCEPTED]: [
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.VOIDED,
  ],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED, ORDER_STATUS.VOIDED],
  [ORDER_STATUS.READY]: [ORDER_STATUS.SERVED, ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SERVED]: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PAID]: [
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.REFUNDED,
    ORDER_STATUS.PARTIALLY_REFUNDED,
  ],
  [ORDER_STATUS.COMPLETED]: [ORDER_STATUS.REFUNDED, ORDER_STATUS.PARTIALLY_REFUNDED],
  [ORDER_STATUS.PARTIALLY_REFUNDED]: [ORDER_STATUS.REFUNDED],
  // Terminal states.
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.REFUNDED]: [],
  [ORDER_STATUS.VOIDED]: [],
};

/** Statuses that still occupy a table and still count as "open". */
export const OPEN_ORDER_STATUSES: ReadonlyArray<OrderStatus> = [
  ORDER_STATUS.DRAFT,
  ORDER_STATUS.HELD,
  ORDER_STATUS.SUBMITTED,
  ORDER_STATUS.KITCHEN_ACCEPTED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
  ORDER_STATUS.SERVED,
];

/** Statuses that contribute to revenue reporting. */
export const REVENUE_ORDER_STATUSES: ReadonlyArray<OrderStatus> = [
  ORDER_STATUS.PAID,
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.PARTIALLY_REFUNDED,
];

export const ORDER_TYPE = {
  DINE_IN: 'dine_in',
  TAKEAWAY: 'takeaway',
  DELIVERY: 'delivery',
} as const;
export type OrderType = (typeof ORDER_TYPE)[keyof typeof ORDER_TYPE];
export const ORDER_TYPE_VALUES = Object.values(ORDER_TYPE) as OrderType[];

export const ORDER_PRIORITY = {
  NORMAL: 'normal',
  HIGH: 'high',
  RUSH: 'rush',
} as const;
export type OrderPriority = (typeof ORDER_PRIORITY)[keyof typeof ORDER_PRIORITY];
export const ORDER_PRIORITY_VALUES = Object.values(ORDER_PRIORITY) as OrderPriority[];

export const ORDER_ITEM_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  CANCELLED: 'cancelled',
} as const;
export type OrderItemStatus = (typeof ORDER_ITEM_STATUS)[keyof typeof ORDER_ITEM_STATUS];
export const ORDER_ITEM_STATUS_VALUES = Object.values(ORDER_ITEM_STATUS) as OrderItemStatus[];

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export const PAYMENT_METHOD = {
  CASH: 'cash',
  CARD: 'card',
  DIGITAL_WALLET: 'digital_wallet',
  BANK_TRANSFER: 'bank_transfer',
  STORE_CREDIT: 'store_credit',
  LOYALTY_POINTS: 'loyalty_points',
} as const;
export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];
export const PAYMENT_METHOD_VALUES = Object.values(PAYMENT_METHOD) as PaymentMethod[];

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  COMPLETED: 'completed',
  FAILED: 'failed',
  VOIDED: 'voided',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
} as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
export const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS) as PaymentStatus[];

export const REFUND_STATUS = {
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PROCESSED: 'processed',
} as const;
export type RefundStatus = (typeof REFUND_STATUS)[keyof typeof REFUND_STATUS];
export const REFUND_STATUS_VALUES = Object.values(REFUND_STATUS) as RefundStatus[];

export const DISCOUNT_TYPE = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
} as const;
export type DiscountType = (typeof DISCOUNT_TYPE)[keyof typeof DISCOUNT_TYPE];
export const DISCOUNT_TYPE_VALUES = Object.values(DISCOUNT_TYPE) as DiscountType[];

// ---------------------------------------------------------------------------
// Tables & reservations
// ---------------------------------------------------------------------------

export const TABLE_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  CLEANING: 'cleaning',
  OUT_OF_SERVICE: 'out_of_service',
} as const;
export type TableStatus = (typeof TABLE_STATUS)[keyof typeof TABLE_STATUS];
export const TABLE_STATUS_VALUES = Object.values(TABLE_STATUS) as TableStatus[];

export const TABLE_SHAPE = {
  SQUARE: 'square',
  ROUND: 'round',
  RECTANGLE: 'rectangle',
  BOOTH: 'booth',
} as const;
export type TableShape = (typeof TABLE_SHAPE)[keyof typeof TABLE_SHAPE];
export const TABLE_SHAPE_VALUES = Object.values(TABLE_SHAPE) as TableShape[];

export const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SEATED: 'seated',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;
export type ReservationStatus = (typeof RESERVATION_STATUS)[keyof typeof RESERVATION_STATUS];
export const RESERVATION_STATUS_VALUES = Object.values(RESERVATION_STATUS) as ReservationStatus[];

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

export const DELIVERY_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY_FOR_PICKUP: 'ready_for_pickup',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;
export type DeliveryStatus = (typeof DELIVERY_STATUS)[keyof typeof DELIVERY_STATUS];
export const DELIVERY_STATUS_VALUES = Object.values(DELIVERY_STATUS) as DeliveryStatus[];

export const DRIVER_STATUS = {
  AVAILABLE: 'available',
  ON_DELIVERY: 'on_delivery',
  OFF_DUTY: 'off_duty',
} as const;
export type DriverStatus = (typeof DRIVER_STATUS)[keyof typeof DRIVER_STATUS];
export const DRIVER_STATUS_VALUES = Object.values(DRIVER_STATUS) as DriverStatus[];

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export const SPICY_LEVEL = {
  NONE: 0,
  MILD: 1,
  MEDIUM: 2,
  HOT: 3,
  EXTRA_HOT: 4,
} as const;
export type SpicyLevel = (typeof SPICY_LEVEL)[keyof typeof SPICY_LEVEL];

export const ALLERGENS = [
  'gluten',
  'dairy',
  'eggs',
  'peanuts',
  'tree_nuts',
  'soy',
  'fish',
  'shellfish',
  'sesame',
  'mustard',
  'celery',
  'sulphites',
] as const;
export type Allergen = (typeof ALLERGENS)[number];

export const MODIFIER_SELECTION = {
  SINGLE: 'single',
  MULTIPLE: 'multiple',
} as const;
export type ModifierSelection = (typeof MODIFIER_SELECTION)[keyof typeof MODIFIER_SELECTION];
export const MODIFIER_SELECTION_VALUES = Object.values(MODIFIER_SELECTION) as ModifierSelection[];

export const KITCHEN_STATION = {
  GRILL: 'grill',
  FRYER: 'fryer',
  SALAD: 'salad',
  PIZZA: 'pizza',
  CURRY: 'curry',
  WOK: 'wok',
  DESSERT: 'dessert',
  BAR: 'bar',
  BARISTA: 'barista',
  EXPO: 'expo',
} as const;
export type KitchenStation = (typeof KITCHEN_STATION)[keyof typeof KITCHEN_STATION];
export const KITCHEN_STATION_VALUES = Object.values(KITCHEN_STATION) as KitchenStation[];

// ---------------------------------------------------------------------------
// Inventory & purchasing
// ---------------------------------------------------------------------------

export const UNIT = {
  GRAM: 'g',
  KILOGRAM: 'kg',
  MILLILITRE: 'ml',
  LITRE: 'l',
  PIECE: 'pc',
  PACK: 'pack',
  BOX: 'box',
  BOTTLE: 'bottle',
  CAN: 'can',
  DOZEN: 'dozen',
} as const;
export type Unit = (typeof UNIT)[keyof typeof UNIT];
export const UNIT_VALUES = Object.values(UNIT) as Unit[];

/** Base unit each purchase/consumption unit converts into, with its factor. */
export const UNIT_BASE: Record<Unit, { base: Unit; factor: number }> = {
  [UNIT.GRAM]: { base: UNIT.GRAM, factor: 1 },
  [UNIT.KILOGRAM]: { base: UNIT.GRAM, factor: 1000 },
  [UNIT.MILLILITRE]: { base: UNIT.MILLILITRE, factor: 1 },
  [UNIT.LITRE]: { base: UNIT.MILLILITRE, factor: 1000 },
  [UNIT.PIECE]: { base: UNIT.PIECE, factor: 1 },
  [UNIT.PACK]: { base: UNIT.PIECE, factor: 1 },
  [UNIT.BOX]: { base: UNIT.PIECE, factor: 1 },
  [UNIT.BOTTLE]: { base: UNIT.PIECE, factor: 1 },
  [UNIT.CAN]: { base: UNIT.PIECE, factor: 1 },
  [UNIT.DOZEN]: { base: UNIT.PIECE, factor: 12 },
};

export const INVENTORY_TRANSACTION_TYPE = {
  STOCK_IN: 'stock_in',
  STOCK_OUT: 'stock_out',
  SALE_DEDUCTION: 'sale_deduction',
  ADJUSTMENT: 'adjustment',
  WASTAGE: 'wastage',
  RETURN: 'return',
  TRANSFER_IN: 'transfer_in',
  TRANSFER_OUT: 'transfer_out',
  PHYSICAL_COUNT: 'physical_count',
  OPENING_BALANCE: 'opening_balance',
} as const;
export type InventoryTransactionType =
  (typeof INVENTORY_TRANSACTION_TYPE)[keyof typeof INVENTORY_TRANSACTION_TYPE];
export const INVENTORY_TRANSACTION_TYPE_VALUES = Object.values(
  INVENTORY_TRANSACTION_TYPE,
) as InventoryTransactionType[];

/** Transaction types that increase stock; everything else decreases it. */
export const INVENTORY_INBOUND_TYPES: ReadonlyArray<InventoryTransactionType> = [
  INVENTORY_TRANSACTION_TYPE.STOCK_IN,
  INVENTORY_TRANSACTION_TYPE.RETURN,
  INVENTORY_TRANSACTION_TYPE.TRANSFER_IN,
  INVENTORY_TRANSACTION_TYPE.OPENING_BALANCE,
];

export const WASTAGE_REASON = {
  EXPIRED: 'expired',
  DAMAGED: 'damaged',
  SPOILED: 'spoiled',
  PREPARATION_ERROR: 'preparation_error',
  CUSTOMER_RETURN: 'customer_return',
  SPILLAGE: 'spillage',
  OTHER: 'other',
} as const;
export type WastageReason = (typeof WASTAGE_REASON)[keyof typeof WASTAGE_REASON];
export const WASTAGE_REASON_VALUES = Object.values(WASTAGE_REASON) as WastageReason[];

export const PURCHASE_ORDER_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  ORDERED: 'ordered',
  PARTIALLY_RECEIVED: 'partially_received',
  RECEIVED: 'received',
  CANCELLED: 'cancelled',
} as const;
export type PurchaseOrderStatus =
  (typeof PURCHASE_ORDER_STATUS)[keyof typeof PURCHASE_ORDER_STATUS];
export const PURCHASE_ORDER_STATUS_VALUES = Object.values(
  PURCHASE_ORDER_STATUS,
) as PurchaseOrderStatus[];

export const PURCHASE_PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid',
} as const;
export type PurchasePaymentStatus =
  (typeof PURCHASE_PAYMENT_STATUS)[keyof typeof PURCHASE_PAYMENT_STATUS];
export const PURCHASE_PAYMENT_STATUS_VALUES = Object.values(
  PURCHASE_PAYMENT_STATUS,
) as PurchasePaymentStatus[];

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

export const EXPENSE_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid',
} as const;
export type ExpenseStatus = (typeof EXPENSE_STATUS)[keyof typeof EXPENSE_STATUS];
export const EXPENSE_STATUS_VALUES = Object.values(EXPENSE_STATUS) as ExpenseStatus[];

export const RECURRENCE = {
  NONE: 'none',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
} as const;
export type Recurrence = (typeof RECURRENCE)[keyof typeof RECURRENCE];
export const RECURRENCE_VALUES = Object.values(RECURRENCE) as Recurrence[];

// ---------------------------------------------------------------------------
// Customers & loyalty
// ---------------------------------------------------------------------------

export const CUSTOMER_SEGMENT = {
  NEW: 'new',
  REGULAR: 'regular',
  VIP: 'vip',
  INACTIVE: 'inactive',
  HIGH_SPENDER: 'high_spender',
} as const;
export type CustomerSegment = (typeof CUSTOMER_SEGMENT)[keyof typeof CUSTOMER_SEGMENT];
export const CUSTOMER_SEGMENT_VALUES = Object.values(CUSTOMER_SEGMENT) as CustomerSegment[];

export const MEMBERSHIP_TIER = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
} as const;
export type MembershipTier = (typeof MEMBERSHIP_TIER)[keyof typeof MEMBERSHIP_TIER];
export const MEMBERSHIP_TIER_VALUES = Object.values(MEMBERSHIP_TIER) as MembershipTier[];

/** Points threshold and earn multiplier per tier. */
export const MEMBERSHIP_TIER_RULES: Record<
  MembershipTier,
  { minLifetimePoints: number; earnMultiplier: number; discountPercent: number }
> = {
  [MEMBERSHIP_TIER.BRONZE]: { minLifetimePoints: 0, earnMultiplier: 1, discountPercent: 0 },
  [MEMBERSHIP_TIER.SILVER]: { minLifetimePoints: 500, earnMultiplier: 1.25, discountPercent: 3 },
  [MEMBERSHIP_TIER.GOLD]: { minLifetimePoints: 2000, earnMultiplier: 1.5, discountPercent: 5 },
  [MEMBERSHIP_TIER.PLATINUM]: { minLifetimePoints: 5000, earnMultiplier: 2, discountPercent: 8 },
};

export const LOYALTY_TRANSACTION_TYPE = {
  EARNED: 'earned',
  REDEEMED: 'redeemed',
  EXPIRED: 'expired',
  ADJUSTED: 'adjusted',
  REFUNDED: 'refunded',
  BONUS: 'bonus',
  REFERRAL: 'referral',
  BIRTHDAY: 'birthday',
} as const;
export type LoyaltyTransactionType =
  (typeof LOYALTY_TRANSACTION_TYPE)[keyof typeof LOYALTY_TRANSACTION_TYPE];
export const LOYALTY_TRANSACTION_TYPE_VALUES = Object.values(
  LOYALTY_TRANSACTION_TYPE,
) as LoyaltyTransactionType[];

export const COUPON_TYPE = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
  FREE_ITEM: 'free_item',
} as const;
export type CouponType = (typeof COUPON_TYPE)[keyof typeof COUPON_TYPE];
export const COUPON_TYPE_VALUES = Object.values(COUPON_TYPE) as CouponType[];

// ---------------------------------------------------------------------------
// Employees & shifts
// ---------------------------------------------------------------------------

export const EMPLOYMENT_STATUS = {
  ACTIVE: 'active',
  ON_LEAVE: 'on_leave',
  SUSPENDED: 'suspended',
  TERMINATED: 'terminated',
} as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUS)[keyof typeof EMPLOYMENT_STATUS];
export const EMPLOYMENT_STATUS_VALUES = Object.values(EMPLOYMENT_STATUS) as EmploymentStatus[];

export const EMPLOYMENT_TYPE = {
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  CONTRACT: 'contract',
  CASUAL: 'casual',
} as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPE)[keyof typeof EMPLOYMENT_TYPE];
export const EMPLOYMENT_TYPE_VALUES = Object.values(EMPLOYMENT_TYPE) as EmploymentType[];

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  LATE: 'late',
  ABSENT: 'absent',
  ON_LEAVE: 'on_leave',
  HALF_DAY: 'half_day',
} as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];
export const ATTENDANCE_STATUS_VALUES = Object.values(ATTENDANCE_STATUS) as AttendanceStatus[];

export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;
export type LeaveStatus = (typeof LEAVE_STATUS)[keyof typeof LEAVE_STATUS];
export const LEAVE_STATUS_VALUES = Object.values(LEAVE_STATUS) as LeaveStatus[];

export const REGISTER_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  RECONCILED: 'reconciled',
} as const;
export type RegisterStatus = (typeof REGISTER_STATUS)[keyof typeof REGISTER_STATUS];
export const REGISTER_STATUS_VALUES = Object.values(REGISTER_STATUS) as RegisterStatus[];

export const CASH_MOVEMENT_TYPE = {
  PAID_IN: 'paid_in',
  PAID_OUT: 'paid_out',
} as const;
export type CashMovementType = (typeof CASH_MOVEMENT_TYPE)[keyof typeof CASH_MOVEMENT_TYPE];
export const CASH_MOVEMENT_TYPE_VALUES = Object.values(CASH_MOVEMENT_TYPE) as CashMovementType[];

// ---------------------------------------------------------------------------
// Notifications & audit
// ---------------------------------------------------------------------------

export const NOTIFICATION_TYPE = {
  ORDER_NEW: 'order_new',
  ORDER_READY: 'order_ready',
  ORDER_CANCELLED: 'order_cancelled',
  STOCK_LOW: 'stock_low',
  STOCK_OUT: 'stock_out',
  RESERVATION_REMINDER: 'reservation_reminder',
  APPROVAL_PENDING: 'approval_pending',
  REGISTER_VARIANCE: 'register_variance',
  PAYMENT_RECEIVED: 'payment_received',
  REFUND_REQUESTED: 'refund_requested',
  SYSTEM: 'system',
} as const;
export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];
export const NOTIFICATION_TYPE_VALUES = Object.values(NOTIFICATION_TYPE) as NotificationType[];

export const NOTIFICATION_SEVERITY = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  CRITICAL: 'critical',
} as const;
export type NotificationSeverity =
  (typeof NOTIFICATION_SEVERITY)[keyof typeof NOTIFICATION_SEVERITY];
export const NOTIFICATION_SEVERITY_VALUES = Object.values(
  NOTIFICATION_SEVERITY,
) as NotificationSeverity[];

export const AUDIT_ACTION = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  PASSWORD_RESET: 'password_reset',
  APPROVE: 'approve',
  REJECT: 'reject',
  VOID: 'void',
  REFUND: 'refund',
  DISCOUNT_APPLIED: 'discount_applied',
  EXPORT: 'export',
  PERMISSION_DENIED: 'permission_denied',
} as const;
export type AuditAction = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];
export const AUDIT_ACTION_VALUES = Object.values(AUDIT_ACTION) as AuditAction[];
