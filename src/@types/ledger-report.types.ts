import type { JournalReportAccount, JournalReportCashFlow, JournalReportParams } from './journal-report.types';

export interface LedgerReportItem {
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
  cash_position_before: number | null;
  cash_position_after: number | null;
  created_at: string | null;
  debit: number | null;
  credit: number | null;
  debit_usd: number | null;
  credit_usd: number | null;
  account: JournalReportAccount | null;
  cash_flow: (JournalReportCashFlow & {
    is_paid?: boolean | null;
    is_valid?: boolean | null;
  }) | null;
}

export interface LedgerReportRecords {
  current_page: number;
  data: LedgerReportItem[];
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export interface LedgerReportSummary {
  opening_balance: number | null;
  ending_balance: number | null;
  opening_balance_usd: number | null;
  ending_balance_usd: number | null;
}

export interface LedgerReportPayload {
  records: LedgerReportRecords;
  summary: LedgerReportSummary;
}

export interface LedgerReportResponse {
  status: boolean;
  message: string;
  errors: unknown;
  data: LedgerReportPayload;
}

export interface LedgerReportParams extends JournalReportParams {
  account_id?: string | number | null;
}
