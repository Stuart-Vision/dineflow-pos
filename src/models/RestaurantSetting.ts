import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

import { baseSchemaOptions } from './shared';

export interface ITaxRate {
  name: string;
  ratePercent: number;
  isDefault: boolean;
}

export interface IRestaurantSetting {
  restaurantId: Types.ObjectId;
  receiptHeaderText: string;
  receiptFooterText: string;
  showLogoOnReceipt: boolean;
  defaultReceiptPaperSize: '58mm' | '80mm' | 'a4';
  invoiceNumberPrefix: string;
  orderNumberPrefix: string;
  nextInvoiceSequence: number;
  nextOrderSequence: number;
  taxes: ITaxRate[];
  taxMode: 'exclusive' | 'inclusive';
  serviceChargePercent: number;
  serviceChargeTaxable: boolean;
  cashRoundingIncrementMinor: number;
  paymentMethodsEnabled: string[];
  loyaltyPointsPerCurrencyUnit: number;
  loyaltyRedemptionRateMinorPerPoint: number;
  notifyLowStock: boolean;
  notifyReservationReminders: boolean;
  themePrimaryColor: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RestaurantSettingDocument = HydratedDocument<IRestaurantSetting>;

const taxRateSchema = new Schema<ITaxRate>(
  {
    name: { type: String, required: true },
    ratePercent: { type: Number, required: true, min: 0, max: 100 },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false },
);

const restaurantSettingSchema = new Schema<IRestaurantSetting>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      unique: true,
    },
    receiptHeaderText: { type: String, default: 'Thank you for dining with us' },
    receiptFooterText: { type: String, default: 'Please come again!' },
    showLogoOnReceipt: { type: Boolean, default: true },
    defaultReceiptPaperSize: { type: String, enum: ['58mm', '80mm', 'a4'], default: '80mm' },
    invoiceNumberPrefix: { type: String, default: 'INV-' },
    orderNumberPrefix: { type: String, default: 'ORD-' },
    nextInvoiceSequence: { type: Number, default: 1 },
    nextOrderSequence: { type: Number, default: 1 },
    taxes: {
      type: [taxRateSchema],
      default: [{ name: 'Sales Tax', ratePercent: 8.5, isDefault: true }],
    },
    taxMode: { type: String, enum: ['exclusive', 'inclusive'], default: 'exclusive' },
    serviceChargePercent: { type: Number, default: 0, min: 0, max: 100 },
    serviceChargeTaxable: { type: Boolean, default: false },
    cashRoundingIncrementMinor: { type: Number, default: 1 },
    paymentMethodsEnabled: {
      type: [String],
      default: ['cash', 'card', 'digital_wallet', 'bank_transfer'],
    },
    loyaltyPointsPerCurrencyUnit: { type: Number, default: 1 },
    loyaltyRedemptionRateMinorPerPoint: { type: Number, default: 10 },
    notifyLowStock: { type: Boolean, default: true },
    notifyReservationReminders: { type: Boolean, default: true },
    themePrimaryColor: { type: String, default: '#0f766e' },
  },
  baseSchemaOptions,
);

export const RestaurantSetting: Model<IRestaurantSetting> =
  mongoose.models.RestaurantSetting ??
  mongoose.model<IRestaurantSetting>('RestaurantSetting', restaurantSettingSchema);
