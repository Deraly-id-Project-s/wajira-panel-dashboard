import type { Driver } from './driver.types';
import type { Armada } from './armada.types';
import type { VehicleEquipment } from './vehicle-equipment.types';
import type { PaginatedResult } from './pagination.types';

export interface MaintenanceVehicleFleet {
  id: number;
  uuid: string;
  type: string;
  registrationNumber: string;
  machineNumber: string;
  chassisNumber: string;
  stnkAge: string;
  kirAge: string;
  stnkNumber: string;
  kirBook: string;
}

export interface MaintenanceDriver {
  id: number;
  uuid: string;
  code: string;
  name: string;
  type: string;
}

export interface MaintenanceVehicleEquipment {
  id: number;
  uuid: string;
  code: string;
  name: string;
}

export interface MaintenanceDetail {
  id: number;
  uuid: string;
  qty: number;
  type: string | null;
  price: number;
  goodsTransactionId: number;
  materialId: number | null;
  vehicleEquipmentId: number | null;
  total: number;
  material: unknown | null;
  vehicleEquipment: MaintenanceVehicleEquipment | null;
}

export interface MaintenanceItem {
  id: number;
  uuid: string;
  code: string;
  companyId: number;
  supplierId: number | null;
  driverId: number | null;
  vehicleFleetId: number | null;
  category: 'maintenance' | string;
  type: 'issue' | string;
  transactionDate: string;
  location: string | null;
  description: string | null;
  invoiceFile: string | null;
  createdAt: string;
  totalBrutto: number;
  goodsTransactionDetails: MaintenanceDetail[];
  goodsTransactionBillings: unknown | null;
  company: {
    id: number;
    uuid: string;
    code: string;
    name: string;
    type: string;
  } | null;
  supplier: unknown | null;
  driver: Driver | null;
  vehicleFleet: Armada | null;
}

export interface MaintenanceListParams {
  company_id: number;
  page?: number;
  per_page?: number;
  search?: string;
  code?: string;
  registration_number?: string;
  driver_name?: string;
}

export type MaintenanceResponse = PaginatedResult<MaintenanceItem>;
