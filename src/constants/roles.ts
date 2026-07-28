import { ALL_PERMISSIONS, PERMISSIONS, type Permission } from './permissions';

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  OWNER: 'owner',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  WAITER: 'waiter',
  KITCHEN: 'kitchen',
  ACCOUNTANT: 'accountant',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_VALUES = Object.values(ROLES) as Role[];

const P = PERMISSIONS;

/**
 * Baseline permission grants per role.
 *
 * These are *defaults*: a Role document seeded from this map can be edited at
 * runtime from Settings → Permissions, and the effective set is read from the
 * database. Super Admin is the one role whose grants are not editable.
 *
 * Note the difference between Super Admin and Owner is **data scope**, not
 * permissions: Super Admin is platform-wide (no restaurant filter), Owner is
 * confined to their own restaurant. Scope is enforced in the repository layer.
 */
export const ROLE_PERMISSIONS: Record<Role, ReadonlyArray<Permission>> = {
  [ROLES.SUPER_ADMIN]: ALL_PERMISSIONS,

  [ROLES.OWNER]: ALL_PERMISSIONS,

  [ROLES.MANAGER]: [
    P.DASHBOARD_VIEW,
    P.DASHBOARD_VIEW_FINANCIALS,
    P.POS_ACCESS,
    P.POS_APPLY_DISCOUNT,
    P.POS_OVERRIDE_PRICE,
    P.ORDER_VIEW,
    P.ORDER_VIEW_ALL,
    P.ORDER_CREATE,
    P.ORDER_UPDATE,
    P.ORDER_CANCEL,
    P.ORDER_VOID,
    P.ORDER_TRANSFER,
    P.PAYMENT_VIEW,
    P.PAYMENT_CREATE,
    P.PAYMENT_VOID,
    P.PAYMENT_REFUND,
    P.PAYMENT_APPROVE_REFUND,
    P.KITCHEN_VIEW,
    P.KITCHEN_UPDATE,
    P.TABLE_VIEW,
    P.TABLE_MANAGE,
    P.TABLE_ASSIGN,
    P.RESERVATION_VIEW,
    P.RESERVATION_MANAGE,
    P.MENU_VIEW,
    P.MENU_MANAGE,
    P.MENU_IMPORT,
    P.INVENTORY_VIEW,
    P.INVENTORY_MANAGE,
    P.INVENTORY_ADJUST,
    P.INVENTORY_COUNT,
    P.SUPPLIER_VIEW,
    P.SUPPLIER_MANAGE,
    P.PURCHASE_VIEW,
    P.PURCHASE_MANAGE,
    P.PURCHASE_APPROVE,
    P.PURCHASE_RECEIVE,
    P.EXPENSE_VIEW,
    P.EXPENSE_MANAGE,
    P.EXPENSE_APPROVE,
    P.CUSTOMER_VIEW,
    P.CUSTOMER_MANAGE,
    P.CUSTOMER_BLACKLIST,
    P.LOYALTY_VIEW,
    P.LOYALTY_MANAGE,
    P.LOYALTY_ADJUST_POINTS,
    P.EMPLOYEE_VIEW,
    P.EMPLOYEE_MANAGE,
    P.ATTENDANCE_VIEW,
    P.ATTENDANCE_MANAGE,
    P.REGISTER_VIEW,
    P.REGISTER_VIEW_ALL,
    P.REGISTER_OPEN,
    P.REGISTER_CLOSE,
    P.DELIVERY_VIEW,
    P.DELIVERY_MANAGE,
    P.REPORT_VIEW_SALES,
    P.REPORT_VIEW_FINANCIAL,
    P.REPORT_VIEW_INVENTORY,
    P.REPORT_VIEW_STAFF,
    P.REPORT_EXPORT,
    P.BRANCH_VIEW,
    P.SETTINGS_VIEW,
    P.USER_VIEW,
    P.AUDIT_LOG_VIEW,
  ],

  [ROLES.CASHIER]: [
    P.DASHBOARD_VIEW,
    P.POS_ACCESS,
    P.POS_APPLY_DISCOUNT,
    P.ORDER_VIEW,
    P.ORDER_CREATE,
    P.ORDER_UPDATE,
    P.ORDER_TRANSFER,
    P.PAYMENT_VIEW,
    P.PAYMENT_CREATE,
    P.KITCHEN_VIEW,
    P.TABLE_VIEW,
    P.TABLE_ASSIGN,
    P.RESERVATION_VIEW,
    P.MENU_VIEW,
    P.CUSTOMER_VIEW,
    P.CUSTOMER_MANAGE,
    P.LOYALTY_VIEW,
    P.REGISTER_VIEW,
    P.REGISTER_OPEN,
    P.REGISTER_CLOSE,
    P.DELIVERY_VIEW,
  ],

  [ROLES.WAITER]: [
    P.DASHBOARD_VIEW,
    P.POS_ACCESS,
    P.ORDER_VIEW,
    P.ORDER_CREATE,
    P.ORDER_UPDATE,
    P.ORDER_TRANSFER,
    P.KITCHEN_VIEW,
    P.TABLE_VIEW,
    P.TABLE_ASSIGN,
    P.RESERVATION_VIEW,
    P.RESERVATION_MANAGE,
    P.MENU_VIEW,
    P.CUSTOMER_VIEW,
    P.DELIVERY_VIEW,
  ],

  [ROLES.KITCHEN]: [P.KITCHEN_VIEW, P.KITCHEN_UPDATE, P.ORDER_VIEW, P.MENU_VIEW, P.INVENTORY_VIEW],

  [ROLES.ACCOUNTANT]: [
    P.DASHBOARD_VIEW,
    P.DASHBOARD_VIEW_FINANCIALS,
    P.ORDER_VIEW,
    P.ORDER_VIEW_ALL,
    P.PAYMENT_VIEW,
    P.EXPENSE_VIEW,
    P.EXPENSE_MANAGE,
    P.EXPENSE_APPROVE,
    P.SUPPLIER_VIEW,
    P.PURCHASE_VIEW,
    P.INVENTORY_VIEW,
    P.CUSTOMER_VIEW,
    P.LOYALTY_VIEW,
    P.EMPLOYEE_VIEW,
    P.EMPLOYEE_VIEW_SALARY,
    P.ATTENDANCE_VIEW,
    P.REGISTER_VIEW,
    P.REGISTER_VIEW_ALL,
    P.REPORT_VIEW_SALES,
    P.REPORT_VIEW_FINANCIAL,
    P.REPORT_VIEW_INVENTORY,
    P.REPORT_VIEW_STAFF,
    P.REPORT_EXPORT,
    P.BRANCH_VIEW,
    P.SETTINGS_VIEW,
    P.AUDIT_LOG_VIEW,
  ],
};

