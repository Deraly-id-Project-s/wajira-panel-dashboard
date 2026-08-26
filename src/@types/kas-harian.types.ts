import type { LaravelPagination, PaginationMeta } from '@/@types/pagination.types';
import type { FinanceBilling } from '@/@types/finance-billing.types';

export interface KasHarianCash {
  id: number;
  uuid?: string;
  code: string;
  description: string;
  type: string;
}

export interface KasHarianAccount {
  id: number;
  uuid?: string;
  code: string;
  name: string;
  description?: string | null;
}

export interface KasHarianCompany {
  id: number;
  uuid?: string;
  name: string;
}

export interface KasHarianUnitTransactionBilling {
  id: number;
  uuid?: string;
  unit_transaction_id: number;
  grand_total: number;
  last_payment_at?: string;
  is_paid: boolean;
  is_valid?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface KasHarianGoodsTransactionBilling {
  id: number;
  uuid?: string;
  goods_transaction_id: number;
  grand_total: number;
  last_payment_at?: string;
  is_paid: boolean;
  is_valid?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface KasHarian {
  id: number;
  uuid?: string;
  company_id: number;
  cash_id?: number | null;
  account_id?: number | null;
  unit_transaction_billing_id?: number | null;
  goods_transaction_billing_id?: number | null;
  cash_flow_type?: 'debet' | 'credit' | string;
  code: string;
  date: string;
  note: string;
  amount?: number;
  debet: number;
  debet_usd?: number;
  debet_original?: number;
  debet_usd_original?: number;
  credit: number;
  credit_usd?: number;
  credit_original?: number;
  credit_usd_original?: number;
  payment_proof?: string | null;
  is_paid?: boolean | string | null;
  is_valid?: boolean;
  created_at?: string;
  updated_at?: string;
  grand_total?: number;
  invoice_number?: string | null;
  remaining_payment?: number;
  remaining_payment_usd?: number;
  cash?: KasHarianCash | null;
  account?: KasHarianAccount | null;
  company: KasHarianCompany;
  finance_billings?: FinanceBilling[];
  unit_transaction_billing?: KasHarianUnitTransactionBilling | null;
  goods_transaction_billing?: KasHarianGoodsTransactionBilling | null;
}

export interface CashFlowPayload {
  company_id: number;
  cash_id?: number;
  account_id?: number;
  date: string;
  note: string;
  debet: number;
  debet_usd?: number;
  credit: number;
  credit_usd?: number;
  payment_proof?: File | null;
  is_paid?: boolean;
  is_valid?: boolean;
}

export interface CashFlowFilterParams {
  page?: number;
  per_page?: number;
  search?: string;
  code?: string;
  company_id?: number;
  start_date?: string;
  end_date?: string;
}

export interface CashFlowListResponse {
  status: boolean;
  message?: string;
  errors: Record<string, string[]> | null;
  data: LaravelPagination<KasHarian>;
}

export interface CashFlowItemResponse {
  status: boolean;
  message?: string;
  errors: Record<string, string[]> | null;
  data: KasHarian;
}

export interface CashFlowListResult {
  data: KasHarian[];
  meta: PaginationMeta;
  hasNextPage: boolean;
}

export type KasHarianSource = 'billing' | 'manual';

export interface KasHarianListItem {
  id: number;
  source: KasHarianSource;
  date: string;
  code: string;
  invoiceNumber?: string | null;
  note: string;
  debet: number;
  debet_usd: number;
  credit: number;
  credit_usd: number;
  accountName: string;
  cashName?: string;
  cashFlowId?: number;
  financeBillingId?: number;
  goodsTransactionBillingId?: number;
  unitTransactionBillingId?: number;
  isValid?: boolean;
  is_paid?: boolean;
}
