import { z } from 'zod';

import {
  DISCOUNT_TYPE_VALUES,
  ORDER_TYPE_VALUES,
  PAYMENT_METHOD_VALUES,
  type DiscountType,
  type OrderType,
  type PaymentMethod,
} from '@/constants/enums';

const discountSchema = z.object({
  type: z.enum(DISCOUNT_TYPE_VALUES as [DiscountType, ...DiscountType[]]),
  value: z.number().min(0),
  reason: z.string().max(200).optional(),
  couponCode: z.string().max(40).optional(),
});

const cartModifierSchema = z.object({
  name: z.string().min(1).max(80),
  priceMinor: z.number().min(0),
  quantity: z.number().int().min(1).max(20),
});

const cartLineSchema = z.object({
  menuItemId: z.string().min(1),
  portionName: z.string().max(60).nullable().optional(),
  quantity: z.number().int().min(1).max(50),
  modifiers: z.array(cartModifierSchema).max(10).default([]),
  notes: z.string().max(300).nullable().optional(),
  discount: discountSchema.nullable().optional(),
});
export type CartLineInput = z.infer<typeof cartLineSchema>;

export const createOrderSchema = z.object({
  type: z.enum(ORDER_TYPE_VALUES as [OrderType, ...OrderType[]]),
  tableId: z.string().nullable().optional(),
  customerId: z.string().nullable().optional(),
  items: z.array(cartLineSchema).min(1, 'Add at least one item to the order.'),
  orderDiscount: discountSchema.nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  delivery: z
    .object({
      address: z.string().min(1),
      phone: z.string().min(1),
      instructions: z.string().max(300).optional(),
    })
    .optional(),
  submit: z.boolean().default(false),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderItemsSchema = z.object({
  items: z.array(cartLineSchema).min(1, 'An order needs at least one item.'),
  orderDiscount: discountSchema.nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  tableId: z.string().nullable().optional(),
  customerId: z.string().nullable().optional(),
});
export type UpdateOrderItemsInput = z.infer<typeof updateOrderItemsSchema>;

export const reasonSchema = z.object({
  reason: z.string().min(1, 'A reason is required.').max(300),
});
export type ReasonInput = z.infer<typeof reasonSchema>;

export const transferTableSchema = z.object({
  tableId: z.string().min(1, 'Select a destination table.'),
});
export type TransferTableInput = z.infer<typeof transferTableSchema>;

export const createPaymentSchema = z.object({
  method: z.enum(PAYMENT_METHOD_VALUES as [PaymentMethod, ...PaymentMethod[]]),
  amountMinor: z.number().int().min(1),
  tenderedMinor: z.number().int().min(0).optional(),
  cardLast4: z.string().length(4).optional(),
  walletProvider: z.string().max(40).optional(),
  notes: z.string().max(300).optional(),
});
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const refundPaymentSchema = z.object({
  amountMinor: z.number().int().min(1),
  reason: z.string().min(1).max(300),
});
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
