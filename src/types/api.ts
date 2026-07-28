import type { ErrorCode, FieldError } from '@/lib/api/errors';

/** Every successful API response uses this envelope. */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta & Record<string, unknown>;
}

/** Every failed API response uses this envelope. */
export interface ApiFailure {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    fields?: FieldError[];
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export type SortDirection = 'asc' | 'desc';

export interface ListQuery {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDir: SortDirection;
  from?: Date;
  to?: Date;
  branchId?: string;
  filters: Record<string, string | string[]>;
}
