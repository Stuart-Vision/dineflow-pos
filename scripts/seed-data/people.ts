import { DEMO_ACCOUNTS } from '../../src/constants/demo-accounts';
import { ROLES, type Role } from '../../src/constants/roles';

export interface EmployeeDef {
  demoEmail: string | null;
  /**
   * Grants a working (but unadvertised) login to staff who aren't one of
   * the 7 public demo accounts — e.g. a branch manager at a second branch —
   * so every branch has real users to attribute orders, shifts and audit
   * entries to. Password convention: `${FirstName}@123`.
   */
  extraLoginRole: Role | null;
  name: string;
  branchCode: string | 'ALL';
  jobTitle: string;
  department: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'casual';
  salaryType: 'monthly' | 'hourly';
  monthlySalaryMinor: number;
  hourlyRateMinor: number;
  hireDaysAgo: number;
  phone: string;
}

const demoByRole = Object.fromEntries(DEMO_ACCOUNTS.map((a) => [a.role, a]));

export const EMPLOYEE_DEFS: EmployeeDef[] = [
  {
    demoEmail: demoByRole[ROLES.OWNER]!.email, extraLoginRole: null, name: 'Jordan Whitfield', branchCode: 'ALL',
    jobTitle: 'Restaurant Owner', department: 'Executive', employmentType: 'full_time',
    salaryType: 'monthly', monthlySalaryMinor: 900_000, hourlyRateMinor: 0, hireDaysAgo: 1460, phone: '+1 (555) 310-1001',
  },
  {
    demoEmail: demoByRole[ROLES.MANAGER]!.email, extraLoginRole: null, name: 'Priya Natarajan', branchCode: 'DTN',
    jobTitle: 'Branch Manager', department: 'Management', employmentType: 'full_time',
    salaryType: 'monthly', monthlySalaryMinor: 550_000, hourlyRateMinor: 0, hireDaysAgo: 920, phone: '+1 (555) 310-1002',
  },
  {
    demoEmail: demoByRole[ROLES.ACCOUNTANT]!.email, extraLoginRole: null, name: 'Emily Novak', branchCode: 'DTN',
    jobTitle: 'Accountant', department: 'Finance', employmentType: 'full_time',
    salaryType: 'monthly', monthlySalaryMinor: 520_000, hourlyRateMinor: 0, hireDaysAgo: 760, phone: '+1 (555) 310-1003',
  },
  {
    demoEmail: demoByRole[ROLES.CASHIER]!.email, extraLoginRole: null, name: 'Sam Torres', branchCode: 'DTN',
    jobTitle: 'Cashier', department: 'Front of House', employmentType: 'full_time',
    salaryType: 'hourly', monthlySalaryMinor: 0, hourlyRateMinor: 1800, hireDaysAgo: 480, phone: '+1 (555) 310-1004',
  },
  {
    demoEmail: demoByRole[ROLES.WAITER]!.email, extraLoginRole: null, name: 'Maya Chen', branchCode: 'DTN',
    jobTitle: 'Waiter', department: 'Front of House', employmentType: 'full_time',
    salaryType: 'hourly', monthlySalaryMinor: 0, hourlyRateMinor: 1600, hireDaysAgo: 400, phone: '+1 (555) 310-1005',
  },
  {
    demoEmail: demoByRole[ROLES.KITCHEN]!.email, extraLoginRole: null, name: 'Diego Ramirez', branchCode: 'DTN',
    jobTitle: 'Line Cook', department: 'Kitchen', employmentType: 'full_time',
    salaryType: 'hourly', monthlySalaryMinor: 0, hourlyRateMinor: 1900, hireDaysAgo: 610, phone: '+1 (555) 310-1006',
  },

  // Downtown — additional staff
  { demoEmail: null, extraLoginRole: null, name: 'Marcus Webb', branchCode: 'DTN', jobTitle: 'Sous Chef', department: 'Kitchen', employmentType: 'full_time', salaryType: 'monthly', monthlySalaryMinor: 420_000, hourlyRateMinor: 0, hireDaysAgo: 540, phone: '+1 (555) 310-2001' },
  { demoEmail: null, extraLoginRole: null, name: 'Isabella Rossi', branchCode: 'DTN', jobTitle: 'Waiter', department: 'Front of House', employmentType: 'part_time', salaryType: 'hourly', monthlySalaryMinor: 0, hourlyRateMinor: 1550, hireDaysAgo: 300, phone: '+1 (555) 310-2002' },
  { demoEmail: null, extraLoginRole: null, name: "Liam O'Connor", branchCode: 'DTN', jobTitle: 'Cashier', department: 'Front of House', employmentType: 'part_time', salaryType: 'hourly', monthlySalaryMinor: 0, hourlyRateMinor: 1700, hireDaysAgo: 210, phone: '+1 (555) 310-2003' },
  { demoEmail: null, extraLoginRole: null, name: 'Noah Bennett', branchCode: 'DTN', jobTitle: 'Delivery Driver', department: 'Delivery', employmentType: 'part_time', salaryType: 'hourly', monthlySalaryMinor: 0, hourlyRateMinor: 1500, hireDaysAgo: 260, phone: '+1 (555) 310-2004' },

  // Harbor View
  { demoEmail: null, extraLoginRole: ROLES.MANAGER, name: 'Grace Kim', branchCode: 'HBV', jobTitle: 'Branch Manager', department: 'Management', employmentType: 'full_time', salaryType: 'monthly', monthlySalaryMinor: 530_000, hourlyRateMinor: 0, hireDaysAgo: 700, phone: '+1 (555) 310-3001' },
  { demoEmail: null, extraLoginRole: ROLES.KITCHEN, name: 'Antoine Dubois', branchCode: 'HBV', jobTitle: 'Head Chef', department: 'Kitchen', employmentType: 'full_time', salaryType: 'monthly', monthlySalaryMinor: 480_000, hourlyRateMinor: 0, hireDaysAgo: 650, phone: '+1 (555) 310-3002' },
  { demoEmail: null, extraLoginRole: ROLES.CASHIER, name: 'Fatima Al-Sayed', branchCode: 'HBV', jobTitle: 'Cashier', department: 'Front of House', employmentType: 'full_time', salaryType: 'hourly', monthlySalaryMinor: 0, hourlyRateMinor: 1750, hireDaysAgo: 380, phone: '+1 (555) 310-3003' },
  { demoEmail: null, extraLoginRole: null, name: 'Ethan Walsh', branchCode: 'HBV', jobTitle: 'Waiter', department: 'Front of House', employmentType: 'part_time', salaryType: 'hourly', monthlySalaryMinor: 0, hourlyRateMinor: 1550, hireDaysAgo: 240, phone: '+1 (555) 310-3004' },

  // Uptown
  { demoEmail: null, extraLoginRole: ROLES.MANAGER, name: 'Olivia Bennett', branchCode: 'UPT', jobTitle: 'Branch Manager', department: 'Management', employmentType: 'full_time', salaryType: 'monthly', monthlySalaryMinor: 510_000, hourlyRateMinor: 0, hireDaysAgo: 560, phone: '+1 (555) 310-4001' },
  { demoEmail: null, extraLoginRole: ROLES.KITCHEN, name: 'Carlos Mendes', branchCode: 'UPT', jobTitle: 'Line Cook', department: 'Kitchen', employmentType: 'full_time', salaryType: 'hourly', monthlySalaryMinor: 0, hourlyRateMinor: 1850, hireDaysAgo: 420, phone: '+1 (555) 310-4002' },
  { demoEmail: null, extraLoginRole: ROLES.WAITER, name: 'Zoe Fletcher', branchCode: 'UPT', jobTitle: 'Waiter', department: 'Front of House', employmentType: 'part_time', salaryType: 'hourly', monthlySalaryMinor: 0, hourlyRateMinor: 1550, hireDaysAgo: 180, phone: '+1 (555) 310-4003' },
];

