import type {
  BalanceReportCashListResponse,
  BalanceReportCashPayload,
  BalanceReportFilters,
  BalanceReportResponse,
  BalanceReportTemplatePayload,
  BalanceTemplateResponse,
  BalanceTemplateYearResponse,
  CreateBalanceYearPayload,
  UpdateBalanceYearPayload,
} from '@/@types/balance-report.types';
import type { Kas } from '@/@types/kas.types';
import { apiClient } from '@/lib/api/client';
import { ApiResponseError } from '@/lib/api/response';

const basePath = '/wapi/report/balance-report';

/**
 * 1. Ambil Data Laporan Neraca
 */
export const getBalanceReport = async (
  companyId: string | number,
  filters: BalanceReportFilters = {},
): Promise<BalanceReportResponse> => {
  const response = await apiClient.get<BalanceReportResponse>(`${basePath}/${companyId}`, {
    params: {
      year: filters.year || undefined,
      month: filters.month || undefined,
      start_date: filters.start_date || undefined,
      end_date: filters.end_date || undefined,
      date: filters.date || undefined,
      category: filters.category || undefined,
      account_id: filters.account_id || undefined,
      account_name: filters.account_name || undefined,
      account_code: filters.account_code || undefined,
      search: filters.search || undefined,
    },
  });
  return response.data;
};

/**
 * 2. Ambil Template & Daftar Seluruh Konfigurasi Tahun
 */
export const getBalanceTemplate = async (
  companyId: string | number,
  year?: number,
): Promise<BalanceTemplateResponse> => {
  const response = await apiClient.get<BalanceTemplateResponse>(
    `${basePath}/${companyId}/template`,
    {
      params: year ? { year } : undefined,
    },
  );
  return response.data;
};

/**
 * 3. Ambil Detail Konfigurasi 1 Tahun Tertentu
 */
export const getBalanceYearConfig = async (
  companyId: string | number,
  year: number | string,
): Promise<BalanceTemplateYearResponse> => {
  const response = await apiClient.get<BalanceTemplateYearResponse>(
    `${basePath}/${companyId}/year/${year}`,
  );
  return response.data;
};

/**
 * 4. Tambah Konfigurasi Tahun Baru
 */
export const createBalanceYearConfig = async (
  companyId: string | number,
  payload: CreateBalanceYearPayload,
): Promise<BalanceTemplateYearResponse> => {
  const response = await apiClient.post<BalanceTemplateYearResponse>(
    `${basePath}/${companyId}/year`,
    payload,
  );
  return response.data;
};

/**
 * 5. Update Konfigurasi Tahun Tertentu
 */
export const updateBalanceYearConfig = async (
  companyId: string | number,
  year: number | string,
  payload: UpdateBalanceYearPayload,
): Promise<BalanceTemplateYearResponse> => {
  const response = await apiClient.put<BalanceTemplateYearResponse>(
    `${basePath}/${companyId}/year/${year}`,
    payload,
  );
  return response.data;
};

/**
 * 6. Hapus Konfigurasi Tahun Tertentu
 */
export const deleteBalanceYearConfig = async (
  companyId: string | number,
  year: number | string,
): Promise<{ status?: boolean; message?: string }> => {
  const response = await apiClient.delete<{ status?: boolean; message?: string }>(
    `${basePath}/${companyId}/year/${year}`,
  );
  return response.data;
};

/**
 * 7. Update Kompatibilitas Template
 */
export const updateBalanceTemplate = async (
  companyId: string | number,
  payload: BalanceReportTemplatePayload | UpdateBalanceYearPayload,
): Promise<BalanceReportResponse> => {
  const response = await apiClient.put<BalanceReportResponse>(
    `${basePath}/${companyId}/template`,
    payload,
  );
  return response.data;
};

/**
 * 8. Export Laporan Neraca ke Format Excel (.xlsx)
 */
export const exportBalanceReport = async (
  companyId: string | number,
  filters: BalanceReportFilters = {},
): Promise<void> => {
  const response = await apiClient.get(`${basePath}/${companyId}/export`, {
    params: {
      year: filters.year || undefined,
      month: filters.month || undefined,
      start_date: filters.start_date || undefined,
      end_date: filters.end_date || undefined,
      date: filters.date || undefined,
      category: filters.category || undefined,
      account_id: filters.account_id || undefined,
      account_name: filters.account_name || undefined,
      account_code: filters.account_code || undefined,
      search: filters.search || undefined,
    },
    responseType: 'blob',
  });

  const contentType = response.headers['content-type'];
  const isJson = typeof contentType === 'string' && contentType.includes('application/json');

  if (isJson) {
    const textData = await (response.data as Blob).text();
    const jsonResponse = JSON.parse(textData);
    throw new ApiResponseError(jsonResponse.message ?? 'Gagal export laporan neraca');
  }

  const url = window.URL.createObjectURL(new Blob([response.data as Blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Laporan_Neraca_${companyId}_${filters.year || new Date().getFullYear()}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// ==========================================
// Legacy Fallbacks
// ==========================================
export const updateBalanceReportTemplate = updateBalanceTemplate;

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
