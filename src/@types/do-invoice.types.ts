import type { PaginatedResult } from './pagination.types';

export interface DoInvoiceCustomer {
  id: number;
  uuid?: string;
  companyId?: number;
  code?: string;
  type?: string;
  name: string;
  username?: string | null;
  isActive?: boolean;
  lastLogin?: string | null;
  pic?: string | null;
  picName?: string | null;
  address?: string | null;
  mapCoordinate?: string | null;
  phone?: string | null;
  npwp?: string | null;
  identityNumber?: string | null;
  driveLicenseIdentityNumber?: string | null;
  image?: string | null;
  mapLink?: string | null;
  socialMedia1Link?: string | null;
  socialMedia2Link?: string | null;
  socialMedia3Link?: string | null;
  socialMedia4Link?: string | null;
  websiteLink?: string | null;
  joinDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoInvoiceTarifPivot {
  doOrderlistId?: number;
  tarifId?: number;
  uuid?: string;
  deliveryDestination?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoInvoiceTarif {
  id: number;
  uuid?: string;
  description?: string | null;
  qty?: number;
  invoicePrice?: number;
  ppnPrice?: number;
  loadingIn?: string;
  destination?: string;
  loadingOut?: string;
  distance?: number;
  invCdd?: number | null;
  invFuso?: number | null;
  invTowing?: number | null;
  ujTowing?: number | null;
  ujCdd?: number | null;
  ujFuso?: number | null;
  isActive?: number | boolean;
  createdAt?: string;
  updatedAt?: string;
  pivot?: DoInvoiceTarifPivot | null;
}

export interface DoInvoiceOrderListTarifItem {
  id: number;
  uuid?: string;
  doOrderListTarifId?: number;
  loadContent?: string;
  qty?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoInvoiceOrderListTarif {
  id: number;
  uuid?: string;
  doOrderlistId?: number;
  tarifId?: number;
  vehicleType?: string;
  deliveryDestination?: string;
  vehicleId?: number;
  driverId?: number;
  createdAt?: string;
  updatedAt?: string;
  vehicle?: DoInvoiceVehicle | null;
  driver?: DoInvoiceDriver | null;
  tarif?: DoInvoiceTarif | null;
  doOrderListTarifItems?: DoInvoiceOrderListTarifItem[];
}

export interface DoInvoiceOrderList {
  id: number;
  uuid?: string;
  code: string;
  companyId?: number;
  customerId?: number;
  description?: string | null;
  doDeliveryDestination?: string | null;
  loadingIn?: string | null;
  loadingOut?: string | null;
  vehicleType?: string | null;
  billInvoice?: number | null;
  isHasInvoice?: boolean;
  canMarkDone?: boolean;
  status?: string;
  ujDriver?: number | null;
  ppn?: number | null;
  pph?: number | null;
  ujTowing?: number | null;
  ujCdd?: number | null;
  ujFuso?: number | null;
  invTowing?: number | null;
  invCdd?: number | null;
  invFuso?: number | null;
  driver?: string | DoInvoiceDriver | null;
  customer?: DoInvoiceCustomer | null;
  tarifs?: DoInvoiceTarif[];
  expeditions?: DoInvoiceExpedition[];
  doOrderListTarifs?: DoInvoiceOrderListTarif[];
  createdAt?: string;
  updatedAt?: string;
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
  cashes?: DoInvoiceCash[];
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
  totalCashPayment?: number;
  totalBcaPayment?: number;
  totalUsdPayment?: number;
  totalPaid?: number;
  remainingPayment?: number;
  totalPaymentCount?: number;
  doInvoiceBillingHistories?: DoInvoiceBillingHistory[];
  histories: DoInvoiceBillingHistory[];
  createdAt?: string;
  updatedAt?: string;
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
  companyList?: string;
  company?: any;
}

export interface DoInvoiceExpedition {
  id: number;
  uuid?: string;
  code?: string;
  date?: string;
  description?: string | null;
  qty?: number;
  status?: string | null;
  isAlreadyPrint?: boolean;
  noSuratDo?: string | null;
  doLetterCode?: string | null;
  doAssignmentCode?: string | null;
  doOrderListTarifId?: number;
  startDate?: string;
  endDate?: string;
  targetStartDate?: string;
  targetEndDate?: string;
  ujNominal?: number;
  ujNominalBeforeClaim?: number;
  claimDeductionNominal?: number;
  cashAdvanceDeductionNominal?: number;
  laravelThroughKey?: number;
  vehicle?: DoInvoiceVehicle | null;
  driver?: DoInvoiceDriver | null;
  orderList?: DoInvoiceOrderList | null;
  orderListTarif?: DoInvoiceOrderListTarif | null;
  customer?: DoInvoiceCustomer | null;
  tarif?: DoInvoiceTarif | null;
  invoiceExpedition?: number;
  ppn?: number;
  totalAmount?: number;
  destination?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceBillingPayment {
  id?: number;
  uuid?: string | null;
  amount?: number | null;
  totalPaid?: number | null;
  cashId?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DoInvoice {
  id: number;
  uuid?: string;
  code: string;
  customerId?: number | null;
  doOrderListId?: number | null;
  date: string;
  subject?: string | null;
  letterContent?: string | null;
  description?: string | null;
  isAlreadyPrint: boolean;
  otherFee?: number | null;
  additionalFee?: number | null;
  nominal: number;
  paidNominal: number;
  billingRemainingNominal: number;
  isPaid: boolean;
  doInvoiceBilling?: DoInvoiceBilling | null;
  billing?: DoInvoiceBilling | null;
  financeBillingPayment?: FinanceBillingPayment | null;
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
