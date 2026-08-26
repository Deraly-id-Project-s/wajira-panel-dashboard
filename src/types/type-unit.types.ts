import type { PaginatedResult } from './pagination.types';

export interface UnitBrand {
  id: number;
  uuid?: string;
  name: string;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TypeUnit {
  id: number;
  uuid?: string;
  brandId: number;
  code: string;
  name: string;
  capacity?: number | null;
  image?: string | null;
  unitType?: string | null;
  unitModel?: string | null;
  nettoWeight?: number | null;
  brutoWeight?: number | null;
  sellPrice?: number | null;
  buyPrice?: number | null;
  availableStock?: number | null;
  createdAt?: string;
  updatedAt?: string;
  brand?: UnitBrand | null;
}

export interface TypeUnitPayload {
  code: string;
  brandId: number;
  name: string;
  capacity?: number | null;
  unitType?: string | null;
  unitModel?: string | null;
  nettoWeight?: number | null;
  brutoWeight?: number | null;
  sellPrice?: number | null;
  buyPrice?: number | null;
  image?: File | null;
}

export interface TypeUnitListResponse extends PaginatedResult<TypeUnit> { }
