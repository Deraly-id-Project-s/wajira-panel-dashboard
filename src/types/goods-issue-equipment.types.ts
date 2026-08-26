import type { Driver } from './driver.types';
import type { Armada } from './armada.types';
import type { VehicleEquipment } from './vehicle-equipment.types';
import type { PaginatedResult } from './pagination.types';

export interface GoodsIssueEquipment {
  id: number;
  uuid?: string;
  code: string;
  companyId: number;
  vehicleFleetId: number;
  driverId: number;
  category: 'equipped' | string;
  type: 'issue';
  transactionDate: string;
  description?: string | null;
  invoiceFile?: string | null;
  createdAt?: string;
  updatedAt?: string;
  totalBrutto?: number;
  driver?: Driver | null;
  vehicleFleet?: Armada | null;
}

export interface GoodsIssueEquipmentDetail extends GoodsIssueEquipment {
  goodsTransactionDetails: GoodsTransactionDetailEquipment[];
}

export interface GoodsIssueEquipmentPayload {
  companyId: number;
  type: 'issue';
  category: 'equipped' | 'maintenance';
  vehicleFleetId: number;
  driverId: number;
  transactionDate: string;
  description?: string | null;
}

export interface GoodsTransactionDetailEquipment {
  id: number;
  uuid?: string;
  goodsTransactionId: number;
  vehicleEquipmentId: number;
  qty: number;
  price?: number;
  inStock?: boolean;
  isForecast?: boolean;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  total?: number;
  vehicleEquipment?: VehicleEquipment | null;
  goodsTransaction?: GoodsIssueEquipment | null;
}

export interface GoodsTransactionDetailEquipmentPayload {
  goodsTransactionId: number;
  vehicleEquipmentId: number;
  qty: number;
  price?: number;
  description?: string | null;
}

export interface UploadInvoicePayload {
  file: File;
}

export type GoodsIssueEquipmentResponse = PaginatedResult<GoodsIssueEquipment>;
