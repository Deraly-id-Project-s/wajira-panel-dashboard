import type { PaginatedResult } from './pagination.types';

export type KasType = 'cash' | 'bank';

export interface Kas {
  id: number | string;
  uuid?: string;
  code: string;
  cash_name?: string;
  description: string;
  type: KasType;
  amount: number | string;
  companyId?: number | string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface KasPayload {
  code: string;
  cash_name: string;
  description: string;
  type: KasType;
  companyId?: number | string;
}

export type KasListResponse = PaginatedResult<Kas>;
