import { NextResponse } from 'next/server';

import type { ApiFailure, ApiSuccess, PaginationMeta } from '@/types/api';

import { AppError, ERROR_CODE, type ErrorCode, type FieldError } from './errors';

export function ok<T>(
  data: T,
  meta?: PaginationMeta & Record<string, unknown>,
  init?: { status?: number; headers?: HeadersInit },
): NextResponse<ApiSuccess<T>> {
  const body: ApiSuccess<T> = meta ? { success: true, data, meta } : { success: true, data };
  return NextResponse.json(body, { status: init?.status ?? 200, headers: init?.headers });
}

export function created<T>(data: T): NextResponse<ApiSuccess<T>> {
  return ok(data, undefined, { status: 201 });
}

export function noContent(): NextResponse<ApiSuccess<null>> {
  return ok(null, undefined, { status: 200 });
}

export function fail(
  message: string,
  options: {
    status?: number;
    code?: ErrorCode;
    fields?: FieldError[];
    details?: Record<string, unknown>;
    headers?: HeadersInit;
  } = {},
): NextResponse<ApiFailure> {
  const body: ApiFailure = {
    success: false,
    error: {
      code: options.code ?? ERROR_CODE.INTERNAL_ERROR,
      message,
      ...(options.fields ? { fields: options.fields } : {}),
      ...(options.details ? { details: options.details } : {}),
    },
  };
  return NextResponse.json(body, { status: options.status ?? 400, headers: options.headers });
}

export function failFromAppError(error: AppError, headers?: HeadersInit): NextResponse<ApiFailure> {
  return fail(error.message, {
    status: error.status,
    code: error.code,
    fields: error.fields,
    details: error.details,
    headers,
  });
}

export function buildPaginationMeta(
  page: number,
  pageSize: number,
  total: number,
): PaginationMeta {
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
}