export interface RoleMeta {
  value: Role;
  label: string;
  description: string;
  /** Where a user of this role lands immediately after signing in. */
  landingPath: string;
  /** Tailwind classes for the role badge. */
  badgeClass: string;
}

export const ROLE_META: Record<Role, RoleMeta> = {
  [ROLES.SUPER_ADMIN]: {
    value: ROLES.SUPER_ADMIN,
    label: 'Super Admin',
    description: 'Platform-wide access across every restaurant, branch and setting.',
    landingPath: '/dashboard',
    badgeClass: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
  },
  [ROLES.OWNER]: {
    value: ROLES.OWNER,
    label: 'Restaurant Owner',
    description: 'Full control of their own restaurant, its branches, staff and finances.',
    landingPath: '/dashboard',
    badgeClass: 'bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200',
  },
  [ROLES.MANAGER]: {
    value: ROLES.MANAGER,
    label: 'Manager',
    description: 'Runs daily operations: staff, stock, menu, approvals and reporting.',
    landingPath: '/dashboard',
    badgeClass: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200',
  },
  [ROLES.CASHIER]: {
    value: ROLES.CASHIER,
    label: 'Cashier',
    description: 'Takes orders and payments, and runs the cash register shift.',
    landingPath: '/pos',
    badgeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  },
  [ROLES.WAITER]: {
    value: ROLES.WAITER,
    label: 'Waiter',
    description: 'Manages tables and reservations, and sends orders to the kitchen.',
    landingPath: '/tables',
    badgeClass: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-200',
  },
  [ROLES.KITCHEN]: {
    value: ROLES.KITCHEN,
    label: 'Kitchen Staff',
    description: 'Works the kitchen display: accepts, prepares and completes tickets.',
    landingPath: '/kitchen',
    badgeClass: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200',
  },
  [ROLES.ACCOUNTANT]: {
    value: ROLES.ACCOUNTANT,
    label: 'Accountant',
    description: 'Read-only financial oversight plus expense entry and approval.',
    landingPath: '/reports',
    badgeClass: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
  },
};

export function landingPathForRole(role: Role): string {
  return ROLE_META[role]?.landingPath ?? '/dashboard';
}
