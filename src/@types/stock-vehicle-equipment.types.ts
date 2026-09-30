import type { PaginationMeta } from '@/@types/pagination.types';

export interface StockVehicleEquipment {
  id: string;
  vehicleEquipmentId: number;
  vehicleEquipmentCode: string;
  vehicleEquipmentName: string;
  qty: number;
  forecastQty: number;
  price: number;
  status: string;
  stockStatus: string;
  stockState: string;
  isSoldUnit: boolean;
}

export interface StockVehicleEquipmentResponse {
  data: StockVehicleEquipment[];
  meta: PaginationMeta;
}
