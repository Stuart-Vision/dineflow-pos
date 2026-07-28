import { definePublicRoute } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';

export const GET = definePublicRoute({}, async ({ user }) => ok({ user }));
