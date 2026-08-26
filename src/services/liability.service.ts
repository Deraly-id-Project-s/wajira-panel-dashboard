import { apiClient } from '@/lib/api/client';
import { ensureSuccess, LaravelApiResponse, toPaginatedResult } from '@/lib/api/response';
import type { LaravelPagination } from '@/types/pagination.types';
import type {
  CreateLiabilityPaymentPayload,
  LiabilityDetail,
  LiabilityListItem,
  LiabilityPaymentHistory,
  LiabilityUnitItem,
} from '@/types/pembayaran-hutang.types';

type LiabilityListApiModel = {
  id?: string | number;
  code?: string;
  date?: string;
  supplier_name?: string;
  customer_name?: string;
  grand_total?: string | number;
  total_paid?: string | number;
  remaining_payment?: string | number;
  paid_percentage?: string | number;
};

type LiabilityListResponse = LaravelPagination<LiabilityListApiModel> & {
  from?: number | null;
  to?: number | null;
};

type LiabilityDetailApiModel = {
  id?: string | number;
  code?: string;
  date?: string;
  person?: {
    id?: string | number;
    name?: string;
  };
  billing_summary?: {
    grand_total?: string | number;
    total_paid?: string | number;
    remaining_payment?: string | number;
    is_paid?: boolean | number | string;
    paid_percentage?: string | number;
  };
  unit_transaction_billing?: {
    id?: string | number;
    unit_transaction_billing_histories?: LiabilityPaymentHistoryApiModel[];
  };
  unit_transaction_items?: LiabilityUnitItemApiModel[];
};

type LiabilityPaymentHistoryApiModel = {
  id?: string | number;
  cash_payment_amount?: string | number;
  bca_payment_amount?: string | number;
  bca_payment_usd_amount?: string | number;
  payment_at?: string;
  note?: string | null;
  payment_proof?: string | null;
  created_at?: string;
};

type LiabilityUnitItemApiModel = {
  id?: string | number;
  qty_total?: string | number;
  price?: string | number;
  unit_type?: {
    name?: string;
    unit_model?: string;
  };
};

const basePath = '/wapi/report/liability-report';
const paymentHistoryPath = '/wapi/transaction/unit-transaction/unit-transaction-billing-history';

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

const mapListItem = (item: LiabilityListApiModel): LiabilityListItem => ({
  id: toNumber(item.id),
  code: String(item.code ?? ''),
  date: String(item.date ?? ''),
  supplier_name: String(item.supplier_name ?? item.customer_name ?? ''),
  grand_total: toNumber(item.grand_total),
  total_paid: toNumber(item.total_paid),
  remaining_payment: toNumber(item.remaining_payment),
  paid_percentage: Math.max(0, Math.min(100, toNumber(item.paid_percentage))),
});

const mapPaymentHistory = (item: LiabilityPaymentHistoryApiModel): LiabilityPaymentHistory => ({
  id: toNumber(item.id),
  cash_payment_amount: toNumber(item.cash_payment_amount),
  bca_payment_amount: toNumber(item.bca_payment_amount),
  bca_payment_usd_amount: toNumber(item.bca_payment_usd_amount),
  payment_at: String(item.payment_at ?? ''),
  note: item.note ?? '',
  payment_proof: item.payment_proof ?? null,
  created_at: String(item.created_at ?? ''),
});

const mapUnitItem = (item: LiabilityUnitItemApiModel): LiabilityUnitItem => ({
  id: toNumber(item.id),
  qty_total: toNumber(item.qty_total),
  price: toNumber(item.price),
  unit_type: {
    name: String(item.unit_type?.name ?? ''),
    unit_model: String(item.unit_type?.unit_model ?? ''),
  },
});

const unwrapDetail = (payload: unknown): LiabilityDetailApiModel => {
  if (!payload || typeof payload !== 'object') return {};
  const candidate = payload as { data?: unknown };
  if (candidate.data && typeof candidate.data === 'object' && !Array.isArray(candidate.data)) {
    return candidate.data as LiabilityDetailApiModel;
  }
  return payload as LiabilityDetailApiModel;
};

const buildFormData = (payload: CreateLiabilityPaymentPayload): FormData => {
  const formData = new FormData();
  formData.append('unit_transaction_billing_id', String(payload.unit_transaction_billing_id));

  const cashAmount = toNumber(payload.cash_payment_amount);
  const bcaAmount = toNumber(payload.bca_payment_amount);
  const usdAmount = toNumber(payload.bca_payment_usd_amount);
  const totalPayment = cashAmount + bcaAmount + usdAmount;

  if (cashAmount > 0) formData.append('cash_payment_amount', String(cashAmount));
  if (bcaAmount > 0) formData.append('bca_payment_amount', String(bcaAmount));
  if (usdAmount > 0) formData.append('bca_payment_usd_amount', String(usdAmount));

  // Append total payment amount to satisfy backend validation
  formData.append('payment', String(totalPayment));
  formData.append('payment_amount', String(totalPayment));
  formData.append('amount', String(totalPayment));

  if (payload.payment_at) formData.append('payment_at', payload.payment_at);
  if (payload.note) formData.append('note', payload.note);
  if (payload.payment_proof) formData.append('payment_proof', payload.payment_proof);
  if (payload.cash_id !== undefined && payload.cash_id !== null) {
    formData.append('cash_id', String(payload.cash_id));
  }

  return formData;
};

