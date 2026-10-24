export interface GeneralJournalBilling {
  id?: number;
  uuid?: string;
  general_journal_id?: number;
  account_id: number;
  type: 'debet' | 'credit';
  amount: number;
  amount_original?: number;
  payment_proof?: string | null;
  payment_at?: string;
  note?: string | null;
  account?: {
    id: number;
    uuid?: string;
    name: string;
    code: string;
    type?: string;
  };
}

export interface GeneralJournal {
  id: number;
  uuid?: string;
  company_id: number;
  code: string;
  date: string;
  note: string | null;
  payment_proof: string | null;
  is_paid: boolean;
  is_valid: boolean;
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  company?: {
    id: number;
    uuid?: string;
    name: string;
  };
  billings: GeneralJournalBilling[];
  created_at?: string;
  updated_at?: string;
}

export interface GeneralJournalListItem {
  id: number;
  uuid?: string;
  code: string;
  date: string;
  note: string;
  is_paid: boolean;
  is_valid: boolean;
  is_balanced: boolean;
  total_debit: number;
  total_credit: number;
  billingsCount: number;
  companyName: string;
  created_at?: string;
}

export interface GeneralJournalFilterParams {
  page?: number;
  per_page?: number;
  search?: string;
  company_id?: number | string;
  is_paid?: boolean | string;
  is_valid?: boolean | string;
  date?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface GeneralJournalPayload {
  company_id: number;
  date: string;
  note?: string | null;
  payment_proof?: File | null;
  billings?: Array<{
    id?: number;
    account_id: number;
    type: 'debet' | 'credit';
    amount: number;
    amount_original?: number;
    payment_at?: string;
    note?: string | null;
  }>;
}
