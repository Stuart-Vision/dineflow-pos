import { describe, expect, it } from 'vitest';
import { allocate, percentOf, roundToCashIncrement, toMajor, toMinor } from '@/lib/money';

describe('money utilities', () => {
  it('round-trips major and minor units without float drift', () => {
    expect(toMinor(12.345)).toBe(1235);
    expect(toMajor(1235)).toBe(12.35);
  });
  it('allocates every minor unit exactly', () => {
    const shares = allocate(100, [1, 1, 1]);
    expect(shares.reduce((sum, value) => sum + value, 0)).toBe(100);
    expect(Math.max(...shares) - Math.min(...shares)).toBeLessThanOrEqual(1);
  });
  it('calculates tax and cash rounding', () => {
    expect(percentOf(1999, 8.5)).toBe(170);
    expect(roundToCashIncrement(1002, 5)).toEqual({ rounded: 1000, adjustment: -2 });
  });
});
