'use client';

import type { ApiResponse } from '@/types/api';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function readCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)dineflow_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]!) : null;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: { field: string; message: string }[];

  constructor(response: Extract<ApiResponse<unknown>, { success: false }>, status: number) {
    super(response.error.message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = response.error.code;
    this.fields = response.error.fields;
  }
}

/**
 * Fetch wrapper for browser-side calls into DineFlow's own API. Attaches the
 * CSRF header the route handlers require on mutating requests and unwraps
 * the `{ success, data }` / `{ success, error }` envelope into a plain value
 * or a thrown `ApiRequestError`.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  if (MUTATING_METHODS.has(method)) {
    const csrf = readCsrfCookie();
    if (csrf) headers.set('x-csrf-token', csrf);
  }

  const res = await fetch(path, { ...init, method, headers, credentials: 'include' });
  const json = (await res.json()) as ApiResponse<T>;

  if (!json.success) throw new ApiRequestError(json, res.status);
  return json.data;
}

export function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
}

export function apiDelete<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'DELETE' });
}
