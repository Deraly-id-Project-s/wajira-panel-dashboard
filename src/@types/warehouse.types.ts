import { PaginationMeta } from '@/@types/pagination.types';

export interface WarehouseActivityPerson {
  id: string;
  name: string;
}

export interface WarehouseActivityUnitDetail {
  id: number;
  penerimaanId: string;
  noPembelian: string;
  tipeUnit: string;
  warna: string;
  noMesin: string;
  in_stock: boolean;
  status: string;
  noRangka: string;
  diterima: boolean;
  stockState: string;
  warehouseSubBlock?: string;
  isSoldUnit?: boolean;
}

export interface WarehouseActivity {
  id: string;
  activity_number: string;
  activity_date: string;
  activity_type?: string;
  description?: string;
  warehouse?: {
    id: string;
    name: string;
  } | null;
  person?: WarehouseActivityPerson | null;
  noPenerimaan: string;
  supplier: string;
  tanggal: string;
  state: string;
  keterangan: string;
  isRefundActivity?: boolean;
  state_note?: string;
}

export interface WarehouseActivityListResponse {
  data: WarehouseActivity[];
  meta: PaginationMeta;
}

export interface WarehouseActivityDetail extends WarehouseActivity {
  unit_transaction_details: WarehouseActivityUnitDetail[];
}

export interface ReceiptStockPayload {
  unit_transaction_details: number[];
}

export interface WarehouseActivityListParams {
  page?: number;
  perPage?: number;
  search?: string;
  company_id?: number | null;
  activityType?: 'receipt' | 'issue' | string;
}

export interface CreateWarehouseActivityPayload {
  warehouse_id?: string;
  activity_date: string;
  description?: string;
  activity_type?: 'receipt' | 'issue' | string;
  person_id?: string;
  supplier_name?: string;
}

export interface UpdateWarehouseActivityPayload {
  warehouse_id?: string;
  activity_type?: 'receipt' | 'issue' | string;
  activity_date?: string;
  description?: string;
  person_id?: string;
  supplier_name?: string;
}

export interface CreateWarehouseDataPayload {
  person_id: number;
  warehouse_id: number;
  activity_type: 'receipt' | 'issue';
  activity_date: string;
  description?: string;
}
