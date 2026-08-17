import { apiClient } from '@/lib/api/client';
import { ensureSuccess, mapLaravelPaginationMeta, type LaravelApiResponse } from '@/lib/api/response';
import type {
  CreateSparepartRefundPayload,
  CreateSparepartRefundPaymentPayload,
  SparepartRefundListResponse,
  SparepartTransactionRefund,
  SparepartTransactionRefundPayment,
  UpdateSparepartRefundPayload,
  UpdateSparepartRefundPaymentPayload,
} from '@/@types/sparepart-refund.types';

const refundPath = '/wapi/transaction/unit-transaction/sparepart-transaction-refund';
const paymentPath = '/wapi/transaction/unit-transaction/sparepart-transaction-refund-payment';

const numberValue = (value: unknown) => {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
};

const stringValue = (value: unknown) => String(value ?? '');

const mapPayment = (item: any): SparepartTransactionRefundPayment => ({
  id: stringValue(item.id),
  uuid: item.uuid,
  sparepart_transaction_refund_id: stringValue(item.sparepart_transaction_refund_id),
  code: item.code,
  amount: numberValue(item.amount),
  payment_date: item.payment_date || '',
  created_at: item.created_at,
  updated_at: item.updated_at,
});

const mapRefund = (item: any): SparepartTransactionRefund => ({
  id: stringValue(item.id),
  uuid: item.uuid,
  sparepart_transaction_id: item.sparepart_transaction_id ? stringValue(item.sparepart_transaction_id) : undefined,
  unit_transaction_refund_id: item.unit_transaction_refund_id ? stringValue(item.unit_transaction_refund_id) : undefined,
  code: item.code || '-',
  amount: numberValue(item.amount ?? item.refund_amount),
  payment_date: item.payment_date || item.refund_date || '',
  refund_date: item.refund_date,
  note: item.note || '',
  type: item.type || item.transaction?.type || item.sparepart_transaction?.type,
  transaction: item.transaction || item.sparepart_transaction
    ? (() => {
      const transaction = item.transaction || item.sparepart_transaction;
      return {
        id: transaction.id ? stringValue(transaction.id) : undefined,
        code: transaction.code,
        type: transaction.type,
        sparepart: transaction.sparepart,
        person: transaction.person,
      };
    })()
    : null,
  payments: Array.isArray(item.payments)
    ? item.payments.map(mapPayment)
    : Array.isArray(item.sparepart_transaction_refund_payments)
      ? item.sparepart_transaction_refund_payments.map(mapPayment)
      : [],
  total_paid: numberValue(item.total_paid ?? item.total_payment),
  remaining_payment: numberValue(item.remaining_payment ?? item.remaining_amount),
  created_at: item.created_at,
  updated_at: item.updated_at,
});

const formDataFrom = (payload: object, method?: string) => {
  const form = new FormData();
  if (method) form.append('_method', method);
  Object.entries(payload as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') form.append(key, String(value));
  });
  return form;
};

export const sparepartRefundService = {
  async list(params: { page?: number; perPage?: number; search?: string; type?: string } = {}): Promise<SparepartRefundListResponse> {
    const response = await apiClient.get<LaravelApiResponse<any>>(refundPath, {
      params: {
        page: params.page ?? 1,
        per_page: params.perPage ?? 25,
        search: params.search || undefined,
        type: params.type && params.type !== 'all' ? params.type : undefined,
      },
    });
    const payload = ensureSuccess(response.data);
    return { data: (payload.data ?? []).map(mapRefund), meta: mapLaravelPaginationMeta(payload) };
  },

  async detail(id: string): Promise<SparepartTransactionRefund> {
    const response = await apiClient.get<LaravelApiResponse<any>>(`${refundPath}/${id}`);
    return mapRefund(ensureSuccess(response.data));
  },

  async create(payload: CreateSparepartRefundPayload): Promise<SparepartTransactionRefund> {
    const response = await apiClient.post<LaravelApiResponse<any>>(refundPath, formDataFrom(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapRefund(ensureSuccess(response.data));
  },

  async update(id: string, payload: UpdateSparepartRefundPayload): Promise<SparepartTransactionRefund> {
    const response = await apiClient.post<LaravelApiResponse<any>>(`${refundPath}/${id}`, formDataFrom(payload, 'PUT'), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapRefund(ensureSuccess(response.data));
  },

  async remove(id: string): Promise<void> {
    const response = await apiClient.delete<LaravelApiResponse<any>>(`${refundPath}/${id}`);
    ensureSuccess(response.data);
  },

  async createPayment(payload: CreateSparepartRefundPaymentPayload): Promise<SparepartTransactionRefundPayment> {
    const response = await apiClient.post<LaravelApiResponse<any>>(paymentPath, formDataFrom(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapPayment(ensureSuccess(response.data));
  },

  async updatePayment(id: string, payload: UpdateSparepartRefundPaymentPayload): Promise<SparepartTransactionRefundPayment> {
    const response = await apiClient.post<LaravelApiResponse<any>>(`${paymentPath}/${id}`, formDataFrom(payload, 'PUT'), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapPayment(ensureSuccess(response.data));
  },

  async removePayment(id: string): Promise<void> {
    const response = await apiClient.delete<LaravelApiResponse<any>>(`${paymentPath}/${id}`);
    ensureSuccess(response.data);
  },
};
