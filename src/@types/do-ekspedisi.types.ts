import type { PaginatedResult } from './pagination.types';

export interface DoEkspedisiVehicle {
  id: number;
  uuid?: string;
  registrationNumber: string;
  type: string;
}

export interface DoEkspedisiDriver {
  id: number;
  uuid?: string;
  name: string;
  phone?: string | null;
}

export interface DoEkspedisiOrderList {
  id: number;
  uuid?: string;
  code: string;
  customerName: string;
  loadingIn: string;
  loadingOut: string;
  destination: string;
  loadContent: string;
  qty: number;
  tarifs: DoEkspedisiOrderTarifItem[];
  vehicleType?: string;
}

export interface DoEkspedisiOrderTarifItem {
  id: number;
  uuid?: string;
  loadingIn: string;
  loadingOut: string;
  deliveryDestination: string;
  loadContent: string;
  qty: number;
  tarifItems?: DoEkspedisiOrderTarifLoadItem[];
}

export interface DoEkspedisiOrderTarifLoadItem {
  id: number;
  uuid?: string;
  loadContent: string;
  qty: number;
}

export interface DoEkspedisiCustomer {
  id: number;
  uuid?: string;
  name: string;
  pic?: string | null;
}

export interface DoEkspedisiItemDestination {
  id: number;
  uuid?: string;
  doExpeditionItemId: number;
  destination: string;
  driverNote: string;
  orderNumber: number;
  mapsUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoEkspedisiItem {
  id: number;
  uuid?: string;
  doExpeditionId: number;
  customerId: number;
  customerName: string;
  loadingIn: string;
  loadingOut: string;
  destination: string;
  invoiceFee: number;
  additionalCostFee: number;
  otherFee: number;
  driverFee: number;
  driverNote: string;
  mapsUrl: string;
  ppnFee: number;
  serviceFee: number;
  pphFee: number;
  destinations?: DoEkspedisiItemDestination[];
  customer?: DoEkspedisiCustomer;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoEkspedisi {
  id: number;
  uuid?: string;
  doCode: string;
  orderCode: string;
  date: string;
  vehicleId: number | null;
  driverId: number | null;
  driverNote: string;
  itemsCount: number;
  bruttoValue: number;
  totalPpn: number;
  totalPph: number;
  totalServiceFee: number;
  totalAdditionalCost: number;
  totalOtherFee: number;
  totalDriverFee: number;
  vehicle?: DoEkspedisiVehicle | null;
  driver?: DoEkspedisiDriver | null;
  orderList?: DoEkspedisiOrderList | null;
  items?: DoEkspedisiItem[];
  createdAt?: string;
  updatedAt?: string;
  status: string;
  ujNominal: number;
}

export interface DoEkspedisiListParams {
  search?: string;
  order_by?: string;
  order_sort?: 'asc' | 'desc';
  do_order_list_id?: number | string;
}

export interface DoEkspedisiItemListParams {
  order_by?: string;
  order_sort?: 'asc' | 'desc';
  loading_in?: string;
  loading_out?: string;
  destination?: string;
  do_expedition_id?: number | string;
  customer_id?: number | string;
}

export interface DoEkspedisiItemDestinationListParams {
  order_by?: string;
  order_sort?: 'asc' | 'desc';
  destination?: string;
  do_expedition_item_id?: number | string;
}

export interface DoEkspedisiPayload {
  date: string;
  vehicle_id: string | number;
  driver_id: string | number;
  driver_note?: string;
  status?: string;
}

export interface DoEkspedisiItemPayload {
  do_expedition_id: string | number;
  customer_id: string | number;
  loading_in: string;
  loading_out: string;
  destination: string;
  invoice_fee: number | string;
  additional_cost_fee: number | string;
  other_fee: number | string;
  driver_fee: number | string;
  driver_note: string;
  maps_url: string;
}

export interface DoEkspedisiItemDestinationPayload {
  destination: string;
  driver_note: string;
  order_number: number | string;
  do_expedition_item_id: number | string;
  maps_url: string;
}

export interface LookupOption {
  id: number;
  label: string;
  subtitle?: string;
}

export type DoEkspedisiListResponse = PaginatedResult<DoEkspedisi>;
export type DoEkspedisiItemListResponse = PaginatedResult<DoEkspedisiItem>;
export type DoEkspedisiItemDestinationListResponse = PaginatedResult<DoEkspedisiItemDestination>;
