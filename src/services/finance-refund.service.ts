import type {
  FinanceRefundDetail,
  FinanceRefundListResponse,
  FinanceRefundQueryParams,
  FinanceRefundRecord,
  UpdateFinanceRefundPaidStatusPayload,
  UpdateFinanceRefundPayload,
} from '@/@types/finance-refund.types';
import type { UnitTransactionRefundPayment } from '@/@types/refund.type';
import { apiClient } from '@/lib/api/client';
import { ensureSuccess, LaravelApiResponse } from '@/lib/api/response';
import { normalizeRefundStatus, normalizeRefundTransactionType } from '@/components/features/refund/refund.utils';

const BASE_PATH = '/wapi/finance/finance-refund';

const toString = (value: unknown) => String(value ?? '');
const toNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapPayment = (item: any): UnitTransactionRefundPayment => ({
  id: toString(item.id),
  unit_transaction_refund_id: toString(item.unit_transaction_refund_id),
  cash_id: item.cash_id ? toString(item.cash_id) : undefined,
  amount: toNumber(item.amount),
  payment_date: item.payment_date || '',
  created_at: item.created_at || '',
});

const mapFinanceRefund = (item: any): FinanceRefundRecord => {
  const refundDetail = item.unit_transaction_refund ?? item;
  const transaction = refundDetail.transaction ?? refundDetail.unit_transaction ?? null;
  const transactionType = normalizeRefundTransactionType(item.refund_type ?? refundDetail.refund_type ?? transaction?.type);
  const partner = refundDetail.customer ?? refundDetail.supplier ?? transaction?.person ?? null;

  return {
    id: toString(item.id),
    uuid: item.uuid ? String(item.uuid) : undefined,
    code: refundDetail.code || item.code || `FR-${toString(item.id)}`,
    refundCode: refundDetail.refund_number || refundDetail.code || item.code || '-',
    refundDate: refundDetail.refund_date || refundDetail.date || item.refund_date || item.date || '',
    refundAmount: toNumber(refundDetail.refund_amount ?? refundDetail.total_refund ?? item.refund_amount ?? item.total_refund),
    totalTransaction: toNumber(
      transaction?.grand_total ??
      transaction?.total_amount ??
      transaction?.total_price ??
      transaction?.bruto_amount ??
      refundDetail.total_transaction ??
      refundDetail.total_price ??
      item.total_transaction ??
      item.total_price ??
      refundDetail.refund_amount ??
      refundDetail.total_refund ??
      item.refund_amount ??
      item.total_refund
    ),
    remainingPayment: item.remaining_payment !== undefined ? toNumber(item.remaining_payment) : undefined,
    note: refundDetail.note || item.note || '',
    status: normalizeRefundStatus(item.status),
    isPaid: item.is_paid === true || item.is_paid === 1 || item.is_paid === '1',
    cashId: item.cash_id ? toString(item.cash_id) : undefined,
    cashName: item.cash?.cash_name || undefined,
    transactionId: toString(refundDetail.unit_transaction_id ?? transaction?.id),
    transactionCode: transaction?.code || refundDetail.sales_number || refundDetail.purchase_number || '-',
    transactionType,
    partnerName: partner?.name || '-',
    payments: Array.isArray(item.payments) ? item.payments.map(mapPayment) : [],
    financeRefundCashes: Array.isArray(item.financeRefundCashes) ? item.financeRefundCashes : [],
    createdAt: item.created_at || '',
  };
};

