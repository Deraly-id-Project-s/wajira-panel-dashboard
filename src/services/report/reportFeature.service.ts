import { apiClient } from '@/lib/api/client';
import {
  ReportDateFilters,
  ReportPaginationResponse,
  ReportExpeditionItem,
  ReportOrderListItem,
  ReportCashAdvanceItem,
  ReportExpeditionClaimItem,
  ReportInvoiceItem,
} from '@/@types/report-feature.types';

export interface BaseReportParams extends ReportDateFilters {
  page?: number;
  per_page?: number;
  search?: string;
  order_by?: string;
  order_sort?: 'asc' | 'desc';
}

export const getExpeditionReportFeature = async (
  params?: BaseReportParams
): Promise<ReportPaginationResponse<ReportExpeditionItem>> => {
  const response = await apiClient.get('/wapi/report/expedition-report', { params });
  return response.data?.data || response.data;
};

export const getOrderListReportFeature = async (
  params?: BaseReportParams
): Promise<ReportPaginationResponse<ReportOrderListItem>> => {
  const response = await apiClient.get('/wapi/report/order-list-report', { params });
  return response.data?.data || response.data;
};

export const getCashAdvanceReportFeature = async (
  params?: BaseReportParams
): Promise<ReportPaginationResponse<ReportCashAdvanceItem>> => {
  const response = await apiClient.get('/wapi/report/cash-advance-report', { params });
  return response.data?.data || response.data;
};

export const getExpeditionClaimReportFeature = async (
  params?: BaseReportParams
): Promise<ReportPaginationResponse<ReportExpeditionClaimItem>> => {
  const response = await apiClient.get('/wapi/report/expedition-claim-report', { params });
  return response.data?.data || response.data;
};

export const getInvoiceReportFeature = async (
  params?: BaseReportParams
): Promise<ReportPaginationResponse<ReportInvoiceItem>> => {
  const response = await apiClient.get('/wapi/report/invoice-report', { params });
  return response.data?.data || response.data;
};
