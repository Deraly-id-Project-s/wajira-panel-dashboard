import type {
  BalanceColumnReportParams,
  BalanceColumnReportResponse,
} from '@/@types/balance-column-report.types';
import { apiClient } from '@/lib/api/client';
import { ApiResponseError } from '@/lib/api/response';

const basePath = '/wapi/report/balance-column-report';

const compactParams = (params: BalanceColumnReportParams = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );

export const getBalanceColumnReport = async (
  params?: BalanceColumnReportParams,
): Promise<BalanceColumnReportResponse> => {
  const response = await apiClient.get<BalanceColumnReportResponse>(basePath, {
    params: compactParams(params),
  });

  return response.data;
};

export const exportBalanceColumnReport = async (
  params?: BalanceColumnReportParams,
): Promise<void> => {
  const response = await apiClient.get(`${basePath}/export`, {
    params: compactParams(params),
    responseType: 'blob',
  });

  const contentType = response.headers['content-type'];
  if (typeof contentType === 'string' && contentType.includes('application/json')) {
    const textData = await (response.data as Blob).text();
    const jsonResponse = JSON.parse(textData);
    throw new ApiResponseError(jsonResponse.message ?? 'Gagal export laporan neraca lajur');
  }

  const url = window.URL.createObjectURL(new Blob([response.data as Blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Laporan_Neraca_Lajur_${new Date().getTime()}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
