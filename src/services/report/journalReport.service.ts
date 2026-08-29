import { JournalReportParams, JournalReportResponse } from '@/@types/journal-report.types';
import { apiClient } from '@/lib/api/client';
import { ApiResponseError } from '@/lib/api/response';

const basePath = '/wapi/report/journal-report';

const compactParams = (params: JournalReportParams = {}) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
  return Object.fromEntries(entries);
};

export const getJournalReport = async (params?: JournalReportParams): Promise<JournalReportResponse> => {
  const response = await apiClient.get<JournalReportResponse>(basePath, {
    params: compactParams(params),
  });

  return response.data;
};

export const exportJournalReport = async (params?: JournalReportParams): Promise<void> => {
  const response = await apiClient.get(`${basePath}/export`, {
    params: compactParams(params),
    responseType: 'blob',
  });

  const contentType = response.headers['content-type'];
  const isJson = typeof contentType === 'string' && contentType.includes('application/json');

  if (isJson) {
    const textData = await (response.data as Blob).text();
    const jsonResponse = JSON.parse(textData);
    throw new ApiResponseError(jsonResponse.message ?? 'Gagal export laporan jurnal');
  }

  const url = window.URL.createObjectURL(new Blob([response.data as Blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Laporan_Jurnal_${new Date().getTime()}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
