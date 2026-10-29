export interface GeneralJournalReportItem {
  id: number;
  uuid?: string;
  general_journal_id: number;
  account_id: number;
  type: 'debet' | 'credit';
  amount: number;
  amount_original?: number;
  debit: number;
  credit: number;
  payment_at: string;
  note?: string | null;
  payment_proof?: string | null;
  account?: {
    id: number;
    uuid?: string;
    name: string;
    code: string;
    type?: string;
  };
  general_journal?: {
    id: number;
    company_id: number;
    code: string;
    note?: string | null;
    date: string;
    is_paid: boolean;
    is_valid: boolean;
    amount?: number | string | null;
    amount_original?: number | string | null;
    is_usd_transaction?: boolean;
  };
}

export interface GeneralJournalReportParams {
  page?: number;
  per_page?: number;
  date?: string | null;
  payment_at?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  company_id?: number | string | null;
  account_id?: number | null;
  account_code?: string | null;
  account_name?: string | null;
  search?: string | null;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface GeneralJournalReportResponse {
  status: boolean;
  message?: string;
  data: {
    current_page: number;
    data: GeneralJournalReportItem[];
    first_page_url?: string;
    from?: number;
    last_page: number;
    last_page_url?: string;
    per_page: number;
    to?: number;
    total: number;
  };
}
