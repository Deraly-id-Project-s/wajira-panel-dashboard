import { apiClient } from '@/lib/api/client';
import { ReportPaginationResponse } from '@/types/jumlah-daftar-report.types';

export interface VehicleEquipmentReportItem {
  id?: number;
  uuid: string | null;
  qty: number | null;
  type: string | null;
  description: string | null;
  current_stock?: number | null;
  total_stock?: number | null;
  total: number | null;
  goods_transaction?: {
    id: number;
    code: string | null;
    transaction_date: string | null;
    type: "receipt" | "issue" | string | null;
    total_brutto: number | null;
    location?: string | null;
    vehicle_fleet?: {
      id: number;
      registration_number: string | null;
      type?: string | null;
    } | null;
    vehicle?: {
      id: number;
      registration_number: string | null;
      type?: string | null;
    } | null;
    driver?: {
      id: number;
      name: string | null;
    } | null;
  } | null;
  vehicle_equipment?: {
    id: number;
    code: string | null;
    name: string | null;
  } | null;
  vehicle_fleet?: {
    id: number;
    registration_number: string | null;
    type?: string | null;
  } | null;
  driver?: {
    id: number;
    name: string | null;
  } | null;

  // Additional dynamic/fallback properties for stock endpoint response
  code?: string | null;
  name?: string | null;
  armada?: string | null;
  location?: string | null;
}

export interface StockPerlengkapanReportParams {
  company_id?: number;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
  code?: string;
  name?: string;
  in_stock?: boolean | string;
}

export const getStockPerlengkapanReport = async (
  params?: StockPerlengkapanReportParams
): Promise<ReportPaginationResponse<VehicleEquipmentReportItem>> => {
  const response = await apiClient.get('/wapi/warehouse/goods-transaction-stock', { params });
  return response.data;
};

export const getPenerimaanPerlengkapanReport = async (
  params?: StockPerlengkapanReportParams
): Promise<ReportPaginationResponse<VehicleEquipmentReportItem>> => {
  const response = await apiClient.get('/wapi/report/receipt-vehicle-equipment', { params });
  return response.data;
};

export const getPengeluaranPerlengkapanReport = async (
  params?: StockPerlengkapanReportParams
): Promise<ReportPaginationResponse<VehicleEquipmentReportItem>> => {
  const response = await apiClient.get('/wapi/report/issue-vehicle-equipment', { params });
  return response.data;
};
