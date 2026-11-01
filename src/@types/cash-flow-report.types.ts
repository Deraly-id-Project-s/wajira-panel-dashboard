export interface CashFlowReportItem {
  id: number;
  uuid?: string;
  tanggal: string | null;
  nota_ref: string;
  keterangan: string | null;
  debit_cash_idr: number;
  kredit_cash_idr: number;
  debit_bank_idr: number;
  kredit_bank_idr: number;
  debit_bank_usd: number;
  kredit_bank_usd: number;
  // Aliases provided by backend
  'DEBIT (CASH IDR)'?: number;
  'KREDIT (CASH IDR)'?: number;
  'DEBIT (BANK IDR)'?: number;
  'KREDIT (BANK IDR)'?: number;
  'DEBIT (BANK USD)'?: number;
  'KREDIT (BANK USD)'?: number;
}

export interface CashFlowReportPagination {
  current_page: number;
  data: CashFlowReportItem[];
  first_page_url?: string;
  from: number | null;
  last_page: number;
  last_page_url?: string;
  next_page_url?: string | null;
  path?: string;
  per_page: number;
  prev_page_url?: string | null;
  to: number | null;
  total: number;
}

export interface CashFlowReportResponse {
  status: boolean;
  message: string;
  errors: unknown;
  data: CashFlowReportPagination;
}

export interface CashFlowReportParams {
  company_id?: string | number | null;
  page?: number;
  per_page?: number;
  date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  month?: string | number | null;
  year?: number | null;
  search?: string | null;
  is_paid?: boolean;
  is_valid?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
