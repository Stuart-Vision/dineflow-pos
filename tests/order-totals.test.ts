import { describe, expect, it } from 'vitest';
import { DISCOUNT_TYPE } from '@/constants/enums';
import { calculateOrderTotals, paymentSummary } from '@/lib/pricing/order-totals';

describe('order pricing', () => {
  it('applies modifiers, discounts, service charge and exclusive tax deterministically', () => {
    const result = calculateOrderTotals([
      { id: 'burger', unitPriceMinor: 1000, quantity: 2, modifiers: [{ name: 'Cheese', priceMinor: 100, quantity: 1 }], discount: { type: DISCOUNT_TYPE.PERCENTAGE, value: 10 }, taxRatePercent: 10 },
    ], { taxMode: 'exclusive', serviceChargePercent: 5, serviceChargeTaxable: false });
    expect(result.subtotalMinor).toBe(2200);
    expect(result.itemDiscountMinor).toBe(220);
    expect(result.netSubtotalMinor).toBe(1980);
    expect(result.serviceChargeMinor).toBe(99);
    expect(result.taxMinor).toBe(198);
    expect(result.grandTotalMinor).toBe(2277);
  });
  it('caps fixed discounts and reports payment progress', () => {
    const result = calculateOrderTotals([{ id: 'tea', unitPriceMinor: 300, quantity: 1, discount: { type: DISCOUNT_TYPE.FIXED, value: 500 }, taxRatePercent: 0 }]);
    expect(result.grandTotalMinor).toBe(0);
    expect(paymentSummary(1000, 1200)).toEqual({ netPaidMinor: 1200, balanceDueMinor: 0, changeDueMinor: 200, isSettled: true });
  });
});
