import { ROLES, type Role } from './roles';

export interface DemoAccount {
  role: Role;
  label: string;
  email: string;
  password: string;
}

/**
 * Seeded demo logins, shown on the login page for portfolio reviewers and
 * used verbatim by `scripts/seed.ts` to create the matching accounts — one
 * source of truth so the page never advertises a login that doesn't work.
 */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: ROLES.SUPER_ADMIN, label: 'Super Admin', email: 'admin@dineflow.com', password: 'Admin@123' },
  { role: ROLES.OWNER, label: 'Restaurant Owner', email: 'owner@dineflow.com', password: 'Owner@123' },
  { role: ROLES.MANAGER, label: 'Manager', email: 'manager@dineflow.com', password: 'Manager@123' },
  { role: ROLES.CASHIER, label: 'Cashier', email: 'cashier@dineflow.com', password: 'Cashier@123' },
  { role: ROLES.WAITER, label: 'Waiter', email: 'waiter@dineflow.com', password: 'Waiter@123' },
  { role: ROLES.KITCHEN, label: 'Kitchen Staff', email: 'kitchen@dineflow.com', password: 'Kitchen@123' },
  {
    role: ROLES.ACCOUNTANT,
    label: 'Accountant',
    email: 'accountant@dineflow.com',
    password: 'Accountant@123',
  },
];