export const liabilityService = {
  async getAllReceivables(params: { company_id?: string | number; page?: number; per_page?: number; search?: string } = {}): Promise<{
    data: LiabilityListItem[];
    meta: { currentPage: number; perPage: number; total: number; lastPage: number; from: number | null; to: number | null };
  }> {
    const response = await apiClient.get<LaravelApiResponse<LiabilityListResponse>>(basePath, {
      params: {
        company_id: params.company_id,
        type: 'sales',
        page: params.page ?? 1,
        per_page: params.per_page ?? 10,
        ...(params.search ? { search: params.search } : {}),
      },
    });

    const payload = ensureSuccess(response.data);
    const paginated = toPaginatedResult(payload, mapListItem);

    return {
      data: paginated.data,
      meta: {
        currentPage: paginated.meta.currentPage,
        perPage: paginated.meta.perPage,
        total: paginated.meta.total,
        lastPage: paginated.meta.lastPage,
        from: payload.from ?? null,
        to: payload.to ?? null,
      },
    };
  },

  async getAllLiabilities(params: { company_id?: string | number; page?: number; per_page?: number; search?: string } = {}): Promise<{
    data: LiabilityListItem[];
    meta: { currentPage: number; perPage: number; total: number; lastPage: number; from: number | null; to: number | null };
  }> {
    const response = await apiClient.get<LaravelApiResponse<LiabilityListResponse>>(basePath, {
      params: {
        company_id: params.company_id,
        type: 'purchase',
        page: params.page ?? 1,
        per_page: params.per_page ?? 10,
        ...(params.search ? { search: params.search } : {}),
      },
    });

    const payload = ensureSuccess(response.data);
    const paginated = toPaginatedResult(payload, mapListItem);

    return {
      data: paginated.data,
      meta: {
        currentPage: paginated.meta.currentPage,
        perPage: paginated.meta.perPage,
        total: paginated.meta.total,
        lastPage: paginated.meta.lastPage,
        from: payload.from ?? null,
        to: payload.to ?? null,
      },
    };
  },

  async getList(params: { type?: 'purchase' | 'sales'; company_id?: string | number; page?: number; per_page?: number; search?: string } = {}): Promise<{
    data: LiabilityListItem[];
    meta: { currentPage: number; perPage: number; total: number; lastPage: number; from: number | null; to: number | null };
  }> {
    const response = await apiClient.get<LaravelApiResponse<LiabilityListResponse>>(basePath, {
      params: {
        company_id: params.company_id,
        liability_status: 'unpaid',
        type: params.type ?? 'purchase',
        page: params.page ?? 1,
        per_page: params.per_page ?? 10,
        ...(params.search ? { search: params.search } : {}),
      },
    });

    const payload = ensureSuccess(response.data);
    const paginated = toPaginatedResult(payload, mapListItem);

    return {
      data: paginated.data,
      meta: {
        currentPage: paginated.meta.currentPage,
        perPage: paginated.meta.perPage,
        total: paginated.meta.total,
        lastPage: paginated.meta.lastPage,
        from: payload.from ?? null,
        to: payload.to ?? null,
      },
    };
  },

  async getDetail(id: number): Promise<LiabilityDetail> {
    const response = await apiClient.get<LaravelApiResponse<LiabilityDetailApiModel>>(`${basePath}/${id}`);
    const payload = ensureSuccess(response.data);
    const detail = unwrapDetail(payload);

    return {
      id: toNumber(detail.id),
      code: String(detail.code ?? ''),
      date: String(detail.date ?? ''),
      person: {
        id: toNumber(detail.person?.id),
        name: String(detail.person?.name ?? ''),
      },
      billing_summary: {
        grand_total: toNumber(detail.billing_summary?.grand_total),
        total_paid: toNumber(detail.billing_summary?.total_paid),
        remaining_payment: toNumber(detail.billing_summary?.remaining_payment),
        is_paid: toBoolean(detail.billing_summary?.is_paid),
        paid_percentage: Math.max(0, Math.min(100, toNumber(detail.billing_summary?.paid_percentage))),
      },
      unit_transaction_billing: {
        id: toNumber(detail.unit_transaction_billing?.id),
        unit_transaction_billing_histories: (detail.unit_transaction_billing?.unit_transaction_billing_histories ?? []).map(mapPaymentHistory),
      },
      unit_transaction_items: (detail.unit_transaction_items ?? []).map(mapUnitItem),
    };
  },

  async createPayment(payload: CreateLiabilityPaymentPayload | FormData): Promise<{ status: boolean; message?: string }> {
    const formData = payload instanceof FormData ? payload : buildFormData(payload);
    const response = await apiClient.post<LaravelApiResponse<null>>(paymentHistoryPath, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return {
      status: response.data.status,
      message: response.data.message ?? 'Payment history created successfully',
    };
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete<LaravelApiResponse<null>>(`${basePath}/${id}`);
  },
};
