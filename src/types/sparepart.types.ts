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
  unitType: string;
  price: number; // primary price field (maps to selling price when available)
  purchasePrice: number;
  sellingPrice: number;
  capacity: number;
  companyId?: number | string | null;
  createdAt?: string;
  updatedAt?: string;
  category?: SparepartCategory | null;
  // For backward compatibility with the previous UI naming
  group?: string;
  brandId?: number | null;
  brand?: { name: string } | null;
  unitModel?: string | null;
  nettoWeight?: number | null;
  brutoWeight?: number | null;
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
