import { create } from 'zustand';

import type { OrderType } from '@/constants/enums';
import type { Discount, PricingModifier } from '@/lib/pricing/order-totals';

export interface CartLine {
  key: string;
  menuItemId: string;
  name: string;
  imageUrl: string | null;
  portionName: string | null;
  unitPriceMinor: number;
  quantity: number;
  modifiers: PricingModifier[];
  notes: string | null;
  discount: Discount | null;
}

interface DeliveryInfo {
  address: string;
  phone: string;
  instructions?: string;
}

interface PosCartState {
  orderId: string | null;
  orderNumber: string | null;
  orderType: OrderType;
  tableId: string | null;
  tableLabel: string | null;
  customerId: string | null;
  customerLabel: string | null;
  delivery: DeliveryInfo | null;
  lines: CartLine[];
  orderDiscount: Discount | null;
  notes: string | null;

  setOrderType: (type: OrderType) => void;
  setTable: (tableId: string | null, label: string | null) => void;
  setCustomer: (customerId: string | null, label: string | null) => void;
  setDelivery: (info: DeliveryInfo | null) => void;
  addLine: (line: Omit<CartLine, 'key'>) => void;
  updateQuantity: (key: string, quantity: number) => void;
  updateNotes: (key: string, notes: string | null) => void;
  updateLineDiscount: (key: string, discount: Discount | null) => void;
  removeLine: (key: string) => void;
  setOrderDiscount: (discount: Discount | null) => void;
  setNotes: (notes: string | null) => void;
  loadOrder: (order: {
    id: string;
    orderNumber: string;
    type: OrderType;
    tableId: string | null;
    tableLabel: string | null;
    customerId: string | null;
    customerLabel: string | null;
    delivery: DeliveryInfo | null;
    notes: string | null;
    orderDiscount: Discount | null;
    lines: CartLine[];
  }) => void;
  reset: () => void;
}

function sameLine(a: Omit<CartLine, 'key'>, b: CartLine): boolean {
  return (
    a.menuItemId === b.menuItemId &&
    a.portionName === b.portionName &&
    JSON.stringify(a.modifiers) === JSON.stringify(b.modifiers) &&
    a.notes === b.notes
  );
}

const initialState = {
  orderId: null as string | null,
  orderNumber: null as string | null,
  orderType: 'dine_in' as OrderType,
  tableId: null as string | null,
  tableLabel: null as string | null,
  customerId: null as string | null,
  customerLabel: null as string | null,
  delivery: null as DeliveryInfo | null,
  lines: [] as CartLine[],
  orderDiscount: null as Discount | null,
  notes: null as string | null,
};

export const usePosCartStore = create<PosCartState>((set, get) => ({
  ...initialState,

  setOrderType: (orderType) => set({ orderType }),
  setTable: (tableId, tableLabel) => set({ tableId, tableLabel }),
  setCustomer: (customerId, customerLabel) => set({ customerId, customerLabel }),
  setDelivery: (delivery) => set({ delivery }),

  addLine: (line) => {
    const existing = get().lines.find((l) => sameLine(line, l));
    if (existing) {
      set({
        lines: get().lines.map((l) => (l.key === existing.key ? { ...l, quantity: l.quantity + line.quantity } : l)),
      });
      return;
    }
    const key = `${line.menuItemId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set({ lines: [...get().lines, { ...line, key }] });
  },

  updateQuantity: (key, quantity) => {
    if (quantity <= 0) {
      set({ lines: get().lines.filter((l) => l.key !== key) });
      return;
    }
    set({ lines: get().lines.map((l) => (l.key === key ? { ...l, quantity } : l)) });
  },

  updateNotes: (key, notes) => set({ lines: get().lines.map((l) => (l.key === key ? { ...l, notes } : l)) }),

  updateLineDiscount: (key, discount) => set({ lines: get().lines.map((l) => (l.key === key ? { ...l, discount } : l)) }),

  removeLine: (key) => set({ lines: get().lines.filter((l) => l.key !== key) }),

  setOrderDiscount: (orderDiscount) => set({ orderDiscount }),
  setNotes: (notes) => set({ notes }),

  loadOrder: (order) =>
    set({
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderType: order.type,
      tableId: order.tableId,
      tableLabel: order.tableLabel,
      customerId: order.customerId,
      customerLabel: order.customerLabel,
      delivery: order.delivery,
      notes: order.notes,
      orderDiscount: order.orderDiscount,
      lines: order.lines,
    }),

  reset: () => set({ ...initialState, lines: [] }),
}));
