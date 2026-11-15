import { LedgerReportParams, LedgerReportResponse } from '@/@types/ledger-report.types';
import { apiClient } from '@/lib/api/client';
import { ApiResponseError } from '@/lib/api/response';
import { downloadFileFromResponse, extractBlobErrorMessage } from '@/utils/download';

const basePath = '/wapi/report/ledger-report';

const compactParams = (params: LedgerReportParams = {}) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
  return Object.fromEntries(entries);
};

export const getLedgerReport = async (params?: LedgerReportParams): Promise<LedgerReportResponse> => {
  const response = await apiClient.get<LedgerReportResponse>(basePath, {
    params: compactParams(params),
  });

  return response.data;
};

export const exportLedgerReport = async (params?: LedgerReportParams): Promise<void> => {
  try {
    const response = await apiClient.get(`${basePath}/export`, {
      params: compactParams(params),
      responseType: 'blob',
    });

    await downloadFileFromResponse(response, `Laporan_Buku_Besar_${new Date().getTime()}.xlsx`);
  } catch (error: any) {
    if (error instanceof ApiResponseError) {
      throw error;
    }
    const message = await extractBlobErrorMessage(error, 'Gagal export laporan buku besar');
    throw new ApiResponseError(message);
  }
};
