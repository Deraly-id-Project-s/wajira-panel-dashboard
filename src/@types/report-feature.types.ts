export interface ReportDateFilters {
  created_at?: string;
  start_date?: string;
  end_date?: string;
  target_start_date?: string;
  target_end_date?: string;
}

export interface ReportPaginationResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string | null;
  from: number | null;
  last_page: number;
  last_page_url: string | null;
  next_page_url: string | null;
  path: string | null;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface ReportExpeditionItem {
  id: number;
  uuid: string | null;
  do_expedition_code: string | null;
  order_list_id: number | null;
  order_list_code: string | null;
  company_id: number | null;
  customer_id: number | null;
  customer_code: string | null;
  customer_name: string | null;
  driver_id: number | null;
  driver_code: string | null;
  driver_name: string | null;
  vehicle_id: number | null;
  vehicle_registration_number: string | null;
  vehicle_type: string | null;
  delivery_destination: string | null;
  status: string | null;
  target_start_date: string | null;
  target_end_date: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
  total_item_qty: number | null;
  load_contents: string[];
  invoice_fee: number | null;
  uj_nominal_before_claim: number | null;
  claim_deduction_nominal: number | null;
  cash_advance_deduction_nominal: number | null;
  uj_nominal_after_claim: number | null;
  expense_nominal: number | null;
  is_paid: boolean | null;
  uj_payment_status: string | null;
  uj_payment_amount: number | null;
  uj_payment_cash: string | null;
}

export interface ReportOrderListItem {
  id: number;
  uuid: string | null;
  order_list_code: string | null;
  company_id: number | null;
  customer_id: number | null;
  customer_code: string | null;
  customer_name: string | null;
  status: string | null;
  description: string | null;
  created_at: string | null;
  total_tarif: number | null;
  total_expedition: number | null;
  total_done_expedition: number | null;
  total_process_expedition: number | null;
  total_item_qty: number | null;
  drivers: string[];
  drivers_text: string | null;
  vehicles: string[];
  vehicles_text: string | null;
  vehicle_types: string[];
  delivery_destinations: string[];
  delivery_destinations_text: string | null;
  bill_invoice: number | null;
  ppn: number | null;
  pph: number | null;
  invoice_code: string | null;
  invoice_date: string | null;
  invoice_nominal: number | null;
  invoice_paid_nominal: number | null;
  invoice_remaining_nominal: number | null;
  is_invoice_paid: boolean | null;
  invoice_payment_status: string | null;
  uj_driver: number | null;
}

export interface ReportCashAdvanceItem {
  id: number;
  uuid: string | null;
  claim_date: string | null;
  created_at: string | null;
  driver_id: number | null;
  driver_code: string | null;
  driver_name: string | null;
  do_expedition_id: number | null;
  do_expedition_code: string | null;
  do_expedition_status: string | null;
  vehicle_registration_number: string | null;
  driver_cash_advance_id: number | null;
  cash_advance_subject: string | null;
  cash_advance_description: string | null;
  cash_advance_nominal: number | null;
  cash_advance_claim_nominal: number | null;
  cash_advance_approve_nominal: number | null;
  claim_nominal: number | null;
  paid_nominal: number | null;
  remaining_payment: number | null;
  is_paid: boolean | null;
  payment_status: string | null;
  is_approve: boolean | null;
  is_claim: boolean | null;
  claim_status: string | null;
  payment_type: string | null;
}

export interface ReportExpeditionClaimItem {
  id: number;
  uuid: string | null;
  claim_date: string | null;
  created_at: string | null;
  driver_id: number | null;
  driver_code: string | null;
  driver_name: string | null;
  do_expedition_claim_id: number | null;
  claim_subject: string | null;
  claim_description: string | null;
  claim_nominal: number | null;
  claim_remaining_nominal: number | null;
  claim_status: string | null;
  source_do_expedition_id: number | null;
  source_do_expedition_code: string | null;
  source_do_expedition_status: string | null;
  source_vehicle_registration_number: string | null;
  target_do_expedition_id: number | null;
  target_do_expedition_code: string | null;
  target_do_expedition_status: string | null;
  target_vehicle_registration_number: string | null;
  uj_nominal_before_claim: number | null;
  uj_nominal_after_claim: number | null;
  applied_nominal: number | null;
  payment_type: string | null;
  is_paid: boolean | null;
  uj_payment_status: string | null;
  uj_payment_amount: number | null;
  uj_payment_cash: string | null;
}

export interface ReportInvoiceItem {
  id: number;
  uuid: string | null;
  invoice_code: string | null;
  invoice_date: string | null;
  order_list_id: number | null;
  order_list_code: string | null;
  company_id: number | null;
  customer_id: number | null;
  customer_code: string | null;
  customer_name: string | null;
  subject: string | null;
  description: string | null;
  bill_invoice: number | null;
  ppn: number | null;
  other_fee: number | null;
  additional_fee: number | null;
  invoice_nominal: number | null;
  paid_nominal: number | null;
  remaining_payment: number | null;
  is_paid: boolean | null;
  payment_status: string | null;
  is_already_print: boolean | null;
  print_status: string | null;
  created_at: string | null;
}
