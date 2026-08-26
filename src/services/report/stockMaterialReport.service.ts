import { apiClient } from '@/lib/api/client';
import { ReportPaginationResponse } from '@/types/jumlah-daftar-report.types';

export interface MaterialReportMaterial {
  id: number;
  code: string | null;
  name: string | null;
  type: string | null;
}

export interface MaterialReportGoodsTransaction {
  id: number;
  code: string | null;
  transaction_date: string | null;
  type: 'receipt' | 'issue' | string | null;
  total_brutto: number | null;
}

export interface MaterialStockReportItem {
  uuid: string | null;
  qty: number | null;
  type: string | null;
  description: string | null;
  current_stock: number | null;
  total: number | null;
  goods_transaction: MaterialReportGoodsTransaction | null;
  material: MaterialReportMaterial | null;
}

export interface StockMaterialReportParams {
  company_id?: number;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
  code?: string;
  name?: string;
  in_stock?: boolean;
}

export const getStockPerlengkapanReport = async (
  params?: StockMaterialReportParams
): Promise<ReportPaginationResponse<MaterialStockReportItem>> => {
  const response = await apiClient.get('/wapi/report/receipt-material', { params });
  return response.data;
};

export const getPenerimaanBarangReport = async (
  params?: StockMaterialReportParams
): Promise<ReportPaginationResponse<MaterialStockReportItem>> => {
  const response = await apiClient.get('/wapi/report/issue-material', { params });
  return response.data;
};

export const getPengeluaranBarangReport = async (
  params?: StockMaterialReportParams
): Promise<ReportPaginationResponse<MaterialStockReportItem>> => {
  const response = await apiClient.get('/wapi/warehouse/goods-transaction-stock-material', { params });
  return response.data;
};
