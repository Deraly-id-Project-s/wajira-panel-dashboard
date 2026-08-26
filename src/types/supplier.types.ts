import type { PaginatedResult } from './pagination.types';

export interface Supplier {
  id: number | string;
  uuid?: string;
  code?: string;
  type?: string;
  name: string;
  address?: string | null;
  npwp?: string | null;
  phone?: string | null;
  pic?: string | null;
  userId?: number | string;
  companyId?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierPayload {
  name: string;
  code?: string;
  type?: string;
  address?: string;
  npwp?: string;
  phone?: string;
  pic?: string;
  userId?: number | string;
  companyId?: number | string;
}

export interface SupplierListResponse extends PaginatedResult<Supplier> {}
