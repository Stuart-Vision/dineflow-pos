import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

import type { Permission } from '@/constants/permissions';
import type { Role } from '@/constants/roles';
import { serverEnv } from '@/lib/env';

/**
 * Stateless session tokens.
 *
 * Signed with HS256 via `jose`, which runs in the Edge runtime — that is what
 * lets `middleware.ts` verify a session without a database round trip on every
 * navigation. Tokens live in an HTTP-only, SameSite=Lax cookie so client-side
 * JavaScript can never read them.
 */

export const SESSION_COOKIE = 'dineflow_session';
export const CSRF_COOKIE = 'dineflow_csrf';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  permissions: Permission[];
  restaurantId: string | null;
  branchIds: string[];
  activeBranchId: string | null;
  avatarUrl?: string | null;
}

export interface SessionPayload extends JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
  perms: Permission[];
  rid: string | null;
  bids: string[];
  abid: string | null;
  avatar?: string | null;
}

function secretKey(): Uint8Array {
  return new TextEncoder().encode(serverEnv().AUTH_SECRET);
}

export async function createSessionToken(
  user: SessionUser,
  ttlSeconds: number,
): Promise<{ token: string; expiresAt: Date }> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + ttlSeconds;

  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
    perms: user.permissions,
    rid: user.restaurantId,
    bids: user.branchIds,
    abid: user.activeBranchId,
    avatar: user.avatarUrl ?? null,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(user.id)
    .setIssuedAt(now)
    .setNotBefore(now)
    .setExpirationTime(exp)
    .setIssuer('dineflow-pos')
    .setAudience('dineflow-app')
    .sign(secretKey());

  return { token, expiresAt: new Date(exp * 1000) };
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, secretKey(), {
      issuer: 'dineflow-pos',
      audience: 'dineflow-app',
      algorithms: ['HS256'],
    });

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      permissions: payload.perms ?? [],
      restaurantId: payload.rid ?? null,
      branchIds: payload.bids ?? [],
      activeBranchId: payload.abid ?? null,
      avatarUrl: payload.avatar ?? null,
    };
  } catch {
    // Expired, tampered with, or signed by a different secret — all equally
    // "not signed in" from the caller's point of view.
    return null;
  }
}

export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

/**
 * CSRF double-submit token. Readable by the client (it must be echoed in a
 * header), which is why it is a *separate* cookie from the session and carries
 * no authority on its own.
 */
export function csrfCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time comparison so a token cannot be recovered by timing. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
