import { z } from 'zod';

import {
  EXPENSE_STATUS_VALUES,
  INVENTORY_TRANSACTION_TYPE_VALUES,
  PAYMENT_METHOD_VALUES,
  RECURRENCE_VALUES,
  RESERVATION_STATUS_VALUES,
  TABLE_SHAPE_VALUES,
  TABLE_STATUS_VALUES,
  UNIT_VALUES,
  WASTAGE_REASON_VALUES,
  type ExpenseStatus,
  type InventoryTransactionType,
  type PaymentMethod,
  type Recurrence,
  type ReservationStatus,
  type TableShape,
  type TableStatus,
  type Unit,
  type WastageReason,
} from '@/constants/enums';
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/models/Expense';

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const createTableSchema = z.object({
  label: z.string().min(1, 'Enter a table label.').max(20),
  section: z.string().max(60).default('Main Floor'),
  capacity: z.coerce.number().int().min(1).max(40),
  shape: z.enum(TABLE_SHAPE_VALUES as [TableShape, ...TableShape[]]).default('square'),
  positionX: z.coerce.number().default(0),
  positionY: z.coerce.number().default(0),
});
export type CreateTableInput = z.infer<typeof createTableSchema>;

export const updateTableSchema = createTableSchema.partial().extend({
  status: z.enum(TABLE_STATUS_VALUES as [TableStatus, ...TableStatus[]]).optional(),
  assignedWaiterId: z.string().nullable().optional(),
});
export type UpdateTableInput = z.infer<typeof updateTableSchema>;

// ---------------------------------------------------------------------------
// Reservations
// ---------------------------------------------------------------------------

export const createReservationSchema = z.object({
  guestName: z.string().min(1, 'Enter the guest name.').max(120),
  guestPhone: z.string().min(1, 'Enter a contact number.').max(30),
  guestEmail: z.string().email('Enter a valid email.').optional().or(z.literal('')),
  customerId: z.string().nullable().optional(),
  reservationDate: z.coerce.date(),
  durationMinutes: z.coerce.number().int().min(30).max(480).default(90),
  partySize: z.coerce.number().int().min(1).max(40),
  tableId: z.string().nullable().optional(),
  specialRequests: z.string().max(500).nullable().optional(),
  depositMinor: z.coerce.number().int().min(0).default(0),
});
export type CreateReservationInput = z.infer<typeof createReservationSchema>;

export const updateReservationStatusSchema = z.object({
  status: z.enum(RESERVATION_STATUS_VALUES as [ReservationStatus, ...ReservationStatus[]]),
  cancelReason: z.string().max(300).optional(),
});
export type UpdateReservationStatusInput = z.infer<typeof updateReservationStatusSchema>;

// ---------------------------------------------------------------------------
// Menu management
// ---------------------------------------------------------------------------

export const upsertCategorySchema = z.object({
  name: z.string().min(1, 'Enter a category name.').max(80),
  description: z.string().max(300).optional(),
  icon: z.string().max(40).default('utensils'),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});
export type UpsertCategoryInput = z.infer<typeof upsertCategorySchema>;

export const upsertMenuItemSchema = z.object({
  name: z.string().min(1, 'Enter an item name.').max(120),
  categoryId: z.string().min(1, 'Choose a category.'),
  description: z.string().min(1, 'Add a short description.').max(500),
  priceMinor: z.coerce.number().int().min(0),
  costPriceMinor: z.coerce.number().int().min(0).default(0),
  imageUrl: z.string().url().nullable().optional().or(z.literal('')),
  kitchenStation: z.string().min(1),
  preparationTimeMinutes: z.coerce.number().int().min(0).max(240).default(10),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  spicyLevel: z.coerce.number().int().min(0).max(4).default(0),
  isActive: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
});
export type UpsertMenuItemInput = z.infer<typeof upsertMenuItemSchema>;

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export const upsertIngredientSchema = z.object({
  name: z.string().min(1, 'Enter an ingredient name.').max(120),
  sku: z.string().min(1, 'Enter a SKU.').max(40),
  category: z.string().max(60).default('general'),
  purchaseUnit: z.enum(UNIT_VALUES as [Unit, ...Unit[]]),
  consumptionUnit: z.enum(UNIT_VALUES as [Unit, ...Unit[]]),
  costPerPurchaseUnitMinor: z.coerce.number().int().min(0),
  reorderLevelBase: z.coerce.number().min(0),
  reorderQuantityBase: z.coerce.number().min(0),
  expiryTrackingEnabled: z.boolean().default(false),
  primarySupplierId: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});
