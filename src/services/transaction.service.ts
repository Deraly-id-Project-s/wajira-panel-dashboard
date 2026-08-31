import { Transaction, TransactionSummary, CreateTransactionRequest } from '@/@types/transaction.types';
import { apiClient } from '@/lib/api/client';
import { ensureSuccess, type LaravelApiResponse, ApiResponseError } from '@/lib/api/response';

const basePath = '/wapi/transaction/transaction-flow';

type TransactionFlowApiModel = {
  id: number;
  uuid: string;
  company_id: number;
  unit_transaction_id: number | null;
  transaction_date: string;
  description: string | null;
  bank_usd_debit: string | number | null;
  bank_usd_credit: string | number | null;
  bank_idr_debit: string | number | null;
  bank_idr_credit: string | number | null;
  cash_idr_debit: string | number | null;
  cash_idr_credit: string | number | null;
  created_at?: string;
  updated_at?: string;
  unit_transaction?: unknown;
};

type PaginatedResponse = LaravelApiResponse<{
  current_page: number;
  data: TransactionFlowApiModel[];
  perPage: number;
  total: number;
}>;

type ItemResponse = LaravelApiResponse<TransactionFlowApiModel>;

const mapTransaction = (item: TransactionFlowApiModel): Transaction => ({
  id: String(item.id),
  uuid: item.uuid,
  companyId: String(item.company_id),
  unitTransactionId: item.unit_transaction_id,
  date: item.transaction_date,
  name: item.description ?? '',
  description: item.description ?? '',
  debitUSD: Number(item.bank_usd_debit || 0),
  creditUSD: Number(item.bank_usd_credit || 0),
  debitIDR: Number(item.bank_idr_debit || 0),
  creditIDR: Number(item.bank_idr_credit || 0),
  debitCash: Number(item.cash_idr_debit || 0),
  creditCash: Number(item.cash_idr_credit || 0),
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

export const getTransactions = async (companyId: string, page = 1, limit = 25, search = '', startDate?: string, endDate?: string) => {
  const response = await apiClient.get<PaginatedResponse>(basePath, {
    params: {
      company_id: companyId,
      page,
      perPage: limit,
      description: search || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    },
  });

  const payload = ensureSuccess(response.data);
  const list = payload.data ?? [];

  return {
    data: list.map(mapTransaction),
    total: Number(payload.total ?? list.length),
    page: Number(payload.current_page ?? page),
    limit: Number(payload.perPage ?? limit),
  };
};

export const getTransactionById = async (id: string): Promise<Transaction> => {
  const response = await apiClient.get<ItemResponse>(`${basePath}/${id}`);
  const data = ensureSuccess(response.data);
  return mapTransaction(data);
};

const buildPayload = (payload: Partial<CreateTransactionRequest>) => {
  const body: Record<string, any> = {};
  if (payload.companyId !== undefined) body.company_id = payload.companyId;
  if (payload.unitTransactionId !== undefined) body.unit_transaction_id = payload.unitTransactionId ?? null;
  if (payload.date !== undefined) body.transaction_date = payload.date;
  if (payload.description !== undefined || payload.name !== undefined) body.description = payload.description ?? payload.name ?? '';
  if (payload.debitUSD !== undefined) body.bank_usd_debit = payload.debitUSD ?? 0;
  if (payload.creditUSD !== undefined) body.bank_usd_credit = payload.creditUSD ?? 0;
  if (payload.debitIDR !== undefined) body.bank_idr_debit = payload.debitIDR ?? 0;
  if (payload.creditIDR !== undefined) body.bank_idr_credit = payload.creditIDR ?? 0;
  if (payload.debitCash !== undefined) body.cash_idr_debit = payload.debitCash ?? 0;
  if (payload.creditCash !== undefined) body.cash_idr_credit = payload.creditCash ?? 0;
  return body;
};

export const createTransaction = async (payload: CreateTransactionRequest): Promise<Transaction> => {
  const response = await apiClient.post<ItemResponse>(basePath, buildPayload(payload));
  const data = ensureSuccess(response.data);
  return mapTransaction(data);
};

export const updateTransaction = async (id: string, payload: Partial<CreateTransactionRequest>): Promise<Transaction> => {
  const response = await apiClient.put<ItemResponse>(`${basePath}/${id}`, buildPayload(payload));
  const data = ensureSuccess(response.data);
  return mapTransaction(data);
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${basePath}/${id}`);
  const payload = response.data;
  if (payload.status === false) {
    throw new ApiResponseError(payload.message ?? 'Failed to delete transaction');
  }
};

export const exportTransactions = async (companyId: string, search = ''): Promise<void> => {
  const response = await apiClient.get(`${basePath}/export`, {
    params: {
      company_id: companyId,
      description: search || undefined,
    },
    responseType: 'blob',
  });

  const contentType = response.headers['content-type'];
  const isJson = typeof contentType === 'string' && contentType.includes('application/json');

  if (isJson) {
    const textData = await (response.data as Blob).text();
    const jsonResponse = JSON.parse(textData);
    throw new ApiResponseError(jsonResponse.message ?? 'Gagal mengekspor arus transaksi');
  }

  const url = window.URL.createObjectURL(new Blob([response.data as Blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Arus_Transaksi_${Date.now()}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const getTransactionSummary = async (companyId: string): Promise<TransactionSummary> => {
  // Fetch first page with a higher limit to approximate totals.
  const result = await getTransactions(companyId, 1, 500, '');
  const totals = result.data.reduce(
    (acc, curr) => {
      acc.totalBcaUsd += (curr.debitUSD || 0) - (curr.creditUSD || 0);
      acc.totalBcaIdr += (curr.debitIDR || 0) - (curr.creditIDR || 0);
      acc.totalCashIdr += (curr.debitCash || 0) - (curr.creditCash || 0);
      return acc;
    },
    { totalBcaUsd: 0, totalBcaIdr: 0, totalCashIdr: 0 } as TransactionSummary,
  );

  return totals;
};
