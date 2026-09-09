import type {
  BalanceReportCashListResponse,
  BalanceReportFilters,
  BalanceReportCashPayload,
  BalanceReportResponse,
  BalanceReportTemplatePayload,
} from '@/@types/balance-report.types';
import type { Kas } from '@/@types/kas.types';
import { apiClient } from '@/lib/api/client';
import { ApiResponseError } from '@/lib/api/response';

const basePath = '/wapi/report/balance-report';

export const getBalanceReport = async (
  companyId: string | number,
  filters: BalanceReportFilters = {},
): Promise<BalanceReportResponse> => {
  const response = await apiClient.get<BalanceReportResponse>(`${basePath}/${companyId}`, {
    params: {
      start_date: filters.start_date || undefined,
      end_date: filters.end_date || undefined,
    },
  });
  return response.data;
};

export const updateBalanceReportTemplate = async (
  companyId: string | number,
  payload: BalanceReportTemplatePayload,
): Promise<BalanceReportResponse> => {
  const response = await apiClient.put<BalanceReportResponse>(
    `${basePath}/${companyId}/template`,
    payload,
  );

  return response.data;
};

export const createBalanceReportCash = async (
  companyId: string | number,
  payload: BalanceReportCashPayload,
): Promise<BalanceReportResponse> => {
  const response = await apiClient.post<BalanceReportResponse>(
    `${basePath}/${companyId}/cash`,
    payload,
  );

  return response.data;
};

export const updateBalanceReportCash = async (
  companyId: string | number,
  cashId: string | number,
  payload: BalanceReportCashPayload,
): Promise<BalanceReportResponse> => {
  const response = await apiClient.put<BalanceReportResponse>(
    `${basePath}/${companyId}/cash/${cashId}`,
    payload,
  );

  return response.data;
};

export const deleteBalanceReportCash = async (
  companyId: string | number,
  cashId: string | number,
): Promise<BalanceReportResponse> => {
  const response = await apiClient.delete<BalanceReportResponse>(
    `${basePath}/${companyId}/cash/${cashId}`,
  );

  return response.data;
};

export const getBalanceReportCashOptions = async (
  companyId: string | number,
): Promise<Kas[]> => {
  const response = await apiClient.get<BalanceReportCashListResponse | { data?: { data?: Kas[] } }>(
    '/wapi/master-data/cash',
    { params: { company_id: companyId } },
  );

  const payload = response.data;
  const data = payload?.data;

  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
    return data.data;
  }

  if ('status' in payload && payload.status === false) {
    throw new ApiResponseError(payload.message ?? 'Gagal memuat data kas');
  }

  return [];
};
