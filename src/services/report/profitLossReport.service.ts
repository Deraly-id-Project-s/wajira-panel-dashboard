import type {
  ProfitLossReportFilters,
  ProfitLossReportResponse,
  ProfitLossTemplatePayload,
  ProfitLossTemplateResponse,
  ProfitLossTemplateYearResponse,
  SaveProfitLossTemplateYearPayload,
} from '@/@types/profit-loss-report.types';
import { apiClient } from '@/lib/api/client';
import { ApiResponseError } from '@/lib/api/response';

const basePath = '/wapi/report/profit-loss-report';

export const getProfitLossReport = async (
  companyId: string | number,
  filters: ProfitLossReportFilters = {},
): Promise<ProfitLossReportResponse> => {
  const response = await apiClient.get<ProfitLossReportResponse>(`${basePath}/${companyId}`, {
    params: {
      year: filters.year || undefined,
      month: filters.month || undefined,
    },
  });
  return response.data;
};

export const getProfitLossTemplate = async (
  companyId: string | number,
  year?: number,
): Promise<ProfitLossTemplateResponse> => {
  const response = await apiClient.get<ProfitLossTemplateResponse>(
    `${basePath}/${companyId}/template`,
    {
      params: {
        year: year || undefined,
      },
    },
  );
  return response.data;
};

export const getProfitLossTemplateYear = async (
  companyId: string | number,
  year: number | string,
): Promise<ProfitLossTemplateYearResponse> => {
  const response = await apiClient.get<ProfitLossTemplateYearResponse>(
    `${basePath}/${companyId}/year/${year}`,
  );
  return response.data;
};

export const createProfitLossTemplateYear = async (
  companyId: string | number,
  payload: SaveProfitLossTemplateYearPayload,
): Promise<ProfitLossTemplateYearResponse> => {
  const response = await apiClient.post<ProfitLossTemplateYearResponse>(
    `${basePath}/${companyId}/year`,
    payload,
  );
  return response.data;
};

export const updateProfitLossTemplateYear = async (
  companyId: string | number,
  year: number | string,
  payload: SaveProfitLossTemplateYearPayload,
): Promise<ProfitLossTemplateYearResponse> => {
  const response = await apiClient.put<ProfitLossTemplateYearResponse>(
    `${basePath}/${companyId}/year/${year}`,
    payload,
  );
  return response.data;
};

export const deleteProfitLossTemplateYear = async (
  companyId: string | number,
  year: number | string,
): Promise<{ status?: boolean; message?: string }> => {
  const response = await apiClient.delete<{ status?: boolean; message?: string }>(
    `${basePath}/${companyId}/year/${year}`,
  );
  return response.data;
};

export const updateProfitLossTemplate = async (
  companyId: string | number,
  payload: ProfitLossTemplatePayload,
): Promise<ProfitLossReportResponse> => {
  const response = await apiClient.put<ProfitLossReportResponse>(
    `${basePath}/${companyId}/template`,
    payload,
  );

  return response.data;
};

export const exportProfitLossReport = async (
  companyId: string | number,
  filters: ProfitLossReportFilters = {},
): Promise<void> => {
  const response = await apiClient.get(`${basePath}/${companyId}/export`, {
    params: {
      year: filters.year || undefined,
      month: filters.month || undefined,
    },
    responseType: 'blob',
  });

  const contentType = response.headers['content-type'];
  const isJson = typeof contentType === 'string' && contentType.includes('application/json');

  if (isJson) {
    const textData = await (response.data as Blob).text();
    const jsonResponse = JSON.parse(textData);
    throw new ApiResponseError(jsonResponse.message ?? 'Gagal export laporan laba rugi');
  }

  const url = window.URL.createObjectURL(new Blob([response.data as Blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Laporan_Laba_Rugi_${new Date().getTime()}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
