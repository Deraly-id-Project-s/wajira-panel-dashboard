import type { PaginatedResult } from './pagination.types';

export interface SparepartCategory {
  id: number;
  uuid?: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Sparepart {
  id: number | string;
  uuid?: string;
  code: string;
  name: string;
  categoryId: number | null;
  unit_type: string | null;
  price: number; // primary price field (maps to selling price when available)
  purchasePrice: number;
  sellingPrice: number;
  companyId?: number | string | null;
  createdAt?: string;
  updatedAt?: string;
  category?: SparepartCategory | null;
  group?: string;
  capacity?: number;
}

export interface SparepartPayload {
  code: string;
  name: string;
  categoryId?: number | null;
  unitType: string;
  price: number;
  capacity: number;
  purchasePrice?: number;
  sellingPrice?: number;
  companyId?: string | number;
}

export type SparepartListResponse = PaginatedResult<Sparepart>;
