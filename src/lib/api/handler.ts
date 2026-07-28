import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError, type ZodType, type ZodTypeDef } from 'zod';

import type { Permission } from '@/constants/permissions';
import { SESSION_COOKIE, CSRF_COOKIE, safeEqual, verifySessionToken, type SessionUser } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/connection';
import { serverEnv } from '@/lib/env';
import type { ListQuery } from '@/types/api';

import {
  AppError,
  CsrfError,
  ERROR_CODE,
  ForbiddenError,
  RateLimitError,
  UnauthenticatedError,
  ValidationError,
  isAppError,
  type FieldError,
} from './errors';
import { parseListQuery } from './query';
import { clientIdentifier, rateLimit, rateLimitHeaders } from './rate-limit';
import { fail, failFromAppError } from './response';
import { sanitizeMongoInput } from './sanitize';

/**
 * Route handler composition.
 *
 * Wraps a Next.js Route Handler with the cross-cutting concerns every endpoint
 * needs — database connection, authentication, authorisation, CSRF, rate
 * limiting, body validation and error translation — so that the handler body
 * itself contains only domain logic.
 */

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export interface RouteContext<TBody, TParams extends Record<string, string> = Record<string, string>> {
  request: NextRequest;
  url: URL;
  /** The signed-in user. Always present for `defineRoute`. */
  user: SessionUser;
  body: TBody;
  params: TParams;
  query: ListQuery;
  /** Convenience: the branch the request operates on, respecting user scope. */
  branchId: string | null;
  ip: string;
  userAgent: string;
}

export interface PublicRouteContext<TBody, TParams extends Record<string, string> = Record<string, string>> {
  request: NextRequest;
  url: URL;
  user: SessionUser | null;
  body: TBody;
  params: TParams;
  query: ListQuery;
  ip: string;
  userAgent: string;
}

export interface RouteOptions<TBody> {
  /** Permissions required; the user must hold **all** of them. */
  permissions?: Permission[];
  /** Alternative to `permissions`: the user must hold **at least one**. */
  anyPermission?: Permission[];
  /** Zod schema validating the JSON body (mutating methods only). */
  bodySchema?: ZodType<TBody, ZodTypeDef, unknown>;
  /** Per-window request cap for this endpoint, keyed by user + route. */
  rateLimit?: { limit: number; windowMs?: number };
  /** Skip CSRF verification (used by endpoints called before a token exists). */
  skipCsrf?: boolean;
  defaultSortBy?: string;
}

type NextRouteArgs = { params: Promise<Record<string, string>> };

/** Read and verify the session cookie. Returns null when absent or invalid. */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Throw unless a session exists. */
export async function requireSession(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new UnauthenticatedError();
  return user;
}

export function hasPermission(user: SessionUser, permission: Permission): boolean {
  return user.permissions.includes(permission);
}

export function hasAllPermissions(user: SessionUser, permissions: Permission[]): boolean {
  return permissions.every((p) => user.permissions.includes(p));
}

export function hasAnyPermission(user: SessionUser, permissions: Permission[]): boolean {
  return permissions.some((p) => user.permissions.includes(p));
}

export function assertPermission(user: SessionUser, permission: Permission): void {
  if (!hasPermission(user, permission)) {
    throw new ForbiddenError(`This action requires the "${permission}" permission.`);
  }
}

function zodToFieldErrors(error: ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '_root',
    message: issue.message,
  }));
}

async function readBody<TBody>(
  request: NextRequest,
  schema: ZodType<TBody, ZodTypeDef, unknown> | undefined,
): Promise<TBody> {
  if (!schema) return undefined as TBody;

  let raw: unknown;
  try {
    const text = await request.text();
    raw = text ? JSON.parse(text) : {};
  } catch {
    throw new ValidationError('The request body is not valid JSON.');
  }

  // Strip Mongo operators before the schema ever sees the value.
  const cleaned = sanitizeMongoInput(raw);

  const parsed = schema.safeParse(cleaned);
  if (!parsed.success) {
    throw new ValidationError('Please correct the highlighted fields.', zodToFieldErrors(parsed.error));
  }
  return parsed.data;
}

async function verifyCsrf(request: NextRequest): Promise<void> {
  if (!MUTATING_METHODS.has(request.method)) return;

  const store = await cookies();
  const cookieToken = store.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get('x-csrf-token');

  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
    throw new CsrfError();
  }
}

function resolveBranchScope(user: SessionUser, query: ListQuery): string | null {
  const requested = query.branchId ?? user.activeBranchId;
  if (!requested) return null;

  // Super Admin has no branch restriction; everyone else is confined to the
  // branches on their account.
  if (user.role === 'super_admin') return requested;
  if (user.branchIds.includes(requested)) return requested;

  throw new ForbiddenError('You do not have access to the selected branch.');
}

