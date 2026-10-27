import { JournalReportParams, JournalReportResponse } from '@/@types/journal-report.types';
import { apiClient } from '@/lib/api/client';
import { ApiResponseError } from '@/lib/api/response';
import { downloadFileFromResponse, extractBlobErrorMessage } from '@/utils/download';

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
  try {
    const response = await apiClient.get(`${basePath}/export`, {
      params: compactParams(params),
      responseType: 'blob',
    });

    await downloadFileFromResponse(response, `Laporan_Jurnal_${new Date().getTime()}.xlsx`);
  } catch (error: any) {
    if (error instanceof ApiResponseError) {
      throw error;
    }
    const message = await extractBlobErrorMessage(error, 'Gagal export laporan jurnal');
    throw new ApiResponseError(message);
  }
};
