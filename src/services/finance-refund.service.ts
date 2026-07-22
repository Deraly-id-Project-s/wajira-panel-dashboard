import type { FinanceRefundListResponse, FinanceRefundQueryParams, FinanceRefundRecord, UpdateFinanceRefundPayload } from '@/@types/finance-refund.types';
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
    note: refundDetail.note || item.note || '',
    status: normalizeRefundStatus(item.status),
    cashId: item.cash_id ? toString(item.cash_id) : undefined,
    cashName: item.cash?.cash_name || undefined,
    transactionId: toString(refundDetail.unit_transaction_id ?? transaction?.id),
    transactionCode: transaction?.code || refundDetail.sales_number || refundDetail.purchase_number || '-',
    transactionType,
    partnerName: partner?.name || '-',
    payments: Array.isArray(item.payments) ? item.payments.map(mapPayment) : [],
    createdAt: item.created_at || '',
  };
};


export const financeRefundService = {
  async getRefundList(params: FinanceRefundQueryParams = {}): Promise<FinanceRefundListResponse> {
    const isSales = params.transactionType === 'sales';
    const urlPath = isSales ? '/wapi/finance/refund' : '/wapi/finance/finance-refund';

    const response = await apiClient.get<LaravelApiResponse<any>>(urlPath, {
      params: {
        page: params.page ?? 1,
        per_page: params.per_page ?? 10,
        search: params.search || undefined,
        status: params.status && params.status !== 'all' ? params.status : undefined,
        refund_type: params.transactionType || undefined,
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
};