export type UpsertIngredientInput = z.infer<typeof upsertIngredientSchema>;

export const stockMovementSchema = z.object({
  ingredientId: z.string().min(1),
  type: z.enum(INVENTORY_TRANSACTION_TYPE_VALUES as [InventoryTransactionType, ...InventoryTransactionType[]]),
  quantityBase: z.coerce.number().min(0.0001, 'Enter a quantity greater than zero.'),
  unitCostMinor: z.coerce.number().int().min(0).default(0),
  wastageReason: z.enum(WASTAGE_REASON_VALUES as [WastageReason, ...WastageReason[]]).nullable().optional(),
  batchNumber: z.string().max(60).nullable().optional(),
  expiryDate: z.coerce.date().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});
export type StockMovementInput = z.infer<typeof stockMovementSchema>;

export const physicalCountSchema = z.object({
  ingredientId: z.string().min(1),
  countedQuantityBase: z.coerce.number().min(0),
  notes: z.string().max(500).nullable().optional(),
});
export type PhysicalCountInput = z.infer<typeof physicalCountSchema>;

// ---------------------------------------------------------------------------
// Suppliers & purchasing
// ---------------------------------------------------------------------------

export const upsertSupplierSchema = z.object({
  name: z.string().min(1, 'Enter a supplier name.').max(160),
  contactPerson: z.string().min(1, 'Enter a contact name.').max(120),
  phone: z.string().min(1, 'Enter a phone number.').max(30),
  email: z.string().email('Enter a valid email.').optional().or(z.literal('')),
  address: z.string().max(300).optional(),
  categories: z.array(z.string().max(60)).default([]),
  paymentTermsDays: z.coerce.number().int().min(0).max(180).default(15),
  rating: z.coerce.number().min(0).max(5).default(4),
  notes: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});
export type UpsertSupplierInput = z.infer<typeof upsertSupplierSchema>;

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Choose a supplier.'),
  expectedDeliveryDate: z.coerce.date().nullable().optional(),
  notes: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        ingredientId: z.string().min(1),
        quantityOrdered: z.coerce.number().min(0.0001),
        unit: z.enum(UNIT_VALUES as [Unit, ...Unit[]]),
        unitCostMinor: z.coerce.number().int().min(0),
      }),
    )
    .min(1, 'Add at least one line to the purchase order.'),
});
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;

export const receivePurchaseOrderSchema = z.object({
  items: z
    .array(z.object({ ingredientId: z.string().min(1), quantityReceived: z.coerce.number().min(0) }))
    .min(1),
});
export type ReceivePurchaseOrderInput = z.infer<typeof receivePurchaseOrderSchema>;

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

export const upsertExpenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES as unknown as [ExpenseCategory, ...ExpenseCategory[]]),
  description: z.string().min(1, 'Describe the expense.').max(500),
  amountMinor: z.coerce.number().int().min(1, 'Enter an amount.'),
  expenseDate: z.coerce.date(),
  paymentMethod: z.enum(PAYMENT_METHOD_VALUES as [PaymentMethod, ...PaymentMethod[]]),
  referenceNumber: z.string().max(60).nullable().optional(),
  recurrence: z.enum(RECURRENCE_VALUES as [Recurrence, ...Recurrence[]]).default('none'),
});
export type UpsertExpenseInput = z.infer<typeof upsertExpenseSchema>;

