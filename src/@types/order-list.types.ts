import type { Customer } from './customer.types';
import type { PaginatedResult, PaginationParams } from './pagination.types';

export type OrderListStatus = 'draft' | 'deliver' | 'process' | 'done' | 'reject';
export type OrderListVehicleType = 'towing' | 'cdd' | 'fuso';

export interface OrderListCustomer extends Partial<Customer> {
  id: number;
  name: string;
  code?: string;
  address?: string | null;
}

export interface OrderListVehicle {
  id: number;
  uuid?: string;
  registrationNumber: string;
  type: string;
}

export interface OrderListTarifReference {
  id: number;
  uuid?: string;
  customerId?: number;
  loadingIn: string;
  loadingOut: string;
  distance?: number;
  ujTowing?: number | null;
  ujCdd?: number | null;
  ujFuso?: number | null;
  invCdd?: number | null;
  invFuso?: number | null;
  invTowing?: number | null;
  customer?: Partial<Customer>;
}

export interface OrderListTarifItem {
  id: number;
  uuid?: string;
  doOrderListId: number;
  tarifId: number;
  deliveryDestination: string;
  vehicleType?: OrderListVehicleType | null;
  vehicleId?: number | null;
  driverId?: number | null;
  vehicle?: OrderListVehicle;
  driver?: { id: number; name: string; code?: string };
  loadingIn: string;
  loadingOut: string;
  loadContent?: string;
  qty?: number;
  driverFee?: number;
  expeditionInvoice?: number;
  tarifItems?: OrderListTarifLoadItem[];
  tarif?: OrderListTarifReference;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderListTarifLoadItem {
  id: number;
  uuid?: string;
  doOrderListTarifId: number;
  doOrderListTarifUuid?: string;
  doOrderListId?: number;
  loadContent: string;
  qty: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderList {
  id: number;
  uuid?: string;
  code: string;
  customerId: number;
  status: OrderListStatus;
  isHasInvoice: boolean;
  canMarkDone: boolean;
  vehicleType?: OrderListVehicleType | null;
  billInvoice: number;
  ppn: number;
  pph?: number;
  note: string;
  ujDriver: number;
  ujTowing?: number | null;
  ujCdd?: number | null;
  ujFuso?: number | null;
  invTowing?: number | null;
  invCdd?: number | null;
  invFuso?: number | null;
  loadingIn: string;
  loadingOut: string;
  deliveryDestination: string;
  vehicles: OrderListVehicle[];
  customer?: OrderListCustomer;
  tarifs: OrderListTarifItem[];
  expeditions: unknown[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProcessOrderListInvoiceResponse {
  doOrderList: OrderList;
  invoice: {
    id: number;
    uuid?: string;
    code: string;
    nominal: number;
  };
}

export interface OrderListListParams extends PaginationParams {
  order_by?: string;
  order_sort?: 'asc' | 'desc';
  company_id?: string | number;
  start_date?: string | null;
  end_date?: string | null;
}

export interface OrderListTarifListParams extends PaginationParams {
  order_by?: string;
  order_sort?: 'asc' | 'desc';
  do_orderlist_id?: number | string;
}

export interface OrderListTarifItemListParams extends PaginationParams {
  search?: string;
  order_by?: string;
  order_sort?: 'asc' | 'desc';
  do_order_list_tarif_id?: number | string;
  do_orderlist_id?: number | string;
}

export interface CreateOrderListPayload {
  customer_id: number;
  company_id: number;
  description?: string;
}

export interface UpdateOrderListPayload {
  customer_id: number;
  status: Exclude<OrderListStatus, 'reject'> | OrderListStatus;
  invoice_bill: number;
  bill_invoice?: number;
  vehicle_type?: OrderListVehicleType;
  note?: string;
  description?: string;
  uj_driver?: number;
  loading_in?: string;
  loading_out?: string;
}

export interface CreateOrderListTarifPayload {
  do_orderlist_id: number;
  tarif_id: number;
  vehicle_type: OrderListVehicleType;
  delivery_destination: string;
  vehicle_id: number;
  driver_id: number;
}

export interface UpdateOrderListTarifPayload {
  delivery_destination: string;
  tarif_id?: number;
  vehicle_type?: OrderListVehicleType;
  vehicle_id?: number;
  driver_id?: number;
}

export interface UpdateOrderListStatePayload {
  status: OrderListStatus;
}

export interface CreateOrderListTarifItemPayload {
  do_order_list_tarif_id: number;
  load_content: string;
  qty: number;
}

export interface UpdateOrderListTarifItemPayload {
  do_order_list_tarif_id: number;
  load_content: string;
  qty: number;
}

export type OrderListListResponse = PaginatedResult<OrderList>;
export type OrderListTarifListResponse = PaginatedResult<OrderListTarifItem>;
export type OrderListTarifItemListResponse = PaginatedResult<OrderListTarifLoadItem>;
