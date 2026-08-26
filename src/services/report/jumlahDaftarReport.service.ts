import { apiClient } from '@/lib/api/client';
import {
  BpkbReportItem,
  StnkReportItem,
  SkpdReportItem,
  TnkbReportItem,
  ReportPaginationResponse,
} from '@/types/jumlah-daftar-report.types';

export interface JumlahDaftarReportParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

export const getBpkbReport = async (
  params?: JumlahDaftarReportParams
): Promise<ReportPaginationResponse<BpkbReportItem>> => {
  const response = await apiClient.get('/wapi/report/bpkb-report', { params });
  return response.data;
};

export const getStnkReport = async (
  params?: JumlahDaftarReportParams
): Promise<ReportPaginationResponse<StnkReportItem>> => {
  const response = await apiClient.get('/wapi/report/stnk-report', { params });
  return response.data;
};

export const getSkpdReport = async (
  params?: JumlahDaftarReportParams
): Promise<ReportPaginationResponse<SkpdReportItem>> => {
  const response = await apiClient.get('/wapi/report/skpd-report', { params });
  return response.data;
};

export const getTnkbReport = async (
  params?: JumlahDaftarReportParams
): Promise<ReportPaginationResponse<TnkbReportItem>> => {
  const response = await apiClient.get('/wapi/report/tnkb-report', { params });
  return response.data;
};
