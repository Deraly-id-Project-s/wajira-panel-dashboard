import type {
  FinanceBilling,
  FinanceBillingDetail,
  FinanceBillingDetailResponse,
  FinanceBillingItem,
  FinanceBillingItemPayload,
  FinanceBillingListItem,
  FinanceBillingListResponse,
  FinanceBillingListResult,
  FinanceBillingPayload,
} from '@/types/finance-billing.types';
import { apiClient } from '@/lib/api/client';
import { ensureSuccess, mapLaravelPaginationMeta, type LaravelApiResponse } from '@/lib/api/response';

const BILLING_PATH = '/wapi/finance/finance-billing';
const BILLING_ITEM_PATH = '/wapi/finance/finance-billing-item';
const FINANCE_BILLING_CRUD_PATH = '/wapi/finance/finance-billing';

const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true';
  return false;
};

const toSuccessPayload = <T>(payload: { status: boolean; message?: string; errors: Record<string, string[]> | null; data: T }) =>
  ({
    ...payload,
    errors: payload.errors ?? undefined,
  }) as unknown as LaravelApiResponse<T>;

const normalizeFinanceBillingItem = (item: any): FinanceBillingItem => ({
  id: toNumber(item?.id),
  finance_billing_id: toNumber(item?.finance_billing_id),
  bca_payment_amount: toNumber(item?.bca_payment_amount),
  bca_payment_usd_amount: toNumber(item?.bca_payment_usd_amount),
  cash_payment_amount: toNumber(item?.cash_payment_amount),
  payment_proof: item?.payment_proof ?? null,
  payment_at: item?.payment_at ?? '',
  note: item?.note ?? '',
  created_at: item?.created_at ?? '',
  updated_at: item?.updated_at ?? '',
});

const normalizeFinanceBillingListItem = (item: any): FinanceBillingListItem => ({
  id: toNumber(item?.id),
  uuid: item?.uuid,
  unit_transaction_billing_id: item?.unit_transaction_billing_id ? toNumber(item?.unit_transaction_billing_id) : null,
  last_payment_at: item?.last_payment_at ?? '',
  is_valid: toBoolean(item?.is_valid),
  created_at: item?.created_at ?? '',
  remaining_payment: toNumber(item?.remaining_payment),
  remaining_payment_usd: toNumber(item?.remaining_payment_usd),
  unit_transaction_billing: item?.unit_transaction_billing ? {
    id: toNumber(item?.unit_transaction_billing?.id),
    uuid: item?.unit_transaction_billing?.uuid,
    unit_transaction_id: toNumber(item?.unit_transaction_billing?.unit_transaction_id),
    grand_total: toNumber(item?.unit_transaction_billing?.grand_total),
    is_paid: toBoolean(item?.unit_transaction_billing?.is_paid),
    unit_transaction: {
      id: toNumber(item?.unit_transaction_billing?.unit_transaction?.id),
      code: item?.unit_transaction_billing?.unit_transaction?.code ?? '-',
    },
  } : null,
});

