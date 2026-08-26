import type { PaginatedResult, PaginationParams } from './pagination.types';

export interface TaxVersion {
  id: number;
  tax_id: number;
  name: string;
  is_default: number | boolean;
}

export interface Tax {
  id: number;
  code: string;
  name: string;
  is_lock: number | boolean;
  tax_version_count: number;
  created_at?: string;
  tax_versions?: TaxVersion[];
}

export interface TaxPayload {
  code: string;
  name: string;
}

export interface TaxListParams extends PaginationParams {
  search?: string;
}

export type TaxListResponse = PaginatedResult<Tax>;
