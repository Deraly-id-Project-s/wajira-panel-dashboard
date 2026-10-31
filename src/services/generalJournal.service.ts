import type {
  GeneralJournal,
  GeneralJournalFilterParams,
  GeneralJournalPayload,
  GeneralJournalBillingPayment,
  GeneralJournalBillingPaymentPayload,
  GeneralJournalBillingPaymentUpdatePayload,
} from '@/@types/general-journal.types';
import type { PaginationMeta } from '@/@types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { ensureSuccess, mapLaravelPaginationMeta, type LaravelApiResponse } from '@/lib/api/response';

const BASE_PATH = '/wapi/finance/general-journal';
const BILLING_PAYMENT_BASE_PATH = '/wapi/finance/general-journal-billing-payment';

export interface GeneralJournalListResult {
  data: GeneralJournal[];
  meta: PaginationMeta;
}

const buildJournalFormData = (payload: GeneralJournalPayload, isUpdate = false): FormData => {
  const formData = new FormData();
  if (isUpdate) {
    formData.append('_method', 'PUT');
  }

  formData.append('company_id', String(payload.company_id));
  formData.append('date', payload.date);
  if (payload.type) formData.append('type', payload.type);
  if (payload.note) formData.append('note', payload.note);

  if (payload.amount !== undefined && payload.amount !== null) {
    formData.append('amount', String(payload.amount));
  }

  if (payload.amount_original !== undefined && payload.amount_original !== null) {
    formData.append('amount_original', String(payload.amount_original));
  }

  if (payload.is_usd_transaction !== undefined) {
    formData.append('is_usd_transaction', payload.is_usd_transaction ? '1' : '0');
  }

  if (payload.payment_proof instanceof File) {
    formData.append('payment_proof', payload.payment_proof);
  }

  if (payload.billings && payload.billings.length > 0) {
    payload.billings.forEach((billing, bIndex) => {
      if (billing.id) formData.append(`billings[${bIndex}][id]`, String(billing.id));
      if (billing.date) formData.append(`billings[${bIndex}][date]`, billing.date);
      if (billing.note) formData.append(`billings[${bIndex}][note]`, billing.note);

      if (billing.cashes && billing.cashes.length > 0) {
        billing.cashes.forEach((cash, cIndex) => {
          if (cash.id) formData.append(`billings[${bIndex}][cashes][${cIndex}][id]`, String(cash.id));
          formData.append(`billings[${bIndex}][cashes][${cIndex}][cash_id]`, String(cash.cash_id));
          formData.append(`billings[${bIndex}][cashes][${cIndex}][amount]`, String(cash.amount));
          if (cash.type) formData.append(`billings[${bIndex}][cashes][${cIndex}][type]`, cash.type);
        });
      }
    });
  }

  return formData;
};

export const fetchGeneralJournals = async (
  params: GeneralJournalFilterParams = {},
): Promise<GeneralJournalListResult> => {
  const queryParams = Object.entries(params).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});

  const response = await apiClient.get<LaravelApiResponse<{ data: GeneralJournal[]; current_page: number; per_page: number; total: number; last_page: number }>>(
    BASE_PATH,
    { params: queryParams },
  );

  const payload = ensureSuccess(response.data);
  return {
    data: payload.data ?? [],
    meta: mapLaravelPaginationMeta(payload),
  };
};

export const fetchGeneralJournalDetail = async (id: number | string): Promise<GeneralJournal> => {
  const response = await apiClient.get<LaravelApiResponse<GeneralJournal>>(`${BASE_PATH}/${id}`);
  return ensureSuccess(response.data);
};

