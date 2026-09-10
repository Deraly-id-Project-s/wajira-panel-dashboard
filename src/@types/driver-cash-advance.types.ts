import type { PaginatedResult, PaginationParams } from './pagination.types';

export interface DriverCashAdvanceDriver {
  id: number;
  uuid?: string | null;
  code?: string | null;
  name: string;
  companyId?: number | null;
  companyList?: string | null;
}

export interface DriverCashAdvanceBillingCashPivot {
  driverCashAdvanceBillingHistoryId: number;
  cashId: number;
  amount: number;
  originalAmount: number;
  exchangeAmount: number;
}

export interface DriverCashAdvanceBillingCash {
  id: number;
  uuid?: string | null;
  code: string;
  currencyType: 'idr' | 'usd' | string;
  cashName: string;
  type?: string | null;
  pivot: DriverCashAdvanceBillingCashPivot;
}

export interface DriverCashAdvanceBillingHistory {
  id: number;
  uuid?: string | null;
  driverCashAdvanceBillingId: number;
  paymentProof?: string | null;
  paymentAt: string;
  note?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  cashes: DriverCashAdvanceBillingCash[];
}

export interface DriverCashAdvanceBilling {
  id: number;
  uuid?: string | null;
  driverCashAdvanceId: number;
  grandTotal: number;
  lastPaymentAt?: string | null;
  isPaid: boolean;
  totalCashPayment: number;
  totalBcaCashPayment: number;
  totalUsdPayment: number;
  totalUsdPaymentInIdr: number;
  totalPaid: number;
  remainingPayment: number;
  totalPaymentCount: number;
  createdAt?: string | null;
  updatedAt?: string | null;
  driverCashAdvance?: DriverCashAdvance | null;
  histories: DriverCashAdvanceBillingHistory[];
}

export interface DriverCashAdvance {
  id: number;
  uuid?: string | null;
  companyId: number;
  driverId: number;
  subject: string;
  description?: string | null;
  isClaim: boolean;
  claimNominal: number;
  approveNominal: number;
  claimDate: string;
  isApprove: boolean;
  approveDate?: string | null;
  code?: string | null;
  driver?: DriverCashAdvanceDriver | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  nominal: number;
  paidNominal: number;
  appliedNominal: number;
  remainingNominal: number;
  billingRemainingNominal: number;
  billings: DriverCashAdvanceBilling[];
  remaining_payment?: number;
  remainingPayment?: number;
  is_paid?: boolean;
  isPaid?: boolean;
  is_driver_request?: boolean;
  isDriverRequest?: boolean;
}

export interface DriverCashAdvancePayload {
  company_id: number;
  driver_id: number;
  subject: string;
  description?: string | null;
  claim_nominal: number;
  claim_date: string;
}

export interface DriverCashAdvanceApprovalPayload {
  is_approve: boolean;
  approve_date: string;
  approve_nominal?: number;
}

export interface DriverCashAdvanceBillingHistoryPayload {
  driver_cash_advance_billing_id: number;
  bca_payment_amount: number;
  bca_payment_usd_amount: number;
  cash_payment_amount: number;
  payment_at: string;
  note?: string | null;
  payment_proof?: File | null;
  bca_payment_usd_original_amount?: number | null;
  bca_payment_usd_exchange_amount?: number | null;
}

export interface DriverCashAdvanceBillingStatusPayload {
  last_payment_at: string;
  is_paid: boolean;
}

export interface DriverCashAdvanceListParams extends PaginationParams {
  company_id?: number | string;
  start_date?: string | null;
  end_date?: string | null;
}

export type DriverCashAdvanceListResponse = PaginatedResult<DriverCashAdvance>;
