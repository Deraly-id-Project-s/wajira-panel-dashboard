import { apiClient } from '@/lib/api/client';
import { ReportPaginationResponse } from '@/types/jumlah-daftar-report.types';

export interface DoExpeditionVehicle {
  id: number;
  uuid: string | null;
  registration_number: string | null;
  type: string | null;
  machine_number?: string | null;
  chassis_number?: string | null;
  stnk_age?: string | null;
  kir_age?: string | null;
  stnk_number?: string | null;
  kir_book?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DoExpeditionDriver {
  id: number;
  uuid: string | null;
  code?: string | null;
  type?: string | null;
  name: string | null;
}

export interface DoExpeditionCustomer {
  id: number;
  uuid: string | null;
  code?: string | null;
  type?: string | null;
  name: string | null;
}

export interface DoExpeditionTarifPivot {
  do_orderlist_id: number | null;
  tarif_id: number | null;
  uuid: string | null;
  delivery_destination: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DoExpeditionTarif {
  id: number;
  uuid: string | null;
  loading_in: string | null;
  loading_out: string | null;
  distance: number | null;
  is_active: number | boolean | null;
  pivot?: DoExpeditionTarifPivot | null;
  uj_driver?: number | null;
  other_fee?: number | null;
  bill_invoice?: number | null;
  additional_cost_fee?: number | null;
  ppn?: number | null;
  load_content?: string | null;
  delivery_destination?: string | null;
}

export interface DoExpeditionOrderList {
  id: number;
  uuid: string | null;
  code: string | null;
  customer_id: number | null;
  status?: string | null;
  vehicle_type: string | null;
  bill_invoice?: number | null;
  ppn?: number | null;
  uj_driver: number | null;
  loading_in: string | null;
  loading_out: string | null;
  do_delivery_destination: string | null;
  customer: DoExpeditionCustomer | null;
  tarifs?: DoExpeditionTarif[];
  do_order_list_tarifs?: unknown[];
}

export interface DoExpeditionItem {
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
  vehicle: DoExpeditionVehicle | null;
  driver: DoExpeditionDriver | null;
  order_list: DoExpeditionOrderList | null;
  uj_driver_billing_payment: unknown | null;
}

export interface ExpeditionReportParams {
  page?: number;
  per_page?: number;
  search?: string;
  order_by?: string;
  order_sort?: 'asc' | 'desc';
  do_order_list_id?: number;
}

export const getExpeditionReport = async (
  params?: ExpeditionReportParams
): Promise<ReportPaginationResponse<DoExpeditionItem>> => {
  const response = await apiClient.get('/wapi/transaction/do-expedition', { params });
  return response.data;
};

export const getExpeditionReportDetail = async (
  doExpeditionId: number | string
): Promise<{ status: boolean; message: string; errors: unknown; data: DoExpeditionItem }> => {
  const response = await apiClient.get(`/wapi/transaction/do-expedition/${doExpeditionId}`);
  return response.data;
};
