import type { ListQuery, SortDirection } from '@/types/api';

/**
 * Parse the shared list-query contract (`?page=&pageSize=&search=&sortBy=
 * &sortDir=&from=&to=&branchId=&<filter>=`) out of a request URL.
 *
 * Every collection endpoint accepts the same parameters, so the client-side
 * data table can be written once against a single contract.
 */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 200;

/** Query keys that are structural rather than a domain filter. */
const RESERVED_KEYS = new Set([
  'page',
  'pageSize',
  'search',
  'q',
  'sortBy',
  'sortDir',
  'from',
  'to',
  'branchId',
  'export',
]);

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function parseListQuery(
  url: URL | string,
  options: { defaultSortBy?: string; defaultSortDir?: SortDirection; maxPageSize?: number } = {},
): ListQuery {
  const searchParams = typeof url === 'string' ? new URL(url).searchParams : url.searchParams;
  const maxPageSize = options.maxPageSize ?? MAX_PAGE_SIZE;

  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const rawPageSize =
    Number.parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10) ||
    DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(Math.max(1, rawPageSize), maxPageSize);

  const search = (searchParams.get('search') ?? searchParams.get('q') ?? '').trim() || undefined;

  const sortDirRaw = searchParams.get('sortDir');
  const sortDir: SortDirection =
    sortDirRaw === 'asc' || sortDirRaw === 'desc' ? sortDirRaw : (options.defaultSortDir ?? 'desc');

  const filters: Record<string, string | string[]> = {};
  for (const key of new Set(searchParams.keys())) {
    if (RESERVED_KEYS.has(key)) continue;
    const values = searchParams.getAll(key).filter(Boolean);
    if (values.length === 0) continue;
    filters[key] = values.length === 1 ? values[0]! : values;
  }

  return {
    page,
    pageSize,
    search,
    sortBy: searchParams.get('sortBy') ?? options.defaultSortBy,
    sortDir,
    from: parseDate(searchParams.get('from')),
    to: parseDate(searchParams.get('to')),
    branchId: searchParams.get('branchId') ?? undefined,
    filters,
  };
}

/** Build a Mongoose sort object, restricted to an allow-list of fields. */
export function buildSort(
  query: ListQuery,
  allowedFields: readonly string[],
  fallback: Record<string, 1 | -1> = { createdAt: -1 },
): Record<string, 1 | -1> {
  if (!query.sortBy || !allowedFields.includes(query.sortBy)) return fallback;
  return { [query.sortBy]: query.sortDir === 'asc' ? 1 : -1 };
}

/** Read a single-valued filter, ignoring repeated parameters. */
export function filterValue(query: ListQuery, key: string): string | undefined {
  const value = query.filters[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Read a filter as an array regardless of how many times it was supplied. */
export function filterValues(query: ListQuery, key: string): string[] {
  const value = query.filters[key];
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function filterBoolean(query: ListQuery, key: string): boolean | undefined {
  const value = filterValue(query, key);
  if (value === undefined) return undefined;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return undefined;
}

export function skipFor(query: ListQuery): number {
  return (query.page - 1) * query.pageSize;
}
