import { z } from 'zod';
import { PERMISSIONS } from '@/constants/permissions';
import { NotFoundError } from '@/lib/api/errors';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { Customer } from '@/models/Customer';

type Params = { id: string };
const schema = z.object({ isBlacklisted: z.boolean(), reason: z.string().max(300).nullable().optional() });

export const PATCH = defineRoute<z.infer<typeof schema>, Params>(
  { permissions: [PERMISSIONS.CUSTOMER_BLACKLIST], bodySchema: schema },
  async ({ params, body, user }) => {
    const customer = await Customer.findOneAndUpdate(
      { _id: params.id, restaurantId: user.restaurantId },
      { isBlacklisted: body.isBlacklisted, blacklistReason: body.isBlacklisted ? body.reason ?? null : null },
      { new: true },
    ).lean();
    if (!customer) throw new NotFoundError('Customer');
    return ok(customer);
  },
);
