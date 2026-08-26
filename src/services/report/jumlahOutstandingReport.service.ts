import { apiClient } from '@/lib/api/client';
import { ReportPaginationResponse } from '@/types/jumlah-daftar-report.types';

export interface OutstandingVendor {
  id: number;
  name: string | null;
  code: string | null;
  laravel_through_key?: number;
}

export interface OutstandingVehicleData {
  id: number;
  uuid: string | null;
  dealer_id: number | null;
  region_id: number | null;
  invoice_number: string | null;
  invoice_date: string | null;
  invoice_receive_date: string | null;
  vehicle_type: string | null;
  ktp_number: string | null;
  phone_number: string | null;
  occupation: string | null;
  stnk_name: string | null;
  stnk_address: string | null;
  village: string | null;
  district: string | null;
  sub_village: string | null;
  sub_district: string | null;
  regency: string | null;
  postal_code: string | null;
  motorcycle_brand: string | null;
  motorcycle_type: string | null;
  motorcycle_category: string | null;
  motorcycle_model: string | null;
  manufacture_year: number | null;
  engine_capacity: number | null;
  color: string | null;
  price: number | null;
  chassis_number: string | null;
  machine_number: string | null;
  form_ab: string | null;
  pib: string | null;
  tpt_number: string | null;
  sut_number: string | null;
  srut_number: string | null;
  fuel_type: string | null;
  created_at: string | null;
  updated_at: string | null;

  region?: { name: string } | null;
  dealer?: { name: string } | null;
}

export interface OutstandingReportItem {
  id: number;
  uuid: string | null;
  ditlantas_process_id: number | null;
  vehicle_data_id: number | null;
  process_date: string | null;
  is_already_processed: boolean | null;
  is_update_additional_data: boolean | null;
  customer_delivery_date: string | null;

  bpkb_number: string | null;
  bpkb_registration_date: string | null;
  bpkb_received_date: string | null;
  bpkb_physical_status: boolean | null;

  stnk_registration_date: string | null;
  stnk_received_date: string | null;
  stnk_physical_status: boolean | null;

  skpd_payment_date: string | null;
  skpd_received_date: string | null;
  skpd_physical_status: boolean | null;

  tnkb_received_date: string | null;
  tnkb_number: string | null;
  tnkb_physical_status: boolean | null;

  stck_fee: number;
  bbn_registration_fee: number;
  notice_fee: number;
  pmi_fee: number;
  physical_check_fee: number;
  nik_validation_fee: number;
  garwil_fee: number;
  built_up_fee: number;
  acceleration_fee: number;
  plate_recommendation_fee: number;
  service_fee: number;
  skpd_fee: number;
  stamp_fee: number;
  pnbp_bpkb: number;

  created_at: string | null;
  updated_at: string | null;

  vendor: OutstandingVendor | null;
  vehicle_data: OutstandingVehicleData | null;

  // Flat fallback fields
  stnk_name?: string | null;
  region?: string | null;
  dealer?: string | null;
  vehicle_type?: string | null;
  chassis_number?: string | null;
  machine_number?: string | null;
}

export interface JumlahOutstandingReportParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

export const getOutstandingReport = async (
  params?: JumlahOutstandingReportParams
): Promise<ReportPaginationResponse<OutstandingReportItem>> => {
  const response = await apiClient.get('/wapi/report/outstanding-report', { params });
  return response.data;
};
