import type {
  WithholdingTaxReport,
  WithholdingTaxReportListParams,
  WithholdingTaxReportListResponse,
  UpdateWithholdingTaxReportPayload,
} from '@/types/laporan-bukti-potong.types';

import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ensureSuccess, toPaginatedResult, type LaravelApiResponse } from '@/lib/api/response';


const basePath = '/wapi/finance/withholding-tax';

type PaginatedWithholdingTaxReportResponse = LaravelApiResponse<{
  data: WithholdingTaxReport[];
  current_page: number;
  per_page?: number;
  perPage?: number;
  total: number;
  last_page: number;
}>;

type WithholdingTaxReportItemResponse = LaravelApiResponse<WithholdingTaxReport>;
type DeleteResponse = LaravelApiResponse<null>;

export async function getWithholdingTaxReports(params: WithholdingTaxReportListParams): Promise<WithholdingTaxReportListResponse> {
  const response = await apiClient.get<PaginatedWithholdingTaxReportResponse>(basePath, {
    params: {
      ...buildLaravelPaginationQuery({ page: params.page, perPage: params.per_page }),
      company_id: params.company_id,
      search: params.search,
    },
  });

  const data = ensureSuccess(response.data);

  return toPaginatedResult(
    {
      data: data.data ?? [],
      current_page: data.current_page,
      per_page: data.per_page ?? data.perPage ?? params.per_page ?? 10,
      total: data.total,
      last_page: data.last_page,
    },
    (item) => item
  );
}

export async function getWithholdingTaxReportById(id: number | string): Promise<WithholdingTaxReport> {
  const response = await apiClient.get<WithholdingTaxReportItemResponse>(`${basePath}/${id}`);
  return ensureSuccess(response.data);
}

export async function updateWithholdingTaxReport(id: number | string, payload: UpdateWithholdingTaxReportPayload): Promise<WithholdingTaxReport> {
  const response = await apiClient.put<WithholdingTaxReportItemResponse>(`${basePath}/${id}`, payload);
  return ensureSuccess(response.data);
}

export async function deleteWithholdingTaxReport(id: number | string): Promise<void> {
  const response = await apiClient.delete<DeleteResponse>(`${basePath}/${id}`);
  ensureSuccess(response.data);
}

