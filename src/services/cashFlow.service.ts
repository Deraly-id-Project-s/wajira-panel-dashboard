import { apiClient } from '@/lib/api/client';

export interface CashFlowQueryParams {
  page?: number;
  per_page?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
  sort_by?: string;
  sort_direction?: string;
  company_id?: number;
}

export interface CashFlowItem {
  id: number;
  code: string;
  date: string;
  note: string;
  debet: number;
  debet_usd: number;
  debet_original: number;
  debet_usd_original: number;
  credit: number;
  credit_usd: number;
  credit_original: number;
  credit_usd_original: number;
  cash: { description: string };
}

export interface CashFlowResponse {
  current_page: number;
  data: CashFlowItem[];
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export const cashFlowService = {
  async getCashFlow(params: CashFlowQueryParams = {}): Promise<CashFlowResponse> {
    const response = await apiClient.get('/wapi/finance/cash-flow', { params });
    return response.data.data;
  },
};
