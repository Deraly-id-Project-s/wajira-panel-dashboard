import type {
  GeneralJournal,
  GeneralJournalFilterParams,
  GeneralJournalPayload,
} from '@/@types/general-journal.types';
import type { PaginationMeta } from '@/@types/pagination.types';
import { apiClient } from '@/lib/api/client';
import { ensureSuccess, mapLaravelPaginationMeta, type LaravelApiResponse } from '@/lib/api/response';

const BASE_PATH = '/wapi/finance/general-journal';

export interface GeneralJournalListResult {
  data: GeneralJournal[];
  meta: PaginationMeta;
}

const buildFormData = (payload: GeneralJournalPayload): FormData => {
  const formData = new FormData();
  formData.append('company_id', String(payload.company_id));
  formData.append('date', payload.date);
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
    payload.billings.forEach((billing, index) => {
      if (billing.id) formData.append(`billings[${index}][id]`, String(billing.id));
      formData.append(`billings[${index}][account_id]`, String(billing.account_id));
      formData.append(`billings[${index}][type]`, billing.type);
      formData.append(`billings[${index}][amount]`, String(billing.amount));
      if (billing.amount_original !== undefined && billing.amount_original !== null) {
        formData.append(`billings[${index}][amount_original]`, String(billing.amount_original));
      } else if (!payload.is_usd_transaction) {
        formData.append(`billings[${index}][amount_original]`, String(billing.amount));
      }
      if (billing.payment_at) formData.append(`billings[${index}][payment_at]`, billing.payment_at);
      if (billing.note) formData.append(`billings[${index}][note]`, billing.note);
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
  const formData = buildFormData(payload);
  const response = await apiClient.post<LaravelApiResponse<GeneralJournal>>(BASE_PATH, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return ensureSuccess(response.data);
};

export const updateGeneralJournal = async (
  id: number | string,
  payload: GeneralJournalPayload,
): Promise<GeneralJournal> => {
  const formData = buildFormData(payload);
  // Laravel supports method spoofing for multipart PUT
  formData.append('_method', 'PUT');

  const response = await apiClient.post<LaravelApiResponse<GeneralJournal>>(`${BASE_PATH}/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
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
