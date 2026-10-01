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
  activityNumber?: string;
  activity_date: string;
  activityDate?: string;
  activity_type?: 'receipt' | 'issue' | 'assign' | 'dispatch' | string;
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
  type?: 'unit-type' | 'sparepart' | 'vehicle-equipment' | string;
  is_system_sync?: boolean;
}

export interface WarehouseActivityListResponse {
  data: WarehouseActivity[];
  meta: PaginationMeta;
}

export interface WarehouseActivityDetail extends WarehouseActivity {
  unit_transaction_details?: WarehouseActivityUnitDetail[] | null;
  sparepart_transaction?: {
    id: number;
    uuid: string;
    code: string;
    warehouse_id: number;
    person_id: number;
    sparepart_id: number;
    type: string;
    billing_type: string;
    is_refunded: boolean;
    qty: number;
    price: number;
    discount: number;
    transaction_date: string;
    nota_number: string | null;
    billing_due_date: string | null;
    invoice_file: string | null;
    note: string | null;
    created_at: string;
    updated_at: string;
    sparepart?: {
      id: number;
      uuid: string;
      sparepart_category_id: number;
      code: string;
      name: string;
      image: string | null;
      unit_type: string;
      created_at: string;
      updated_at: string;
      buy_price: number;
      sell_price: number;
    } | null;
  } | null;
  goods_transaction?: {
    id: number;
    uuid?: string;
    code: string;
    warehouse_id?: number | null;
    person_id: number;
    vehicle_equipment_id?: number;
    type: string;
    billing_type: string;
    is_refunded?: boolean;
    qty: number;
    price: number;
    discount: number;
    transaction_date: string;
    nota_number?: string | null;
    billing_due_date?: string | null;
    invoice_file?: string | null;
    note?: string | null;
    vehicle_equipment?: {
      id: number;
      uuid?: string;
      code: string;
      name: string;
      description?: string | null;
      buy_price?: number;
      sell_price?: number;
    } | null;
  } | null;
}

export interface ReceiptStockPayload {
  unit_transaction_details: number[];
}

export interface WarehouseActivityListParams {
  page?: number;
  perPage?: number;
  search?: string;
  company_id?: number | null;
  activityType?: 'receipt' | 'issue' | 'assign' | 'dispatch' | string;
  type?: 'unit-type' | 'sparepart' | 'vehicle-equipment' | string;
  start_date?: string | null;
  end_date?: string | null;
}

export interface CreateWarehouseActivityPayload {
  warehouse_id?: string;
  activity_date: string;
  description?: string;
  activity_type?: 'receipt' | 'issue' | 'assign' | 'dispatch' | string;
  person_id?: string;
  sparepart_transaction_id?: string;
  goods_transaction_id?: string;
  state?: 'draft' | 'process' | 'done' | string;
  supplier_name?: string;
  type?: 'unit-type' | 'sparepart' | 'vehicle-equipment' | string;
}

export interface UpdateWarehouseActivityPayload {
  warehouse_id?: string;
  activity_type?: 'receipt' | 'issue' | 'assign' | 'dispatch' | string;
  activity_date?: string;
  description?: string;
  person_id?: string;
  supplier_name?: string;
  type?: 'unit-type' | 'sparepart' | 'vehicle-equipment' | string;
}

export interface CreateWarehouseDataPayload {
  person_id: number;
  warehouse_id: number;
  activity_type: 'receipt' | 'issue' | 'assign' | 'dispatch';
  activity_date: string;
  description?: string;
  type?: 'unit-type' | 'sparepart' | 'vehicle-equipment' | string;
}

export interface CreateAssignDispatchPayload {
  warehouse_id: number;
  type: 'vehicle-equipment';
  activity_type: 'assign' | 'dispatch';
  activity_date: string;
  description?: string;
  state_note?: string;
  vehicle_equipment_id: number;
  vehicle_fleet_id: number;
  qty: number;
}
