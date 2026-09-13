import type { PaginatedResult } from './pagination.types';

export interface DoInvoiceCustomer {
  id: number;
  uuid?: string;
  code?: string;
  name: string;
  pic?: string | null;
  address?: string | null;
  phone?: string | null;
  npwp?: string | null;
}

export interface DoInvoiceOrderList {
  id: number;
  uuid?: string;
  code: string;
  doDeliveryDestination?: string | null;
  loadingIn?: string | null;
  loadingOut?: string | null;
  vehicleType?: string | null;
  billInvoice?: number | null;
  isHasInvoice?: boolean;
  canMarkDone?: boolean;
  status?: string;
  customer?: DoInvoiceCustomer | null;
}

export interface DoInvoiceCash {
  id: number;
  uuid?: string;
  code: 'cash_idr' | 'bca_idr' | 'bca_usd' | string;
  currencyType: 'idr' | 'usd' | string;
  cashName: string;
}

export interface DoInvoiceBillingHistory {
  id: number;
  uuid?: string;
  doInvoiceBillingId: number;
  paymentAt: string;
  paymentProof?: string | null;
  note?: string | null;
  cashPaymentAmount: number;
  bcaPaymentAmount: number;
  bcaPaymentUsdAmount: number;
  nominal: number;
  remainingPayment?: number;
  cashes: DoInvoiceCash[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DoInvoiceBilling {
  id: number;
  uuid?: string;
  doInvoiceId: number;
  grandTotal: number;
  lastPaymentAt?: string | null;
  isPaid: boolean;
  totalCashPayment: number;
  totalBcaPayment: number;
  totalUsdPayment: number;
  totalPaid: number;
  remainingPayment: number;
  totalPaymentCount: number;
  histories: DoInvoiceBillingHistory[];
}

export interface DoInvoiceVehicle {
  id: number;
  uuid?: string;
  registrationNumber: string;
  type: string;
}

export interface DoInvoiceDriver {
  id: number;
  uuid?: string;
  name: string;
}

export interface DoInvoiceTarif {
  id: number;
  description?: string | null;
  qty?: number;
  invoicePrice?: number;
  ppnPrice?: number;
  loadingIn?: string;
  destination?: string;
  loadingOut?: string;
}

export interface DoInvoiceExpedition {
  id: number;
  uuid?: string;
  date?: string;
  description?: string | null;
  qty?: number;
  status?: string | null;
  isAlreadyPrint?: boolean;
  noSuratDo?: string | null;
  doLetterCode?: string | null;
  doAssignmentCode?: string | null;
  vehicle?: DoInvoiceVehicle | null;
  driver?: DoInvoiceDriver | null;
  orderList?: DoInvoiceOrderList | null;
  customer?: DoInvoiceCustomer | null;
  tarif?: DoInvoiceTarif | null;
  invoiceExpedition?: number;
  ppn?: number;
  totalAmount?: number;
  destination?: string;
}

export interface FinanceBillingPayment {
  id?: number;
  uuid?: string | null;
  amount?: number | null;
  total_paid?: number | null;
  cash_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DoInvoice {
  id: number;
  uuid?: string;
  code: string;
  customerId?: number | null;
  date: string;
  subject: string;
  letterContent: string;
  description: string | null;
  isAlreadyPrint: boolean;
  other_fee?: number | null;
  additional_fee?: number | null;
  nominal: number;
  paidNominal: number;
  billingRemainingNominal: number;
  isPaid: boolean;
  billing?: DoInvoiceBilling | null;
  finance_billing_payment?: FinanceBillingPayment | null;
  createdAt?: string;
  updatedAt?: string;
  customer?: DoInvoiceCustomer | null;
  orderList?: DoInvoiceOrderList | null;
  vehicle?: DoInvoiceVehicle | null;
  driver?: DoInvoiceDriver | null;
  expeditions: DoInvoiceExpedition[];
  raw?: Record<string, unknown>;
}

export interface DoInvoiceListParams {
  search?: string;
  order_sort?: 'asc' | 'desc';
  order_by?: string;
  date?: string;
  is_printed?: '' | '0' | '1';
  is_paid?: boolean;
  is_already_print?: boolean;
  customer_id?: number;
  company_id?: string | number;
  do_order_list_id?: number;
  start_date?: string;
  end_date?: string;
}

export interface DoInvoiceBillingHistoryPayload {
  do_invoice_billing_id: number;
  cash_payment_amount?: number;
  bca_payment_amount?: number;
  bca_payment_usd_amount?: number;
  payment_at?: string;
  note?: string;
  payment_proof?: File | null;
}

export interface UpdateDoInvoiceBillingPayload {
  is_paid: boolean;
  last_payment_at?: string;
}

export interface CreateFinanceInvoicePaymentPayload {
  do_invoice_id: number;
  cash_id: number;
  amount: number;
}

export type DoInvoiceListResponse = PaginatedResult<DoInvoice>;
