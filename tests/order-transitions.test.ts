import { describe, expect, it } from 'vitest';
import { ORDER_STATUS, ORDER_STATUS_TRANSITIONS } from '@/constants/enums';

describe('order lifecycle', () => {
  it('supports the complete dine-in happy path', () => {
    const path = [ORDER_STATUS.DRAFT, ORDER_STATUS.SUBMITTED, ORDER_STATUS.KITCHEN_ACCEPTED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.SERVED, ORDER_STATUS.PAID, ORDER_STATUS.COMPLETED];
    for (let index = 0; index < path.length - 1; index += 1) expect(ORDER_STATUS_TRANSITIONS[path[index]!]).toContain(path[index + 1]);
  });
  it('keeps cancelled, refunded and voided orders terminal', () => {
    expect(ORDER_STATUS_TRANSITIONS.cancelled).toEqual([]);
    expect(ORDER_STATUS_TRANSITIONS.refunded).toEqual([]);
    expect(ORDER_STATUS_TRANSITIONS.voided).toEqual([]);
  });
  it('prevents skipping directly from draft to paid', () => {
    expect(ORDER_STATUS_TRANSITIONS.draft).not.toContain(ORDER_STATUS.PAID);
  });
});
