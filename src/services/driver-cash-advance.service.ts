import type {
  DriverCashAdvance,
  DriverCashAdvanceApprovalPayload,
  DriverCashAdvanceBilling,
  DriverCashAdvanceBillingHistory,
  DriverCashAdvanceBillingHistoryPayload,
  DriverCashAdvanceBillingStatusPayload,
  DriverCashAdvanceListParams,
  DriverCashAdvanceListResponse,
  DriverCashAdvancePayload,
} from '@/@types/driver-cash-advance.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, ensureSuccess, type LaravelApiResponse, toPaginatedResult } from '@/lib/api/response';

const basePath = '/wapi/transaction/driver-cash-advance';
const billingBasePath = '/wapi/transaction/driver-cash-advance-billing';
const billingHistoryBasePath = '/wapi/transaction/driver-cash-advance-billing-history';

const toNumber = (value: unknown): number => {
  if (value == null || value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return ['1', 'true', 'approved', 'approve', 'yes'].includes(value.toLowerCase());
  return false;
};

const mapBillingCash = (item: any) => ({
  id: Number(item?.id ?? 0),
  uuid: item?.uuid ?? null,
  code: item?.code ?? '',
  currencyType: item?.currency_type ?? '',
  cashName: item?.cash_name ?? '',
  type: item?.type ?? null,
  pivot: {
    driverCashAdvanceBillingHistoryId: Number(item?.pivot?.driver_cash_advance_billing_history_id ?? 0),
    cashId: Number(item?.pivot?.cash_id ?? item?.id ?? 0),
    amount: toNumber(item?.pivot?.amount),
    originalAmount: toNumber(item?.pivot?.original_amount),
    exchangeAmount: toNumber(item?.pivot?.exchange_amount),
  },
});

const mapBillingHistory = (item: any): DriverCashAdvanceBillingHistory => ({
  id: Number(item?.id ?? 0),
  uuid: item?.uuid ?? null,
  driverCashAdvanceBillingId: Number(item?.driver_cash_advance_billing_id ?? 0),
  paymentProof: item?.payment_proof ?? null,
  paymentAt: item?.payment_at ?? '',
  note: item?.note ?? null,
  createdAt: item?.created_at ?? null,
  updatedAt: item?.updated_at ?? null,
  cashes: Array.isArray(item?.cashes) ? item.cashes.map(mapBillingCash) : [],
});

const mapDriver = (item: any) => ({
  id: Number(item?.id ?? 0),
  uuid: item?.uuid ?? null,
  code: item?.code ?? null,
  name: item?.name ?? '-',
  companyId: item?.company_id == null ? null : Number(item.company_id),
  companyList: item?.company_list ?? null,
});

const mapDriverCashAdvance = (item: any): DriverCashAdvance => {
  const billings = Array.isArray(item?.driver_cash_advance_billings)
    ? item.driver_cash_advance_billings.map((billing: any) => mapBilling(billing))
    : Array.isArray(item?.billings)
    ? item.billings.map((billing: any) => mapBilling(billing))
    : [];

  const firstBilling = billings[0];
  const isPaid = toBoolean(item?.is_paid ?? item?.isPaid ?? firstBilling?.isPaid);
  const remainingPayment =
    item?.remaining_payment != null
      ? toNumber(item.remaining_payment)
      : item?.remainingPayment != null
      ? toNumber(item.remainingPayment)
      : firstBilling != null
      ? firstBilling.remainingPayment
      : toNumber(item?.billing_remaining_nominal ?? item?.remaining_nominal);

  return {
    id: Number(item.id ?? 0),
    uuid: item.uuid ?? null,
    companyId: Number(item.company_id ?? item.companyId ?? 0),
    driverId: Number(item.driver_id ?? item.driverId ?? item.driver?.id ?? 0),
    subject: item.subject ?? '',
    description: item.description ?? null,
    isClaim: toBoolean(item.is_claim ?? item.isClaim),
    claimNominal: toNumber(item.claim_nominal ?? item.claimNominal),
    approveNominal: toNumber(item.approve_nominal ?? item.approveNominal),
    claimDate: item.claim_date ?? item.claimDate ?? '',
    isApprove: toBoolean(item.is_approve ?? item.isApprove ?? item.approved),
    approveDate: item.approve_date ?? item.approveDate ?? null,
    code: item.code ?? null,
    driver: item.driver ? mapDriver(item.driver) : null,
    createdAt: item.created_at ?? item.createdAt ?? null,
    updatedAt: item.updated_at ?? item.updatedAt ?? null,
    nominal: toNumber(item.nominal),
    paidNominal: toNumber(item.paid_nominal),
    appliedNominal: toNumber(item.applied_nominal),
    remainingNominal: toNumber(item.remaining_nominal),
    billingRemainingNominal: toNumber(item.billing_remaining_nominal),
    billings,
    isPaid,
    is_paid: isPaid,
    remainingPayment,
    remaining_payment: remainingPayment,
    isDriverRequest: toBoolean(item?.is_driver_request ?? item?.isDriverRequest),
    is_driver_request: toBoolean(item?.is_driver_request ?? item?.isDriverRequest),
  };
};

const mapBilling = (item: any): DriverCashAdvanceBilling => {
  const grandTotal = toNumber(item?.grand_total);
  const totalPaid = toNumber(item?.total_paid);
  const isPaid = toBoolean(item?.is_paid);
  const explicitRemaining = toNumber(item?.remaining_payment);

  return {
    id: Number(item?.id ?? 0),
    uuid: item?.uuid ?? null,
    driverCashAdvanceId: Number(item?.driver_cash_advance_id ?? item?.driver_cash_advance?.id ?? 0),
    grandTotal,
    lastPaymentAt: item?.last_payment_at ?? null,
    isPaid,
    totalCashPayment: toNumber(item?.total_cash_payment),
    totalBcaCashPayment: toNumber(item?.total_bca_cash_payment),
    totalUsdPayment: toNumber(item?.total_usd_payment),
    totalUsdPaymentInIdr: toNumber(item?.total_usd_payment_in_idr),
    totalPaid,
    remainingPayment: isPaid ? 0 : explicitRemaining > 0 ? explicitRemaining : Math.max(0, grandTotal - totalPaid),
    totalPaymentCount: toNumber(item?.total_payment_count),
    createdAt: item?.created_at ?? null,
    updatedAt: item?.updated_at ?? null,
    driverCashAdvance: item?.driver_cash_advance ? mapDriverCashAdvance(item.driver_cash_advance) : null,
    histories: Array.isArray(item?.driver_cash_advance_billing_histories)
      ? item.driver_cash_advance_billing_histories.map(mapBillingHistory)
      : [],
  };
};

const unwrapListData = (payload: any) => {
  if (Array.isArray(payload)) {
    return {
      data: payload,
      current_page: 1,
      per_page: payload.length,
      total: payload.length,
      last_page: 1,
    };
  }

  if (Array.isArray(payload?.data)) return payload;
  if (Array.isArray(payload?.data?.data)) return payload.data;

  return {
    data: [],
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  };
};

export const getDriverCashAdvances = async (params: DriverCashAdvanceListParams): Promise<DriverCashAdvanceListResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
    params: {
      ...buildLaravelPaginationQuery(params),
      company_id: params.company_id,
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
    },
  });

  const data = ensureSuccess(response.data);
  return toPaginatedResult(unwrapListData(data), mapDriverCashAdvance);
};

