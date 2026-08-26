import type { Dealer } from './dealer.types';
import type { PaginatedResult } from './pagination.types';
import type { Region } from './region.types';
import type { Vendor } from './vendor.types';

export type VehicleType = 'r2' | 'r3' | 'r4';

export interface VehicleData {
  id: number;
  uuid: string;
  dealerId: number;
  regionId: number;
  invoiceNumber: string;
  invoiceDate: string | null;
  invoiceReceiveDate: string | null;
  vehicleType: VehicleType;
  ktpNumber: string;
  phoneNumber: string;
  occupation: string;
  stnkName: string;
  stnkAddress: string;
  village: string;
  district: string;
  subVillage: string;
  subDistrict: string;
  regency: string;
  postalCode: string;
  motorcycleBrand: string;
  motorcycleType: string;
  motorcycleCategory: string;
  motorcycleModel: string;
  manufactureYear: number | null;
  engineCapacity: number | null;
  color: string;
  price: number | null;
  chassisNumber: string;
  machineNumber: string;
  formAb: string;
  pib: string;
  tptNumber: string;
  sutNumber: string;
  srutNumber: string;
  fuelType: string;
  createdAt?: string;
  updatedAt?: string;
  vehicleRegistration?: {
    id: number;
    vendorId: number | null;
    vehicleDataId: number | null;
    processDate: string | null;
    isAlreadyProcessed: boolean;
  } | null;
  dealer?: Pick<Dealer, 'id' | 'code' | 'namaDealer'>;
  region?: Pick<Region, 'id' | 'name'>;
  ditlantasProcess?: {
    id: number;
    uuid: string;
    code: string;
    vendorId: number;
    processDate: string;
  }[] | null;
}

export interface VehicleDataPayload {
  dealerId: number;
  regionId: number;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceReceiveDate: string;
  vehicleType: VehicleType;
  ktpNumber: string;
  phoneNumber: string;
  occupation: string;
  stnkName: string;
  stnkAddress: string;
  village: string;
  district: string;
  subVillage: string;
  subDistrict: string;
  regency: string;
  postalCode: string;
  motorcycleBrand: string;
  motorcycleType: string;
  motorcycleCategory: string;
  motorcycleModel: string;
  manufactureYear: string;
  engineCapacity: string;
  color: string;
  price: string;
  chassisNumber: string;
  machineNumber: string;
  formAb: string;
  pib: string;
  tptNumber: string;
  sutNumber: string;
  srutNumber: string;
  fuelType: string;
}

export interface VehicleDataFilters {
  search?: string;
  dealerId?: string;
  invoiceDate?: string;
}

export interface VehicleDataAssignPayload {
  vehicleDataIds: number[];
  vendorId: number;
  processDate: string;
}

export interface VehicleDataOption {
  id: number;
  label: string;
  subtitle?: string;
  value: string;
}

export type VehicleDataListResponse = PaginatedResult<VehicleData>;

export interface VehicleDataLookupItem {
  id: number;
  label: string;
  invoiceNumber: string;
  stnkName: string;
  chassisNumber: string;
  machineNumber: string;
}

export interface VendorLookupItem {
  id: number;
  label: string;
  vendor: Vendor;
}
