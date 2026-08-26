import type { LaravelPagination, PaginatedResult, PaginationMeta } from '@/types/pagination.types';

export interface LaravelApiResponse<T> {
  status: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data: T;
}

export class ApiResponseError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiResponseError';
    this.statusCode = statusCode;
  }
}

export class ApiValidationError extends Error {
  fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]>) {
    super(message);
    this.name = 'ApiValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export const ensureSuccess = <T>(payload: LaravelApiResponse<T>): T => {
  if (payload.status) return payload.data;

  if (payload.errors) {
    throw new ApiValidationError(payload.message ?? 'Validation error', payload.errors);
  }

  throw new ApiResponseError(payload.message ?? 'Request failed');
};

export const mapLaravelPaginationMeta = (source: LaravelPagination<unknown>): PaginationMeta => ({
  currentPage: source.current_page ?? 1,
  perPage: source.per_page ?? 10,
  total: source.total ?? 0,
  lastPage: source.last_page ?? 1,
});

export const toPaginatedResult = <Raw, Domain>(source: LaravelPagination<Raw>, mapper: (item: Raw) => Domain): PaginatedResult<Domain> => ({
  data: (source.data ?? []).map(mapper),
  meta: mapLaravelPaginationMeta(source),
});
