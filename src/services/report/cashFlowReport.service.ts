import type {
  CashFlowReportParams,
  CashFlowReportResponse,
} from '@/@types/cash-flow-report.types';
import { apiClient } from '@/lib/api/client';
import { ApiResponseError } from '@/lib/api/response';
import { downloadFileFromResponse, extractBlobErrorMessage } from '@/utils/download';

const BASE_PATH = '/wapi/report/cash-flow-report';

const compactParams = (params: CashFlowReportParams = {}) => {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== '',
  );
  return Object.fromEntries(entries);
};

export const getCashFlowReport = async (
  params?: CashFlowReportParams,
): Promise<CashFlowReportResponse> => {
  const response = await apiClient.get<CashFlowReportResponse>(BASE_PATH, {
    params: compactParams(params),
  });

  return response.data;
};

export const exportCashFlowReport = async (
  params?: CashFlowReportParams,
): Promise<void> => {
  try {
    const response = await apiClient.get(`${BASE_PATH}/export`, {
      params: compactParams(params),
      responseType: 'blob',
    });

    await downloadFileFromResponse(
      response,
      `laporan_kas_flow_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  } catch (error: any) {
    if (error instanceof ApiResponseError) {
      throw error;
    }
    const message = await extractBlobErrorMessage(error, 'Gagal export laporan transaksi kas');
    throw new ApiResponseError(message);
  }
};
