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

export interface CashFlowUnitTransaction {
  id: number;
  code?: string;
  dpp_total: number;
  ppn_total: number;
  expedition_total: number;
  bbn_price_total: number;
  other_fee_total: number;
  has_warehouse_activity: boolean;
  has_refund_transaction: boolean;
  expedition_fee_total: number;
}

export interface CashFlowUnitTransactionBilling {
  id: number;
  uuid?: string;
  unit_transaction_id: number;
  grand_total: number;
  last_payment_at?: string;
  is_paid: boolean;
  created_at?: string;
  updated_at?: string;
  unit_transaction?: CashFlowUnitTransaction | null;
}

export interface CashFlowItem {
  id: number;
  uuid?: string;
  company_id?: number;
  unit_transaction_billing_id?: number | null;
  sparepart_transaction_billing_id?: number | null;
  goods_transaction_billing_id?: number | null;
  driver_cash_advance_billing_id?: number | null;
  do_invoice_billing_id?: number | null;
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
  payment_proof?: string | null;
  is_paid?: boolean;
  is_valid?: boolean;
  created_at?: string;
  updated_at?: string;
  grand_total?: number;
  remaining_payment?: number;
  invoice_number?: string | null;
  cash?: { description: string };
  company?: {
    id: number;
    uuid?: string;
    name: string;
  };
  finance_billings?: any[];
  unit_transaction_billing?: CashFlowUnitTransactionBilling | null;
  goods_transaction_billing?: any;
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
  async getCashFlowDetail(id: number | string): Promise<CashFlowItem> {
    const response = await apiClient.get(`/wapi/finance/cash-flow/${id}`);
    return response.data.data;
  },
};
