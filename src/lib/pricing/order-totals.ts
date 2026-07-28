import { DISCOUNT_TYPE, type DiscountType } from '@/constants/enums';
import { allocate, clampMinor, percentOf, roundHalfUp, roundToCashIncrement } from '@/lib/money';

/**
 * Order pricing engine.
 *
 * Single authority for what an order costs. The POS screen, the API and the
 * receipt renderer all call this — the totals a cashier sees, the totals stored
 * on the order and the totals printed are computed by the same function, so
 * they cannot disagree.
 *
 * Order of operations (deliberate, and the reason discounts are not simply
 * summed):
 *   1. line gross          = (unit price + modifiers) x quantity
 *   2. line discount       = item-level discount, capped at the line gross
 *   3. order discount      = spread across lines in proportion to their value
 *   4. line net            = gross - line discount - order discount share
 *   5. service charge      = % of net subtotal (configurable, may be taxable)
 *   6. tax                 = per-line rate applied to the discounted net
 *   7. grand total         = net + service + tax + delivery + tip, then rounded
 */

export interface Discount {
  type: DiscountType;
  /** Percent (0–100) when type is percentage, otherwise minor units. */
  value: number;
  reason?: string;
  couponCode?: string;
}

export interface PricingModifier {
  name: string;
  priceMinor: number;
  quantity: number;
}

export interface PricingLineInput {
  /** Stable identifier — cart line id or order item id. */
  id: string;
  name?: string;
  unitPriceMinor: number;
  quantity: number;
  modifiers?: PricingModifier[];
  discount?: Discount | null;
  /** Percentage, e.g. 8.25. Zero for tax-exempt lines. */
  taxRatePercent: number;
  /** Excluded from order-level discounts (e.g. an already-discounted combo). */
  excludeFromOrderDiscount?: boolean;
}

export interface PricingOptions {
  /**
   * `exclusive` — listed prices are pre-tax and tax is added on top.
   * `inclusive` — listed prices already contain tax, which is then extracted.
   */
  taxMode: 'exclusive' | 'inclusive';
  serviceChargePercent: number;
  /** Whether the service charge is itself subject to tax. */
  serviceChargeTaxable: boolean;
  /** Blended rate used to tax the service charge line. */
  serviceChargeTaxRatePercent: number;
  orderDiscount?: Discount | null;
  deliveryFeeMinor?: number;
  tipMinor?: number;
  /** Smallest cash unit still in circulation. 1 disables rounding. */
  cashRoundingIncrementMinor?: number;
}

export const DEFAULT_PRICING_OPTIONS: PricingOptions = {
  taxMode: 'exclusive',
  serviceChargePercent: 0,
  serviceChargeTaxable: false,
  serviceChargeTaxRatePercent: 0,
  orderDiscount: null,
  deliveryFeeMinor: 0,
  tipMinor: 0,
  cashRoundingIncrementMinor: 1,
};

export interface PricedLine {
  id: string;
  name?: string;
  quantity: number;
  /** Unit price including its modifiers. */
  effectiveUnitPriceMinor: number;
  grossMinor: number;
  itemDiscountMinor: number;
  orderDiscountShareMinor: number;
  /** gross - all discounts, tax-exclusive. */
  netMinor: number;
  taxRatePercent: number;
  taxMinor: number;
  /** net + tax. */
  totalMinor: number;
}

export interface TaxBreakdownEntry {
  ratePercent: number;
  taxableMinor: number;
  taxMinor: number;
}

export interface OrderTotals {
  lines: PricedLine[];
  /** Sum of line gross, before any discount. */
  subtotalMinor: number;
  itemDiscountMinor: number;
  orderDiscountMinor: number;
  discountTotalMinor: number;
  /** subtotal - discounts, tax-exclusive. */
  netSubtotalMinor: number;
  serviceChargeMinor: number;
  serviceChargeTaxMinor: number;
  taxMinor: number;
  taxBreakdown: TaxBreakdownEntry[];
  deliveryFeeMinor: number;
  tipMinor: number;
  roundingMinor: number;
  grandTotalMinor: number;
  /** Convenience for the receipt: quantity of all lines. */
  totalQuantity: number;
}

function discountAmount(baseMinor: number, discount: Discount | null | undefined): number {
  if (!discount || discount.value <= 0) return 0;
  const raw =
    discount.type === DISCOUNT_TYPE.PERCENTAGE
      ? percentOf(baseMinor, Math.min(discount.value, 100))
      : discount.value;
  return clampMinor(raw, baseMinor);
}

/** Unit price with its modifier surcharges folded in. */
export function effectiveUnitPrice(line: PricingLineInput): number {
  const modifiers = line.modifiers ?? [];
  const modifierTotal = modifiers.reduce(
    (sum, m) => sum + m.priceMinor * Math.max(1, m.quantity),
    0,
  );
  return line.unitPriceMinor + modifierTotal;
}

