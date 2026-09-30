import { z } from 'zod';
import type { LaravelPagination } from '@/@types/pagination.types';

export interface VehicleEquipmentPriceVersion {
  id: number;
  uuid?: string;
  vehicle_equipment_id: number;
  name: string;
  buy_price: number;
  sell_price: number;
  effective_from: string | null;
  effective_until: string | null;
  is_default: boolean | number;
  is_lock?: boolean | number;
  created_at?: string;
  updated_at?: string;
  vehicle_equipment?: {
    id: number;
    code: string;
    name: string;
    buy_price?: number;
    sell_price?: number;
  };
}

export interface VehicleEquipmentPriceVersionFilterParams {
  page?: number;
  per_page?: number;
  search?: string;
  is_lock?: boolean;
  is_default?: boolean;
  vehicle_equipment_id?: number | string;
}

export interface VehicleEquipmentPriceVersionListResponse {
  status: boolean;
  message: string;
  errors: Record<string, string[]> | null;
  data: LaravelPagination<VehicleEquipmentPriceVersion>;
}

export const vehicleEquipmentPriceVersionSchema = z.object({
  name: z.string().min(1, 'Nama versi wajib diisi'),
  buy_price: z.coerce.number().min(0, 'Harga beli tidak boleh kurang dari 0'),
  sell_price: z.coerce.number().min(0, 'Harga jual tidak boleh kurang dari 0'),
  effective_from: z.string().optional().nullable(),
  effective_until: z.string().optional().nullable(),
  is_default: z.boolean().default(false),
  is_lock: z.boolean().optional(),
});

export type VehicleEquipmentPriceVersionFormValues = z.infer<typeof vehicleEquipmentPriceVersionSchema>;