export const expenseStatusSchema = z.object({
  status: z.enum(EXPENSE_STATUS_VALUES as [ExpenseStatus, ...ExpenseStatus[]]),
  rejectionReason: z.string().max(300).optional(),
});
export type ExpenseStatusInput = z.infer<typeof expenseStatusSchema>;

// ---------------------------------------------------------------------------
// Customers, loyalty, employees
// ---------------------------------------------------------------------------

export const upsertCustomerSchema = z.object({
  name: z.string().min(1, 'Enter a name.').max(120),
  phone: z.string().min(1, 'Enter a phone number.').max(30),
  email: z.string().email('Enter a valid email.').optional().or(z.literal('')),
  address: z.string().max(300).optional(),
  birthday: z.coerce.date().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  tags: z.array(z.string().max(40)).default([]),
});
export type UpsertCustomerInput = z.infer<typeof upsertCustomerSchema>;

export const adjustLoyaltySchema = z.object({
  points: z.coerce.number().int(),
  description: z.string().min(1, 'Explain the adjustment.').max(300),
});
export type AdjustLoyaltyInput = z.infer<typeof adjustLoyaltySchema>;

export const upsertEmployeeSchema = z.object({
  name: z.string().min(1, 'Enter a name.').max(120),
  employeeCode: z.string().min(1, 'Enter an employee code.').max(20),
  jobTitle: z.string().min(1, 'Enter a job title.').max(80),
  department: z.string().max(60).default('Operations'),
  phone: z.string().min(1, 'Enter a phone number.').max(30),
  email: z.string().email('Enter a valid email.').optional().or(z.literal('')),
  hireDate: z.coerce.date(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'casual']).default('full_time'),
  employmentStatus: z.enum(['active', 'on_leave', 'suspended', 'terminated']).default('active'),
  salaryType: z.enum(['monthly', 'hourly']).default('monthly'),
  monthlySalaryMinor: z.coerce.number().int().min(0).default(0),
  hourlyRateMinor: z.coerce.number().int().min(0).default(0),
});
export type UpsertEmployeeInput = z.infer<typeof upsertEmployeeSchema>;

export const upsertAttendanceSchema = z.object({
  employeeId: z.string().min(1, 'Choose an employee.'),
  date: z.coerce.date(),
  checkInAt: z.coerce.date().nullable().optional(),
  checkOutAt: z.coerce.date().nullable().optional(),
  breakMinutes: z.coerce.number().int().min(0).max(720).default(0),
  status: z.enum(['present', 'absent', 'late', 'on_leave']).default('present'),
  notes: z.string().max(300).nullable().optional(),
});
export type UpsertAttendanceInput = z.infer<typeof upsertAttendanceSchema>;

export const upsertShiftSchema = z.object({
  employeeId: z.string().min(1, 'Choose an employee.'),
  entryType: z.enum(['shift', 'leave']).default('shift'),
  date: z.coerce.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  station: z.string().max(80).nullable().optional(),
  shiftStatus: z.enum(['scheduled', 'completed', 'missed']).default('scheduled'),
  leaveStatus: z.enum(['pending', 'approved', 'rejected']).nullable().optional(),
  leaveReason: z.string().max(300).nullable().optional(),
  notes: z.string().max(300).nullable().optional(),
});
export type UpsertShiftInput = z.infer<typeof upsertShiftSchema>;

// ---------------------------------------------------------------------------
// Cash register
// ---------------------------------------------------------------------------

export const openRegisterSchema = z.object({
  openingCashMinor: z.coerce.number().int().min(0),
});
export type OpenRegisterInput = z.infer<typeof openRegisterSchema>;

export const closeRegisterSchema = z.object({
  closingCashActualMinor: z.coerce.number().int().min(0),
  closingNotes: z.string().max(500).optional(),
});
export type CloseRegisterInput = z.infer<typeof closeRegisterSchema>;

export const cashMovementSchema = z.object({
  type: z.enum(['paid_in', 'paid_out']),
  amountMinor: z.coerce.number().int().min(1),
  reason: z.string().min(1, 'Give a reason.').max(200),
});
export type CashMovementInput = z.infer<typeof cashMovementSchema>;
