import { apiClient } from '@/lib/api/client';
import { ensureSuccess, LaravelApiResponse, mapLaravelPaginationMeta } from '@/lib/api/response';
import { UnitTransactionRefundListResponse, CreateRefundPayload, CreateRefundPaymentPayload, UnitTransactionRefund, UpdateRefundPayload, UpdateRefundPaymentPayload } from '@/types/refund.type';
import type { UnitTransactionItemDetail } from '@/types/unit-transaction.types';

const BASE_PATH = '/wapi/transaction/unit-transaction/unit-transaction-refund';
const PAYMENT_PATH = '/wapi/transaction/unit-transaction/unit-transaction-refund-payment';
const ITEM_DETAIL_PATH = '/wapi/transaction/unit-transaction/unit-transaction-item-detail';
const TRANSACTION_PATH = '/wapi/transaction/unit-transaction/unit-transaction';

const toString = (value: unknown) => String(value ?? '');
const toNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const appendRefundItemDetailIds = (formData: FormData, ids?: Array<string | number>) => {
  const normalizedIds = (ids ?? []).map((id) => String(id)).filter(Boolean);
  normalizedIds.forEach((id) => {
    formData.append('unit_transaction_item_detail_ids[]', id);
  });

  if (normalizedIds.length > 0) {
    formData.append('unit_transaction_item_detail_ids', JSON.stringify(normalizedIds));
  }
};

const mapItemDetail = (item: any): UnitTransactionItemDetail => ({
  ...item,
  id: toString(item.id),
  unit_transaction_item_id: toString(item.unit_transaction_item_id),
  unit_type_name: item?.tipeUnit ?? '-',
  price: item.price !== undefined ? toNumber(item.price) : undefined,
  color: item.color ?? '-',
  machine_number: item.machine_number ?? '-',
  chassis_number: item.chassis_number ?? '-',
  in_stock: (item.in_stock === true || item.in_stock === 1 || item.in_stock === '1') ? '1' : '0',
  is_forecast: (item.is_forecast === true || item.is_forecast === 1 || item.is_forecast === '1') ? '1' : '0',
  status: item.status ? String(item.status) : '',
  created_at: item.created_at ?? '',
});

const mapRefundPayment = (payment: any) => ({
  id: toString(payment.id),
  code: payment.code ? String(payment.code) : undefined,
  unit_transaction_refund_id: toString(payment.unit_transaction_refund_id),
  cash_id: payment.cash_id ? toString(payment.cash_id) : undefined,
  amount: toNumber(payment.amount),
  payment_date: payment.payment_date || '',
  created_at: payment.created_at || '',
  note: payment.note || payment.description || '',
});

const mapRefund = (item: any): UnitTransactionRefund => ({
  id: toString(item.id),
  code: item.code || '-',
  unit_transaction_id: toString(item.unit_transaction_id),
  refund_date: item.refund_date || '',
  refund_amount: toNumber(item.refund_amount),
  note: item.note || '',
  status: item.status || 'waiting',
  created_at: item.created_at || '',
  total_paid: toNumber(item.total_paid ?? item.total_terbayar),
  total_qty: toNumber(item.total_qty),
  total_payable: toNumber(item.total_payable ?? item.total_bayar),
  remaining_payment: toNumber(item.remaining_payment ?? item.total_kurang_bayar),
  items: Array.isArray(item.items)
    ? item.items.map(mapItemDetail)
    : Array.isArray(item.unit_transaction_item_details)
      ? item.unit_transaction_item_details.map(mapItemDetail)
      : [],
  payments: Array.isArray(item.payments)
    ? item.payments.map(mapRefundPayment)
    : Array.isArray(item.unit_transaction_refund_payments)
      ? item.unit_transaction_refund_payments.map(mapRefundPayment)
      : [],
  transaction: item.transaction ?? item.unit_transaction
    ? {
      id: (item.transaction ?? item.unit_transaction).id ? toString((item.transaction ?? item.unit_transaction).id) : undefined,
      code: (item.transaction ?? item.unit_transaction).code || undefined,
      type: (item.transaction ?? item.unit_transaction).type || undefined,
      person: (item.transaction ?? item.unit_transaction).person
        ? {
          id: (item.transaction ?? item.unit_transaction).person.id ? toString((item.transaction ?? item.unit_transaction).person.id) : undefined,
          name: (item.transaction ?? item.unit_transaction).person.name || '-',
        }
        : null,
    }
    : null,
});

