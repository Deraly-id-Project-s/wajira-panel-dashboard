import type { PaginatedResult, PaginationParams } from './pagination.types';

export interface WithholdingTaxCompany {
  id: number;
  name: string | null;
  slug: string | null;
}

export interface WithholdingTaxCash {
  id: number;
  uuid: string | null;
  company_id: number | null;
  account_id?: number | null;
  code: string | null;
  cash_name?: string | null;
  description?: string | null;
  amount?: number | string | null;
  type: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface WithholdingTaxCustomer {
  id: number;
  name: string | null;
  code?: string | null;
}

export interface WithholdingTaxDoInvoice {
  id: number;
  uuid: string | null;
  code: string | null;
  customer_id: number | null;
  do_order_list_id?: number | null;
  date: string | null;
  subject?: string | null;
  letter_content?: string | null;
  description?: string | null;
  other_fee?: number | null;
  additional_fee?: number | null;
  bill_invoice?: number | null;
  invoice_amount?: number | null;
  total_amount?: number | null;
  is_already_print?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  customer?: WithholdingTaxCustomer | null;
}

export interface WithholdingTaxItem {
  id: number;
  company_id: number | null;
  source: 'internal' | 'external' | string;
  cash_id: number | null;
  unit_transaction_id: number | null;
  bbn_bill_id: number | null;
  do_invoice_id: number | null;
  withholding_number: string | null;
  withholding_age: number | null;
  pph_amount: number | null;
  pph_description: string | null;
  payment_amount: number | null;
  payment_date: string | null;
  no_invoice: string | null;
  created_at: string | null;
  updated_at: string | null;
  company?: WithholdingTaxCompany | null;
  cash?: WithholdingTaxCash | null;
  unit_transaction?: unknown | null;
  bbn_bill?: unknown | null;
  do_invoice?: WithholdingTaxDoInvoice | null;
}

export interface WithholdingTaxPayload {
  company_id?: number | string;
  source: string;
  cash_id?: number | null;
  unit_transaction_id?: number | null;
  withholding_number: string;
  withholding_age?: number;
  pph_amount?: number;
  pph_description?: string | null;
  payment_amount: number;
  payment_date: string;
  no_invoice: string;
}

export interface WithholdingTaxListParams extends PaginationParams {
  source?: string;
  company_id?: number | string;
  cash_id?: number | string;
  withholding_number?: string;
  withholding_age?: number | string;
  pph_amount?: number | string;
  pph_description?: string;
  payment_amount?: number | string;
  payment_date?: string;
  no_invoice?: string;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
  start_date?: string | null;
  end_date?: string | null;
}

export type WithholdingTaxListResponse = PaginatedResult<WithholdingTaxItem>;