export interface CustomerDef {
  name: string;
  phone: string;
  email: string;
  segment: 'new' | 'regular' | 'vip' | 'inactive' | 'high_spender';
  tags: string[];
}

export const CUSTOMER_DEFS: CustomerDef[] = [
  { name: 'Ava Thompson', phone: '+1 (555) 402-1001', email: 'ava.thompson@example.com', segment: 'vip', tags: ['birthday-club'] },
  { name: 'Noah Garcia', phone: '+1 (555) 402-1002', email: 'noah.garcia@example.com', segment: 'regular', tags: [] },
  { name: 'Sophia Martinez', phone: '+1 (555) 402-1003', email: 'sophia.martinez@example.com', segment: 'high_spender', tags: ['corporate'] },
  { name: 'Lucas Anderson', phone: '+1 (555) 402-1004', email: 'lucas.anderson@example.com', segment: 'regular', tags: [] },
  { name: 'Mia Robinson', phone: '+1 (555) 402-1005', email: 'mia.robinson@example.com', segment: 'new', tags: [] },
  { name: 'Ethan Clark', phone: '+1 (555) 402-1006', email: 'ethan.clark@example.com', segment: 'regular', tags: ['vegetarian'] },
  { name: 'Amelia Lewis', phone: '+1 (555) 402-1007', email: 'amelia.lewis@example.com', segment: 'vip', tags: ['anniversary'] },
  { name: 'James Walker', phone: '+1 (555) 402-1008', email: 'james.walker@example.com', segment: 'inactive', tags: [] },
  { name: 'Charlotte Hall', phone: '+1 (555) 402-1009', email: 'charlotte.hall@example.com', segment: 'regular', tags: [] },
  { name: 'Benjamin Young', phone: '+1 (555) 402-1010', email: 'benjamin.young@example.com', segment: 'new', tags: [] },
  { name: 'Harper King', phone: '+1 (555) 402-1011', email: 'harper.king@example.com', segment: 'high_spender', tags: ['corporate'] },
  { name: 'Elijah Wright', phone: '+1 (555) 402-1012', email: 'elijah.wright@example.com', segment: 'regular', tags: [] },
  { name: 'Evelyn Scott', phone: '+1 (555) 402-1013', email: 'evelyn.scott@example.com', segment: 'inactive', tags: [] },
  { name: 'Alexander Green', phone: '+1 (555) 402-1014', email: 'alexander.green@example.com', segment: 'new', tags: [] },
  { name: 'Abigail Baker', phone: '+1 (555) 402-1015', email: 'abigail.baker@example.com', segment: 'vip', tags: ['gluten-free'] },
  { name: 'Daniel Nelson', phone: '+1 (555) 402-1016', email: 'daniel.nelson@example.com', segment: 'regular', tags: [] },
  { name: 'Emily Carter', phone: '+1 (555) 402-1017', email: 'emily.carter@example.com', segment: 'high_spender', tags: [] },
  { name: 'Matthew Mitchell', phone: '+1 (555) 402-1018', email: 'matthew.mitchell@example.com', segment: 'new', tags: [] },
];

