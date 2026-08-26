import { PaginationMeta } from '@/types/pagination.types';
import { UnitTransactionDetail } from './unit-transaction.types';

export interface RefundStatus {
  id: string;
  name: string;
  slug: 'waiting' | 'approve' | 'reject';
}

export interface UnitTransactionRefund {
  id: string;
  code: string;
  unit_transaction_id: string;
  refund_date: string;
  refund_amount: number;
  note: string;
  status: 'waiting' | 'approve' | 'reject' | string;
  created_at: string;
  total_paid?: number;
  total_qty?: number;
  total_payable?: number;
  remaining_payment?: number;
  items?: UnitTransactionDetail[];
  payments?: UnitTransactionRefundPayment[];
  transaction?: {
    id?: string;
    code?: string;
    type?: string;
    person?: {
      id?: string;
      name?: string;
    } | null;
  } | null;
}

export interface UnitTransactionRefundPayment {
  id: string;
  code?: string;
  unit_transaction_refund_id: string;
  cash_id?: string;
  amount: number;
  payment_date: string;
  created_at: string;
  note?: string;
}

export interface UnitTransactionRefundListResponse {
  data: UnitTransactionRefund[];
  meta: PaginationMeta;
}

export interface CreateRefundPayload {
  company_id?: string | number;
  unit_transaction_id: string;
  refund_date: string;
  refund_amount: number;
  note?: string;
  unit_transaction_item_detail_ids: Array<string | number>;
}

export interface UpdateRefundPayload {
  company_id?: string | number;
  unit_transaction_id?: string;
  refund_date?: string;
  refund_amount?: number;
  note?: string;
  unit_transaction_item_detail_ids?: Array<string | number>;
}

export interface CreateRefundPaymentPayload {
  unit_transaction_refund_id: string;
  amount: number;
  payment_date: string;
  note?: string;
  cash_id?: string | number;
}

export interface UpdateRefundPaymentPayload {
  unit_transaction_refund_id?: string;
  amount?: number;
  payment_date?: string;
  note?: string;
  cash_id?: string | number;
}
