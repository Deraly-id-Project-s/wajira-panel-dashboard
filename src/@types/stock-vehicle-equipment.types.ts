import type { PaginationMeta } from '@/@types/pagination.types';

export interface StockVehicleEquipment {
  id: string;
  vehicleEquipmentCode: string;
  vehicleEquipmentName: string;
  stockAvailable: number;
  stockUsed: number;
  totalStock: number;
}

export interface StockVehicleEquipmentResponse {
  data: StockVehicleEquipment[];
  meta: PaginationMeta;
}
