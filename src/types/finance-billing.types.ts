import type { LaravelPagination, PaginationMeta } from '@/types/pagination.types';

export interface FinanceBillingCash {
  id: number;
  uuid?: string;
  company_id?: number;
  code: string;
  cash_name: string;
}

export interface FinanceBilling {
  id: number;
  uuid?: string;
  cash_flow_id: number;
  cash_id: number;
  account_id: number;
  amount: number;
  amount_original: number;
  payment_proof: string | null;
  payment_at: string;
  note: string;
  created_at?: string;
  updated_at?: string;
  cash: FinanceBillingCash;
}

export interface FinanceBillingPayload {
  cash_flow_id: number;
  cash_id: number;
  account_id: number;
  amount: number;
  amount_original?: number;
  payment_at: string;
  note: string;
  payment_proof?: File | null;
}

export interface FinanceBillingListItem {
  id: number;
  uuid?: string;
  unit_transaction_billing_id: number | null;
  last_payment_at: string;
  is_valid: boolean;
  created_at?: string;
  remaining_payment: number;
  remaining_payment_usd: number;
  unit_transaction_billing: {
    id: number;
    uuid?: string;
    unit_transaction_id: number;
    grand_total: number;
    is_paid: boolean;
    unit_transaction: {
      id: number;
      code: string;
    };
  } | null;
}

export interface FinanceBillingItem {
  id: number;
  finance_billing_id: number;
  bca_payment_amount: number;
  bca_payment_usd_amount: number;
  cash_payment_amount: number;
  payment_proof: string | null;
  payment_at: string;
  note: string;
  created_at?: string;
  updated_at?: string;
}

export interface FinanceBillingDetail {
  id: number;
  uuid?: string;
  unit_transaction_billing_id: number | null;
  last_payment_at: string;
  is_valid: boolean;
  created_at?: string;
  total_cash_payment: number;
  total_bca_payment: number;
  total_usd_payment: number;
  total_usd_payment_original?: number;
  total_paid: number;
  remaining_payment: number;
  remaining_payment_usd?: number;
  total_payment_count: number;
  grand_total?: number;
  unit_transaction_billing: {
    id: number;
    uuid?: string;
    unit_transaction_id: number;
    grand_total: number;
    last_payment_at: string;
    is_paid: boolean;
    created_at?: string;
    updated_at?: string;
    unit_transaction: {
      id: number;
      uuid?: string;
      code: string;
      type?: string;
    };
    unit_transaction_billing_histories: Array<{
      id: number;
      uuid?: string;
      unit_transaction_billing_id: number;
      bca_payment_amount: number;
      bca_payment_usd_amount: number;
      cash_payment_amount: number;
      payment_proof: string | null;
      payment_at: string;
      note: string | null;
      created_at?: string;
      updated_at?: string;
    }>;
  } | null;
  finance_billing_items: FinanceBillingItem[];
}

export interface FinanceBillingListResponse {
  status: boolean;
  message?: string;
  errors: Record<string, string[]> | null;
  data: LaravelPagination<FinanceBillingListItem>;
}

export interface FinanceBillingDetailResponse {
  status: boolean;
  message?: string;
  errors: Record<string, string[]> | null;
  data: FinanceBillingDetail;
}

export interface FinanceBillingListResult {
  data: FinanceBillingListItem[];
  meta: PaginationMeta;
  hasNextPage: boolean;
}

export interface FinanceBillingItemPayload {
  finance_billing_id: number;
  bca_payment_amount?: number;
  bca_payment_usd_amount?: number;
  cash_payment_amount?: number;
  payment_proof?: File | null;
  payment_at: string;
  note?: string;
}
