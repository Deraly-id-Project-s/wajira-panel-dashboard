import type { PaginatedResult } from './pagination.types';

export interface DoInvoiceCustomer {
  id: number;
  uuid?: string;
  code?: string;
  name: string;
  pic?: string | null;
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
}

export interface DoInvoiceCreatePayload {
  customer_id: string | number;
  date: string;
  subject: string;
  letter_content: string;
  description?: string;
}

export interface DoInvoiceDeletePayload {
  do_code: string;
}

export interface DoInvoiceProcessPayload {
  date?: string;
  subject?: string;
  attachment?: File | string | null;
  letter_content?: string;
  do_expedition_invoice_ids?: Array<number | string>;
  customer_name?: string;
}

export interface DoInvoiceProcessResponse {
  id?: number | string;
  uuid?: string;
  code?: string;
  [key: string]: unknown;
}

export interface DoInvoiceTableRow {
  id: number;
  code: string;
  orderCode: string;
  customerName: string;
  date: string;
  isPrinted: boolean;
  statusLabel: string;
  raw: DoInvoice;
}

export interface CreateInvoiceDetailRow {
  invoiceId: number;
  expeditionId: number;
  orderListId?: number | null;
  date: string;
  noPolisi: string;
  type: string;
  driver: string;
  loadingIn: string;
  destination: string;
  loadingOut: string;
  noSuratDo: string;
  description: string;
  qty: number;
  invoiceExpedition: number;
  ppn: number;
  totalAmount: number;
  status: string;
  isPrinted: boolean;
  kodeOrder: string;
}

export interface CreateInvoiceProcessValues {
  invoiceCode: string;
  date: string;
  subject: string;
  attachmentLabel: string;
  letterContent: string;
  customerName: string;
  description: string;
  attachmentFile: File | null;
  isUsd?: boolean;
  rateUsd?: number;
}

export interface InvoiceProcessDraft {
  primaryInvoiceId: number;
  invoiceIds: number[];
  selectedExpeditionIds?: number[];
  invoiceCode: string;
  date: string;
  subject: string;
  attachmentLabel: string;
  letterContent: string;
  customerName: string;
  description: string;
  savedAt: string;
  isUsd?: boolean;
  rateUsd?: number;
}

export interface CreateInvoicePrintPayload {
  draft: InvoiceProcessDraft;
  invoiceCode: string;
  companyName: string;
  customerName: string;
  rows: CreateInvoiceDetailRow[];
  statusLabel: string;
}

export interface CreateFinanceInvoicePaymentPayload {
  do_invoice_id: number;
  cash_id: number;
  amount: number;
}

export type DoInvoiceListResponse = PaginatedResult<DoInvoice>;
