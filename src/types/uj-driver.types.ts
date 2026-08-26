export interface UJDriverVehicle {
  id: number;
  uuid: string | null;
  registration_number: string | null;
  type: string | null;
}

export interface UJDriverDriver {
  id: number;
  uuid: string | null;
  name: string | null;
}

export interface UJDriverCustomer {
  id: number;
  uuid: string | null;
  name: string | null;
  type: string | null;
}

export interface UJDriverOrderList {
  id: number;
  uuid: string | null;
  code: string | null;
  vehicle_type: string | null;
  customer_id: number | null;
  uj_driver: number | null;
  loading_in: string | null;
  loading_out: string | null;
  do_delivery_destination: string | null;
  customer: UJDriverCustomer | null;
}

export interface UJDriverBillingPayment {
  id?: number;
  uuid?: string | null;
  amount?: number | null;
  total_paid?: number | null;
  other_amount?: number | null;
  uj_lainnya?: number | null;
  cash_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface UJDriverItem {
  id: number;
  uuid: string | null;
  code: string | null;
  do_order_list_id: number | null;
  vehicle_id: number | null;
  driver_id: number | null;
  date: string | null;
  driver_note: string | null;
  is_printed: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  vehicle: UJDriverVehicle | null;
  driver: UJDriverDriver | null;
  order_list: UJDriverOrderList | null;
  uj_driver_billing_payment: UJDriverBillingPayment | null;
}

export interface CreateUJDriverPaymentPayload {
  do_expedition_id: number;
  cash_id: number;
  amount: number;
}

export interface UJDriverFilterParams {
  search?: string;
  order_by?: string;
  order_sort?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
  do_order_list_id?: number;
  with_driver?: boolean;
}

export interface UJDriverPaginationResponse<T> {
  status: boolean;
  message: string;
  errors: unknown;
  data: {
    current_page: number;
    data: T[];
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
    links?: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    next_page_url?: string | null;
    prev_page_url?: string | null;
  };
}
