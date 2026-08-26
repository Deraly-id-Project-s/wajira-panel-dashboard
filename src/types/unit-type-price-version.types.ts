import { z } from 'zod';
import type { LaravelPagination } from '@/types/pagination.types';

export interface UnitTypePriceVersion {
  id: number;
  unit_type_id: number;
  name: string;
  buy_price: number;
  sell_price: number;
  effective_from: string | null;
  effective_until: string | null;
  is_default: boolean | number;
  is_lock?: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface UnitTypePriceVersionFilterParams {
  page?: number;
  per_page?: number;
  search?: string;
  is_lock?: boolean;
  is_default?: boolean;
  unit_type_id?: number | string;
}

export interface UnitTypePriceVersionListResponse {
  status: boolean;
  message: string;
  errors: Record<string, string[]> | null;
  data: LaravelPagination<UnitTypePriceVersion>;
}

export const UnitTypePriceVersionSchema = z.object({
  name: z.string().min(1, 'Nama versi wajib diisi'),
  buy_price: z.number().min(0, 'Harga beli tidak boleh kurang dari 0'),
  sell_price: z.number().min(0, 'Harga jual tidak boleh kurang dari 0'),
  effective_from: z.string().optional().nullable(),
  effective_until: z.string().optional().nullable(),
  is_default: z.boolean(),
});

export type UnitTypePriceVersionFormValues = z.infer<typeof UnitTypePriceVersionSchema>;