const mapFinanceRefundDetail = (item: any): FinanceRefundDetail => {
  return {
    id: toNumber(item?.id),
    uuid: item?.uuid ? String(item.uuid) : undefined,
    code: item?.code || '',
    transaction_of: item?.transaction_of || 'unit_type',
    date: item?.date || '',
    note: item?.note || '',
    is_paid: item?.is_paid === true || item?.is_paid === 1 || item?.is_paid === '1',
    is_valid: item?.is_valid === true || item?.is_valid === 1 || item?.is_valid === '1',
    remaining_payment: toNumber(item?.remaining_payment),
    cash_position: item?.cash_position ? {
      debet_idr_total: toNumber(item.cash_position.debet_idr_total),
      credit_idr_total: toNumber(item.cash_position.credit_idr_total),
      debet_usd_total: toNumber(item.cash_position.debet_usd_total),
      credit_usd_total: toNumber(item.cash_position.credit_usd_total),
    } : undefined,
    financeRefundCashes: Array.isArray(item?.financeRefundCashes) ? item.financeRefundCashes.map((c: any) => ({
      id: toNumber(c.id),
      finance_refund_id: c.finance_refund_id ? toNumber(c.finance_refund_id) : undefined,
      cash_id: toNumber(c.cash_id),
      amount: toNumber(c.amount),
      amount_original: c.amount_original !== undefined ? toNumber(c.amount_original) : undefined,
      type: c.type || 'credit',
      cash: c.cash ? {
        id: toNumber(c.cash.id),
        cash_name: c.cash.cash_name || '',
        currency_type: c.cash.currency_type || 'idr',
        code: c.cash.code || '',
      } : undefined,
    })) : [],
    financeBillings: Array.isArray(item?.financeBillings) ? item.financeBillings.map((b: any) => ({
      id: toNumber(b.id),
      uuid: b.uuid,
      cash_flow_id: toNumber(b.cash_flow_id || b.finance_refund_id),
      cash_id: toNumber(b.cash_id),
      account_id: toNumber(b.account_id),
      amount: toNumber(b.amount),
      amount_original: toNumber(b.amount_original),
      payment_proof: b.payment_proof ?? null,
      payment_at: b.payment_at ?? '',
      note: b.note ?? '',
      created_at: b.created_at ?? '',
      updated_at: b.updated_at ?? '',
      cash: {
        id: toNumber(b.cash?.id),
        uuid: b.cash?.uuid,
        company_id: b.cash?.company_id ? toNumber(b.cash.company_id) : undefined,
        code: b.cash?.code ?? '-',
        cash_name: b.cash?.cash_name ?? '-',
      },
      account: b.account ? {
        id: toNumber(b.account.id),
        uuid: b.account.uuid,
        code: b.account.code,
        name: b.account.name,
        type: b.account.type,
      } : null,
      remaining_payment: b.remaining_payment !== undefined ? toNumber(b.remaining_payment) : undefined,
    })) : [],
  };
};


export const financeRefundService = {
  async getRefundList(params: FinanceRefundQueryParams = {}): Promise<FinanceRefundListResponse> {
    const urlPath = '/wapi/finance/finance-refund';

    const response = await apiClient.get<LaravelApiResponse<any>>(urlPath, {
      params: {
        page: params.page ?? 1,
        per_page: params.per_page ?? 10,
        search: params.search || undefined,
        status: params.status && params.status !== 'all' ? params.status : undefined,
        refund_type: params.transactionType || undefined,
        company_id: params.company_id || undefined,
      },
    });

    const payload = ensureSuccess(response.data);
    const rows = Array.isArray(payload?.data) ? payload.data.map(mapFinanceRefund) : [];

    return {
      data: rows,
      meta: {
        currentPage: payload?.current_page ?? params.page ?? 1,
        perPage: payload?.per_page ?? params.per_page ?? 10,
        total: payload?.total ?? rows.length,
        lastPage: payload?.last_page ?? 1,
        from: rows.length === 0 ? 0 : payload?.from ?? 1,
        to: rows.length === 0 ? 0 : payload?.to ?? rows.length,
      },
    };
  },

  async approveRefund(id: string, payload: UpdateFinanceRefundPayload) {
    const body = new URLSearchParams();
    body.append('status', payload.status);
    if (payload.cash_id) {
      body.append('cash_id', payload.cash_id);
    }

    const response = await apiClient.put<LaravelApiResponse<any>>(`${BASE_PATH}/${id}`, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return ensureSuccess(response.data);
  },

  async getFinanceRefundDetail(id: number | string): Promise<FinanceRefundDetail> {
    let response;
    try {
      response = await apiClient.get<LaravelApiResponse<any>>(`${BASE_PATH}/${id}`);
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.response?.status === 404) {
        response = await apiClient.get<LaravelApiResponse<any>>(`/api/v1/finance-refund/${id}`);
      } else {
        throw error;
      }
    }
    const payload = ensureSuccess(response.data);
    return mapFinanceRefundDetail(payload);
  },

  async updatePaidStatus(id: number | string, payload: UpdateFinanceRefundPaidStatusPayload): Promise<FinanceRefundDetail> {
    let response;
    try {
      response = await apiClient.put<LaravelApiResponse<any>>(`${BASE_PATH}/${id}/paid-status`, payload);
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.response?.status === 404) {
        response = await apiClient.put<LaravelApiResponse<any>>(`/api/v1/finance-refund/${id}/paid-status`, payload);
      } else {
        throw error;
      }
    }
    const payloadResult = ensureSuccess(response.data);
    return mapFinanceRefundDetail(payloadResult);
  },

  async deleteRefund(id: string, deleteFinanceRefund: boolean = true) {
    const urlPath = `/wapi/transaction/unit-transaction/unit-transaction-refund/${id}`;
    const response = await apiClient.delete<LaravelApiResponse<any>>(urlPath, {
      params: {
        'delete-finance-refund': deleteFinanceRefund,
      },
    });
    return ensureSuccess(response.data);
  },
};