export const refundAdministrasiService = {
  /**
   * GET Unit Transaction Refund List
   */
  async getRefundList(params: { page?: number; per_page?: number; search?: string; unit_transaction_id?: string } = {}): Promise<UnitTransactionRefundListResponse> {
    const response = await apiClient.get<LaravelApiResponse<any>>(BASE_PATH, {
      params: {
        page: params.page ?? 1,
        per_page: params.per_page ?? 10,
        search: params.search || undefined,
        unit_transaction_id: params.unit_transaction_id || undefined,
      }
    });
    const payload = ensureSuccess(response.data);

    // Mapping from Laravel paginated format to our expected format
    const data = (payload?.data || []).map(mapRefund);

    return {
      data,
      meta: mapLaravelPaginationMeta(payload),
    };
  },

  async getRefundDetail(id: string): Promise<UnitTransactionRefund> {
    const response = await apiClient.get<LaravelApiResponse<any>>(`${BASE_PATH}/${id}`);
    const payload = ensureSuccess(response.data);
    return mapRefund(payload);
  },

  /**
   * POST Create New Refund
   */
  async createRefund(payload: CreateRefundPayload): Promise<UnitTransactionRefund> {
    const formData = new FormData();
    formData.append('unit_transaction_id', payload.unit_transaction_id);
    formData.append('refund_date', payload.refund_date);
    formData.append('refund_amount', String(payload.refund_amount));
    if (payload.note) {
      formData.append('note', payload.note);
    }
    if (payload.company_id) {
      formData.append('company_id', String(payload.company_id));
    }

    appendRefundItemDetailIds(formData, payload.unit_transaction_item_detail_ids);

    const response = await apiClient.post<LaravelApiResponse<any>>(BASE_PATH, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });

    const result = ensureSuccess(response.data);
    return mapRefund(result);
  },

  async updateRefund(id: string, payload: UpdateRefundPayload): Promise<UnitTransactionRefund> {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    if (payload.unit_transaction_id) formData.append('unit_transaction_id', payload.unit_transaction_id);
    if (payload.refund_date) formData.append('refund_date', payload.refund_date);
    if (payload.refund_amount !== undefined) formData.append('refund_amount', String(payload.refund_amount));
    if (payload.note !== undefined) formData.append('note', payload.note);
    if (payload.company_id) formData.append('company_id', String(payload.company_id));
    appendRefundItemDetailIds(formData, payload.unit_transaction_item_detail_ids);

    const response = await apiClient.post<LaravelApiResponse<any>>(`${BASE_PATH}/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const result = ensureSuccess(response.data);
    return mapRefund(result);
  },

  async deleteRefund(id: string, deleteFinanceRefund: boolean = true): Promise<void> {
    const response = await apiClient.delete<LaravelApiResponse<any>>(`${BASE_PATH}/${id}`, {
      params: {
        'delete-finance-refund': deleteFinanceRefund,
      },
    });
    ensureSuccess(response.data);
  },

  /**
   * POST Create Refund Payment (Cicilan)
   */
  async createRefundPayment(payload: CreateRefundPaymentPayload): Promise<void> {
    const body = new URLSearchParams();
    body.append('unit_transaction_refund_id', payload.unit_transaction_refund_id);
    body.append('amount', String(payload.amount));
    body.append('payment_date', payload.payment_date);
    if (payload.note) {
      body.append('note', payload.note);
    }
    if (payload.cash_id) {
      body.append('cash_id', String(payload.cash_id));
    }

    const response = await apiClient.post<LaravelApiResponse<any>>(PAYMENT_PATH, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    ensureSuccess(response.data);
  },

  async updateRefundPayment(id: string, payload: UpdateRefundPaymentPayload): Promise<void> {
    const body = new URLSearchParams();
    if (payload.unit_transaction_refund_id) body.append('unit_transaction_refund_id', payload.unit_transaction_refund_id);
    if (payload.amount !== undefined) body.append('amount', String(payload.amount));
    if (payload.payment_date) body.append('payment_date', payload.payment_date);
    if (payload.note !== undefined) body.append('note', payload.note);
    if (payload.cash_id) body.append('cash_id', String(payload.cash_id));

    const response = await apiClient.put<LaravelApiResponse<any>>(`${PAYMENT_PATH}/${id}`, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    ensureSuccess(response.data);
  },

  async deleteRefundPayment(id: string): Promise<void> {
    const response = await apiClient.delete<LaravelApiResponse<any>>(`${PAYMENT_PATH}/${id}`);
    ensureSuccess(response.data);
  },

  /**
   * GET Unit Transaction Item Detail (for multi-select)
   */
  async getTransactionItemDetails(params: { page?: number; per_page?: number; search?: string } = {}) {
    const response = await apiClient.get<LaravelApiResponse<any>>(ITEM_DETAIL_PATH, {
      params: {
        page: params.page ?? 1,
        per_page: params.per_page ?? 100, // as requested
        search: params.search || undefined,
      }
    });

    const payload = ensureSuccess(response.data);

    return {
      ...payload,
      data: Array.isArray(payload?.data) ? payload.data.map(mapItemDetail) : [],
    };
  },

  /**
   * GET Detail Transaction
   */
  async getTransactionDetail(id: string) {
    const response = await apiClient.get<LaravelApiResponse<any>>(`${TRANSACTION_PATH}/${id}`);
    const payload = ensureSuccess(response.data);
    return payload;
  }
};