const normalizeFinanceBillingDetail = (item: any): FinanceBillingDetail => ({
  id: toNumber(item?.id),
  uuid: item?.uuid,
  unit_transaction_billing_id: item?.unit_transaction_billing_id ? toNumber(item?.unit_transaction_billing_id) : null,
  last_payment_at: item?.last_payment_at ?? '',
  is_valid: toBoolean(item?.is_valid),
  created_at: item?.created_at ?? '',
  total_cash_payment: toNumber(item?.total_cash_payment),
  total_bca_payment: toNumber(item?.total_bca_payment),
  total_usd_payment: toNumber(item?.total_usd_payment),
  total_usd_payment_original: toNumber(item?.total_usd_payment_original),
  total_paid: toNumber(item?.total_paid),
  remaining_payment: toNumber(item?.remaining_payment),
  remaining_payment_usd: toNumber(item?.remaining_payment_usd),
  total_payment_count: toNumber(item?.total_payment_count),
  grand_total: toNumber(item?.grand_total),
  unit_transaction_billing: item?.unit_transaction_billing ? {
    id: toNumber(item?.unit_transaction_billing?.id),
    uuid: item?.unit_transaction_billing?.uuid,
    unit_transaction_id: toNumber(item?.unit_transaction_billing?.unit_transaction_id),
    grand_total: toNumber(item?.unit_transaction_billing?.grand_total),
    last_payment_at: item?.unit_transaction_billing?.last_payment_at ?? '',
    is_paid: toBoolean(item?.unit_transaction_billing?.is_paid),
    created_at: item?.unit_transaction_billing?.created_at ?? '',
    updated_at: item?.unit_transaction_billing?.updated_at ?? '',
    unit_transaction: {
      id: toNumber(item?.unit_transaction_billing?.unit_transaction?.id),
      uuid: item?.unit_transaction_billing?.unit_transaction?.uuid,
      code: item?.unit_transaction_billing?.unit_transaction?.code ?? '-',
      type: item?.unit_transaction_billing?.unit_transaction?.type ?? '',
    },
    unit_transaction_billing_histories: (item?.unit_transaction_billing?.unit_transaction_billing_histories ?? []).map((history: any) => ({
      id: toNumber(history?.id),
      uuid: history?.uuid,
      unit_transaction_billing_id: toNumber(history?.unit_transaction_billing_id),
      bca_payment_amount: toNumber(history?.bca_payment_amount),
      bca_payment_usd_amount: toNumber(history?.bca_payment_usd_amount),
      cash_payment_amount: toNumber(history?.cash_payment_amount),
      payment_proof: history?.payment_proof ?? null,
      payment_at: history?.payment_at ?? '',
      note: history?.note ?? null,
      created_at: history?.created_at ?? '',
      updated_at: history?.updated_at ?? '',
    })),
  } : null,
  finance_billing_items: (item?.finance_billing_items ?? []).map(normalizeFinanceBillingItem),
});

export async function fetchFinanceBilling(params: { page?: number; per_page?: number; search?: string; company_id?: number | string } = {}): Promise<FinanceBillingListResult> {
  const response = await apiClient.get<FinanceBillingListResponse>(BILLING_PATH, {
    params: {
      page: params.page ?? 1,
      per_page: params.per_page ?? 10,
      search: params.search || undefined,
      company_id: params.company_id || undefined,
    },
  });

  const payload = ensureSuccess(toSuccessPayload(response.data));

  return {
    data: (payload.data ?? []).map(normalizeFinanceBillingListItem),
    meta: mapLaravelPaginationMeta(payload),
    hasNextPage: Boolean(payload.next_page_url),
  };
}

export async function fetchFinanceBillingDetail(id: number | string): Promise<FinanceBillingDetail> {
  const response = await apiClient.get<FinanceBillingDetailResponse>(`${BILLING_PATH}/${id}`);
  const payload = ensureSuccess(toSuccessPayload(response.data));
  return normalizeFinanceBillingDetail(payload);
}

export async function createFinanceBillingItem(id: number | string, payload: FinanceBillingItemPayload) {
  const formData = new FormData();
  formData.append('finance_billing_id', String(payload.finance_billing_id));

  if ((payload.bca_payment_amount ?? 0) > 0) {
    formData.append('bca_payment_amount', String(payload.bca_payment_amount ?? 0));
  }

  if ((payload.bca_payment_usd_amount ?? 0) > 0) {
    formData.append('bca_payment_usd_amount', String(payload.bca_payment_usd_amount ?? 0));
  }

  if ((payload.cash_payment_amount ?? 0) > 0) {
    formData.append('cash_payment_amount', String(payload.cash_payment_amount ?? 0));
  }

  formData.append('payment_at', payload.payment_at);

  if (payload.note) {
    formData.append('note', payload.note);
  }

  if (payload.payment_proof) {
    formData.append('payment_proof', payload.payment_proof);
  }

  const response = await apiClient.post<{ status: boolean; message?: string; errors: Record<string, string[]> | null; data: FinanceBillingItem }>(
    `${BILLING_ITEM_PATH}/${id}`,
    formData,
  );

  const data = ensureSuccess(toSuccessPayload(response.data));
  return normalizeFinanceBillingItem(data);
}

