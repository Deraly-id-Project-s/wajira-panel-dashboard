import { PaginationMeta } from '@/@types/pagination.types';

export interface SparepartTransactionBillingHistoryCash {
  id: number;
  code?: string;
  name?: string;
  cash_name?: string;
  description?: string;
  pivot: {
    sparepart_transaction_billing_history_id?: number;
    cash_id?: number;
    amount: number | string;
    original_amount?: number | string;
    exchange_amount?: number | string;
  };
}

export interface SparepartTransactionBillingHistory {
  id: number;
  uuid: string;
  sparepart_transaction_billing_id: number;
  payment_proof?: string | null;
  bca_payment_amount?: number;
  cash_payment_amount?: number;
  bca_payment_usd_amount?: number;
  grand_total?: number;
  cash_name?: string;
  cash?: any;
  cashes?: SparepartTransactionBillingHistoryCash[];
  payment_at?: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SparepartTransactionBilling {
  id: number;
  uuid: string;
  sparepart_transaction_id: number;
  grand_total: number;
  last_payment_at: string | null;
  is_paid: boolean;
  is_remaining_payment?: number | string | null;
  is_usd_transaction?: boolean;
  total_cash_payment?: number;
  total_bca_payment?: number;
  total_bca_cash_payment?: number;
  total_usd_payment?: number;
  total_paid?: number;
  remaining_payment?: number;
  created_at: string;
  updated_at: string;
  sparepart_transaction_billing_histories?: SparepartTransactionBillingHistory[];
}

export interface SparepartTransactionBillingSummary {
  grand_total: number;
  total_paid: number;
  remaining_payment: number;
  is_paid: boolean;
  is_usd_transaction?: boolean;
  total_cash_payment?: number;
  total_bca_payment?: number;
  total_bca_cash_payment?: number;
  total_usd_payment?: number;
}

export interface SparepartTransaction {
  id: number;
  uuid: string;
  code: string;
  warehouse_id: number;
  person_id: number;
  sparepart_id: number;
  type: 'purchase' | 'sales';
  billing_type: 'cash' | 'credit';
  is_refunded: boolean;
  qty: number;
  price: number;
  discount: number;
  transaction_date: string;
  nota_number: string;
  billing_due_date: string | null;
  invoice_file: string | null;
  note: string;
  created_at: string;
  updated_at: string;
  transaction_bruto_total: number;
  supplier: {
    name: string,
  };
  transaction_netto_total: number;
  billing_summary: SparepartTransactionBillingSummary;
  sparepart_transaction_billing?: SparepartTransactionBilling;
  warehouse?: any;
  person?: any;
  sparepart?: any;
}

export interface SparepartTransactionResponse {
  data: SparepartTransaction[];
  meta: PaginationMeta;
}

export interface CreateSparepartTransactionPayload {
  warehouse_id?: number;
  company_id: number;
  person_id: number;
  sparepart_id: number;
  type: string;
  billing_type: string;
  qty: number;
  price: number;
  discount: number;
  transaction_date: string;
  nota_number: string;
  billing_due_date?: string | null;
  invoice_file?: File | null;
  note?: string;
}

export interface UpdateSparepartTransactionPayload {
  warehouse_id?: number;
  company_id?: number;
  person_id: number;
  sparepart_id: number;
  type: string;
  billing_type: string;
  qty: number;
  price: number;
  discount: number;
  transaction_date: string;
  nota_number: string;
  billing_due_date?: string | null;
  invoice_file?: File | null;
  note?: string;
}

export interface CreateSparepartTransactionBillingHistoryPayload {
  sparepart_transaction_billing_id: number;
  bca_payment_amount?: number;
  bca_payment_usd_amount?: number;
  cash_payment_amount?: number;
  payment_at: string;
  note?: string;
  payment_proof?: File | null;
}

export interface UpdateSparepartTransactionBillingHistoryPayload {
  sparepart_transaction_billing_id: number;
  bca_payment_amount?: number;
  bca_payment_usd_amount?: number;
  cash_payment_amount?: number;
  payment_at: string;
  note?: string;
  payment_proof?: File | null;
}
