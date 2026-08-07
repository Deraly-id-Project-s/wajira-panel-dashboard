import { apiClient } from '@/lib/api/client';
import { ensureSuccess, mapLaravelPaginationMeta, type LaravelApiResponse } from '@/lib/api/response';
import { PaginationParams, PaginationMeta } from '@/@types/pagination.types';
import {
  SparepartTransaction,
  SparepartTransactionResponse,
  CreateSparepartTransactionPayload,
  UpdateSparepartTransactionPayload,
  SparepartTransactionBillingHistory,
  CreateSparepartTransactionBillingHistoryPayload,
  UpdateSparepartTransactionBillingHistoryPayload,
} from '@/@types/sparepart-transaction.types';

const basePath = '/wapi/transaction/sparepart-transaction/sparepart-transaction';
const billingPath = '/wapi/transaction/sparepart-transaction/sparepart-transaction-billing-history';

export const sparepartTransactionService = {
  // --- Sparepart Transaction ---
  
  async getSparepartTransactions(
    params: PaginationParams & {
      warehouse_id?: number | string;
      is_refunded?: boolean;
      code?: string;
      type?: 'purchase' | 'sales';
      person_id?: number | string;
      sparepart_id?: number | string;
      billing_type?: 'cash' | 'credit';
      company_id?: number | string;
      start_date?: string | null;
      end_date?: string | null;
    } = {}
  ): Promise<SparepartTransactionResponse> {
    const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
      params: {
        page: params.page ?? 1,
        per_page: params.perPage ?? 10,
        sort_order: 'desc',
        search: params.search || undefined,
        warehouse_id: params.warehouse_id || undefined,
        is_refunded: params.is_refunded ?? undefined,
        code: params.code || undefined,
        type: params.type || undefined,
        person_id: params.person_id || undefined,
        sparepart_id: params.sparepart_id || undefined,
        billing_type: params.billing_type || undefined,
        company_id: params.company_id || undefined,
        start_date: params.start_date || undefined,
        end_date: params.end_date || undefined,
      },
    });

    const payload = ensureSuccess(response.data);
    return {
      data: payload.data ?? [],
      meta: mapLaravelPaginationMeta(payload),
    };
  },

  async getSparepartTransactionById(id: string): Promise<SparepartTransaction> {
    const response = await apiClient.get<LaravelApiResponse<SparepartTransaction>>(`${basePath}/${id}`);
    return ensureSuccess(response.data);
  },

  async createSparepartTransaction(payload: CreateSparepartTransactionPayload): Promise<SparepartTransaction> {
    const form = new FormData();
    form.append('warehouse_id', String(payload.warehouse_id));
    form.append('person_id', String(payload.person_id));
    form.append('sparepart_id', String(payload.sparepart_id));
    form.append('type', payload.type);
    form.append('billing_type', payload.billing_type);
    form.append('qty', String(payload.qty));
    form.append('price', String(payload.price));
    form.append('discount', String(payload.discount));
    form.append('transaction_date', payload.transaction_date);
    form.append('nota_number', payload.nota_number);

    if (payload.billing_due_date) form.append('billing_due_date', payload.billing_due_date);
    if (payload.note) form.append('note', payload.note);
    if (payload.invoice_file) form.append('invoice_file', payload.invoice_file);

    const response = await apiClient.post<LaravelApiResponse<SparepartTransaction>>(basePath, form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return ensureSuccess(response.data);
  },

  async updateSparepartTransaction(id: string, payload: UpdateSparepartTransactionPayload): Promise<SparepartTransaction> {
    const form = new FormData();
    form.append('_method', 'PUT');
    form.append('warehouse_id', String(payload.warehouse_id));
    form.append('person_id', String(payload.person_id));
    form.append('sparepart_id', String(payload.sparepart_id));
    form.append('type', payload.type);
    form.append('billing_type', payload.billing_type);
    form.append('qty', String(payload.qty));
    form.append('price', String(payload.price));
    form.append('discount', String(payload.discount));
    form.append('transaction_date', payload.transaction_date);
    form.append('nota_number', payload.nota_number);

    if (payload.billing_due_date) form.append('billing_due_date', payload.billing_due_date);
    if (payload.note) form.append('note', payload.note);
    if (payload.invoice_file) form.append('invoice_file', payload.invoice_file);

    const response = await apiClient.post<LaravelApiResponse<SparepartTransaction>>(`${basePath}/${id}`, form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return ensureSuccess(response.data);
  },

  async deleteSparepartTransaction(id: string): Promise<void> {
    await apiClient.delete<LaravelApiResponse<null>>(`${basePath}/${id}`);
  },

  async updateBillingPaymentStatus(billingId: string, isPaid: boolean): Promise<void> {
    const data = new URLSearchParams();
    data.append('is_paid', String(isPaid));

    await apiClient.put<LaravelApiResponse<null>>(`/wapi/transaction/sparepart-transaction/sparepart-transaction-billing/${billingId}`, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },

  // --- Sparepart Transaction Billing History ---

  async getBillingHistories(
    params: PaginationParams & {
      sparepart_transaction_billing_id?: number | string;
    } = {}
  ): Promise<{ data: SparepartTransactionBillingHistory[]; meta: PaginationMeta }> {
    const response = await apiClient.get<LaravelApiResponse<any>>(billingPath, {
      params: {
        page: params.page ?? 1,
        per_page: params.perPage ?? 25,
        search: params.search || undefined,
        sparepart_transaction_billing_id: params.sparepart_transaction_billing_id || undefined,
      },
    });

    const payload = ensureSuccess(response.data);
    return {
      data: payload.data ?? [],
      meta: mapLaravelPaginationMeta(payload),
    };
  },

  async getBillingHistoryById(id: string): Promise<SparepartTransactionBillingHistory> {
    const response = await apiClient.get<LaravelApiResponse<SparepartTransactionBillingHistory>>(`${billingPath}/${id}`);
    return ensureSuccess(response.data);
  },

  async createBillingHistory(payload: CreateSparepartTransactionBillingHistoryPayload): Promise<SparepartTransactionBillingHistory> {
    const form = new FormData();
    form.append('sparepart_transaction_billing_id', String(payload.sparepart_transaction_billing_id));
    form.append('payment_at', payload.payment_at);
    
    if (payload.bca_payment_amount !== undefined) form.append('bca_payment_amount', String(payload.bca_payment_amount));
    if (payload.bca_payment_usd_amount !== undefined) form.append('bca_payment_usd_amount', String(payload.bca_payment_usd_amount));
    if (payload.cash_payment_amount !== undefined) form.append('cash_payment_amount', String(payload.cash_payment_amount));
    
    if (payload.note) form.append('note', payload.note);
    if (payload.payment_proof) form.append('payment_proof', payload.payment_proof);

    const response = await apiClient.post<LaravelApiResponse<SparepartTransactionBillingHistory>>(billingPath, form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return ensureSuccess(response.data);
  },

  async updateBillingHistory(id: string, payload: UpdateSparepartTransactionBillingHistoryPayload): Promise<SparepartTransactionBillingHistory> {
    const form = new FormData();
    form.append('_method', 'PUT'); // For Laravel form data PUT
    form.append('sparepart_transaction_billing_id', String(payload.sparepart_transaction_billing_id));
    form.append('payment_at', payload.payment_at);
    
    if (payload.bca_payment_amount !== undefined) form.append('bca_payment_amount', String(payload.bca_payment_amount));
    if (payload.bca_payment_usd_amount !== undefined) form.append('bca_payment_usd_amount', String(payload.bca_payment_usd_amount));
    if (payload.cash_payment_amount !== undefined) form.append('cash_payment_amount', String(payload.cash_payment_amount));
    
    if (payload.note) form.append('note', payload.note);
    if (payload.payment_proof) form.append('payment_proof', payload.payment_proof);

    const response = await apiClient.post<LaravelApiResponse<SparepartTransactionBillingHistory>>(`${billingPath}/${id}`, form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return ensureSuccess(response.data);
  },

  async deleteBillingHistory(id: string): Promise<void> {
    await apiClient.delete<LaravelApiResponse<null>>(`${billingPath}/${id}`);
  },
};
