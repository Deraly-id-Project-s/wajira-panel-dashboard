import type { ApiError } from '@/types/api';
import type {
  BulkUpdatePPNPayload,
  BulkUpdatePPNResponse,
  PPNFilterParams,
  PPNItem,
  PPNListResponse,
  PPNListResult,
  PPNUpdateResponse,
  UnitTransactionItemDetail,
  UnitType,
  UpdatePPNMutationPayload,
} from '@/types/ppn.types';
import { apiClient } from '@/lib/api/client';
import { ensureSuccess, mapLaravelPaginationMeta, type LaravelApiResponse } from '@/lib/api/response';

const BASE_PATH = '/wapi/finance/ppn';
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;

const toNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const normalizeUnitType = (value: Partial<UnitType> | null | undefined): UnitType => ({
  id: toNumber(value?.id),
  code: value?.code ?? '-',
  name: value?.name ?? '-',
  unit_type: value?.unit_type ?? '-',
  unit_model: value?.unit_model ?? '-',
});

const normalizeUnitDetail = (value: Partial<UnitTransactionItemDetail> | null | undefined): UnitTransactionItemDetail => ({
  id: toNumber(value?.id),
  machine_number: value?.machine_number ?? '-',
  chassis_number: value?.chassis_number ?? '-',
  color: value?.color ?? '-',
});

const normalizePPNItem = (value: Partial<PPNItem>): PPNItem => ({
  id: toNumber(value.id),
  code: value.code ?? '-',
  buy_date: value.buy_date ?? '',
  supplier: value.supplier ?? '-',
  fp_date: value.fp_date ?? null,
  nsfp_age: value.nsfp_age ?? null,
  qty: toNumber(value.qty),
  unit_type: normalizeUnitType(value.unit_type),
  unit_transaction_item_detail: normalizeUnitDetail(value.unit_transaction_item_detail),
  unit_price: toNumber(value.unit_price),
  total_price: toNumber(value.total_price),
  dpp_amount: toNumber(value.dpp_amount),
  ppn_11: toNumber(value.ppn_11),
  payment_amount: toNumber(value.payment_amount),
  nsfp_number: value.nsfp_number ?? null,
});

const toSuccessPayload = <T>(payload: { status: boolean; message: string; errors: Record<string, string[]> | null; data: T }) =>
  ({
    ...payload,
    errors: payload.errors ?? undefined,
  }) as unknown as LaravelApiResponse<T>;

const isMethodNotAllowed = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;

  const apiError = error as ApiError;
  return apiError.statusCode === 405;
};

export async function getPPNList(params: PPNFilterParams = {}): Promise<PPNListResult> {
  const page = params.page ?? DEFAULT_PAGE;
  const perPage = params.per_page ?? DEFAULT_PER_PAGE;

  const response = await apiClient.get<PPNListResponse>(BASE_PATH, {
    params: {
      type: params.type ?? 'ppn_purchase',
      page,
      per_page: perPage,
      search: params.search || undefined,
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
      sort_by: params.sort_by ?? 'buy_date',
      sort_direction: params.sort_direction ?? 'desc',
    },
  });

  const payload = ensureSuccess(toSuccessPayload(response.data));

  return {
    data: (payload.data ?? []).map((item) => normalizePPNItem(item)),
    meta: mapLaravelPaginationMeta(payload),
    hasNextPage: Boolean(payload.next_page_url),
    isTotalExact: true,
  };
}

export async function updatePPN({ id, payload }: UpdatePPNMutationPayload) {
  const requestBody = {
    fp_date: payload.fp_date || undefined,
    nsfp_age: payload.nsfp_age || undefined,
    amount: payload.amount ?? undefined,
    nsfp_number: payload.nsfp_number || undefined,
  };

  try {
    const response = await apiClient.put<PPNUpdateResponse>(`${BASE_PATH}/${id}`, requestBody);
    return ensureSuccess(toSuccessPayload(response.data));
  } catch (error) {
    if (!isMethodNotAllowed(error)) throw error;

    const response = await apiClient.post<PPNUpdateResponse>(`${BASE_PATH}/${id}`, {
      ...requestBody,
      _method: 'PUT',
    });

    return ensureSuccess(toSuccessPayload(response.data));
  }
}

export async function bulkUpdatePPN(payload: BulkUpdatePPNPayload) {
  const requestBody = {
    ppn_data_ids: payload.ppn_data_ids,
    fp_date: payload.fp_date || undefined,
    nsfp_age: payload.nsfp_age || undefined,
    nsfp_amount: payload.nsfp_amount ?? undefined,
    amount: payload.amount ?? undefined,
    nsfp_number: payload.nsfp_number || undefined,
  };

  try {
    const response = await apiClient.put<BulkUpdatePPNResponse>(`${BASE_PATH}/bulk-update`, requestBody);
    return ensureSuccess(toSuccessPayload(response.data));
  } catch (error) {
    if (!isMethodNotAllowed(error)) throw error;

    const response = await apiClient.post<BulkUpdatePPNResponse>(`${BASE_PATH}/bulk-update`, {
      ...requestBody,
      _method: 'PUT',
    });

    return ensureSuccess(toSuccessPayload(response.data));
  }
}

// Convenient aliases for Pembelian & Penjualan
export const getPPNPembelianList = (params?: PPNFilterParams) => getPPNList({ ...params, type: 'ppn_purchase' });
export const getPPNPenjualanList = (params?: PPNFilterParams) => getPPNList({ ...params, type: 'ppn_sales' });
export const updatePPNPembelian = updatePPN;
export const updatePPNPenjualan = updatePPN;
export const bulkUpdatePPNPembelian = bulkUpdatePPN;
export const bulkUpdatePPNPenjualan = bulkUpdatePPN;
