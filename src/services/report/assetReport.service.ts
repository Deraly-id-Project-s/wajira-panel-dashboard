import { apiClient } from '@/lib/api/client';
import { ReportPaginationResponse } from '@/types/jumlah-daftar-report.types';

export interface FinanceAssetDetail {
  id: number;
  code: string | null;
  serial_number: string | null;
  name: string | null;
  type: string | null;
  purchase_date: string | null;
  price: number | null;
}

export interface FinanceAssetReportItem {
  id: number;
  uuid: string | null;
  asset_id: number | null;
  economic_age: number | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
  depreciation_per_month: number | null;
  months_used: number | null;
  difference: number | null;
  final_value: number | null;
  asset: FinanceAssetDetail | null;
}

export interface AssetReportParams {
  company_id?: number;
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const getAssetReport = async (
  params?: AssetReportParams
): Promise<ReportPaginationResponse<FinanceAssetReportItem>> => {
  const response = await apiClient.get('/wapi/finance/finance-asset', { params });
  return response.data;
};
