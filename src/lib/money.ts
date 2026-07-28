/**
 * Money handling.
 *
 * Every monetary value in DineFlow is stored and computed as an **integer
 * number of minor units** (cents/paise/fils). Floating-point currency is the
 * classic source of one-cent drift in a POS — `0.1 + 0.2 !== 0.3` shows up as a
 * receipt that does not foot. Conversion to a decimal happens only at the
 * formatting boundary.
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  /** Number of decimal places, i.e. minor units per major unit = 10^decimals. */
  decimals: number;
  locale: string;
  /** Symbol placement relative to the number. */
  position: 'before' | 'after';
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', decimals: 2, locale: 'en-US', position: 'before' },
  EUR: { code: 'EUR', symbol: '€', decimals: 2, locale: 'de-DE', position: 'after' },
  GBP: { code: 'GBP', symbol: '£', decimals: 2, locale: 'en-GB', position: 'before' },
  AED: { code: 'AED', symbol: 'AED', decimals: 2, locale: 'en-AE', position: 'before' },
  PKR: { code: 'PKR', symbol: 'Rs', decimals: 2, locale: 'en-PK', position: 'before' },
  INR: { code: 'INR', symbol: '₹', decimals: 2, locale: 'en-IN', position: 'before' },
  SAR: { code: 'SAR', symbol: 'SAR', decimals: 2, locale: 'en-SA', position: 'before' },
  CAD: { code: 'CAD', symbol: 'C$', decimals: 2, locale: 'en-CA', position: 'before' },
  AUD: { code: 'AUD', symbol: 'A$', decimals: 2, locale: 'en-AU', position: 'before' },
};

export const DEFAULT_CURRENCY = 'USD';

export function currencyConfig(code: string | undefined): CurrencyConfig {
  return CURRENCIES[code ?? DEFAULT_CURRENCY] ?? CURRENCIES[DEFAULT_CURRENCY]!;
}

/** Convert a major-unit decimal (12.34) to minor units (1234). */
export function toMinor(major: number, decimals = 2): number {
  return Math.round(major * 10 ** decimals);
}

/** Convert minor units (1234) to a major-unit decimal (12.34). */
export function toMajor(minor: number, decimals = 2): number {
  return minor / 10 ** decimals;
}

/**
 * Multiply a minor-unit amount by a rate, rounding half-up to a whole minor
 * unit. Half-up (not banker's rounding) matches what customers and tax
 * authorities expect on a receipt.
 */
export function applyRate(amountMinor: number, rate: number): number {
  return roundHalfUp(amountMinor * rate);
}

export function roundHalfUp(value: number): number {
  // `Math.round` rounds -0.5 towards zero, which would under-charge refunds.
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/** Percentage of an amount, e.g. `percentOf(1000, 7.5)` -> 75. */
export function percentOf(amountMinor: number, percent: number): number {
  return roundHalfUp((amountMinor * percent) / 100);
}

/**
 * Split `totalMinor` across `weights` so the parts sum **exactly** to the
 * total. Largest-remainder distribution: floor every share, then hand the
 * leftover minor units to the entries with the biggest fractional remainder.
 *
 * Used for spreading an order-level discount over its line items and for
 * apportioning a split payment.
 */
export function allocate(totalMinor: number, weights: number[]): number[] {
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  if (weights.length === 0) return [];
  if (weightSum <= 0) {
    // Nothing to weight by — distribute as evenly as possible.
    const base = Math.trunc(totalMinor / weights.length);
    const shares = weights.map(() => base);
    let leftover = totalMinor - base * weights.length;
    for (let i = 0; leftover !== 0; i = (i + 1) % weights.length) {
      const step = leftover > 0 ? 1 : -1;
      shares[i] += step;
      leftover -= step;
    }
    return shares;
  }

  const exact = weights.map((w) => (totalMinor * w) / weightSum);
  const shares = exact.map((v) => Math.trunc(v));
  let remainder = totalMinor - shares.reduce((sum, v) => sum + v, 0);

  const order = exact
    .map((value, index) => ({ index, frac: Math.abs(value - Math.trunc(value)) }))
    .sort((a, b) => b.frac - a.frac);

  let cursor = 0;
  const step = remainder >= 0 ? 1 : -1;
  while (remainder !== 0 && order.length > 0) {
    shares[order[cursor % order.length]!.index] += step;
    remainder -= step;
    cursor += 1;
  }

  return shares;
}

/** Clamp an amount into [0, max]; discounts must never create negative lines. */
export function clampMinor(amountMinor: number, max: number): number {
  if (amountMinor < 0) return 0;
  return amountMinor > max ? max : amountMinor;
}

/**
 * Round a grand total to the nearest cash increment (e.g. 5 cents where 1c and
 * 2c coins are withdrawn). Returns the adjustment as well as the rounded total
 * so the receipt can show a "Rounding" line.
 */
export function roundToCashIncrement(
  amountMinor: number,
  incrementMinor: number,
): { rounded: number; adjustment: number } {
  if (incrementMinor <= 1) return { rounded: amountMinor, adjustment: 0 };
  const rounded = roundHalfUp(amountMinor / incrementMinor) * incrementMinor;
  return { rounded, adjustment: rounded - amountMinor };
}

/** Format a minor-unit amount for display, e.g. 123456 -> "$1,234.56". */
export function formatMoney(
  amountMinor: number,
  currencyCode: string = DEFAULT_CURRENCY,
  options: { showSymbol?: boolean; signed?: boolean } = {},
): string {
  const { showSymbol = true, signed = false } = options;
  const cfg = currencyConfig(currencyCode);
  const major = toMajor(amountMinor, cfg.decimals);

  const body = new Intl.NumberFormat(cfg.locale, {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  }).format(Math.abs(major));

  const sign = major < 0 ? '-' : signed && major > 0 ? '+' : '';
  if (!showSymbol) return `${sign}${body}`;

  return cfg.position === 'before'
    ? `${sign}${cfg.symbol}${body}`
    : `${sign}${body} ${cfg.symbol}`;
}

/** Compact form for dashboard tiles, e.g. 1234567 -> "$12.3K". */
export function formatMoneyCompact(
  amountMinor: number,
  currencyCode: string = DEFAULT_CURRENCY,
): string {
  const cfg = currencyConfig(currencyCode);
  const major = toMajor(amountMinor, cfg.decimals);
  const body = new Intl.NumberFormat(cfg.locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Math.abs(major));
  const sign = major < 0 ? '-' : '';
  return cfg.position === 'before'
    ? `${sign}${cfg.symbol}${body}`
    : `${sign}${body} ${cfg.symbol}`;
}

/** Parse user input ("1,234.56", "$1234.56") into minor units, or null. */
export function parseMoneyInput(input: string, decimals = 2): number | null {
  const cleaned = input.replace(/[^\d.-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return toMinor(value, decimals);
}
