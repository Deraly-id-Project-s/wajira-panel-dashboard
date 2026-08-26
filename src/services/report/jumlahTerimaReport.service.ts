import { apiClient } from '@/lib/api/client';
import {
  BpkbReportItem,
  StnkReportItem,
  SkpdReportItem,
  TnkbReportItem,
  ReportPaginationResponse,
} from '@/types/jumlah-daftar-report.types';

export interface JumlahTerimaReportParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

export const getBpkbReceiptReport = async (
  params?: JumlahTerimaReportParams
): Promise<ReportPaginationResponse<BpkbReportItem>> => {
  const response = await apiClient.get('/wapi/report/bpkb-receipt', { params });
  return response.data;
};

export const getStnkReceiptReport = async (
  params?: JumlahTerimaReportParams
): Promise<ReportPaginationResponse<StnkReportItem>> => {
  const response = await apiClient.get('/wapi/report/stnk-receipt', { params });
  return response.data;
};

export const getSkpdReceiptReport = async (
  params?: JumlahTerimaReportParams
): Promise<ReportPaginationResponse<SkpdReportItem>> => {
  const response = await apiClient.get('/wapi/report/skpd-receipt', { params });
  return response.data;
};

export const getTnkbReceiptReport = async (
  params?: JumlahTerimaReportParams
): Promise<ReportPaginationResponse<TnkbReportItem>> => {
  const response = await apiClient.get('/wapi/report/tnkb-receipt', { params });
  return response.data;
};