function translateError(error: unknown): NextResponse {
  if (error instanceof RateLimitError) {
    return failFromAppError(error, { 'Retry-After': String(error.retryAfterSeconds) });
  }

  if (isAppError(error)) {
    if (error.shouldLog) console.error('[api]', error.name, error.message, error.details ?? '');
    return failFromAppError(error);
  }

  if (error instanceof ZodError) {
    return fail('Please correct the highlighted fields.', {
      status: 422,
      code: ERROR_CODE.VALIDATION_ERROR,
      fields: zodToFieldErrors(error),
    });
  }

  // Mongoose duplicate key.
  if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: number }).code === 11000) {
    const keyPattern = (error as { keyPattern?: Record<string, number> }).keyPattern ?? {};
    const field = Object.keys(keyPattern)[0] ?? 'value';
    return fail(`That ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is already in use.`, {
      status: 409,
      code: ERROR_CODE.CONFLICT,
      fields: [{ field, message: 'Already in use.' }],
    });
  }

  console.error('[api] Unhandled error', error);

  const isProd = process.env.NODE_ENV === 'production';
  return fail(
    isProd
      ? 'Something went wrong on our side. Please try again.'
      : error instanceof Error
        ? error.message
        : 'Unknown error',
    { status: 500, code: ERROR_CODE.INTERNAL_ERROR },
  );
}

function applyRateLimit(
  request: NextRequest,
  identity: string,
  options: RouteOptions<unknown>['rateLimit'],
): Record<string, string> {
  const env = serverEnv();
  const limit = options?.limit ?? env.RATE_LIMIT_MAX_REQUESTS;
  const windowMs = options?.windowMs ?? env.RATE_LIMIT_WINDOW_MS;

  const route = new URL(request.url).pathname;
  const result = rateLimit(`${identity}:${request.method}:${route}`, limit, windowMs);

  if (!result.allowed) throw new RateLimitError(result.retryAfterSeconds);
  return rateLimitHeaders(result);
}

/**
 * Define an authenticated route handler.
 *
 * ```ts
 * export const POST = defineRoute(
 *   { permissions: [PERMISSIONS.ORDER_CREATE], bodySchema: createOrderSchema },
 *   async ({ body, user }) => created(await orderService.create(body, user)),
 * );
 * ```
 */
export function defineRoute<TBody = undefined, TParams extends Record<string, string> = Record<string, string>>(
  options: RouteOptions<TBody>,
  handler: (context: RouteContext<TBody, TParams>) => Promise<NextResponse> | NextResponse,
) {
  return async (request: NextRequest, routeArgs?: NextRouteArgs): Promise<NextResponse> => {
    try {
      await connectToDatabase();

      const user = await requireSession();

      if (!options.skipCsrf) await verifyCsrf(request);

      const headers = applyRateLimit(request, user.id, options.rateLimit);

      if (options.permissions?.length && !hasAllPermissions(user, options.permissions)) {
        throw new ForbiddenError(
          `This action requires: ${options.permissions.join(', ')}.`,
        );
      }
      if (options.anyPermission?.length && !hasAnyPermission(user, options.anyPermission)) {
        throw new ForbiddenError('You do not have permission to perform this action.');
      }

      const url = new URL(request.url);
      const query = parseListQuery(url, { defaultSortBy: options.defaultSortBy });
      const params = ((await routeArgs?.params) ?? {}) as TParams;
      const body = await readBody(request, options.bodySchema);

      const response = await handler({
        request,
        url,
        user,
        body,
        params,
        query,
        branchId: resolveBranchScope(user, query),
        ip: clientIdentifier(request),
        userAgent: request.headers.get('user-agent') ?? 'unknown',
      });

      for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      return response;
    } catch (error) {
      return translateError(error);
    }
  };
}

/** Define a route that does not require a session (login, health, reset flows). */
export function definePublicRoute<TBody = undefined, TParams extends Record<string, string> = Record<string, string>>(
  options: Omit<RouteOptions<TBody>, 'permissions' | 'anyPermission'>,
  handler: (context: PublicRouteContext<TBody, TParams>) => Promise<NextResponse> | NextResponse,
) {
  return async (request: NextRequest, routeArgs?: NextRouteArgs): Promise<NextResponse> => {
    try {
      await connectToDatabase();

      const headers = applyRateLimit(request, clientIdentifier(request), options.rateLimit);

      const url = new URL(request.url);
      const query = parseListQuery(url, { defaultSortBy: options.defaultSortBy });
      const params = ((await routeArgs?.params) ?? {}) as TParams;
      const body = await readBody(request, options.bodySchema);

      const response = await handler({
        request,
        url,
        user: await getSession(),
        body,
        params,
        query,
        ip: clientIdentifier(request),
        userAgent: request.headers.get('user-agent') ?? 'unknown',
      });

      for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      return response;
    } catch (error) {
      return translateError(error);
    }
  };
}

export { AppError };
