import type { NextRequest } from 'next/server';

import { PERMISSIONS } from '@/constants/permissions';
import { getSession, hasPermission } from '@/lib/api/handler';
import { connectToDatabase } from '@/lib/db/connection';
import { getKitchenBoard, resolveKitchenBranchIds } from '@/services/kitchen-service';

/**
 * Server-Sent Events feed for the kitchen display.
 *
 * SSE rather than WebSockets: the traffic is one-directional (server pushes
 * ticket changes, the client acts through ordinary POST routes), it survives
 * proxies that block upgrades, and the browser reconnects on its own. The
 * board is diffed by revision signature so an idle kitchen sends only
 * keep-alive comments rather than repeating the same payload every tick.
 */
export const dynamic = 'force-dynamic';

const POLL_INTERVAL_MS = 3_000;
const KEEPALIVE_INTERVAL_MS = 25_000;

export async function GET(request: NextRequest): Promise<Response> {
  await connectToDatabase();

  const user = await getSession();
  if (!user) return new Response('Unauthorized', { status: 401 });
  if (!hasPermission(user, PERMISSIONS.KITCHEN_VIEW)) return new Response('Forbidden', { status: 403 });

  const requestedBranchId = new URL(request.url).searchParams.get('branchId');
  const branchIds = await resolveKitchenBranchIds(user.restaurantId, user.branchIds, requestedBranchId);

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let lastRevision: string | null = null;
      let lastKeepalive = Date.now();

      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const tick = async () => {
        if (closed) return;
        try {
          const board = await getKitchenBoard(branchIds);
          if (board.revision !== lastRevision) {
            lastRevision = board.revision;
            send('board', board);
            lastKeepalive = Date.now();
          } else if (Date.now() - lastKeepalive > KEEPALIVE_INTERVAL_MS) {
            // A bare comment keeps intermediaries from reaping an idle stream.
            controller.enqueue(encoder.encode(': keep-alive\n\n'));
            lastKeepalive = Date.now();
          }
        } catch (error) {
          send('error', { message: error instanceof Error ? error.message : 'Kitchen feed failed' });
        }
      };

      await tick();
      const interval = setInterval(tick, POLL_INTERVAL_MS);

      request.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // Already closed by the runtime — nothing to do.
        }
      });
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
