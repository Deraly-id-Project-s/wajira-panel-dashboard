import type {
  GeneralJournalReportParams,
  GeneralJournalReportResponse,
} from '@/@types/general-journal-report.types';
import { apiClient } from '@/lib/api/client';
import { ApiResponseError } from '@/lib/api/response';
import { downloadFileFromResponse, extractBlobErrorMessage } from '@/utils/download';

const BASE_PATH = '/wapi/report/general-journal-report';

const compactParams = (params: GeneralJournalReportParams = {}) => {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== '',
  );
  return Object.fromEntries(entries);
};

export const getGeneralJournalReport = async (
  params?: GeneralJournalReportParams,
): Promise<GeneralJournalReportResponse> => {
  const response = await apiClient.get<GeneralJournalReportResponse>(BASE_PATH, {
    params: compactParams(params),
  });

  return response.data;
};

export const exportGeneralJournalReport = async (
  params?: GeneralJournalReportParams,
): Promise<void> => {
  try {
    const response = await apiClient.get(`${BASE_PATH}/export`, {
      params: compactParams(params),
      responseType: 'blob',
    });

    await downloadFileFromResponse(
      response,
      `Laporan_Jurnal_Umum_${new Date().getTime()}.xlsx`,
    );
  } catch (error: any) {
    if (error instanceof ApiResponseError) {
      throw error;
    }
    const message = await extractBlobErrorMessage(error, 'Gagal export laporan jurnal umum');
    throw new ApiResponseError(message);
  }
};