export async function updateFinanceBillingItem(id: number | string, payload: FinanceBillingItemPayload) {
  const formData = new FormData();
  formData.append('_method', 'PUT');
  formData.append('finance_billing_id', String(payload.finance_billing_id));

  if ((payload.bca_payment_amount ?? 0) > 0) {
    formData.append('bca_payment_amount', String(payload.bca_payment_amount ?? 0));
  }

  if ((payload.bca_payment_usd_amount ?? 0) > 0) {
    formData.append('bca_payment_usd_amount', String(payload.bca_payment_usd_amount ?? 0));
  }

  if ((payload.cash_payment_amount ?? 0) > 0) {
    formData.append('cash_payment_amount', String(payload.cash_payment_amount ?? 0));
  }

  formData.append('payment_at', payload.payment_at);

  if (payload.note) {
    formData.append('note', payload.note);
  }

  if (payload.payment_proof) {
    formData.append('payment_proof', payload.payment_proof);
  }

  const response = await apiClient.post<{ status: boolean; message?: string; errors: Record<string, string[]> | null; data: FinanceBillingItem }>(
    `${BILLING_ITEM_PATH}/${id}`,
    formData,
  );

  const data = ensureSuccess(toSuccessPayload(response.data));
  return normalizeFinanceBillingItem(data);
}

export async function deleteFinanceBillingItem(id: number | string) {
  await apiClient.delete(`${BILLING_ITEM_PATH}/${id}`);
}

const normalizeFinanceBilling = (item: any): FinanceBilling => ({
  id: toNumber(item?.id),
  uuid: item?.uuid,
  cash_flow_id: toNumber(item?.cash_flow_id),
  cash_id: toNumber(item?.cash_id),
  account_id: toNumber(item?.account_id),
  amount: toNumber(item?.amount),
  amount_original: toNumber(item?.amount_original),
  payment_proof: item?.payment_proof ?? null,
  payment_at: item?.payment_at ?? '',
  note: item?.note ?? '',
  created_at: item?.created_at ?? '',
  updated_at: item?.updated_at ?? '',
  cash: {
    id: toNumber(item?.cash?.id),
    uuid: item?.cash?.uuid,
    company_id: item?.cash?.company_id ? toNumber(item?.cash.company_id) : undefined,
    code: item?.cash?.code ?? '-',
    cash_name: item?.cash?.cash_name ?? '-',
  },
});

export async function createFinanceBilling(payload: FinanceBillingPayload): Promise<FinanceBilling> {
  const formData = new FormData();
  formData.append('cash_flow_id', String(payload.cash_flow_id));
  formData.append('cash_id', String(payload.cash_id));
  formData.append('account_id', String(payload.account_id));
  formData.append('amount', String(payload.amount));
  if (payload.amount_original != null) {
    formData.append('amount_original', String(payload.amount_original));
  }
  formData.append('payment_at', payload.payment_at);
  formData.append('note', payload.note);
  if (payload.payment_proof) {
    formData.append('payment_proof', payload.payment_proof);
  }

  const response = await apiClient.post<{ status: boolean; message?: string; errors: Record<string, string[]> | null; data: FinanceBilling }>(
    FINANCE_BILLING_CRUD_PATH,
    formData,
  );

  const data = ensureSuccess(toSuccessPayload(response.data));
  return normalizeFinanceBilling(data);
}

export async function updateFinanceBilling(id: number | string, payload: FinanceBillingPayload): Promise<FinanceBilling> {
  const formData = new FormData();
  formData.append('_method', 'PUT');
  formData.append('cash_flow_id', String(payload.cash_flow_id));
  formData.append('cash_id', String(payload.cash_id));
  formData.append('account_id', String(payload.account_id));
  formData.append('amount', String(payload.amount));
  if (payload.amount_original != null) {
    formData.append('amount_original', String(payload.amount_original));
  }
  formData.append('payment_at', payload.payment_at);
  formData.append('note', payload.note);
  if (payload.payment_proof) {
    formData.append('payment_proof', payload.payment_proof);
  }

  const response = await apiClient.post<{ status: boolean; message?: string; errors: Record<string, string[]> | null; data: FinanceBilling }>(
    `${FINANCE_BILLING_CRUD_PATH}/${id}`,
    formData,
  );

  const data = ensureSuccess(toSuccessPayload(response.data));
  return normalizeFinanceBilling(data);
}

export async function deleteFinanceBilling(id: number | string) {
  await apiClient.delete(`${FINANCE_BILLING_CRUD_PATH}/${id}`);
}
