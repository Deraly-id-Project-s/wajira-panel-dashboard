import { PaginatedResult } from './pagination.types';

export interface VehicleEquipment {
  id: number;
  uuid: string;
  code: string;
  name: string;
  description?: string | null;
  buy_price?: number;
  sell_price?: number;
  buyPrice?: number;
  sellPrice?: number;
  available_stock?: number;
  availableStock?: number;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleEquipmentPayload {
  code: string;
  name: string;
  description?: string | null;
  buy_price?: number;
  sell_price?: number;
}

export type VehicleEquipmentListResponse = PaginatedResult<VehicleEquipment>;
