import { PERMISSIONS } from '@/constants/permissions';
import { ValidationError } from '@/lib/api/errors';
import { defineRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { recordPhysicalCount, recordStockMovement } from '@/services/inventory-service';
import { physicalCountSchema, stockMovementSchema, type PhysicalCountInput, type StockMovementInput } from '@/validators/operations';
import { z } from 'zod';

// One endpoint handles both a movement and a count so the client has a single
// place to post stock changes; the shape discriminates which path runs.
const bodySchema = z.union([
  z.object({ mode: z.literal('movement') }).and(stockMovementSchema),
  z.object({ mode: z.literal('count') }).and(physicalCountSchema),
]);

type Body = ({ mode: 'movement' } & StockMovementInput) | ({ mode: 'count' } & PhysicalCountInput);

export const POST = defineRoute<Body>(
  { permissions: [PERMISSIONS.INVENTORY_ADJUST], bodySchema },
  async ({ body, branchId, user }) => {
    if (!branchId) throw new ValidationError('No active branch selected.');

    if (body.mode === 'count') {
      const result = await recordPhysicalCount(branchId, body, user);
      return ok(result, undefined, { status: 201 });
    }

    const ingredient = await recordStockMovement(branchId, body, user);
    return ok(ingredient, undefined, { status: 201 });
  },
);
