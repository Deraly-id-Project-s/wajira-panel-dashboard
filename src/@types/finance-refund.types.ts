import type { PaginationMeta } from '@/@types/pagination.types';
import type { UnitTransactionRefundPayment } from '@/@types/refund.type';

export type RefundApprovalStatus = 'waiting' | 'approve' | 'reject';
export type RefundTransactionType = 'purchase' | 'sales';

export interface FinanceRefundTransactionPerson {
  id?: string;
  name: string;
}

export interface FinanceRefundTransaction {
  id: string;
  code: string;
  type: RefundTransactionType | string;
  person?: FinanceRefundTransactionPerson | null;
}

export interface FinanceRefundCash {
  id: number;
  finance_refund_id?: number;
  cash_id: number;
  amount: number;
  amount_original?: number;
  type: 'debet' | 'credit' | string;
  cash?: {
    id: number;
    cash_name: string;
    currency_type?: string;
    code?: string;
  };
}

export interface FinanceRefundDetail {
  id: number;
  uuid?: string;
  code: string;
  transaction_of: string;
  date: string;
  note: string;
  is_paid: boolean;
  is_valid: boolean;
  remaining_payment: number;
  cash_position?: {
    debet_idr_total: number;
    credit_idr_total: number;
    debet_usd_total: number;
    credit_usd_total: number;
  };
  financeRefundCashes: FinanceRefundCash[];
  financeBillings: import('@/@types/finance-billing.types').FinanceBilling[];
}

export interface FinanceRefundRecord {
  id: string;
  uuid?: string;
  code: string;
  refundCode: string;
  refundDate: string;
  refundAmount: number;
  totalTransaction?: number;
  remainingPayment?: number;
  note: string;
  status: RefundApprovalStatus;
  isPaid?: boolean;
  cashId?: string;
  cashName?: string;
  transactionId: string;
  transactionCode: string;
  transactionType: RefundTransactionType;
  partnerName: string;
  payments: UnitTransactionRefundPayment[];
  financeRefundCashes?: FinanceRefundCash[];
  createdAt: string;
}

export interface FinanceRefundListResponse {
  data: FinanceRefundRecord[];
  meta: PaginationMeta & {
    from: number;
    to: number;
  };
}

export interface FinanceRefundQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: RefundApprovalStatus | 'all';
  transactionType?: RefundTransactionType;
  company_id?: number | string | null;
}

export interface UpdateFinanceRefundPayload {
  cash_id?: string;
  status: RefundApprovalStatus;
}

export interface UpdateFinanceRefundPaidStatusPayload {
  is_paid: boolean;
  note?: string;
}

export interface FinanceRefundDetailResponse {
  status: boolean;
  message?: string;
  data: FinanceRefundDetail;
}
