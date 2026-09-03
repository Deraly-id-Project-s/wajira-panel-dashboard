import type {
  DriverCashAdvance,
  DriverCashAdvanceApprovalPayload,
  DriverCashAdvanceListParams,
  DriverCashAdvanceListResponse,
  DriverCashAdvancePayload,
} from '@/@types/driver-cash-advance.types';
import { apiClient } from '@/lib/api/client';
import { buildLaravelPaginationQuery } from '@/lib/api/pagination';
import { ApiResponseError, ensureSuccess, type LaravelApiResponse, toPaginatedResult } from '@/lib/api/response';

const basePath = '/wapi/transaction/driver-cash-advance';

const toNumber = (value: unknown): number => {
  if (value == null || value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return ['1', 'true', 'approved', 'approve', 'yes'].includes(value.toLowerCase());
  return false;
};

const mapDriverCashAdvance = (item: any): DriverCashAdvance => ({
  id: Number(item.id ?? 0),
  uuid: item.uuid ?? null,
  companyId: Number(item.company_id ?? item.companyId ?? 0),
  driverId: Number(item.driver_id ?? item.driverId ?? item.driver?.id ?? 0),
  subject: item.subject ?? '',
  description: item.description ?? null,
  claimNominal: toNumber(item.claim_nominal ?? item.claimNominal),
  claimDate: item.claim_date ?? item.claimDate ?? '',
  isApprove: toBoolean(item.is_approve ?? item.isApprove ?? item.approved),
  approveDate: item.approve_date ?? item.approveDate ?? null,
  code: item.code ?? null,
  driver: item.driver
    ? {
        id: Number(item.driver.id ?? 0),
        code: item.driver.code ?? null,
        name: item.driver.name ?? '-',
      }
    : null,
  createdAt: item.created_at ?? item.createdAt ?? null,
  updatedAt: item.updated_at ?? item.updatedAt ?? null,
});

const unwrapListData = (payload: any) => {
  if (Array.isArray(payload)) {
    return {
      data: payload,
      current_page: 1,
      per_page: payload.length,
      total: payload.length,
      last_page: 1,
    };
  }

  if (Array.isArray(payload?.data)) return payload;
  if (Array.isArray(payload?.data?.data)) return payload.data;

  return {
    data: [],
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  };
};

export const getDriverCashAdvances = async (params: DriverCashAdvanceListParams): Promise<DriverCashAdvanceListResponse> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(basePath, {
    params: {
      ...buildLaravelPaginationQuery(params),
      company_id: params.company_id,
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
    },
  });

  const data = ensureSuccess(response.data);
  return toPaginatedResult(unwrapListData(data), mapDriverCashAdvance);
};

export const getDriverCashAdvanceById = async (id: string | number): Promise<DriverCashAdvance> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${id}`);
  return mapDriverCashAdvance(ensureSuccess(response.data));
};

export const createDriverCashAdvance = async (payload: DriverCashAdvancePayload): Promise<DriverCashAdvance> => {
  const response = await apiClient.post<LaravelApiResponse<any>>(basePath, payload);
  return mapDriverCashAdvance(ensureSuccess(response.data));
};

export const updateDriverCashAdvance = async (id: string | number, payload: DriverCashAdvancePayload): Promise<DriverCashAdvance> => {
  const response = await apiClient.put<LaravelApiResponse<any>>(`${basePath}/${id}`, payload);
  return mapDriverCashAdvance(ensureSuccess(response.data));
};

export const deleteDriverCashAdvance = async (id: string | number): Promise<void> => {
  const response = await apiClient.delete<LaravelApiResponse<null>>(`${basePath}/${id}`);
  if (!response.data.status) {
    throw new ApiResponseError(response.data.message ?? 'Gagal menghapus kas bon');
  }
};

export const approveDriverCashAdvance = async (id: string | number, payload: DriverCashAdvanceApprovalPayload): Promise<DriverCashAdvance> => {
  const response = await apiClient.post<LaravelApiResponse<any>>(`${basePath}/${id}/approve`, payload);
  return mapDriverCashAdvance(ensureSuccess(response.data));
};
