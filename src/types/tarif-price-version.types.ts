import { z } from 'zod';
import type { LaravelPagination } from '@/types/pagination.types';

export interface TarifPriceVersion {
  id: number;
  tarif_id: number;
  name: string;
  uj_towing: number;
  uj_cdd: number;
  uj_fuso: number;
  effective_from: string | null;
  effective_until: string | null;
  is_default: boolean | number;
  is_lock?: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface TarifPriceVersionFilterParams {
  page?: number;
  per_page?: number;
  search?: string;
  is_lock?: boolean;
  is_default?: boolean;
  tarif_id?: number | string;
}

export interface TarifPriceVersionListResponse {
  status: boolean;
  message: string;
  errors: Record<string, string[]> | null;
  data: LaravelPagination<TarifPriceVersion>;
}

export const TarifPriceVersionSchema = z.object({
  name: z.string().min(1, 'Nama versi wajib diisi'),
  uj_towing: z.number().min(0, 'UJ Towing tidak boleh kurang dari 0'),
  uj_cdd: z.number().min(0, 'UJ CDD tidak boleh kurang dari 0'),
  uj_fuso: z.number().min(0, 'UJ Fuso tidak boleh kurang dari 0'),
  effective_from: z.string().optional().nullable(),
  effective_until: z.string().optional().nullable(),
  is_default: z.boolean(),
  is_lock: z.boolean().optional(),
});

export type TarifPriceVersionFormValues = z.infer<typeof TarifPriceVersionSchema>;
