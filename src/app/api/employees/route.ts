import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute, hasPermission } from '@/lib/api/handler';
import { buildPaginationMeta, created, ok } from '@/lib/api/response';
import { buildSort, filterValue, skipFor } from '@/lib/api/query';
import { Employee } from '@/models/Employee';
import { upsertEmployeeSchema } from '@/validators/operations';

export const GET = defineRoute(
  { permissions: [PERMISSIONS.EMPLOYEE_VIEW], defaultSortBy: 'name' },
  async ({ user, query, branchId }) => {
    const filter: Record<string, unknown> = { restaurantId: user.restaurantId, deletedAt: null };
    if (branchId) filter.branchId = branchId;
    const status = filterValue(query, 'status');
    if (status) filter.employmentStatus = status;
    if (query.search) filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { employeeCode: { $regex: query.search, $options: 'i' } },
      { jobTitle: { $regex: query.search, $options: 'i' } },
    ];
    const salaryFields = hasPermission(user, PERMISSIONS.EMPLOYEE_VIEW_SALARY)
      ? '+monthlySalaryMinor +hourlyRateMinor'
      : '';
    const [items, total] = await Promise.all([
      Employee.find(filter).select(salaryFields).sort(buildSort(query, ['name', 'hireDate', 'employeeCode'], { name: 1 }))
        .skip(skipFor(query)).limit(query.pageSize).lean(),
      Employee.countDocuments(filter),
    ]);
    return ok(items, { ...buildPaginationMeta(query.page, query.pageSize, total) });
  },
);

export const POST = defineRoute(
  { permissions: [PERMISSIONS.EMPLOYEE_MANAGE], bodySchema: upsertEmployeeSchema },
  async ({ body, user, branchId }) => {
    const { monthlySalaryMinor, hourlyRateMinor, ...publicFields } = body;
    const compensation = hasPermission(user, PERMISSIONS.EMPLOYEE_VIEW_SALARY)
      ? { monthlySalaryMinor, hourlyRateMinor }
      : {};
    return created(await Employee.create({
      restaurantId: user.restaurantId,
      branchId: branchId ?? user.activeBranchId,
      ...publicFields,
      ...compensation,
      email: body.email || undefined,
    }));
  },
);
