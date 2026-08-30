import type {
  ProfitLossReportResponse,
  ProfitLossTemplatePayload,
} from '@/@types/profit-loss-report.types';
import { apiClient } from '@/lib/api/client';
import { ApiResponseError } from '@/lib/api/response';

const basePath = '/wapi/report/profit-loss-report';

export const getProfitLossReport = async (
  companyId: string | number,
): Promise<ProfitLossReportResponse> => {
  const response = await apiClient.get<ProfitLossReportResponse>(`${basePath}/${companyId}`);
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

export const exportProfitLossReport = async (companyId: string | number): Promise<void> => {
  const response = await apiClient.get(`${basePath}/${companyId}/export`, {
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
