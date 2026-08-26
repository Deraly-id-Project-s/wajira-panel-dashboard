import type { RawRefundBeliResponse, RefundBeli, RefundBeliListResponse, RefundBeliListResult, RefundBeliQueryParams } from '@/types/refund-beli.types';
import type { RawRefundJualResponse, RefundJual, RefundJualListResponse, RefundJualListResult, RefundJualQueryParams } from '@/types/refund-jual.types';
import { apiClient } from '@/lib/api/client';
import { ensureSuccess, mapLaravelPaginationMeta, type LaravelApiResponse } from '@/lib/api/response';

const BASE_PATH = '/wapi/finance/refund';

const toNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const toDateOnly = (value: string | null | undefined): string => {
  if (!value) return '';
  const [date] = value.split('T');
  return date ?? value;
};

export const mapRawToRefundBeli = (raw: RawRefundBeliResponse): RefundBeli => ({
  id: toNumber(raw.id),
  noPembelian: raw.refund_number || raw.purchase_number || raw.code || '-',
  tanggal: toDateOnly(raw.date),
  namaSupplier: raw.supplier?.name || '-',
  totalPembelian: toNumber(raw.total_purchase),
  totalRefund: toNumber(raw.total_refund),
  kasMasuk: raw.cash?.description || '-',
  keterangan: raw.note || '-',
});

export const mapRawToRefundJual = (raw: RawRefundJualResponse): RefundJual => ({
  id: toNumber(raw.id),
  noPenjualan: raw.sales_number || raw.refund_number || raw.code || '-',
  tanggal: toDateOnly(raw.date),
  namaCustomer: raw.customer?.name || '-',
  totalPenjualan: toNumber(raw.total_sales),
  totalRefund: toNumber(raw.total_refund),
  kasKeluar: raw.cash?.description || '-',
  keterangan: raw.note || '-',
});

const toSuccessPayload = <T>(payload: { status: boolean; message?: string; errors: Record<string, string[]> | null; data: T }) =>
  ({
    ...payload,
    errors: payload.errors ?? undefined,
  }) as unknown as LaravelApiResponse<T>;

export async function fetchPurchaseRefund(params: RefundBeliQueryParams = {}): Promise<RefundBeliListResult> {
  const response = await apiClient.get<RefundBeliListResponse>(BASE_PATH, {
    params: {
      refund_type: 'purchase',
      page: params.page ?? 1,
      per_page: params.per_page ?? 10,
      search: params.search?.trim() || undefined,
    },
  });

  const payload = ensureSuccess(toSuccessPayload(response.data));
  const meta = mapLaravelPaginationMeta(payload);

  return {
    data: (payload.data ?? []).map(mapRawToRefundBeli),
    pagination: {
      ...meta,
      from: payload.from ?? 0,
      to: payload.to ?? 0,
    },
  };
}

export async function fetchSalesRefund(params: RefundJualQueryParams = {}): Promise<RefundJualListResult> {
  const response = await apiClient.get<RefundJualListResponse>(BASE_PATH, {
    params: {
      refund_type: 'sales',
      page: params.page ?? 1,
      per_page: params.per_page ?? 10,
      search: params.search?.trim() || undefined,
    },
  });

  const payload = ensureSuccess(toSuccessPayload(response.data));
  const meta = mapLaravelPaginationMeta(payload);

  return {
    data: (payload.data ?? []).map(mapRawToRefundJual),
    pagination: {
      ...meta,
      from: payload.from ?? 0,
      to: payload.to ?? 0,
    },
  };
}
