import { describe, expect, it } from 'vitest';
import { ALL_PERMISSIONS, PERMISSIONS } from '@/constants/permissions';
import { ROLE_PERMISSIONS, ROLES } from '@/constants/roles';

describe('role permissions', () => {
  it('gives super admin every permission', () => expect(ROLE_PERMISSIONS[ROLES.SUPER_ADMIN]).toEqual(ALL_PERMISSIONS));
  it('does not expose salary or refunds to cashier accounts', () => {
    expect(ROLE_PERMISSIONS[ROLES.CASHIER]).not.toContain(PERMISSIONS.EMPLOYEE_VIEW_SALARY);
    expect(ROLE_PERMISSIONS[ROLES.CASHIER]).not.toContain(PERMISSIONS.PAYMENT_REFUND);
  });
  it('allows kitchen staff to update kitchen tickets but not access finance', () => {
    expect(ROLE_PERMISSIONS[ROLES.KITCHEN]).toContain(PERMISSIONS.KITCHEN_UPDATE);
    expect(ROLE_PERMISSIONS[ROLES.KITCHEN]).not.toContain(PERMISSIONS.REPORT_VIEW_FINANCIAL);
  });
});
