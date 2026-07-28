import { NextResponse, type NextRequest } from 'next/server';

import { PERMISSIONS, type Permission } from '@/constants/permissions';
import { landingPathForRole } from '@/constants/roles';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session';

/**
 * Edge middleware: gates every non-public route behind a valid session, and
 * coarsely gates a handful of top-level sections behind the permission a
 * user needs to even open them. Pages still re-check permissions
 * server-side for the actions inside them — this only stops the
 * navigation, it is not the authorisation boundary.
 */

const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password'];

const ROUTE_PERMISSIONS: Array<{ prefix: string; anyOf: Permission[] }> = [
  { prefix: '/dashboard', anyOf: [PERMISSIONS.DASHBOARD_VIEW] },
  { prefix: '/pos', anyOf: [PERMISSIONS.POS_ACCESS] },
  { prefix: '/kitchen', anyOf: [PERMISSIONS.KITCHEN_VIEW] },
  { prefix: '/tables', anyOf: [PERMISSIONS.TABLE_VIEW] },
  { prefix: '/reservations', anyOf: [PERMISSIONS.RESERVATION_VIEW] },
  { prefix: '/menu', anyOf: [PERMISSIONS.MENU_VIEW] },
  { prefix: '/inventory', anyOf: [PERMISSIONS.INVENTORY_VIEW] },
  { prefix: '/suppliers', anyOf: [PERMISSIONS.SUPPLIER_VIEW] },
  { prefix: '/purchases', anyOf: [PERMISSIONS.PURCHASE_VIEW] },
  { prefix: '/customers', anyOf: [PERMISSIONS.CUSTOMER_VIEW] },
  { prefix: '/loyalty', anyOf: [PERMISSIONS.LOYALTY_VIEW] },
  { prefix: '/employees', anyOf: [PERMISSIONS.EMPLOYEE_VIEW] },
  { prefix: '/attendance', anyOf: [PERMISSIONS.ATTENDANCE_VIEW] },
  { prefix: '/register', anyOf: [PERMISSIONS.REGISTER_VIEW] },
  { prefix: '/expenses', anyOf: [PERMISSIONS.EXPENSE_VIEW] },
  { prefix: '/delivery', anyOf: [PERMISSIONS.DELIVERY_VIEW] },
  {
    prefix: '/reports',
    anyOf: [
      PERMISSIONS.REPORT_VIEW_SALES,
      PERMISSIONS.REPORT_VIEW_FINANCIAL,
      PERMISSIONS.REPORT_VIEW_INVENTORY,
      PERMISSIONS.REPORT_VIEW_STAFF,
    ],
  },
  { prefix: '/branches', anyOf: [PERMISSIONS.BRANCH_VIEW] },
  { prefix: '/settings', anyOf: [PERMISSIONS.SETTINGS_VIEW] },
  { prefix: '/users', anyOf: [PERMISSIONS.USER_VIEW] },
  { prefix: '/audit-log', anyOf: [PERMISSIONS.AUDIT_LOG_VIEW] },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isPublicPath = pathname === '/' || PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (isPublicPath) {
    if (session) {
      return NextResponse.redirect(new URL(landingPathForRole(session.role), request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const gate = ROUTE_PERMISSIONS.find((route) => pathname.startsWith(route.prefix));
  if (gate && !gate.anyOf.some((permission) => session.permissions.includes(permission))) {
    const destination = new URL(landingPathForRole(session.role), request.url);
    destination.searchParams.set('denied', pathname);
    return NextResponse.redirect(destination);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
};
