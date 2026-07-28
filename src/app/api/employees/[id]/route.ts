import { PERMISSIONS } from '@/constants/permissions';
import { NotFoundError } from '@/lib/api/errors';
import { defineRoute, hasPermission } from '@/lib/api/handler';
import { noContent, ok } from '@/lib/api/response';
import { Employee } from '@/models/Employee';
import { upsertEmployeeSchema, type UpsertEmployeeInput } from '@/validators/operations';

type Params = { id: string };

export const PATCH = defineRoute<Partial<UpsertEmployeeInput>, Params>(
  { permissions: [PERMISSIONS.EMPLOYEE_MANAGE], bodySchema: upsertEmployeeSchema.partial() },
  async ({ params, body, user }) => {
    const { monthlySalaryMinor, hourlyRateMinor, ...publicFields } = body;
    const compensation = hasPermission(user, PERMISSIONS.EMPLOYEE_VIEW_SALARY)
      ? { monthlySalaryMinor, hourlyRateMinor }
      : {};
    const employee = await Employee.findOneAndUpdate(
      { _id: params.id, restaurantId: user.restaurantId },
      { ...publicFields, ...compensation },
      { new: true },
    ).lean();
    if (!employee) throw new NotFoundError('Employee');
    return ok(employee);
  },
);

export const DELETE = defineRoute<undefined, Params>(
  { permissions: [PERMISSIONS.EMPLOYEE_MANAGE] },
  async ({ params, user }) => {
    const employee = await Employee.findOne({ _id: params.id, restaurantId: user.restaurantId });
    if (!employee) throw new NotFoundError('Employee');
    employee.deletedAt = new Date();
    employee.employmentStatus = 'terminated';
    employee.terminationDate = new Date();
    await employee.save();
    return noContent();
  },
);