export const getDriverCashAdvanceById = async (id: string | number): Promise<DriverCashAdvance> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${id}`);
  return mapDriverCashAdvance(ensureSuccess(response.data));
};

export const createDriverCashAdvance = async (payload: DriverCashAdvancePayload): Promise<DriverCashAdvance> => {
  const response = await apiClient.post<LaravelApiResponse<any>>(basePath, payload);
  return mapDriverCashAdvance(ensureSuccess(response.data));
};

export const updateDriverCashAdvance = async (id: string | number, payload: DriverCashAdvancePayload): Promise<DriverCashAdvance> => {
  const response = await apiClient.put<LaravelApiResponse<any>>(`${basePath}/${id}`, payload);
  return mapDriverCashAdvance(ensureSuccess(response.data));
};

export const deleteDriverCashAdvance = async (id: string | number): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${basePath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Gagal menghapus kas bon');
  }
};

export const approveDriverCashAdvance = async (id: string | number, payload: DriverCashAdvanceApprovalPayload): Promise<DriverCashAdvance> => {
  const response = await apiClient.put<LaravelApiResponse<any>>(`${basePath}/${id}/approve`, payload);
  return mapDriverCashAdvance(ensureSuccess(response.data));
};

export const getDriverCashAdvanceBillingById = async (id: string | number): Promise<DriverCashAdvanceBilling> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${billingBasePath}/${id}`);
  return mapBilling(ensureSuccess(response.data));
};

export const createDriverCashAdvanceBillingHistory = async (
  payload: DriverCashAdvanceBillingHistoryPayload,
): Promise<DriverCashAdvanceBillingHistory> => {
  const formData = new FormData();
  formData.append('driver_cash_advance_billing_id', String(payload.driver_cash_advance_billing_id));
  formData.append('bca_payment_amount', String(payload.bca_payment_amount ?? 0));
  formData.append('bca_payment_usd_amount', String(payload.bca_payment_usd_amount ?? 0));
  formData.append('cash_payment_amount', String(payload.cash_payment_amount ?? 0));
  formData.append('payment_at', payload.payment_at);
  if (payload.note) {
    formData.append('note', payload.note);
  }
  if (payload.payment_proof) {
    formData.append('payment_proof', payload.payment_proof);
  }
  if (payload.bca_payment_usd_original_amount != null) {
    formData.append('bca_payment_usd_original_amount', String(payload.bca_payment_usd_original_amount));
  }
  if (payload.bca_payment_usd_exchange_amount != null) {
    formData.append('bca_payment_usd_exchange_amount', String(payload.bca_payment_usd_exchange_amount));
  }

  const response = await apiClient.post<LaravelApiResponse<any>>(billingHistoryBasePath, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return mapBillingHistory(ensureSuccess(response.data));
};

export const deleteDriverCashAdvanceBillingHistory = async (id: string | number): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${billingHistoryBasePath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Gagal menghapus riwayat pembayaran');
  }
};

export const updateDriverCashAdvanceBillingStatus = async (
  id: string | number,
  payload: DriverCashAdvanceBillingStatusPayload,
): Promise<DriverCashAdvanceBilling> => {
  const response = await apiClient.put<LaravelApiResponse<any>>(`${billingBasePath}/${id}`, payload);
  return mapBilling(ensureSuccess(response.data));
};
