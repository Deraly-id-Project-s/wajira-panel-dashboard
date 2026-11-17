import type { JournalReportParams } from './journal-report.types';

export interface BalanceColumnPair {
  debit: number;
  kredit: number;
  credit?: number;
}

export interface BalanceColumnReportItem {
  id: number;
  uuid: string | null;

  // New structured fields per accounting worksheet
  kode_akun?: string;
  nama_akun?: string;
  kelompok_akun?: string | null;
  pos_akun?: 'NRC' | 'LR' | string | null;
  saldo_normal?: 'DB' | 'KR' | string;
  saldo_akun?: number;
  saldo_awal?: BalanceColumnPair;
  pergerakan?: BalanceColumnPair;
  saldo_akhir?: BalanceColumnPair;
  laba_rugi?: BalanceColumnPair;
  neraca?: BalanceColumnPair;

  // Backward compatibility fields
  account_group?: string | null;
  account_group_code?: string | null;
  account_group_name?: string | null;
  account_code?: string | null;
  account_name?: string | null;
  normal_balance?: string | null;
  pos_code?: string | null;
  type?: string | null;
  amount?: number;
  opening_balance?: number | null;
  debit?: number | null;
  credit?: number | null;
  ending_balance?: number | null;
  total?: number | null;
}

export interface BalanceColumnReportPagination {
  current_page: number;
  data: BalanceColumnReportItem[];
  first_page_url?: string;
  from: number | null;
  last_page: number;
  next_page_url?: string | null;
  path?: string;
  per_page: number;
  prev_page_url?: string | null;
  to: number | null;
  total: number;
}

export interface BalanceColumnReportResponse {
  status: boolean;
  message: string;
  errors?: unknown;
  data: BalanceColumnReportPagination;
}

export interface BalanceColumnReportParams extends Partial<JournalReportParams> {
  company_id?: number | string | null;
  page?: number;
  per_page?: number;
  start_date?: string | null;
  end_date?: string | null;
  date?: string | null;
  payment_at?: string | null;
  month?: number | string | null;
  year?: number | string | null;
  pos_code?: 'NRC' | 'LR' | string | null;
  account_id?: number | null;
  account_code?: string | null;
  account_name?: string | null;
  account_group_id?: number | null;
  search?: string | null;
  transaction_filter?: 'accounts' | 'account_with_transactions' | string | null;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
