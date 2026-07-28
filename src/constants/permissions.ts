/**
 * Permission catalogue.
 *
 * Permissions are `resource:action` strings. They are the single source of
 * truth for authorisation — the API guards on them, the navigation filters on
 * them, and the UI hides affordances that the current user cannot use.
 *
 * Adding a permission here without adding it to at least one role in
 * `roles.ts` makes it unreachable, which the permission tests assert against.
 */
export const PERMISSIONS = {
  // Dashboard & analytics
  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_VIEW_FINANCIALS: 'dashboard:view_financials',

  // Point of sale
  POS_ACCESS: 'pos:access',
  POS_APPLY_DISCOUNT: 'pos:apply_discount',
  POS_OVERRIDE_PRICE: 'pos:override_price',

  // Orders
  ORDER_VIEW: 'order:view',
  ORDER_VIEW_ALL: 'order:view_all',
  ORDER_CREATE: 'order:create',
  ORDER_UPDATE: 'order:update',
  ORDER_CANCEL: 'order:cancel',
  ORDER_VOID: 'order:void',
  ORDER_TRANSFER: 'order:transfer',

  // Payments
  PAYMENT_VIEW: 'payment:view',
  PAYMENT_CREATE: 'payment:create',
  PAYMENT_VOID: 'payment:void',
  PAYMENT_REFUND: 'payment:refund',
  PAYMENT_APPROVE_REFUND: 'payment:approve_refund',

  // Kitchen display
  KITCHEN_VIEW: 'kitchen:view',
  KITCHEN_UPDATE: 'kitchen:update',

  // Tables
  TABLE_VIEW: 'table:view',
  TABLE_MANAGE: 'table:manage',
  TABLE_ASSIGN: 'table:assign',

  // Reservations
  RESERVATION_VIEW: 'reservation:view',
  RESERVATION_MANAGE: 'reservation:manage',

  // Menu
  MENU_VIEW: 'menu:view',
  MENU_MANAGE: 'menu:manage',
  MENU_IMPORT: 'menu:import',

  // Inventory
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_MANAGE: 'inventory:manage',
  INVENTORY_ADJUST: 'inventory:adjust',
  INVENTORY_COUNT: 'inventory:count',

  // Suppliers & purchasing
  SUPPLIER_VIEW: 'supplier:view',
  SUPPLIER_MANAGE: 'supplier:manage',
  PURCHASE_VIEW: 'purchase:view',
  PURCHASE_MANAGE: 'purchase:manage',
  PURCHASE_APPROVE: 'purchase:approve',
  PURCHASE_RECEIVE: 'purchase:receive',

  // Expenses
  EXPENSE_VIEW: 'expense:view',
  EXPENSE_MANAGE: 'expense:manage',
  EXPENSE_APPROVE: 'expense:approve',

  // Customers & loyalty
  CUSTOMER_VIEW: 'customer:view',
  CUSTOMER_MANAGE: 'customer:manage',
  CUSTOMER_BLACKLIST: 'customer:blacklist',
  LOYALTY_VIEW: 'loyalty:view',
  LOYALTY_MANAGE: 'loyalty:manage',
  LOYALTY_ADJUST_POINTS: 'loyalty:adjust_points',

  // People
  EMPLOYEE_VIEW: 'employee:view',
  EMPLOYEE_MANAGE: 'employee:manage',
  EMPLOYEE_VIEW_SALARY: 'employee:view_salary',
  ATTENDANCE_VIEW: 'attendance:view',
  ATTENDANCE_MANAGE: 'attendance:manage',

  // Shifts & cash register
  REGISTER_VIEW: 'register:view',
  REGISTER_OPEN: 'register:open',
  REGISTER_CLOSE: 'register:close',
  REGISTER_VIEW_ALL: 'register:view_all',

  // Delivery
  DELIVERY_VIEW: 'delivery:view',
  DELIVERY_MANAGE: 'delivery:manage',

  // Reports
  REPORT_VIEW_SALES: 'report:view_sales',
  REPORT_VIEW_FINANCIAL: 'report:view_financial',
  REPORT_VIEW_INVENTORY: 'report:view_inventory',
  REPORT_VIEW_STAFF: 'report:view_staff',
  REPORT_EXPORT: 'report:export',

  // Branches & settings
  BRANCH_VIEW: 'branch:view',
  BRANCH_MANAGE: 'branch:manage',
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_MANAGE: 'settings:manage',

  // Administration
  USER_VIEW: 'user:view',
  USER_MANAGE: 'user:manage',
  AUDIT_LOG_VIEW: 'audit_log:view',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[];

/** Human-readable grouping used by the settings > permissions matrix screen. */
export const PERMISSION_GROUPS: ReadonlyArray<{
  label: string;
  permissions: ReadonlyArray<Permission>;
}> = [
  {
    label: 'Dashboard',
    permissions: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.DASHBOARD_VIEW_FINANCIALS],
  },
  {
    label: 'Point of Sale',
    permissions: [PERMISSIONS.POS_ACCESS, PERMISSIONS.POS_APPLY_DISCOUNT, PERMISSIONS.POS_OVERRIDE_PRICE],
  },
  {
    label: 'Orders',
    permissions: [
      PERMISSIONS.ORDER_VIEW,
      PERMISSIONS.ORDER_VIEW_ALL,
      PERMISSIONS.ORDER_CREATE,
      PERMISSIONS.ORDER_UPDATE,
      PERMISSIONS.ORDER_CANCEL,
      PERMISSIONS.ORDER_VOID,
      PERMISSIONS.ORDER_TRANSFER,
    ],
  },
  {
    label: 'Payments',
    permissions: [
      PERMISSIONS.PAYMENT_VIEW,
      PERMISSIONS.PAYMENT_CREATE,
      PERMISSIONS.PAYMENT_VOID,
      PERMISSIONS.PAYMENT_REFUND,
      PERMISSIONS.PAYMENT_APPROVE_REFUND,
    ],
  },
  { label: 'Kitchen', permissions: [PERMISSIONS.KITCHEN_VIEW, PERMISSIONS.KITCHEN_UPDATE] },
  {
    label: 'Tables & Reservations',
    permissions: [
      PERMISSIONS.TABLE_VIEW,
      PERMISSIONS.TABLE_MANAGE,
      PERMISSIONS.TABLE_ASSIGN,
      PERMISSIONS.RESERVATION_VIEW,
      PERMISSIONS.RESERVATION_MANAGE,
    ],
  },
  {
    label: 'Menu',
    permissions: [PERMISSIONS.MENU_VIEW, PERMISSIONS.MENU_MANAGE, PERMISSIONS.MENU_IMPORT],
  },
  {
    label: 'Inventory',
    permissions: [
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.INVENTORY_MANAGE,
      PERMISSIONS.INVENTORY_ADJUST,
      PERMISSIONS.INVENTORY_COUNT,
    ],
  },
  {
    label: 'Suppliers & Purchasing',
    permissions: [
      PERMISSIONS.SUPPLIER_VIEW,
      PERMISSIONS.SUPPLIER_MANAGE,
      PERMISSIONS.PURCHASE_VIEW,
      PERMISSIONS.PURCHASE_MANAGE,
      PERMISSIONS.PURCHASE_APPROVE,
      PERMISSIONS.PURCHASE_RECEIVE,
    ],
  },
  {
    label: 'Expenses',
    permissions: [PERMISSIONS.EXPENSE_VIEW, PERMISSIONS.EXPENSE_MANAGE, PERMISSIONS.EXPENSE_APPROVE],
  },
  {
    label: 'Customers & Loyalty',
    permissions: [
      PERMISSIONS.CUSTOMER_VIEW,
      PERMISSIONS.CUSTOMER_MANAGE,
      PERMISSIONS.CUSTOMER_BLACKLIST,
      PERMISSIONS.LOYALTY_VIEW,
      PERMISSIONS.LOYALTY_MANAGE,
      PERMISSIONS.LOYALTY_ADJUST_POINTS,
    ],
  },
  {
    label: 'Employees',
    permissions: [
      PERMISSIONS.EMPLOYEE_VIEW,
      PERMISSIONS.EMPLOYEE_MANAGE,
      PERMISSIONS.EMPLOYEE_VIEW_SALARY,
      PERMISSIONS.ATTENDANCE_VIEW,
      PERMISSIONS.ATTENDANCE_MANAGE,
    ],
  },
  {
    label: 'Cash Register',
    permissions: [
      PERMISSIONS.REGISTER_VIEW,
      PERMISSIONS.REGISTER_OPEN,
      PERMISSIONS.REGISTER_CLOSE,
      PERMISSIONS.REGISTER_VIEW_ALL,
    ],
  },
  { label: 'Delivery', permissions: [PERMISSIONS.DELIVERY_VIEW, PERMISSIONS.DELIVERY_MANAGE] },
  {
    label: 'Reports',
    permissions: [
      PERMISSIONS.REPORT_VIEW_SALES,
      PERMISSIONS.REPORT_VIEW_FINANCIAL,
      PERMISSIONS.REPORT_VIEW_INVENTORY,
      PERMISSIONS.REPORT_VIEW_STAFF,
      PERMISSIONS.REPORT_EXPORT,
    ],
  },
  {
    label: 'Administration',
    permissions: [
      PERMISSIONS.BRANCH_VIEW,
      PERMISSIONS.BRANCH_MANAGE,
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.SETTINGS_MANAGE,
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.USER_MANAGE,
      PERMISSIONS.AUDIT_LOG_VIEW,
    ],
  },
];
