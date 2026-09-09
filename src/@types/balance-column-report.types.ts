import type { JournalReportParams } from './journal-report.types';
export interface BalanceColumnReportItem {
  id: number;
  uuid: string | null;
  account_group: string | null;
  account_group_code: string | null;
  account_group_name: string | null;
  account_code: string | null;
  account_name: string | null;
  normal_balance: string | null;
  opening_balance: number | null;
  debit: number | null;
  credit: number | null;
  debit_usd: number | null;
  credit_usd: number | null;
  ending_balance: number | null;
  total: number | null;
}

export interface BalanceColumnReportPagination {
  current_page: number;
  data: BalanceColumnReportItem[];
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export interface BalanceColumnReportResponse {
  status: boolean;
  message: string;
  errors: unknown;
  data: BalanceColumnReportPagination;
}

export type BalanceColumnReportParams = JournalReportParams;
