import { PERMISSIONS } from '@/constants/permissions';
import { defineRoute } from '@/lib/api/handler';
import { created, ok } from '@/lib/api/response';
import { Attendance } from '@/models/Attendance';
import { Employee } from '@/models/Employee';
import { Shift } from '@/models/Shift';
import { upsertAttendanceSchema } from '@/validators/operations';

function hoursBetween(checkInAt?: Date | null, checkOutAt?: Date | null, breakMinutes = 0): number {
  if (!checkInAt || !checkOutAt) return 0;
  return Math.max(0, Math.round(((checkOutAt.getTime() - checkInAt.getTime()) / 3_600_000 - breakMinutes / 60) * 100) / 100);
}

export const GET = defineRoute(
  { permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
  async ({ user, branchId, query }) => {
    const filter: Record<string, unknown> = { restaurantId: user.restaurantId };
    if (branchId) filter.branchId = branchId;
    if (query.from || query.to) filter.date = {
      ...(query.from ? { $gte: query.from } : {}),
      ...(query.to ? { $lte: query.to } : {}),
    };
    const employeeFilter: Record<string, unknown> = { restaurantId: user.restaurantId, deletedAt: null };
    if (branchId) employeeFilter.branchId = branchId;
    const [records, employees, shifts] = await Promise.all([
      Attendance.find(filter).sort({ date: -1 }).limit(200).populate('employeeId', 'name employeeCode jobTitle').lean(),
      Employee.find(employeeFilter).select('name employeeCode jobTitle employmentStatus').sort({ name: 1 }).lean(),
      Shift.find(filter).sort({ date: 1, startTime: 1 }).limit(200).populate('employeeId', 'name employeeCode').lean(),
    ]);
    return ok({ records, employees, shifts });
  },
);

export const POST = defineRoute(
  { permissions: [PERMISSIONS.ATTENDANCE_MANAGE], bodySchema: upsertAttendanceSchema },
  async ({ body, user, branchId }) => {
    const hoursWorked = hoursBetween(body.checkInAt, body.checkOutAt, body.breakMinutes);
    const record = await Attendance.findOneAndUpdate(
      { employeeId: body.employeeId, date: body.date },
      { restaurantId: user.restaurantId, branchId: branchId ?? user.activeBranchId, ...body, hoursWorked },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return created(record);
  },
);
