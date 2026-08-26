import type { PaginatedResult } from './pagination.types';

export interface Customer {
  id: number | string;
  uuid?: string;
  code?: string;
  type?: string;
  name: string;
  address?: string | null;
  npwp?: string | null;
  pic?: string | null;
  phone?: string | null;
  map_link?: string | null;
  userId?: number | string;
  companyId?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerPayload {
  name: string;
  address?: string;
  npwp?: string;
  pic?: string;
  phone?: string;
  map_link?: string;
  userId?: number | string;
  companyId?: number | string;
}

export interface CustomerListResponse extends PaginatedResult<Customer> {}
