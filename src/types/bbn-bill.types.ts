import type { PaginatedResult } from '@/types/pagination.types';

export interface BBNBillDealer {
  id: number;
  uuid?: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
}

export interface BBNBillVehicleRegistrationFees {
  id: number;
  uuid?: string;
  vendorId?: number | null;
  vehicleDataId?: number | null;
  processDate?: string | null;
  isAlreadyProcessed?: boolean;
  customerDeliveryDate?: string | null;
  bpkbNumber?: string | null;
  bpkbRegistrationDate?: string | null;
  bpkbReceivedDate?: string | null;
  bpkbPhysicalStatus?: boolean;
  stnkRegistrationDate?: string | null;
  stnkReceivedDate?: string | null;
  stnkPhysicalStatus?: boolean;
  skpdPaymentDate?: string | null;
  skpdReceivedDate?: string | null;
  skpdPhysicalStatus?: boolean;
  tnkbReceivedDate?: string | null;
  tnkbNumber?: string | null;
  tnkbPhysicalStatus?: boolean;
  stckFee: number;
  bbnRegistrationFee: number;
  noticeFee: number;
  pmiFee: number;
  physicalCheckFee: number;
  nikValidationFee: number;
  garwilFee: number;
  builtUpFee: number;
  accelerationFee: number;
  plateRecommendationFee: number;
  serviceFee: number;
  skpdFee: number;
  stampFee: number;
  pnbpBpkb: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BBNBillVehicleData {
  id: number;
  uuid?: string;
  dealerId?: number | null;
  invoiceNumber?: string;
  stnkName: string;
  ktpNumber?: string;
  chassisNumber?: string;
  machineNumber?: string;
  vehicleRegistration: BBNBillVehicleRegistrationFees | null;
}

export interface BBNBillBillingSummary {
  id: number;
  uuid?: string;
  bbnBillId: number;
  totalPayment: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BBNBillDitlantasProcess {
  id: number;
  uuid?: string;
  code: string;
  processDate?: string;
  vendorId?: number | null;
  vendor?: {
    id: number;
    name: string;
  } | null;
}

export interface BBNBill {
  id: number;
  uuid?: string;
  code?: string;
  dealerId: number;
  billDate: string | null;
  paidDate: string | null;
  createdAt?: string;
  updatedAt?: string;
  bruttoAmount: number;
  paidAmount: number;
  remainingAmount?: number;
  pph23Amount?: number;
  isPaid: boolean;
  dealer: BBNBillDealer | null;
  ditlantasProcess?: BBNBillDitlantasProcess | null;
}

export interface BBNBillDetail extends BBNBill {
  dealerDetail: (BBNBillDealer & { vehicleDatas: BBNBillVehicleData[] }) | null;
  billings: BBNBillBillingSummary[];
}

export interface BBNBillBilling {
  id: number;
  uuid?: string;
  bbnBillId: number;
  totalPayment: number;
  createdAt?: string;
  updatedAt?: string;
  bbnBill: BBNBill | null;
}

export interface BBNBillBillingItem {
  id: number;
  uuid?: string;
  bbnBillBillingId: number;
  paidDate: string | null;
  cashId: number | null;
  amount: number;
  createdAt?: string;
  updatedAt?: string;
  cashLabel?: string;
}

export interface BBNBillBillingDetail extends BBNBillBilling {
  items: BBNBillBillingItem[];
}

export type BBNBillListResponse = PaginatedResult<BBNBill>;
export type BBNBillBillingListResponse = PaginatedResult<BBNBillBilling>;
export type BBNBillBillingItemListResponse = PaginatedResult<BBNBillBillingItem>;

export interface BBNBillPayload {
  dealerId?: number | string;
  ditlantasProcessId?: number | string;
  billDate: string;
  paidDate?: string;
}

export interface BBNBillVehicleFeePayload {
  bbnRegistrationFee: string | number;
  garwilFee: string | number;
  nikValidationFee: string | number;
  accelerationFee: string | number;
  stampFee: string | number;
  pnbpBpkb: string | number;
  skpdFee: string | number;
}

export interface BBNBillBillingPayload {
  bbnBillId: number | string;
}

export interface BBNBillBillingItemPayload {
  bbnBillBillingId: number | string;
  paidDate: string;
  cashId: number | string;
  amount: string | number;
}
