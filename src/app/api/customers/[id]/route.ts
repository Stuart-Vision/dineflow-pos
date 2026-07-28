import { PERMISSIONS } from '@/constants/permissions';
import { NotFoundError } from '@/lib/api/errors';
import { defineRoute } from '@/lib/api/handler';
import { noContent, ok } from '@/lib/api/response';
import { getCustomerDetail } from '@/services/crm-service';
import { Customer } from '@/models/Customer';
import { upsertCustomerSchema, type UpsertCustomerInput } from '@/validators/operations';

type Params = { id: string };

export const GET = defineRoute<undefined, Params>(
  { permissions: [PERMISSIONS.CUSTOMER_VIEW] },
  async ({ params, user }) => ok(await getCustomerDetail(params.id, user.restaurantId!)),
);

export const PATCH = defineRoute<Partial<UpsertCustomerInput>, Params>(
  { permissions: [PERMISSIONS.CUSTOMER_MANAGE], bodySchema: upsertCustomerSchema.partial() },
  async ({ params, body, user }) => {
    const customer = await Customer.findOneAndUpdate(
      { _id: params.id, restaurantId: user.restaurantId },
      body,
      { new: true },
    ).lean();
    if (!customer) throw new NotFoundError('Customer');
    return ok(customer);
  },
);

export const DELETE = defineRoute<undefined, Params>(
  { permissions: [PERMISSIONS.CUSTOMER_MANAGE] },
  async ({ params, user }) => {
    const customer = await Customer.findOne({ _id: params.id, restaurantId: user.restaurantId });
    if (!customer) throw new NotFoundError('Customer');
    customer.deletedAt = new Date();
    await customer.save();
    return noContent();
  },
);
