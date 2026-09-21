import { LedgerReportParams, LedgerReportResponse } from '@/@types/ledger-report.types';
import { apiClient } from '@/lib/api/client';

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
