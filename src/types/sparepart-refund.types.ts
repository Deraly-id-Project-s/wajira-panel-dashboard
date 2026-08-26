import type { PaginationMeta } from '@/types/pagination.types';

export type SparepartRefundTransactionType = 'purchase' | 'sales' | string;

export interface SparepartTransactionRefundPayment {
  id: string;
  uuid?: string;
  sparepart_transaction_refund_id: string;
  code?: string;
  amount: number;
  payment_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface SparepartTransactionRefund {
  id: string;
  uuid?: string;
  sparepart_transaction_id?: string;
  unit_transaction_refund_id?: string;
  code: string;
  amount: number;
  payment_date: string;
  refund_date?: string;
  note?: string;
  type?: SparepartRefundTransactionType;
  transaction?: {
    id?: string;
    code?: string;
    type?: SparepartRefundTransactionType;
    sparepart?: { id?: string; name?: string; code?: string } | null;
    person?: { id?: string; name?: string } | null;
  } | null;
  payments?: SparepartTransactionRefundPayment[];
  total_paid?: number;
  remaining_payment?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SparepartRefundListResponse {
  data: SparepartTransactionRefund[];
  meta: PaginationMeta;
}

export interface CreateSparepartRefundPayload {
  sparepart_transaction_id: string;
  amount: number;
  payment_date: string;
  note?: string;
}

export type UpdateSparepartRefundPayload = Partial<CreateSparepartRefundPayload>;

export interface CreateSparepartRefundPaymentPayload {
  sparepart_transaction_refund_id: string;
  amount: number;
  payment_date: string;
}

export type UpdateSparepartRefundPaymentPayload = Partial<Omit<CreateSparepartRefundPaymentPayload, 'sparepart_transaction_refund_id'>> & {
  sparepart_transaction_refund_id?: string;
};
