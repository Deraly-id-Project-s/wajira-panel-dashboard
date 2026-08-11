import { PaginationMeta } from '@/@types/pagination.types';

export type WarehouseActivityType = 'issue' | 'receipt';
export type SortDirection = 'asc' | 'desc';
export type DispatchStatusFilter = 'all' | 'pending' | 'issued';

export interface WarehouseOption {
  id: number;
  name: string;
}

export interface PersonOption {
  id: number;
  name: string;
}

export interface PengeluaranUnit {
  id: number;
  uuid: string;
  personId: number;
  warehouseId: number;
  activityNumber: string;
  activityType: WarehouseActivityType;
  activityDate: string;
  description: string | null;
  createdAt: string;
  warehouse: WarehouseOption | null;
  person: PersonOption | null;
  state?: string;
  state_note?: string;
}

export interface DispatchUnitTableRow {
  id: number;
  salesCode: string;
  unitTypeName: string;
  color: string;
  machineNumber: string;
  chassisNumber: string;
  stockState: string;
  inStock: boolean | null;
  isDispatched: boolean;
  warehouseId: number;
  unitTransactionItemDetailId: number;
}

export interface DispatchUnitTableParams {
  page?: number;
  perPage?: number;
  search?: string;
  warehouseId?: number;
}

export interface DispatchUnitTableResult {
  data: DispatchUnitTableRow[];
  meta: PaginationMeta;
}

export interface PengeluaranUnitListParams {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: SortDirection;
  start_date?: string | null;
  end_date?: string | null;
  company_id?: number | null;
}

export interface PengeluaranUnitListResult {
  data: PengeluaranUnit[];
  meta: PaginationMeta;
}

export interface SavePengeluaranUnitPayload {
  personId: number;
  warehouseId: number;
  activityDate: string;
  description?: string;
}

export interface PengeluaranUnitFormValues {
  personId: number;
  warehouseId: number;
  activityDate: Date;
  description: string;
}

export interface ApiFieldErrors {
  [key: string]: string[];
}
