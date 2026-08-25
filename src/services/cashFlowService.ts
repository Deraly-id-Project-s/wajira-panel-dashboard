import type {
  CashFlowFilterParams,
  CashFlowItemResponse,
  CashFlowListResponse,
  CashFlowListResult,
  CashFlowPayload,
  KasHarian,
} from '@/@types/kas-harian.types';
import { apiClient } from '@/lib/api/client';
import { ensureSuccess, mapLaravelPaginationMeta, type LaravelApiResponse } from '@/lib/api/response';

const BASE_PATH = '/wapi/finance/cash-flow';

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

const normalizeCashFlow = (payload: Partial<KasHarian>): KasHarian => ({
  id: toNumber(payload.id),
  uuid: payload.uuid,
  company_id: toNumber(payload.company_id),
  cash_id: toNumber(payload.cash_id),
  account_id: payload.account_id == null ? null : toNumber(payload.account_id),
  unit_transaction_billing_id: payload.unit_transaction_billing_id
    ? toNumber(payload.unit_transaction_billing_id)
    : (payload.unit_transaction_billing?.id ? toNumber(payload.unit_transaction_billing.id) : null),
  goods_transaction_billing_id: payload.goods_transaction_billing_id
    ? toNumber(payload.goods_transaction_billing_id)
    : (payload.goods_transaction_billing?.id ? toNumber(payload.goods_transaction_billing.id) : null),
  cash_flow_type: payload.cash_flow_type ?? '',
  code: payload.code ?? '-',
  date: payload.date ?? '',
  note: payload.note ?? '',
  amount: toNumber(payload.amount),
  debet: toNumber(payload.debet),
  debet_usd: toNumber(payload.debet_usd),
  debet_original: toNumber(payload.debet_original),
  debet_usd_original: toNumber(payload.debet_usd_original),
  credit: toNumber(payload.credit),
  credit_usd: toNumber(payload.credit_usd),
  credit_original: toNumber(payload.credit_original),
  credit_usd_original: toNumber(payload.credit_usd_original),
  payment_proof: payload.payment_proof ?? null,
  is_paid: toBoolean(payload.is_paid),
  is_valid: payload.is_valid !== undefined ? toBoolean(payload.is_valid) : undefined,
  created_at: payload.created_at ?? '',
  updated_at: payload.updated_at ?? '',
  cash: {
    id: toNumber(payload.cash?.id),
    uuid: payload.cash?.uuid,
    code: payload.cash?.code ?? '-',
    description: payload.cash?.description ?? '-',
    type: payload.cash?.type ?? '-',
  },
  account: payload.account
    ? {
        id: toNumber(payload.account.id),
        uuid: payload.account.uuid,
        code: payload.account.code ?? '-',
        name: payload.account.name ?? '-',
        description: payload.account.description ?? null,
      }
    : null,
  company: {
    id: toNumber(payload.company?.id),
    uuid: payload.company?.uuid,
    name: payload.company?.name ?? '-',
  },
  finance_billings: (payload.finance_billings ?? []).map((fb) => ({
    id: toNumber(fb.id),
    uuid: fb.uuid,
    cash_flow_id: toNumber(fb.cash_flow_id),
    cash_id: toNumber(fb.cash_id),
    account_id: toNumber(fb.account_id),
    amount: toNumber(fb.amount),
    amount_original: toNumber(fb.amount_original),
    payment_proof: fb.payment_proof ?? null,
    payment_at: fb.payment_at ?? '',
    note: fb.note ?? '',
    created_at: fb.created_at ?? '',
    updated_at: fb.updated_at ?? '',
    cash: {
      id: toNumber(fb.cash?.id),
      uuid: fb.cash?.uuid,
      company_id: fb.cash?.company_id ? toNumber(fb.cash.company_id) : undefined,
      code: fb.cash?.code ?? '-',
      cash_name: fb.cash?.cash_name ?? '-',
    },
  })),
  grand_total: toNumber(payload.grand_total),
  invoice_number: payload.invoice_number ?? null,
  remaining_payment: toNumber(payload.remaining_payment),
  remaining_payment_usd: toNumber(payload.remaining_payment_usd),
  unit_transaction_billing: payload.unit_transaction_billing
    ? {
        id: toNumber(payload.unit_transaction_billing.id),
        uuid: payload.unit_transaction_billing.uuid,
        unit_transaction_id: toNumber(payload.unit_transaction_billing.unit_transaction_id),
        grand_total: toNumber(payload.unit_transaction_billing.grand_total),
        last_payment_at: payload.unit_transaction_billing.last_payment_at ?? '',
        is_paid: toBoolean(payload.unit_transaction_billing.is_paid),
        is_valid: toBoolean(payload.unit_transaction_billing.is_valid),
        created_at: payload.unit_transaction_billing.created_at ?? '',
        updated_at: payload.unit_transaction_billing.updated_at ?? '',
      }
    : null,
  goods_transaction_billing: payload.goods_transaction_billing
    ? {
        id: toNumber(payload.goods_transaction_billing.id),
        uuid: payload.goods_transaction_billing.uuid,
        goods_transaction_id: toNumber(payload.goods_transaction_billing.goods_transaction_id),
        grand_total: toNumber(payload.goods_transaction_billing.grand_total),
        last_payment_at: payload.goods_transaction_billing.last_payment_at ?? '',
        is_paid: toBoolean(payload.goods_transaction_billing.is_paid),
        is_valid: toBoolean(payload.goods_transaction_billing.is_valid),
        created_at: payload.goods_transaction_billing.created_at ?? '',
        updated_at: payload.goods_transaction_billing.updated_at ?? '',
      }
    : null,
});