export interface SupplierDef {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  categories: string[];
  paymentTermsDays: number;
}

export const SUPPLIER_DEFS: SupplierDef[] = [
  { name: 'Riverside Meat & Poultry Co.', contactPerson: 'Frank Delgado', phone: '+1 (555) 700-1001', email: 'orders@riversidemeat.example', categories: ['Meat'], paymentTermsDays: 15 },
  { name: 'Blue Bay Seafoods', contactPerson: 'Nora Chen', phone: '+1 (555) 700-1002', email: 'sales@bluebayseafood.example', categories: ['Seafood'], paymentTermsDays: 7 },
  { name: 'Greenfield Produce Market', contactPerson: 'Oscar Reyes', phone: '+1 (555) 700-1003', email: 'accounts@greenfieldproduce.example', categories: ['Produce'], paymentTermsDays: 7 },
  { name: 'Dairy Valley Farms', contactPerson: 'Helen Brooks', phone: '+1 (555) 700-1004', email: 'orders@dairyvalley.example', categories: ['Dairy'], paymentTermsDays: 15 },
  { name: 'Golden Wheat Bakery Supply', contactPerson: 'Peter Adams', phone: '+1 (555) 700-1005', email: 'wholesale@goldenwheat.example', categories: ['Bakery'], paymentTermsDays: 10 },
  { name: 'Artisan Pantry Distributors', contactPerson: 'Lucia Ferreira', phone: '+1 (555) 700-1006', email: 'orders@artisanpantry.example', categories: ['Pantry'], paymentTermsDays: 30 },
  { name: 'Cascade Beverage Co.', contactPerson: 'Ryan Foster', phone: '+1 (555) 700-1007', email: 'accounts@cascadebeverage.example', categories: ['Beverage'], paymentTermsDays: 15 },
  { name: 'Sunrise Coffee Roasters', contactPerson: 'Maria Lopez', phone: '+1 (555) 700-1008', email: 'wholesale@sunriseroasters.example', categories: ['Beverage'], paymentTermsDays: 15 },
  { name: 'EcoPack Packaging Solutions', contactPerson: 'David Kim', phone: '+1 (555) 700-1009', email: 'sales@ecopack.example', categories: ['Packaging'], paymentTermsDays: 30 },
  { name: 'Spice Route Imports', contactPerson: 'Anjali Rao', phone: '+1 (555) 700-1010', email: 'orders@spiceroute.example', categories: ['Condiment', 'Pantry'], paymentTermsDays: 20 },
  { name: 'Harborside Wine & Beverage', contactPerson: 'Tom Whitaker', phone: '+1 (555) 700-1011', email: 'orders@harborsidewine.example', categories: ['Beverage'], paymentTermsDays: 30 },
];
