import type { PaginationMeta } from '@/types/pagination.types';
import type { UnitTransactionRefundPayment } from '@/types/refund.type';

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

export interface FinanceRefundRecord {
  id: string;
  code: string;
  refundCode: string;
  refundDate: string;
  refundAmount: number;
  totalTransaction?: number;
  note: string;
  status: RefundApprovalStatus;
  cashId?: string;
  cashName?: string;
  transactionId: string;
  transactionCode: string;
  transactionType: RefundTransactionType;
  partnerName: string;
  payments: UnitTransactionRefundPayment[];
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
