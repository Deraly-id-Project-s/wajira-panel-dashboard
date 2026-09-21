export interface JournalReportAccount {
  id: number;
  code: string | null;
  name: string | null;
}

export interface JournalReportCashFlow {
  id: number;
  company_id: number | null;
  code: string | null;
  note: string | null;
  debet: number | null;
  debit?: number | null;
  debet_usd?: number | null;
  debit_usd?: number | null;
  credit: number | null;
  credit_usd?: number | null;
  remaining_payment: number | null;
}

export interface JournalReportItem {
  id: number;
  uuid: string | null;
  cash_flow_id: number | null;
  cash_id: number | null;
  account_id: number | null;
  amount: number | null;
  amount_original: number | null;
  payment_at: string | null;
  note: string | null;
  is_usd_payment: boolean | null;
  created_at: string | null;
  debit: number | null;
  credit: number | null;
  debit_usd: number | null;
  credit_usd: number | null;
  account: JournalReportAccount | null;
  cash_flow: JournalReportCashFlow | null;
}

export interface JournalReportPagination {
  current_page: number;
  data: JournalReportItem[];
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export interface JournalReportResponse {
  status: boolean;
  message: string;
  errors: unknown;
  data: JournalReportPagination;
}

export interface JournalReportParams {
  company_id?: string | number | null;
  page?: number;
  per_page?: number;
  date?: string | null;
  payment_at?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  account_id?: string | number | null;
  account_name?: string | null;
  account_code?: string | null;
  search?: string | null;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