export const createGeneralJournal = async (payload: GeneralJournalPayload): Promise<GeneralJournal> => {
  if (payload.payment_proof instanceof File) {
    const formData = buildJournalFormData(payload, false);
    const response = await apiClient.post<LaravelApiResponse<GeneralJournal>>(BASE_PATH, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return ensureSuccess(response.data);
  }

  const jsonBody = {
    company_id: payload.company_id,
    date: payload.date,
    ...(payload.type ? { type: payload.type } : {}),
    note: payload.note || null,
    is_usd_transaction: payload.is_usd_transaction,
    amount: payload.amount,
    amount_original: payload.amount_original,
    billings: payload.billings,
  };

  const response = await apiClient.post<LaravelApiResponse<GeneralJournal>>(BASE_PATH, jsonBody);
  return ensureSuccess(response.data);
};

export const updateGeneralJournal = async (
  id: number | string,
  payload: GeneralJournalPayload,
): Promise<GeneralJournal> => {
  if (payload.payment_proof instanceof File) {
    const formData = buildJournalFormData(payload, true);
    const response = await apiClient.post<LaravelApiResponse<GeneralJournal>>(`${BASE_PATH}/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return ensureSuccess(response.data);
  }

  const jsonBody = {
    company_id: payload.company_id,
    date: payload.date,
    ...(payload.type ? { type: payload.type } : {}),
    note: payload.note || null,
    is_usd_transaction: payload.is_usd_transaction,
    amount: payload.amount,
    amount_original: payload.amount_original,
    billings: payload.billings,
  };

  const response = await apiClient.put<LaravelApiResponse<GeneralJournal>>(`${BASE_PATH}/${id}`, jsonBody);
  return ensureSuccess(response.data);
};

export const toggleGeneralJournalPaidStatus = async ({
  id,
  isPaid,
}: {
  id: number | string;
  isPaid: boolean;
}): Promise<GeneralJournal> => {
  const response = await apiClient.put<LaravelApiResponse<GeneralJournal>>(`${BASE_PATH}/${id}/paid-status`, {
    is_paid: isPaid,
  });
  return ensureSuccess(response.data);
};

export const deleteGeneralJournal = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${BASE_PATH}/${id}`);
  ensureSuccess(response.data);
};

// ==========================================
// Billing Payments Services
// ==========================================

export const createGeneralJournalBillingPayment = async (
  payload: GeneralJournalBillingPaymentPayload,
): Promise<GeneralJournalBillingPayment> => {
  if (payload.transaction_proof instanceof File) {
    const formData = new FormData();
    formData.append('general_journal_billing_id', String(payload.general_journal_billing_id));
    formData.append('account_id', String(payload.account_id));
    formData.append('amount', String(payload.amount));
    if (payload.amount_original !== undefined) {
      formData.append('amount_original', String(payload.amount_original));
    }
    if (payload.note) formData.append('note', payload.note);
    formData.append('transaction_proof', payload.transaction_proof);

    const response = await apiClient.post<LaravelApiResponse<GeneralJournalBillingPayment>>(
      BILLING_PAYMENT_BASE_PATH,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return ensureSuccess(response.data);
  }

  const jsonBody = {
    general_journal_billing_id: payload.general_journal_billing_id,
    account_id: payload.account_id,
    amount: payload.amount,
    amount_original: payload.amount_original ?? 0,
    note: payload.note ?? null,
  };

  const response = await apiClient.post<LaravelApiResponse<GeneralJournalBillingPayment>>(
    BILLING_PAYMENT_BASE_PATH,
    jsonBody,
  );
  return ensureSuccess(response.data);
};

export const updateGeneralJournalBillingPayment = async (
  id: number | string,
  payload: GeneralJournalBillingPaymentUpdatePayload,
): Promise<GeneralJournalBillingPayment> => {
  if (payload.transaction_proof instanceof File) {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    if (payload.account_id !== undefined) formData.append('account_id', String(payload.account_id));
    if (payload.amount !== undefined) formData.append('amount', String(payload.amount));
    if (payload.amount_original !== undefined) {
      formData.append('amount_original', String(payload.amount_original));
    }
    if (payload.note !== undefined && payload.note !== null) formData.append('note', payload.note);
    formData.append('transaction_proof', payload.transaction_proof);

    const response = await apiClient.post<LaravelApiResponse<GeneralJournalBillingPayment>>(
      `${BILLING_PAYMENT_BASE_PATH}/${id}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return ensureSuccess(response.data);
  }

  const jsonBody: Record<string, unknown> = {};
  if (payload.account_id !== undefined) jsonBody.account_id = payload.account_id;
  if (payload.amount !== undefined) jsonBody.amount = payload.amount;
  if (payload.amount_original !== undefined) jsonBody.amount_original = payload.amount_original;
  if (payload.note !== undefined) jsonBody.note = payload.note;

  const response = await apiClient.put<LaravelApiResponse<GeneralJournalBillingPayment>>(
    `${BILLING_PAYMENT_BASE_PATH}/${id}`,
    jsonBody,
  );
  return ensureSuccess(response.data);
};

export const deleteGeneralJournalBillingPayment = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${BILLING_PAYMENT_BASE_PATH}/${id}`);
  ensureSuccess(response.data);
};