const toSuccessPayload = <T>(payload: { status: boolean; message?: string; errors: Record<string, string[]> | null; data: T }) =>
  ({
    ...payload,
    errors: payload.errors ?? undefined,
  }) as unknown as LaravelApiResponse<T>;

const buildCashFlowFormData = (payload: CashFlowPayload) => {
  const formData = new FormData();
  formData.append('company_id', String(payload.company_id));
  if (payload.cash_id !== undefined && payload.cash_id !== null) {
    formData.append('cash_id', String(payload.cash_id));
  }
  if (payload.account_id !== undefined && payload.account_id !== null) {
    formData.append('account_id', String(payload.account_id));
  }
  formData.append('date', payload.date);
  formData.append('note', payload.note);
  if ((payload.debet ?? 0) > 0) {
    formData.append('debet', String(payload.debet));
  }
  if ((payload.debet_usd ?? 0) > 0) {
    formData.append('debet_usd', String(payload.debet_usd));
  }
  if ((payload.credit ?? 0) > 0) {
    formData.append('credit', String(payload.credit));
  }
  if ((payload.credit_usd ?? 0) > 0) {
    formData.append('credit_usd', String(payload.credit_usd));
  }
  if (payload.payment_proof) {
    formData.append('payment_proof', payload.payment_proof);
  }
  if (payload.is_paid !== undefined && payload.is_paid !== null) {
    const isPaidBool = payload.is_paid === true || String(payload.is_paid).toLowerCase() === 'true' || String(payload.is_paid) === '1';
    formData.append('is_paid', isPaidBool ? 'true' : 'false');
  }
  return formData;
};

export async function fetchCashFlow(params: CashFlowFilterParams = {}): Promise<CashFlowListResult> {
  const response = await apiClient.get<CashFlowListResponse>(BASE_PATH, {
    params: {
      page: params.page ?? 1,
      per_page: params.per_page ?? 10,
      company_id: params.company_id || undefined,
      search: params.search || undefined,
      code: params.code || params.search || undefined,
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
    },
  });

  const payload = ensureSuccess(toSuccessPayload(response.data));

  return {
    data: (payload.data ?? []).map((item) => normalizeCashFlow(item)),
    meta: mapLaravelPaginationMeta(payload),
    hasNextPage: Boolean(payload.next_page_url),
  };
}

export async function fetchCashFlowDetail(id: number | string) {
  const response = await apiClient.get<CashFlowItemResponse>(`${BASE_PATH}/${id}`);
  const payload = ensureSuccess(toSuccessPayload(response.data));
  return normalizeCashFlow(payload);
}

export async function createCashFlow(payload: CashFlowPayload) {
  const response = await apiClient.post<CashFlowItemResponse>(BASE_PATH, buildCashFlowFormData(payload));
  const item = ensureSuccess(toSuccessPayload(response.data));
  return normalizeCashFlow(item);
}

export async function updateCashFlow(id: number | string, payload: CashFlowPayload) {
  const formData = buildCashFlowFormData(payload);
  formData.append('_method', 'PUT');
  const response = await apiClient.post<CashFlowItemResponse>(`${BASE_PATH}/${id}`, formData);
  const item = ensureSuccess(toSuccessPayload(response.data));
  return normalizeCashFlow(item);
}

export async function deleteCashFlow(id: number | string) {
  await apiClient.delete(`${BASE_PATH}/${id}`);
}

export async function toggleCashFlowPaymentStatus(id: number | string, isPaid: boolean) {
  const formData = new FormData();
  formData.append('_method', 'PUT');
  formData.append('is_paid', isPaid ? 'true' : 'false');

  const response = await apiClient.post<CashFlowItemResponse>(`${BASE_PATH}/${id}`, formData);
  const item = ensureSuccess(toSuccessPayload(response.data));
  return normalizeCashFlow(item);
}
