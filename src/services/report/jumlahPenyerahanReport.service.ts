import { apiClient } from '@/lib/api/client';
import { ReportPaginationResponse } from '@/types/jumlah-daftar-report.types';

export interface HandoverReportItem {
  id: number;
  uuid: string;
  process_date: string | null;
  customer_delivery_date: string | null;
  bpkb_number: string | null;
  bpkb_registration_date: string | null;
  bpkb_received_date: string | null;
  stnk_registration_date: string | null;
  stnk_received_date: string | null;
  skpd_payment_date: string | null;
  skpd_received_date: string | null;
  tnkb_received_date: string | null;
  tnkb_number: string | null;
  created_at: string | null;
  updated_at: string | null;
  
  // Flat fallback fields
  stnk_name?: string | null;
  region?: string | null;
  dealer?: string | null;
  vehicle_type?: string | null;
  chassis_number?: string | null;
  machine_number?: string | null;

  // Nested object structures
  vendor?: string | {
    id: number;
    name: string;
    code: string;
  } | null;
  vehicle_data?: {
    id: number;
    uuid: string;
    dealer_id: number;
    region_id: number;
    chassis_number: string | null;
    machine_number: string | null;
    stnk_name: string | null;
    motorcycle_brand: string | null;
    motorcycle_type: string | null;
    region?: { name: string } | null;
    dealer?: { name: string } | null;
  } | null;
}

export interface JumlahPenyerahanReportParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

export const getHandoverReport = async (
  params?: JumlahPenyerahanReportParams
): Promise<ReportPaginationResponse<HandoverReportItem>> => {
  const response = await apiClient.get('/wapi/report/receipt-report', { params });
  return response.data;
};
