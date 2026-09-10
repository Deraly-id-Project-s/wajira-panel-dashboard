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
  description: string;
  status: string;
  customer?: DoEkspedisiCustomer | null;
  customerName: string;
  loadingIn: string;
  loadingOut: string;
  destination: string;
  loadContent: string;
  qty: number;
  tarifs: DoEkspedisiOrderTarifItem[];
  vehicleType?: string;
  billInvoice: number;
  ppn: number;
  pph: number;
  ujDriver: number;
  ujTowing: number | null;
  ujCdd: number | null;
  ujFuso: number | null;
  invTowing: number | null;
  invCdd: number | null;
  invFuso: number | null;
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
  address?: string | null;
  phone?: string | null;
  pic?: string | null;
  companyList?: string | null;
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
  ujNominalBeforeClaim: number;
  claimDeductionNominal: number;
  startDate?: string | null;
  endDate?: string | null;
  doOrderListTarifId: number;
  targetStartDate?: string | null;
  targetEndDate?: string | null;
  driverNotes: DoEkspedisiDriverNote[];
  expeditionExpenses: DoEkspedisiExpense[];
  expeditionClaims: DoEkspedisiClaim[];
  driverExpeditionClaims: DoEkspedisiClaimApplication[];
}

export interface DoEkspedisiDriverNote {
  id: number;
  uuid?: string;
  doExpeditionsId: number;
  effectiveDate: string;
  subject: string;
  image?: string | null;
  description: string;
}

export interface DoEkspedisiExpense {
  id: number;
  uuid?: string;
  doExpeditionsId: number;
  driverId?: number | null;
  subject: string;
  description: string;
  nominal: number;
}

export interface DoEkspedisiClaim {
  id: number;
  uuid?: string;
  doExpeditionsId: number;
  driverId: number;
  subject: string;
  description: string;
  isClaim: boolean;
  claimNominal: number;
  nominal: number;
  remainingNominal: number;
  appliedNominal: number;
  sourceExpeditionCode?: string;
  documentations: DoEkspedisiClaimDocumentation[];
}

export interface DoEkspedisiClaimPayload {
  do_expeditions_id: number | string;
  driver_id: number | string;
  subject: string;
  description: string;
  claim_nominal: number | string;
}

export interface DoEkspedisiClaimDocumentationPayload {
  do_expedition_claim_id: number | string;
  caption?: string | null;
  image: File;
}

export interface DoEkspedisiClaimApplication {
  id: number;
  uuid?: string;
  doExpeditionId: number;
  doExpeditionClaimId: number;
  driverId: number;
  nominal: number;
  type: 'cash' | 'transfer';
  date: string;
  claim?: DoEkspedisiClaim | null;
}

export interface ApplyExpeditionClaimPayload {
  do_expedition_claim_id: number;
  do_expedition_id: number;
  driver_id: number;
  nominal: number;
  type: 'cash' | 'transfer';
  date: string;
}

export interface DoEkspedisiClaimDocumentation {
  id: number;
  uuid?: string;
  doExpeditionClaimId: number;
  image?: string | null;
  caption: string;
}

export interface DoEkspedisiListParams {
  search?: string;
  order_by?: string;
  order_sort?: 'asc' | 'desc';
  do_order_list_id?: number | string;
  start_date?: string;
  end_date?: string;
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
  date?: string;
  vehicle_id?: string | number;
  driver_id?: string | number;
  driver_note?: string;
  status?: string;
  start_date?: string | null;
  end_date?: string | null;
  do_order_list_tarif_id?: number;
  uj_nominal?: number;
  target_start_date?: string | null;
  target_end_date?: string | null;
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

export interface DoEkspedisiDocumentation {
  id: number;
  uuid?: string;
  doExpeditionId: number;
  documentationPosition: string;
  subject: string;
  description: string | null;
  image: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoEkspedisiDocumentationListParams {
  do_expedition_id?: number | string;
  documentation_position?: string;
  subject?: string;
  description?: string;
  uuid?: string;
  search?: string;
  order_by?: string;
  order_sort?: 'asc' | 'desc';
}

export type DoEkspedisiDocumentationListResponse = PaginatedResult<DoEkspedisiDocumentation>;
