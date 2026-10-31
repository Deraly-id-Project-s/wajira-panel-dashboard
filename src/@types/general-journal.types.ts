export interface MasterCash {
  id: number;
  uuid?: string;
  cash_name?: string;
  name?: string;
  code: string;
  type?: string;
  currency_type?: 'idr' | 'usd' | string;
}

export interface MasterAccount {
  id: number;
  uuid?: string;
  name: string;
  code: string;
  type?: string;
}

export interface GeneralJournalBillingCash {
  id?: number;
  general_journal_billing_id?: number;
  cash_id: number;
  amount: number | string;
  type?: 'debit' | 'credit' | 'debet' | 'kredit';
  created_at?: string;
  updated_at?: string;
  cash?: MasterCash;
}

export interface GeneralJournalBillingPayment {
  id?: number;
  general_journal_billing_id: number;
  account_id: number;
  amount: number | string;
  amount_original?: number | string;
  note?: string | null;
  transaction_proof?: string | null;
  created_at?: string;
  updated_at?: string;
  account?: MasterAccount;
  billing?: GeneralJournalBilling;
}

export interface GeneralJournalBilling {
  id?: number;
  uuid?: string;
  general_journal_id?: number;
  date?: string | null;
  note?: string | null;
  is_paid?: boolean;
  is_valid?: boolean;
  total_amount?: number;
  total_paid?: number;
  remaining_amount?: number;
  cashes?: GeneralJournalBillingCash[];
  payments?: GeneralJournalBillingPayment[];
  created_at?: string;
  updated_at?: string;
}

export interface GeneralJournal {
  id: number;
  uuid?: string;
  company_id: number;
  code: string;
  date: string;
  note: string | null;
  payment_proof: string | null;
  amount: number | string;
  amount_original?: number | string | null;
  is_usd_transaction?: boolean;
  is_paid: boolean;
  is_valid: boolean;
  total_amount?: number;
  total_paid?: number;
  remaining_amount?: number;
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  company?: {
    id: number;
    uuid?: string;
    slug?: string;
    name?: string;
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
  amount?: number;
  amount_original?: number;
  is_usd_transaction?: boolean;
  total_debit: number;
  total_credit: number;
  total_amount?: number;
  total_paid?: number;
  remaining_amount?: number;
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
  is_usd_transaction?: boolean | string;
  min_amount?: number | string;
  max_amount?: number | string;
  date?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface GeneralJournalCashPayload {
  id?: number;
  cash_id: number;
  amount: number;
  type?: 'debit' | 'credit' | 'debet' | 'kredit';
}

export interface GeneralJournalBillingPayload {
  id?: number;
  date?: string;
  note?: string | null;
  cashes: GeneralJournalCashPayload[];
}

export interface GeneralJournalPayload {
  company_id: number;
  date: string;
  type?: 'debit' | 'credit' | 'debet' | 'kredit';
  note?: string | null;
  payment_proof?: File | null;
  amount?: number | null;
  amount_original?: number | null;
  is_usd_transaction?: boolean;
  billings?: GeneralJournalBillingPayload[];
}

export interface GeneralJournalBillingPaymentPayload {
  general_journal_billing_id: number;
  account_id: number;
  amount: number;
  amount_original?: number;
  note?: string | null;
  transaction_proof?: File | null;
}

export interface GeneralJournalBillingPaymentUpdatePayload {
  account_id?: number;
  amount?: number;
  amount_original?: number;
  note?: string | null;
  transaction_proof?: File | null;
}