export function calculateOrderTotals(
  inputLines: PricingLineInput[],
  options: Partial<PricingOptions> = {},
): OrderTotals {
  const opts: PricingOptions = { ...DEFAULT_PRICING_OPTIONS, ...options };

  // --- 1 & 2: line gross and item-level discount ---------------------------
  const staged = inputLines.map((line) => {
    const unit = effectiveUnitPrice(line);
    const quantity = Math.max(0, line.quantity);
    const gross = unit * quantity;
    const itemDiscount = discountAmount(gross, line.discount);
    return { line, unit, quantity, gross, itemDiscount, afterItem: gross - itemDiscount };
  });

  const subtotalMinor = staged.reduce((sum, s) => sum + s.gross, 0);
  const itemDiscountMinor = staged.reduce((sum, s) => sum + s.itemDiscount, 0);

  // --- 3: order-level discount, spread proportionally ----------------------
  const eligible = staged.filter((s) => !s.line.excludeFromOrderDiscount);
  const eligibleBase = eligible.reduce((sum, s) => sum + s.afterItem, 0);
  const orderDiscountMinor = discountAmount(eligibleBase, opts.orderDiscount);

  const eligibleShares = allocate(
    orderDiscountMinor,
    eligible.map((s) => s.afterItem),
  );
  const shareByLineId = new Map<string, number>();
  eligible.forEach((s, i) => shareByLineId.set(s.line.id, eligibleShares[i] ?? 0));

  // --- 4, 6: net and tax per line -----------------------------------------
  const lines: PricedLine[] = staged.map((s) => {
    const orderShare = shareByLineId.get(s.line.id) ?? 0;
    const afterDiscount = Math.max(0, s.afterItem - orderShare);
    const rate = Math.max(0, s.line.taxRatePercent);

    let netMinor: number;
    let taxMinor: number;

    if (opts.taxMode === 'inclusive') {
      // The discounted amount already contains tax; extract it.
      taxMinor = rate > 0 ? roundHalfUp((afterDiscount * rate) / (100 + rate)) : 0;
      netMinor = afterDiscount - taxMinor;
    } else {
      netMinor = afterDiscount;
      taxMinor = percentOf(netMinor, rate);
    }

    return {
      id: s.line.id,
      name: s.line.name,
      quantity: s.quantity,
      effectiveUnitPriceMinor: s.unit,
      grossMinor: s.gross,
      itemDiscountMinor: s.itemDiscount,
      orderDiscountShareMinor: orderShare,
      netMinor,
      taxRatePercent: rate,
      taxMinor,
      totalMinor: netMinor + taxMinor,
    };
  });

  const netSubtotalMinor = lines.reduce((sum, l) => sum + l.netMinor, 0);

  // --- 5: service charge ---------------------------------------------------
  const serviceChargeMinor = percentOf(netSubtotalMinor, Math.max(0, opts.serviceChargePercent));
  const serviceChargeTaxMinor =
    opts.serviceChargeTaxable && serviceChargeMinor > 0
      ? percentOf(serviceChargeMinor, Math.max(0, opts.serviceChargeTaxRatePercent))
      : 0;

  // --- Tax breakdown, grouped by rate for the receipt ----------------------
  const breakdownMap = new Map<number, TaxBreakdownEntry>();
  for (const line of lines) {
    if (line.taxMinor === 0 && line.taxRatePercent === 0) continue;
    const entry = breakdownMap.get(line.taxRatePercent) ?? {
      ratePercent: line.taxRatePercent,
      taxableMinor: 0,
      taxMinor: 0,
    };
    entry.taxableMinor += line.netMinor;
    entry.taxMinor += line.taxMinor;
    breakdownMap.set(line.taxRatePercent, entry);
  }
  if (serviceChargeTaxMinor > 0) {
    const rate = opts.serviceChargeTaxRatePercent;
    const entry = breakdownMap.get(rate) ?? { ratePercent: rate, taxableMinor: 0, taxMinor: 0 };
    entry.taxableMinor += serviceChargeMinor;
    entry.taxMinor += serviceChargeTaxMinor;
    breakdownMap.set(rate, entry);
  }
  const taxBreakdown = [...breakdownMap.values()].sort((a, b) => a.ratePercent - b.ratePercent);
  const taxMinor = taxBreakdown.reduce((sum, e) => sum + e.taxMinor, 0);

  // --- 7: grand total ------------------------------------------------------
  const deliveryFeeMinor = Math.max(0, opts.deliveryFeeMinor ?? 0);
  const tipMinor = Math.max(0, opts.tipMinor ?? 0);

  const preRounding =
    netSubtotalMinor + serviceChargeMinor + taxMinor + deliveryFeeMinor + tipMinor;

  const { rounded, adjustment } = roundToCashIncrement(
    preRounding,
    opts.cashRoundingIncrementMinor ?? 1,
  );

  return {
    lines,
    subtotalMinor,
    itemDiscountMinor,
    orderDiscountMinor,
    discountTotalMinor: itemDiscountMinor + orderDiscountMinor,
    netSubtotalMinor,
    serviceChargeMinor,
    serviceChargeTaxMinor,
    taxMinor,
    taxBreakdown,
    deliveryFeeMinor,
    tipMinor,
    roundingMinor: adjustment,
    grandTotalMinor: rounded,
    totalQuantity: lines.reduce((sum, l) => sum + l.quantity, 0),
  };
}

/** Payment progress for an order, used by the payment modal and the API. */
export function paymentSummary(
  grandTotalMinor: number,
  paidMinor: number,
  refundedMinor = 0,
): { balanceDueMinor: number; changeDueMinor: number; isSettled: boolean; netPaidMinor: number } {
  const netPaidMinor = paidMinor - refundedMinor;
  const difference = netPaidMinor - grandTotalMinor;
  return {
    netPaidMinor,
    balanceDueMinor: difference < 0 ? -difference : 0,
    changeDueMinor: difference > 0 ? difference : 0,
    isSettled: difference >= 0,
  };
}
