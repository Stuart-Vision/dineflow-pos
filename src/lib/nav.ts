import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bike,
  Boxes,
  Building2,
  CalendarDays,
  ChefHat,
  Clock4,
  Gift,
  History,
  LayoutDashboard,
  LayoutGrid,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Truck,
  UserCog,
  Users,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';

import { PERMISSIONS, type Permission } from '@/constants/permissions';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** User needs at least one of these permissions to see the item. */
  anyOf: Permission[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export function pageTitleForPath(pathname: string): string {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return item.label;
    }
  }
  const segment = pathname.split('/').filter(Boolean)[0] ?? 'Dashboard';
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, anyOf: [PERMISSIONS.DASHBOARD_VIEW] }],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Point of Sale', href: '/pos', icon: ShoppingCart, anyOf: [PERMISSIONS.POS_ACCESS] },
      { label: 'Kitchen Display', href: '/kitchen', icon: ChefHat, anyOf: [PERMISSIONS.KITCHEN_VIEW] },
      { label: 'Tables', href: '/tables', icon: LayoutGrid, anyOf: [PERMISSIONS.TABLE_VIEW] },
      { label: 'Reservations', href: '/reservations', icon: CalendarDays, anyOf: [PERMISSIONS.RESERVATION_VIEW] },
      { label: 'Delivery', href: '/delivery', icon: Bike, anyOf: [PERMISSIONS.DELIVERY_VIEW] },
    ],
  },
  {
    label: 'Catalog & Inventory',
    items: [
      { label: 'Menu', href: '/menu', icon: UtensilsCrossed, anyOf: [PERMISSIONS.MENU_VIEW] },
      { label: 'Inventory', href: '/inventory', icon: Boxes, anyOf: [PERMISSIONS.INVENTORY_VIEW] },
      { label: 'Suppliers', href: '/suppliers', icon: Truck, anyOf: [PERMISSIONS.SUPPLIER_VIEW] },
      { label: 'Purchases', href: '/purchases', icon: ShoppingBag, anyOf: [PERMISSIONS.PURCHASE_VIEW] },
    ],
  },
  {
    label: 'People & CRM',
    items: [
      { label: 'Customers', href: '/customers', icon: Users, anyOf: [PERMISSIONS.CUSTOMER_VIEW] },
      { label: 'Loyalty', href: '/loyalty', icon: Gift, anyOf: [PERMISSIONS.LOYALTY_VIEW] },
      { label: 'Employees', href: '/employees', icon: UserCog, anyOf: [PERMISSIONS.EMPLOYEE_VIEW] },
      { label: 'Attendance', href: '/attendance', icon: Clock4, anyOf: [PERMISSIONS.ATTENDANCE_VIEW] },
      { label: 'Cash Register', href: '/register', icon: Wallet, anyOf: [PERMISSIONS.REGISTER_VIEW] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Expenses', href: '/expenses', icon: Receipt, anyOf: [PERMISSIONS.EXPENSE_VIEW] },
      {
        label: 'Reports',
        href: '/reports',
        icon: BarChart3,
        anyOf: [
          PERMISSIONS.REPORT_VIEW_SALES,
          PERMISSIONS.REPORT_VIEW_FINANCIAL,
          PERMISSIONS.REPORT_VIEW_INVENTORY,
          PERMISSIONS.REPORT_VIEW_STAFF,
        ],
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Branches', href: '/branches', icon: Building2, anyOf: [PERMISSIONS.BRANCH_VIEW] },
      { label: 'Users & Roles', href: '/users', icon: ShieldCheck, anyOf: [PERMISSIONS.USER_VIEW] },
      { label: 'Audit Log', href: '/audit-log', icon: History, anyOf: [PERMISSIONS.AUDIT_LOG_VIEW] },
      { label: 'Settings', href: '/settings', icon: Settings, anyOf: [PERMISSIONS.SETTINGS_VIEW] },
    ],
  },
];
