import type { PaginationParams } from '@/types/pagination.types';

export const buildLaravelPaginationQuery = (params: PaginationParams) => ({
  page: params.page ?? 1,
  per_page: params.perPage ?? 10,
  search: params.search?.trim() ? params.search.trim() : undefined,
  sort_by: params.sort_by,
  sort_order: params.sort_order,
});

export const getVisiblePageNumbers = (totalPages: number, currentPage: number, windowSize = 5): number[] => {
  if (totalPages <= 0) return [];

  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, currentPage - half);
  const end = Math.min(totalPages, start + windowSize - 1);

  if (end - start + 1 < windowSize) {
    start = Math.max(1, end - windowSize + 1);
  }

  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }
  return pages;
};
