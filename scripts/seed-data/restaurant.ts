export const RESTAURANT_DEF = {
  name: 'Copper Kettle Kitchens',
  slug: 'copper-kettle-kitchens',
  legalName: 'Copper Kettle Kitchens LLC',
  defaultCurrency: 'USD',
  timezone: 'America/New_York',
};

export interface BranchDef {
  name: string;
  code: string;
  address: { line1: string; city: string; state: string; country: string; postalCode: string };
  phone: string;
  email: string;
  isMain: boolean;
  tableCount: number;
}

export const BRANCH_DEFS: BranchDef[] = [
  {
    name: 'Copper Kettle — Downtown',
    code: 'DTN',
    address: { line1: '482 Market Street', city: 'Riverside', state: 'NJ', country: 'USA', postalCode: '08075' },
    phone: '+1 (555) 201-4488',
    email: 'downtown@copperkettle.example',
    isMain: true,
    tableCount: 14,
  },
  {
    name: 'Copper Kettle — Harbor View',
    code: 'HBV',
    address: { line1: '17 Harbor Walk', city: 'Riverside', state: 'NJ', country: 'USA', postalCode: '08077' },
    phone: '+1 (555) 201-7723',
    email: 'harborview@copperkettle.example',
    isMain: false,
    tableCount: 10,
  },
  {
    name: 'Copper Kettle — Uptown',
    code: 'UPT',
    address: { line1: '905 Grand Avenue', city: 'Fairview', state: 'NJ', country: 'USA', postalCode: '08093' },
    phone: '+1 (555) 201-9021',
    email: 'uptown@copperkettle.example',
    isMain: false,
    tableCount: 8,
  },
];
